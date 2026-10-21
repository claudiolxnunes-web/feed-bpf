// Worker de campanhas WhatsApp — cron a cada 1 min
// Processa mensagens da fila com agendado_para <= now(), respeitando limite diário
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// batch máximo por execução (por segurança)
const MAX_PER_RUN = 12;
// orçamento de tempo por execução (cron 1 min) e tempo p/ considerar 'enviando' travado
const TIME_BUDGET_MS = 40_000;
const STUCK_MINUTES = 5;

interface Campanha {
  id: string;
  status: string;
  intervalo_min_seg: number;
  intervalo_max_seg: number;
  pausa_a_cada: number;
  pausa_duracao_seg: number;
  limite_diario: number;
  enviados: number;
  erros: number;
  optouts: number;
  enviados_hoje: number;
  enviados_hoje_data: string | null;
  empresa_id: string | null;
  total: number;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function randBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const summary = { processadas: 0, enviadas: 0, erros: 0, optouts: 0, campanhas: 0 };

  const startedAt = Date.now();
  const timeLeft = () => TIME_BUDGET_MS - (Date.now() - startedAt);

  try {
    // 0. Recuperação: re-enfileira mensagens travadas em 'enviando' (execução anterior morreu)
    const stuckBefore = new Date(Date.now() - STUCK_MINUTES * 60_000).toISOString();
    const { error: recErr } = await supabase.from('campanha_mensagens')
      .update({ status: 'pendente' })
      .eq('status', 'enviando')
      .lt('agendado_para', stuckBefore);
    if (recErr) console.error('recovery error', recErr);

    // 1. Buscar campanhas ativas
    const { data: campanhas, error: campErr } = await supabase
      .from('campanhas')
      .select('*')
      .eq('status', 'em_andamento');

    if (campErr) throw campErr;
    if (!campanhas || campanhas.length === 0) {
      return new Response(JSON.stringify({ ok: true, ...summary, msg: 'Nenhuma campanha ativa' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    for (const camp of campanhas as Campanha[]) {
      if (timeLeft() < 8_000) break;
      summary.campanhas++;

      // Reset contador diário
      let enviadosHoje = camp.enviados_hoje;
      const today = todayISO();
      if (camp.enviados_hoje_data !== today) {
        enviadosHoje = 0;
        await supabase.from('campanhas').update({
          enviados_hoje: 0,
          enviados_hoje_data: today,
        }).eq('id', camp.id);
      }

      if (enviadosHoje >= camp.limite_diario) {
        console.log(`Campanha ${camp.id}: limite diário (${camp.limite_diario}) atingido.`);
        continue;
      }

      // Buscar mensagens pendentes agendadas
      const restanteHoje = camp.limite_diario - enviadosHoje;
      const limite = Math.min(MAX_PER_RUN, restanteHoje);

      const { data: mensagens, error: msgErr } = await supabase
        .from('campanha_mensagens')
        .select('*')
        .eq('campanha_id', camp.id)
        .eq('status', 'pendente')
        .lte('agendado_para', new Date().toISOString())
        .order('agendado_para', { ascending: true })
        .limit(limite);

      if (msgErr) { console.error('msgErr', msgErr); continue; }
      if (!mensagens || mensagens.length === 0) {
        // Se não há pendentes E não há agendadas futuras, marca concluída
        const { count } = await supabase
          .from('campanha_mensagens')
          .select('id', { count: 'exact', head: true })
          .eq('campanha_id', camp.id)
          .eq('status', 'pendente');
        if ((count ?? 0) === 0) {
          await supabase.from('campanhas').update({
            status: 'concluida',
            concluida_em: new Date().toISOString(),
          }).eq('id', camp.id);
        }
        continue;
      }

      let contadorEnviados = 0;
      let contadorErros = 0;
      let contadorOptouts = 0;

      for (const msg of mensagens) {
        if (timeLeft() < 8_000) break; // deixa o restante como 'pendente' p/ próxima execução
        summary.processadas++;

        // marca enviando (lock leve); se outra execução pegou, pula
        const { data: locked } = await supabase.from('campanha_mensagens').update({
          status: 'enviando',
          tentativas: msg.tentativas + 1,
        }).eq('id', msg.id).eq('status', 'pendente').select('id');
        if (!locked || locked.length === 0) continue;

        // Verifica opt-out
        const { data: opt } = await supabase
          .from('campanha_optout')
          .select('telefone')
          .eq('telefone', msg.telefone)
          .maybeSingle();

        if (opt) {
          await supabase.from('campanha_mensagens').update({
            status: 'optout',
            erro: 'Número está na lista de opt-out',
          }).eq('id', msg.id);
          contadorOptouts++;
          continue;
        }

        // Envia via evolution-send
        try {
          const resp = await fetch(`${SUPABASE_URL}/functions/v1/evolution-send`, {
            method: 'POST',
            signal: AbortSignal.timeout(15_000),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SERVICE_KEY}`,
            },
            body: JSON.stringify({
              to: msg.telefone,
              message: msg.mensagem_final,
              modulo: 'campanha',
              tipo: 'marketing',
              empresa_id: camp.empresa_id,
              metadata: { campanha_id: camp.id, mensagem_id: msg.id },
            }),
          });

          const respBody = await resp.text();

          if (resp.ok) {
            await supabase.from('campanha_mensagens').update({
              status: 'enviado',
              enviado_em: new Date().toISOString(),
              erro: null,
            }).eq('id', msg.id);
            contadorEnviados++;
          } else {
            await supabase.from('campanha_mensagens').update({
              status: 'erro',
              erro: `HTTP ${resp.status}: ${respBody.slice(0, 500)}`,
            }).eq('id', msg.id);
            contadorErros++;
          }
        } catch (e) {
          await supabase.from('campanha_mensagens').update({
            status: 'erro',
            erro: `Exceção: ${(e as Error).message}`.slice(0, 500),
          }).eq('id', msg.id);
          contadorErros++;
        }

        // Pequena pausa entre envios no mesmo run (2s) — o ritmo real vem de agendado_para
        if (timeLeft() > 10_000) await new Promise((r) => setTimeout(r, 1000));
      }

      // Atualiza contadores da campanha
      const novoEnviados = camp.enviados + contadorEnviados;
      const novoErros = camp.erros + contadorErros;
      const novoOptouts = camp.optouts + contadorOptouts;
      const novoEnviadosHoje = enviadosHoje + contadorEnviados;

      await supabase.from('campanhas').update({
        enviados: novoEnviados,
        erros: novoErros,
        optouts: novoOptouts,
        enviados_hoje: novoEnviadosHoje,
        enviados_hoje_data: today,
        ultimo_envio_em: contadorEnviados > 0 ? new Date().toISOString() : camp.ultimo_envio_em,
      }).eq('id', camp.id);

      summary.enviadas += contadorEnviados;
      summary.erros += contadorErros;
      summary.optouts += contadorOptouts;
    }

    return new Response(JSON.stringify({ ok: true, ...summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('campanha-worker erro:', e);
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
