import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import {
  sendTemplateEmail,
  type SendTemplateEmailOptions,
  type SendTemplateEmailResult,
} from './send-email.ts'

/**
 * Sends a registered template through the managed email API and records the
 * outcome in the app's `email_send_log` table (history only — it never gates
 * a send; suppression is enforced server-side by Lovable).
 *
 * Returns the send result. Any non-suppression failure is logged and rethrown
 * so the caller keeps its own error handling.
 */
export async function sendTemplateEmailLogged(
  admin: SupabaseClient,
  templateName: string,
  to: string,
  options: SendTemplateEmailOptions = {},
): Promise<SendTemplateEmailResult> {
  const logRow = async (
    status: 'sent' | 'suppressed' | 'failed',
    errorMessage?: string,
  ) => {
    const { error } = await admin.from('email_send_log').insert({
      message_id: null,
      template_name: templateName,
      recipient_email: to,
      status,
      error_message: errorMessage ?? null,
    })
    if (error) {
      console.error('Failed to write email_send_log row', {
        status,
        template_name: templateName,
        error,
      })
    }
  }

  try {
    const result = await sendTemplateEmail(templateName, to, options)
    if (result.sent) {
      await logRow('sent')
    } else {
      await logRow('suppressed', 'Recipient is suppressed')
    }
    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await logRow('failed', message.slice(0, 1000))
    throw error
  }
}
