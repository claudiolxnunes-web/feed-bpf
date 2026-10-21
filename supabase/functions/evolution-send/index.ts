// ============= Envio central de WhatsApp =============
// Canal primário: WhatsApp Business oficial (Meta) via Lovable Connector Gateway.
// Fallback legado: Evolution API self-hosted (mantido apenas se a chave oficial não existir).
// Usado por todos os módulos: AgroRC, Feed_BPF, Audits_BPF, Portal de Gestão, AgroGestão, NutriCRM.
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const WHATSAPP_API_KEY = Deno.env.get('WHATSAPP_API_KEY');
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const GATEWAY_URL = 'https://connector-gateway.lovable.dev/whatsapp';

const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL');
const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY');
const EVOLUTION_INSTANCE_NAME = Deno.env.get('EVOLUTION_INSTANCE_NAME');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface EvolutionConfig {
  api_url: string;
  api_key: string;
  instance_name: string;
}

interface SendPayload {
  to: string;                  // ex: 5561996757585 ou 61996757585
  message: string;
  modulo?: string;             // ex: 'agrorc' | 'feed_bpf' | 'audits_bpf' | 'portal' | 'agrogestao'
  tipo?: string;               // ex: 'alerta_nc', 'marketing', 'lead', 'manual'
  empresa_id?: string | null;
  user_id?: string | null;
  metadata?: Record<string, unknown>;
}

function normalizeNumber(raw: string): string {
  let n = (raw || '').replace(/\D/g, '');
  if (!n) return '';
  // Se não vier com DDI brasileiro, adiciona 55
  if (n.length <= 11) n = '55' + n;
  return n;
}

async function resolveEvolutionConfig(empresaId?: string | null): Promise<EvolutionConfig | null> {
  if (empresaId) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await supabase
      .from('whatsapp_config')
      .select('api_url, api_key, instance_name')
      .eq('empresa_id', empresaId)
      .maybeSingle();

    if (error) throw new Error(`Falha ao carregar configuração WhatsApp: ${error.message}`);
    if (data?.api_url && data?.api_key && data?.instance_name) return data as EvolutionConfig;
  }

  if (EVOLUTION_API_URL && EVOLUTION_API_KEY && EVOLUTION_INSTANCE_NAME) {
    return {
      api_url: EVOLUTION_API_URL,
      api_key: EVOLUTION_API_KEY,
      instance_name: EVOLUTION_INSTANCE_NAME,
    };
  }

  return null;
}

/** Traduz erros conhecidos da Cloud API do Meta para mensagens acionáveis. */
function friendlyMetaError(status: number, data: Record<string, unknown>): string {
  const raw = JSON.stringify(data ?? {}).toLowerCase();
  // 131047: re-engajamento — destinatário não falou com o número nas últimas 24h
  if (raw.includes('131047') || raw.includes('re-engagement') || raw.includes('reengagement')) {
    return 'O WhatsApp oficial só permite mensagem livre até 24h depois que a pessoa manda uma mensagem para o número da empresa. Fora disso, é preciso usar um modelo (template) aprovado pela Meta. Envie uma mensagem do seu celular para o número da empresa ou solicite a criação de um template.';
  }
  if (raw.includes('131026') || raw.includes('undeliverable')) {
    return 'O número informado não é alcançável pelo WhatsApp (número inexistente, sem WhatsApp ou bloqueou o número da empresa).';
  }
  if (raw.includes('131030') || raw.includes('recipient phone number not in allowed list')) {
    return 'Número fora da lista de destinatários de teste permitida pela Meta. Adicione o número na configuração do WhatsApp Business (painel da Meta) ou complete a verificação da conta.';
  }
  if (raw.includes('"code":100') || raw.includes('invalid parameter')) {
    return 'A Meta recusou o envio (parâmetro inválido). Causa mais comum: o destino é o próprio número da empresa conectado ao WhatsApp Business — ele não pode enviar mensagem para si mesmo. Use outro número de destino.';
  }
  if (status === 401) {
    return 'Credencial do WhatsApp Business rejeitada (401). Verifique a conexão do conector WhatsApp no Lovable.';
  }
  return 'Falha ao enviar via WhatsApp Business oficial';
}

