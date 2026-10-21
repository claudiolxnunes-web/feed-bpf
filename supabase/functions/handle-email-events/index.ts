// Webhook do Resend (bounce/complaint) -> suppressed_emails + email_send_log.
//
// Configuração (Resend > Webhooks): endpoint
//   https://<ref>.supabase.co/functions/v1/handle-email-events
// com os eventos email.bounced e email.complained; o signing secret ("whsec_...")
// vai em RESEND_WEBHOOK_SECRET. Descadastro continua no handle-email-unsubscribe.
//
// O Resend assina via Svix, que segue o padrão Standard Webhooks: os cabeçalhos
// svix-* são os mesmos webhook-* com outro prefixo.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { Webhook } from 'npm:standardwebhooks@1.0.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

function admin() {
  return createClient(supabaseUrl, serviceKey)
}

// suppressed_emails é consultada antes de cada envio (send-email.ts e
// send-transactional-email); email_send_log mantém o histórico/badges do app.
async function recordOutcome(
  recipient: string,
  reason: 'bounce' | 'complaint' | 'unsubscribe',
  logStatus: 'bounced' | 'complained' | 'suppressed',
  humanMessage: string,
) {
  const db = admin()
  const email = recipient.toLowerCase()

  const { error: suppressError } = await db
    .from('suppressed_emails')
    .upsert({ email, reason, metadata: null }, { onConflict: 'email' })
  if (suppressError) {
    throw new Error(
      `suppressed_emails upsert failed: ${suppressError.code} ${suppressError.message}`,
    )
  }

  const { error: logError } = await db.from('email_send_log').insert({
    message_id: null,
    template_name: 'system',
    recipient_email: recipient,
    status: logStatus,
    error_message: humanMessage,
  })
  if (logError) {
    throw new Error(
      `email_send_log insert failed: ${logError.code} ${logError.message}`,
    )
  }
}

interface ResendEvent {
  type: string
  data: { email_id?: string; to?: string[] | string }
}

function jsonResponse(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  const secret = Deno.env.get('RESEND_WEBHOOK_SECRET')
  if (!secret) {
    console.error('RESEND_WEBHOOK_SECRET não configurado')
    return jsonResponse({ error: 'Server configuration error' }, 500)
  }

  const payload = await req.text()
  let event: ResendEvent
  try {
    event = new Webhook(secret.replace(/^whsec_/, '')).verify(payload, {
      'webhook-id': req.headers.get('svix-id') ?? '',
      'webhook-timestamp': req.headers.get('svix-timestamp') ?? '',
      'webhook-signature': req.headers.get('svix-signature') ?? '',
    }) as ResendEvent
  } catch (error) {
    console.error('Invalid webhook signature', error instanceof Error ? error.message : error)
    return jsonResponse({ error: 'Invalid signature' }, 401)
  }

  const recipients = [event.data?.to ?? []].flat().filter(Boolean)
  try {
    for (const recipient of recipients) {
      if (event.type === 'email.bounced') {
        await recordOutcome(
          recipient,
          'bounce',
          'bounced',
          'E-mail retornou (bounce) — endereço bloqueado para novos envios',
        )
      } else if (event.type === 'email.complained') {
        await recordOutcome(
          recipient,
          'complaint',
          'complained',
          'Destinatário marcou o e-mail como spam',
        )
      }
    }
  } catch (error) {
    // 500 faz o Resend reenviar o evento; recordOutcome é idempotente (upsert).
    console.error('handle-email-events failed', error instanceof Error ? error.message : error)
    return jsonResponse({ error: 'Failed to record event' }, 500)
  }

  console.log('Email event processed', { type: event.type, email_id: event.data?.email_id })
  return jsonResponse({ success: true })
})
