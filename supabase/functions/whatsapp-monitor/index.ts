// WhatsApp/Evolution connection monitor.
// Runs on a schedule (pg_cron -> HTTP POST) or can be invoked manually.
// Checks each empresa's Evolution instance state and, when a previously-connected
// instance goes offline, sends an e-mail alert (once per outage) and tries to
// push a WhatsApp warning as best-effort.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { sendTemplateEmailLogged } from '../_shared/transactional-email-templates/send-and-log.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FALLBACK_EMAIL = 'clxn2000@hotmail.com';
const ALERT_EMAIL_EXTRA = 'contato@bpfconsult.com.br';
// Após enviar 1 alerta, aguarda esse tempo antes de re-avisar (evita spam).
const ALERT_COOLDOWN_HOURS = 6;

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function isConnected(state: string | null | undefined): boolean {
  const s = (state ?? '').toLowerCase();
  return s === 'open' || s === 'connected';
}

async function checkInstance(apiUrl: string, apiKey: string, instance: string) {
  const url = `${apiUrl.replace(/\/$/, '')}/instance/connectionState/${encodeURIComponent(instance)}`;
  try {
    const res = await fetch(url, { headers: { apikey: apiKey } });
    const text = await res.text();
    let data: any = {};
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    const state = data?.instance?.state ?? data?.state ?? (res.ok ? 'unknown' : 'error');
    return { ok: res.ok, state: String(state), raw: data };
  } catch (err) {
    return { ok: false, state: 'unreachable', raw: { error: String(err) } };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Carrega todas as configs válidas
  const { data: configs, error } = await admin
    .from('whatsapp_config')
    .select('id, empresa_id, api_url, api_key, instance_name, last_known_status, last_alert_at, alert_email');

  if (error) return json({ ok: false, error: error.message }, 500);
  if (!configs?.length) return json({ ok: true, checked: 0, message: 'Nenhuma config' });

  const results: any[] = [];

  for (const cfg of configs) {
    if (!cfg.api_url || !cfg.api_key || !cfg.instance_name) continue;

    const check = await checkInstance(cfg.api_url, cfg.api_key, cfg.instance_name);
    const nowIso = new Date().toISOString();
    const previous = cfg.last_known_status;
    const current = check.state;
    const wasConnected = isConnected(previous);
    const nowConnected = isConnected(current);
    const statusChanged = previous !== current;

    const updates: Record<string, any> = {
      last_known_status: current,
      last_status_check: nowIso,
    };
    if (statusChanged) updates.last_status_change = nowIso;

    let alerted = false;

    // Regra: alerta quando estava conectado e ficou desconectado, OU
    // segue desconectado por muito tempo (respeitando cooldown).
    const shouldAlert =
      !nowConnected && previous !== null && (
        wasConnected ||
        (!cfg.last_alert_at || (Date.now() - new Date(cfg.last_alert_at).getTime()) > ALERT_COOLDOWN_HOURS * 3600_000)
      );

    if (shouldAlert) {
      // Descobre nome da empresa e e-mail do dono
      const { data: empresa } = await admin
        .from('empresas')
        .select('nome, user_id')
        .eq('id', cfg.empresa_id)
        .maybeSingle();

      let ownerEmail: string | null = null;
      if (empresa?.user_id) {
        const { data: userRes } = await admin.auth.admin.getUserById(empresa.user_id);
        ownerEmail = userRes?.user?.email ?? null;
      }

      const recipients = Array.from(new Set([
        cfg.alert_email,
        ownerEmail,
        ALERT_EMAIL_EXTRA,
        FALLBACK_EMAIL,
      ].filter(Boolean))) as string[];

      const templateData = {
        empresa_nome: empresa?.nome ?? 'Sua empresa',
        instance_name: cfg.instance_name,
        status: current,
        status_anterior: previous ?? 'desconhecido',
        detectado_em: new Date().toLocaleString('pt-BR'),
        portal_url: 'https://www.bpfconsult.com.br/admin?tab=whatsapp',
      };

      for (const to of recipients) {
        try {
          await sendTemplateEmailLogged(admin, 'whatsapp-alert', to, {
            idempotencyKey: `wa-alert-${cfg.id}-${new Date().toISOString().slice(0, 13)}`,
            templateData,
          });
        } catch (e) {
          console.error('email err', to, e);
        }
      }

      updates.last_alert_at = nowIso;
      alerted = true;
    }

    await admin.from('whatsapp_config').update(updates).eq('id', cfg.id);

    results.push({
      empresa_id: cfg.empresa_id,
      instance: cfg.instance_name,
      previous,
      current,
      alerted,
    });
  }

  return json({ ok: true, checked: results.length, results });
});
