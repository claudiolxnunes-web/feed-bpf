import { createEmailWebhookHandler } from 'npm:@lovable.dev/email-js@0.1.0'
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

function admin() {
  return createClient(supabaseUrl, serviceKey)
}

// Notification-only bookkeeping: Lovable already enforces suppression at send
// time. These rows keep the app's own history/badges in sync.
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

const handler = createEmailWebhookHandler({
  apiKey: Deno.env.get('LOVABLE_API_KEY')!,
  on: {
    'email.bounced': async (event) => {
      await recordOutcome(
        event.data.recipient,
        'bounce',
        'bounced',
        'E-mail retornou (bounce) — endereço bloqueado para novos envios',
      )
      console.log('Email bounced', { event_id: event.event_id })
    },
    'email.complaint': async (event) => {
      await recordOutcome(
        event.data.recipient,
        'complaint',
        'complained',
        'Destinatário marcou o e-mail como spam',
      )
      console.log('Email complaint', { event_id: event.event_id })
    },
    'email.unsubscribed': async (event) => {
      await recordOutcome(
        event.data.recipient,
        'unsubscribe',
        'suppressed',
        'Destinatário cancelou o recebimento (unsubscribe)',
      )
      console.log('Email unsubscribed', { event_id: event.event_id })
    },
  },
})

Deno.serve((req) => handler(req))
