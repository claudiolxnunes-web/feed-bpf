import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { sendResendEmail } from '../resend.ts'
import { TEMPLATES } from './registry.ts'

// Server-only: reads RESEND_API_KEY and SUPABASE_SERVICE_ROLE_KEY. Import from
// edge functions only — never expose sending to the browser.

export type SendTemplateEmailResult =
  | { sent: true }
  | { sent: false; reason: 'recipient_suppressed' }

export interface SendTemplateEmailOptions {
  templateData?: Record<string, any>
  /** Dedupes retries of the same logical send; defaults to a random UUID (no dedupe). */
  idempotencyKey?: string
  replyTo?: string
}

/**
 * Consulta suppressed_emails (alimentada pelo handle-email-events e pelo
 * handle-email-unsubscribe). Fail-closed, igual ao send-transactional-email:
 * se não der para verificar, não envia.
 */
async function isSuppressed(email: string): Promise<boolean> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) {
    throw new Error('SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY não configurados')
  }
  const { data, error } = await createClient(supabaseUrl, serviceKey)
    .from('suppressed_emails')
    .select('id')
    .eq('email', email.toLowerCase())
    .maybeSingle()
  if (error) {
    throw new Error(`Falha ao verificar supressão: ${error.code} ${error.message}`)
  }
  return !!data
}

/**
 * Renders a registered template and sends it through Resend. A suppressed
 * recipient is an expected outcome ({ sent: false }); any other failure
 * throws — EmailAPIError exposes .status for branching.
 */
export async function sendTemplateEmail(
  templateName: string,
  to: string,
  options: SendTemplateEmailOptions = {}
): Promise<SendTemplateEmailResult> {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  const template = TEMPLATES[templateName]
  if (!template) {
    throw new Error(
      `Template '${templateName}' not found. Available: ${Object.keys(TEMPLATES).join(', ')}`
    )
  }

  // Template-level `to` takes precedence — notification templates always
  // send to their fixed address.
  const recipient = template.to || to
  if (!recipient) {
    throw new Error('Recipient is required (the template defines no fixed recipient)')
  }

  if (await isSuppressed(recipient)) {
    return { sent: false, reason: 'recipient_suppressed' }
  }

  const templateData = options.templateData ?? {}
  const element = React.createElement(template.component, templateData)
  const html = await renderAsync(element)
  const text = await renderAsync(element, { plainText: true })
  const subject =
    typeof template.subject === 'function'
      ? template.subject(templateData)
      : template.subject

  // O remetente vem de RESEND_FROM (ou do padrão em _shared/resend.ts).
  await sendResendEmail(
    {
      to: recipient,
      subject,
      html,
      text,
      purpose: 'transactional',
      label: templateName,
      idempotency_key: options.idempotencyKey || crypto.randomUUID(),
      reply_to: options.replyTo,
    },
    { apiKey, sendUrl: Deno.env.get('RESEND_SEND_URL') }
  )

  return { sent: true }
}
