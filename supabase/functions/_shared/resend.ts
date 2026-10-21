// Envio de e-mail via Resend.
//
// Substitui `sendLovableEmail` do pacote npm:@lovable.dev/email-js mantendo a
// MESMA assinatura (payload, options) e o MESMO contrato de erro, para que o
// process-email-queue continue funcionando sem mudar sua lógica de retry:
//
//   - erro carrega `status` (number)      -> isRateLimited()/isForbidden()
//   - erro carrega `retryAfterSeconds`    -> getRetryAfterSeconds()
//
// Referência da API: POST https://api.resend.com/emails

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

// Remetente fixo em domínio verificado no Resend.
// O `payload.from` e o `payload.sender_domain` que vêm da fila apontam para o
// subdomínio delegado aos nameservers do Lovable e são IGNORADOS de propósito —
// usá-los aqui resultaria em domínio não verificado no Resend.
const DEFAULT_FROM = 'BPF Consult <nao-responda@bpfconsult.com.br>'

export class EmailAPIError extends Error {
  readonly status: number
  readonly retryAfterSeconds: number | null

  constructor(message: string, status: number, retryAfterSeconds: number | null = null) {
    super(message)
    this.name = 'EmailAPIError'
    this.status = status
    this.retryAfterSeconds = retryAfterSeconds
  }
}

export interface EmailPayload {
  run_id?: string
  to: string
  from?: string
  sender_domain?: string
  subject: string
  html: string
  text?: string
  purpose?: string
  label?: string
  idempotency_key?: string
  unsubscribe_token?: string
  message_id?: string
  reply_to?: string
}

export interface SendOptions {
  apiKey: string
  /** Override do endpoint, para desenvolvimento local. Produção usa o padrão. */
  sendUrl?: string
}

/**
 * URL de descadastro. O handle-email-unsubscribe aceita o token por query param
 * (GET) e por corpo form-urlencoded (POST one-click), e está com
 * verify_jwt = false — ou seja, alcançável pelo cliente de e-mail.
 */
function buildUnsubscribeUrl(token: string): string | null {
  const base =
    Deno.env.get('UNSUBSCRIBE_BASE_URL') ??
    (Deno.env.get('SUPABASE_URL')
      ? `${Deno.env.get('SUPABASE_URL')}/functions/v1/handle-email-unsubscribe`
      : null)

  if (!base) return null
  return `${base}?token=${encodeURIComponent(token)}`
}

/** Lê Retry-After, que pode vir em segundos ou como HTTP-date. */
function parseRetryAfter(response: Response): number | null {
  const raw = response.headers.get('retry-after')
  if (!raw) return null

  const seconds = Number(raw)
  if (Number.isFinite(seconds)) return Math.max(0, Math.ceil(seconds))

  const when = Date.parse(raw)
  if (!Number.isNaN(when)) return Math.max(0, Math.ceil((when - Date.now()) / 1000))

  return null
}

export async function sendResendEmail(
  payload: EmailPayload,
  options: SendOptions
): Promise<{ id?: string }> {
  if (!options?.apiKey) {
    // 500 não é 429 nem 403, então a fila trata como falha comum e faz retry.
    throw new EmailAPIError('Missing Resend API key', 500)
  }

  const requestHeaders: Record<string, string> = {
    Authorization: `Bearer ${options.apiKey}`,
    'Content-Type': 'application/json',
  }

  // Idempotência ponta a ponta: reenvio do mesmo item da fila (VT expirado,
  // worker duplicado) não gera segunda entrega.
  if (payload.idempotency_key) {
    requestHeaders['Idempotency-Key'] = payload.idempotency_key
  }

  // Cabeçalhos do próprio e-mail.
  const emailHeaders: Record<string, string> = {}

  if (payload.message_id) {
    emailHeaders['X-Entity-Ref-ID'] = payload.message_id
  }

  // O unsubscribe_token vira cabeçalho List-Unsubscribe (RFC 8058), não campo
  // do corpo. List-Unsubscribe-Post habilita o botão nativo de um clique no
  // Gmail/Outlook, que dispara POST para a mesma URL.
  if (payload.unsubscribe_token) {
    const url = buildUnsubscribeUrl(payload.unsubscribe_token)
    if (url) {
      emailHeaders['List-Unsubscribe'] = `<${url}>`
      emailHeaders['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click'
    } else {
      console.warn('unsubscribe_token presente mas UNSUBSCRIBE_BASE_URL/SUPABASE_URL ausentes')
    }
  }

  const body: Record<string, unknown> = {
    from: Deno.env.get('RESEND_FROM') ?? DEFAULT_FROM,
    to: [payload.to],
    subject: payload.subject,
    html: payload.html,
  }
  if (payload.text) body.text = payload.text
  if (payload.reply_to) body.reply_to = payload.reply_to
  if (Object.keys(emailHeaders).length > 0) body.headers = emailHeaders

  let response: Response
  try {
    response = await fetch(options.sendUrl ?? RESEND_ENDPOINT, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(body),
    })
  } catch (error) {
    // Falha de rede: sem status HTTP. status 0 não casa com 429 nem 403,
    // então a fila faz retry normalmente até esgotar o orçamento.
    const detail = error instanceof Error ? error.message : String(error)
    throw new EmailAPIError(`Network error calling Resend: ${detail}`, 0)
  }

  if (response.ok) {
    return (await response.json().catch(() => ({}))) as { id?: string }
  }

  const detail = (await response.text().catch(() => '')).slice(0, 500)

  // 429 -> a fila grava retry_after_until e para o lote.
  // 403 -> a fila manda direto para a DLQ (retry não resolve).
  throw new EmailAPIError(
    `Resend responded ${response.status}: ${detail}`,
    response.status,
    response.status === 429 ? (parseRetryAfter(response) ?? 60) : null
  )
}
