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
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(supabaseUrl, serviceKey)

  // 1. Validate User
  const { data: { user }, error: userErr } = await admin.auth.getUser(authHeader.replace('Bearer ', ''))
  if (userErr || !user) return bad('Unauthorized', 401)

  // 2. Check Roles
  const { data: roleRows } = await admin.from('user_roles').select('role').eq('user_id', user.id)
  const roles = (roleRows ?? []).map((r: any) => r.role)
  if (!roles.includes('admin') && !roles.includes('comercial')) return bad('Forbidden', 403)

  let body: any
  try { body = await req.json() } catch { return bad('Invalid JSON') }

  const { recipients, emailSubject, emailBodyHtml, senderName, channel, messageText } = body

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) return bad('Recipients required')

  
  if (channel === 'email') {
    if (!emailSubject || !emailBodyHtml) return bad('Subject and Body required for email')
    
    const results = []
    for (const rec of recipients) {
      if (!rec.email) continue
      
      const messageId = `marketing-${crypto.randomUUID()}`
      
      // Enfileira via send-transactional-email (o worker da fila controla o ritmo/rate limit)
      const { data: sendData, error: enqueueError } = await admin.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'crm-message',
          recipientEmail: rec.email,
          idempotencyKey: messageId,
          templateData: {
            assunto: emailSubject.replace('{{nome}}', rec.nome || 'Cliente'),
            corpo_html: emailBodyHtml.replace('{{nome}}', rec.nome || 'Cliente'),
            remetente_nome: senderName
          }
        }
      })
      // 200 com reason 'email_suppressed' = destinatário bloqueado (bounce/spam/descadastro)
      const suprimido = sendData?.reason === 'email_suppressed'
      const delivered = !enqueueError && !suprimido

      results.push({
        email: rec.email,
        success: delivered,
        error: enqueueError ? String(enqueueError) : suprimido ? 'recipient_suppressed' : null,
      })

      // Optional: Add to CRM interaction history if it's a pipeline lead
      if (rec.pipeline_id && delivered) {
        await admin.from('crm_interacoes').insert({
          pipeline_id: rec.pipeline_id,
          tipo: 'email',
          descricao: `[Marketing] E-mail enviado: ${emailSubject}`,
          autor_id: user.id,
          autor_nome: user.email
        })
      }
    }
    
    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  if (channel === 'whatsapp') {
    if (!messageText) return bad('Message text required for WhatsApp')

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER')

    if (!accountSid || !authToken || !fromNumber) {
      return bad('Twilio configuration missing', 500)
    }

    const results = []
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
    const auth = btoa(`${accountSid}:${authToken}`)

    for (const rec of recipients) {
      if (!rec.telefone) continue

      // Format phone number for WhatsApp (must start with whatsapp:)
      let to = rec.telefone.replace(/\D/g, '')
      if (!to.startsWith('+')) to = `+${to}`
      
      const formData = new URLSearchParams()
      formData.append('To', `whatsapp:${to}`)
      formData.append('From', `whatsapp:${fromNumber}`)
      formData.append('Body', messageText.replace('{{nome}}', rec.nome || 'Cliente'))

      try {
        const response = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        })

        const resData = await response.json()
        const success = response.ok

        results.push({ telefone: rec.telefone, success, error: success ? null : resData.message })

        if (success && rec.pipeline_id) {
          await admin.from('crm_interacoes').insert({
            pipeline_id: rec.pipeline_id,
            tipo: 'whatsapp',
            descricao: `[Marketing] WhatsApp enviado: ${messageText.substring(0, 50)}...`,
            autor_id: user.id,
            autor_nome: user.email
          })
        }
      } catch (err: any) {
        results.push({ telefone: rec.telefone, success: false, error: err.message })
      }
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  return bad('Invalid channel')

})