async function sendViaOfficial(
  number: string,
  message: string,
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const res = await fetch(`${GATEWAY_URL}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      'X-Connection-Api-Key': WHATSAPP_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: number,
      type: 'text',
      text: { body: message },
    }),
  });

  const data = await res.json().catch(() => ({})) as Record<string, unknown>;
  // Alguns provedores retornam 2xx com ok:false no corpo
  const bodyOk = data && typeof data === 'object' && 'ok' in data
    ? (data as { ok?: boolean }).ok !== false
    : true;
  return { ok: res.ok && bodyOk, status: res.status, data };
}

async function sendViaEvolution(
  evolutionConfig: EvolutionConfig,
  number: string,
  message: string,
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const baseUrl = evolutionConfig.api_url.replace(/\/+$/, '');
  const url = `${baseUrl}/message/sendText/${encodeURIComponent(evolutionConfig.instance_name)}`;

  let res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: evolutionConfig.api_key },
    body: JSON.stringify({ number, text: message }),
  });

  if (!res.ok && (res.status === 400 || res.status === 422)) {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: evolutionConfig.api_key },
      body: JSON.stringify({ number, textMessage: { text: message } }),
    });
  }

  const data = await res.json().catch(() => ({})) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, data };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = (await req.json().catch(() => ({}))) as SendPayload;
    const { to, message, modulo, tipo, empresa_id, user_id, metadata } = body;

    if (!to || !message) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: to, message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const number = normalizeNumber(to);
    if (!number) {
      return new Response(
        JSON.stringify({ error: 'Número inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result: { ok: boolean; status: number; data: Record<string, unknown> };
    let provider: 'whatsapp_oficial' | 'evolution';

    if (WHATSAPP_API_KEY && LOVABLE_API_KEY) {
      // Canal primário: WhatsApp Business oficial (Meta)
      provider = 'whatsapp_oficial';
      result = await sendViaOfficial(number, message);
} else {
      // Fallback legado: Evolution self-hosted
      const evolutionConfig = await resolveEvolutionConfig(empresa_id);
      if (!evolutionConfig) {
        return new Response(
          JSON.stringify({ error: 'WhatsApp não configurado: credencial oficial ausente e Evolution sem URL/KEY/INSTANCE' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      provider = 'evolution';
      result = await sendViaEvolution(evolutionConfig, number, message);
}

    // Log persistente em whatsapp_mensagens (best-effort, não bloqueia a resposta)
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      await supabase.from('whatsapp_mensagens').insert({
        to_number: number,
        body: message,
        status: result.ok ? 'enviada' : 'erro',
        direction: 'outbound',
        empresa_id: empresa_id ?? null,
        raw: { provider, modulo, tipo, user_id, metadata, response: result.data },
      });
    } catch (logErr) {
      console.error('whatsapp log error', logErr);
    }

    if (!result.ok) {
      console.error(`WhatsApp send error [${provider}]`, result.status, result.data);
      const friendly = provider === 'whatsapp_oficial'
        ? friendlyMetaError(result.status, result.data)
        : 'Falha ao enviar via Evolution';
      // Se o provedor respondeu 2xx mas reportou falha no corpo (ok:false),
      // devolvemos 502 para que o cliente (supabase.functions.invoke) trate como erro.
      const httpStatus = result.status >= 200 && result.status < 300 ? 502 : (result.status === 0 ? 502 : result.status);
      return new Response(
        JSON.stringify({ error: friendly, provider, status: result.status, details: result.data }),
        { status: httpStatus, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, provider, data: result.data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('evolution-send error', err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
