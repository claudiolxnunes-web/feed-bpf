// ============= Envio central de WhatsApp =============
// Canal: Evolution API self-hosted (config por empresa em whatsapp_config ou
// EVOLUTION_API_URL/KEY/INSTANCE_NAME como padrão).
// Usado por todos os módulos: AgroRC, Feed_BPF, Audits_BPF, Portal de Gestão, AgroGestão, NutriCRM.
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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

    const evolutionConfig = await resolveEvolutionConfig(empresa_id);
    if (!evolutionConfig) {
      return new Response(
        JSON.stringify({ error: 'WhatsApp não configurado: Evolution sem URL/KEY/INSTANCE' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const provider = 'evolution';
    const result = await sendViaEvolution(evolutionConfig, number, message);

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
      const friendly = 'Falha ao enviar via Evolution';
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
