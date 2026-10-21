import { createClient } from 'npm:@supabase/supabase-js@2'
import { sendTemplateEmailLogged } from '../_shared/transactional-email-templates/send-and-log.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const NOTIFY_RECIPIENTS = [
  'contato@bpfconsult.com.br',
  'clxn2000@hotmail.com',
  '61996757585@c.us',
]

interface LeadPayload {
  nome: string
  email: string
  telefone: string
  produto?: string
  origem?: string
  user_id?: string
}

function badRequest(msg: string) {
  return new Response(JSON.stringify({ error: msg }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let body: LeadPayload
  try {
    body = await req.json()
  } catch {
    return badRequest('Invalid JSON body')
  }

  const nome = (body.nome ?? '').toString().trim()
  const email = (body.email ?? '').toString().trim().toLowerCase()
  const telefone = (body.telefone ?? '').toString().trim()
  const produto = (body.produto ?? '').toString().trim() || 'plataforma'
  const origem = (body.origem ?? '').toString().trim() || 'desconhecida'

  if (!nome || nome.length < 2) return badRequest('Nome inválido')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return badRequest('E-mail inválido')
  if (!telefone || telefone.replace(/\D/g, '').length < 8) {
    return badRequest('Telefone inválido')
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(supabaseUrl, serviceKey)

  // Anti-abuse: dedupe duplicate submissions from same email/phone in last 5 min
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
  const { data: recent } = await admin
    .from('leads')
    .select('id')
    .or(`email.eq.${email},telefone.eq.${telefone}`)
    .gte('created_at', fiveMinAgo)
    .limit(1)
  if (recent && recent.length > 0) {
    return new Response(
      JSON.stringify({ success: true, deduped: true, lead_id: recent[0].id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  // 1) Persist lead
  const { data: lead, error: insertError } = await admin
    .from('leads')
    .insert({
      nome,
      email,
      telefone,
      produto_interesse: produto,
      origem,
      user_id: body.user_id ?? null,
    })
    .select()
    .single()

  if (!insertError && lead) {
    // 1.1) Create entry in crm_pipeline automatically
    const { error: pipelineError } = await admin
      .from('crm_pipeline')
      .insert({
        lead_id: lead.id,
        lead_origem: origem.toLowerCase().includes('site') || origem.toLowerCase().includes('fale conosco') ? 'site' : 'produto',
        nome: lead.nome,
        email: lead.email,
        telefone: lead.telefone,
        produto_interesse: lead.produto_interesse,
        etapa: 'novo',
        responsavel_nome: 'Sistema',
        observacoes: `Lead captado via ${origem}`,
      })
    
    if (pipelineError) {
      console.error('Failed to create crm_pipeline entry', pipelineError)
    }
  }

  if (insertError) {
    console.error('Failed to insert lead', insertError)
    return new Response(
      JSON.stringify({ error: 'Failed to register lead' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  const dataFormatada = new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
  })

  // 2) Fire-and-track notification emails to each recipient
  const results: Array<{ to: string; ok: boolean; error?: string }> = []
  
  // WhatsApp Link for the team to use
  const waLink = `https://wa.me/55${telefone.replace(/\D/g, '')}`
  
  for (const recipient of NOTIFY_RECIPIENTS) {
    try {
      const res = await sendTemplateEmailLogged(admin, 'new-lead-notification', recipient, {
        idempotencyKey: `lead-${lead.id}-${recipient}`,
        templateData: {
          nome,
          email,
          telefone,
          produto,
          origem,
          data: dataFormatada,
          whatsapp_link: waLink, // Added for quick response
        },
      })
      results.push({ to: recipient, ok: res.sent, error: res.sent ? undefined : 'recipient_suppressed' })
    } catch (err) {
      console.error('Notification email failed', { recipient, err })
      results.push({ to: recipient, ok: false, error: String(err) })
    }
  }

  await admin
    .from('leads')
    .update({ notificado: results.every((r) => r.ok) })
    .eq('id', lead.id)

  return new Response(
    JSON.stringify({ success: true, lead_id: lead.id, notifications: results }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  )
})
