// Worker de cadências de vendas — processa envios pendentes (email + WhatsApp)
import { createClient } from 'npm:@supabase/supabase-js@2';
import { sendTemplateEmailLogged } from '../_shared/transactional-email-templates/send-and-log.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface Passo {
  dia: number;           // dias após o passo anterior (0 = imediato)
  canal: 'email' | 'whatsapp';
  assunto?: string;      // email
  corpo: string;         // texto (whatsapp) ou HTML (email)
}

function renderVars(txt: string, vars: Record<string, string>): string {
  return (txt || '').replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? '');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const now = new Date().toISOString();
  const results = { processadas: 0, enviadas: 0, concluidas: 0, erros: 0, detalhes: [] as any[] };

  try {
    const { data: pendentes } = await supabase
      .from('crm_cadencia_execucoes')
      .select('*, crm_cadencias(*)')
      .eq('status', 'ativa')
      .lte('proximo_envio_em', now)
      .limit(50);

    for (const exec of pendentes || []) {
      results.processadas++;
      const cadencia: any = (exec as any).crm_cadencias;
      if (!cadencia || !cadencia.ativo) {
        await supabase.from('crm_cadencia_execucoes').update({ status: 'cancelada', ultimo_erro: 'Cadência inativa' }).eq('id', exec.id);
        continue;
      }

      const passos: Passo[] = Array.isArray(cadencia.passos) ? cadencia.passos : [];
      const passo = passos[exec.passo_atual];
      if (!passo) {
        await supabase.from('crm_cadencia_execucoes').update({ status: 'concluida' }).eq('id', exec.id);
        results.concluidas++;
        continue;
      }

      const vars = {
        nome: exec.lead_nome || 'olá',
        primeiro_nome: (exec.lead_nome || '').split(' ')[0] || 'olá',
        email: exec.lead_email || '',
        telefone: exec.lead_telefone || '',
      };

      try {
        if (passo.canal === 'whatsapp') {
          if (!exec.lead_telefone) throw new Error('Sem telefone');
          const r = await fetch(`${SUPABASE_URL}/functions/v1/evolution-send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SERVICE_KEY}` },
            body: JSON.stringify({
              to: exec.lead_telefone,
              message: renderVars(passo.corpo, vars),
              modulo: 'portal',
              tipo: 'cadencia',
              metadata: { cadencia_id: cadencia.id, execucao_id: exec.id, passo: exec.passo_atual },
            }),
          });
          if (!r.ok) throw new Error(`WhatsApp ${r.status}: ${(await r.text()).slice(0, 200)}`);
        } else if (passo.canal === 'email') {
          if (!exec.lead_email) throw new Error('Sem email');
          await sendTemplateEmailLogged(supabase, 'crm-message', exec.lead_email, {
            idempotencyKey: `cad-${exec.id}-${exec.passo_atual}`,
            templateData: {
              assunto: renderVars(passo.assunto || 'Mensagem BPF Consult', vars),
              corpo_html: renderVars(passo.corpo, vars),
              remetente_nome: 'Equipe Comercial BPF Consult',
            },
          });
        }

        results.enviadas++;
        const proximoIdx = exec.passo_atual + 1;
        const proximo = passos[proximoIdx];
        if (!proximo) {
          await supabase.from('crm_cadencia_execucoes').update({
            status: 'concluida', passo_atual: proximoIdx, ultimo_erro: null,
          }).eq('id', exec.id);
          results.concluidas++;
        } else {
          const proxData = new Date(Date.now() + (Number(proximo.dia) || 0) * 24 * 60 * 60 * 1000);
          await supabase.from('crm_cadencia_execucoes').update({
            passo_atual: proximoIdx, proximo_envio_em: proxData.toISOString(), ultimo_erro: null,
          }).eq('id', exec.id);
        }
      } catch (e: any) {
        results.erros++;
        results.detalhes.push({ execucao_id: exec.id, erro: e.message });
        // adia 1h em caso de erro
        await supabase.from('crm_cadencia_execucoes').update({
          proximo_envio_em: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          ultimo_erro: e.message,
        }).eq('id', exec.id);
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
