// Send Email Hook do Supabase Auth: renderiza os templates React e envia via
// Resend (_shared/resend.ts).
//
// Configuração (Supabase > Authentication > Hooks > Send Email):
//   - URI: https://<ref>.supabase.co/functions/v1/auth-email-hook
//   - secret gerado no painel -> SEND_EMAIL_HOOK_SECRET ("v1,whsec_...")
//   - RESEND_API_KEY (e opcionalmente RESEND_FROM) já usados pela fila de e-mail
//
// Referência: https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook
import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { Webhook } from 'npm:standardwebhooks@1.0.0'
import { sendResendEmail } from '../_shared/resend.ts'
import { SignupEmail } from '../_shared/email-templates/signup.tsx'
import { InviteEmail } from '../_shared/email-templates/invite.tsx'
import { MagicLinkEmail } from '../_shared/email-templates/magic-link.tsx'
import { RecoveryEmail } from '../_shared/email-templates/recovery.tsx'
import { EmailChangeEmail } from '../_shared/email-templates/email-change.tsx'
import { ReauthenticationEmail } from '../_shared/email-templates/reauthentication.tsx'

const SITE_NAME = "Feed_BPF_Pro"
const ROOT_DOMAIN = "www.bpfconsult.com.br"
const SITE_URL = `https://${ROOT_DOMAIN}`

interface HookUser {
  email: string
  new_email?: string
}

interface HookEmailData {
  token: string
  token_hash: string
  redirect_to: string
  email_action_type: string
  site_url: string
  token_new: string
  token_hash_new: string
  old_email?: string
}

interface OutgoingEmail {
  to: string
  subject: string
  element: React.ReactElement
}

function verifyUrl(tokenHash: string, type: string, redirectTo: string): string {
  const params = new URLSearchParams({ token: tokenHash, type, redirect_to: redirectTo || SITE_URL })
  return `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?${params}`
}

function buildEmails(user: HookUser, data: HookEmailData): OutgoingEmail[] {
  const type = data.email_action_type
  const url = (tokenHash: string) => verifyUrl(tokenHash, type, data.redirect_to)

  switch (type) {
    case 'signup':
      return [{
        to: user.email,
        subject: 'Confirm your email',
        element: React.createElement(SignupEmail, {
          siteName: SITE_NAME,
          siteUrl: SITE_URL,
          recipient: user.email,
          confirmationUrl: url(data.token_hash),
        }),
      }]
    case 'invite':
      return [{
        to: user.email,
        subject: "You've been invited",
        element: React.createElement(InviteEmail, {
          siteName: SITE_NAME,
          siteUrl: SITE_URL,
          confirmationUrl: url(data.token_hash),
        }),
      }]
    case 'magiclink':
    case 'email':
      return [{
        to: user.email,
        subject: 'Your login link',
        element: React.createElement(MagicLinkEmail, {
          siteName: SITE_NAME,
          confirmationUrl: url(data.token_hash),
        }),
      }]
    case 'recovery':
      return [{
        to: user.email,
        subject: 'Reset your password',
        element: React.createElement(RecoveryEmail, {
          siteName: SITE_NAME,
          confirmationUrl: url(data.token_hash),
        }),
      }]
    case 'email_change': {
      const newEmail = user.new_email ?? ''
      const render = (to: string, tokenHash: string): OutgoingEmail => ({
        to,
        subject: 'Confirm your new email',
        element: React.createElement(EmailChangeEmail, {
          siteName: SITE_NAME,
          oldEmail: user.email,
          email: user.email,
          newEmail,
          confirmationUrl: url(tokenHash),
        }),
      })
      // Os nomes dos hashes são invertidos por compatibilidade (doc do Supabase):
      // token_hash_new vai para o e-mail ATUAL e token_hash para o NOVO.
      // Com "Secure email change" ligado chegam os dois; sem ele, só o novo.
      const emails = [render(newEmail, data.token_hash)]
      if (data.token_hash_new) emails.unshift(render(user.email, data.token_hash_new))
      return emails
    }
    case 'reauthentication':
      return [{
        to: user.email,
        subject: 'Your verification code',
        element: React.createElement(ReauthenticationEmail, { token: data.token ?? '' }),
      }]
    default:
      // *_notification e tipos futuros: sem template próprio, não enviamos.
      return []
  }
}

function errorResponse(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: { http_code: status, message } }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return errorResponse(400, 'Method not allowed')

  const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET')
  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!hookSecret || !apiKey) {
    console.error('SEND_EMAIL_HOOK_SECRET/RESEND_API_KEY não configurados')
    return errorResponse(500, 'Server configuration error')
  }

  const payload = await req.text()
  const headers = Object.fromEntries(req.headers)
  let user: HookUser
  let emailData: HookEmailData
  try {
    const wh = new Webhook(hookSecret.replace('v1,whsec_', ''))
    ;({ user, email_data: emailData } = wh.verify(payload, headers) as {
      user: HookUser
      email_data: HookEmailData
    })
  } catch (error) {
    console.error('Invalid hook signature', error instanceof Error ? error.message : error)
    return errorResponse(401, 'Invalid signature')
  }

  const emails = buildEmails(user, emailData)
  if (emails.length === 0) {
    console.log('auth-email-hook: tipo sem template, ignorado', { type: emailData.email_action_type })
    return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    for (const email of emails) {
      const html = await renderAsync(email.element)
      const text = await renderAsync(email.element, { plainText: true })
      await sendResendEmail(
        {
          to: email.to,
          subject: email.subject,
          html,
          text,
          purpose: 'auth',
          label: emailData.email_action_type,
          // Reentrega do mesmo hook (mesmo webhook-id) não duplica o e-mail.
          idempotency_key: headers['webhook-id'] ? `${headers['webhook-id']}:${email.to}` : undefined,
        },
        { apiKey, sendUrl: Deno.env.get('RESEND_SEND_URL') }
      )
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('auth-email-hook send failed', { type: emailData.email_action_type, message })
    return errorResponse(500, message)
  }

  return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } })
})
