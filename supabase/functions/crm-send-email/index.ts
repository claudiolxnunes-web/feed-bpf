import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function bad(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return bad('Method not allowed', 405)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return bad('Missing authorization', 401)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // Validar usuário pelo JWT
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: userData, error: userErr } = await userClient.auth.getUser()
  if (userErr || !userData.user) return bad('Unauthorized', 401)
  const userId = userData.user.id

  // Verificar acesso ao CRM
  const admin = createClient(supabaseUrl, serviceKey)
  const { data: roleRows } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
  const roles = (roleRows ?? []).map((r: any) => r.role)
  if (!roles.includes('admin') && !roles.includes('comercial')) {
    return bad('Forbidden', 403)
  }

  let body: any
  try { body = await req.json() } catch { return bad('Invalid JSON') }

  const pipelineId = String(body.pipeline_id ?? '').trim()
  const para = String(body.para_email ?? '').trim().toLowerCase()
  const assunto = String(body.assunto ?? '').trim()
  const corpoHtml = String(body.corpo_html ?? '').trim()
  const remetenteNome = String(body.remetente_nome ?? '').trim()

  if (!pipelineId) return bad('pipeline_id obrigatório')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(para)) return bad('E-mail inválido')
  if (!assunto || assunto.length > 200) return bad('Assunto inválido')
  if (!corpoHtml || corpoHtml.length > 20000) return bad('Corpo inválido')

  const messageId = `crm-${pipelineId}-${Date.now()}`

  // `crm_emails_enviados.status` aceita apenas 'enviado' | 'falhou' (CHECK).
  // Supressão é registrada como 'falhou' com o motivo explícito em `erro`.
  let status: 'enviado' | 'falhou' = 'enviado'
  let suprimido = false
  let erro: string | null = null
  try {
    const res = await admin.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'crm-message',
        recipientEmail: para,
        idempotencyKey: messageId,
        templateData: { assunto, corpo_html: corpoHtml, remetente_nome: remetenteNome },
      },
    })
    if (res.error) throw res.error
    // send-transactional-email responde 200 com reason 'email_suppressed' quando o destinatário está bloqueado
    if (res.data?.reason === 'email_suppressed') {
      status = 'falhou'
      suprimido = true
      erro = 'Destinatário bloqueado para novos envios (bounce/spam/descadastro)'
    }
  } catch (e) {
    status = 'falhou'
    erro = String(e)
    console.error('CRM email failed', e)
  }

  // Registrar no histórico
  const { error: histErro } = await admin.from('crm_emails_enviados').insert({
    pipeline_id: pipelineId,
    para_email: para,
    assunto,
    corpo_html: corpoHtml,
    enviado_por: userId,
    enviado_por_nome: userData.user.email ?? null,
    status,
    erro,
    message_id: messageId,
  })
  if (histErro) {
    console.error('Falha ao gravar histórico de e-mail do CRM', {
      code: histErro.code,
      message: histErro.message,
    })
  }

  // Registrar interação automaticamente
  if (status === 'enviado') {
    await admin.from('crm_interacoes').insert({
      pipeline_id: pipelineId,
      tipo: 'email',
      descricao: `E-mail enviado: ${assunto}`,
      autor_id: userId,
      autor_nome: userData.user.email ?? null,
    })
  }

  return new Response(
    JSON.stringify({ ok: status === 'enviado', status: suprimido ? 'suprimido' : status, erro }),
    { status: status === 'enviado' ? 200 : 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
