import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-intake-secret',
}

interface IntakeRecord {
  email: string
  nome: string | null
  data_nascimento: string | null
  cidade_nascimento: string | null
  gender: string | null
  respostas: Record<string, unknown>
  analise_visual: string
  palma_imagem_url: string | null
  audio_url: string | null
  produto: string | null
  bluen_tx_id: string | null
}

async function vincularSessao(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  userId: string,
  record: IntakeRecord,
) {
  const profileUpdate: Record<string, unknown> = {}
  if (record.nome) profileUpdate.name = record.nome
  if (record.data_nascimento) profileUpdate.date_of_birth = record.data_nascimento
  if (record.cidade_nascimento) profileUpdate.city_of_birth = record.cidade_nascimento
  if (record.gender) profileUpdate.gender = record.gender

  if (Object.keys(profileUpdate).length > 0) {
    await supabase.from('profiles').update(profileUpdate).eq('id', userId)
  }

  await supabase.from('sessoes').insert({
    user_id: userId,
    respostas: record.respostas,
    analise_visual: record.analise_visual,
    palma_imagem_url: record.palma_imagem_url,
    audio_url: record.audio_url,
    status: 'pendente',
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const secret = Deno.env.get('MARKETING_INTAKE_SECRET') ?? ''
    const received = req.headers.get('x-intake-secret') ?? ''
    if (!secret || received !== secret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payload = await req.json()
    const email = String(payload.email ?? '').toLowerCase().trim()
    if (!email) {
      return new Response(JSON.stringify({ error: 'Missing email' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const record: IntakeRecord = {
      email,
      nome: payload.nome ?? null,
      data_nascimento: payload.data_nascimento ?? null,
      cidade_nascimento: payload.cidade_nascimento ?? null,
      gender: payload.gender ?? null,
      respostas: payload.respostas_quiz ?? {},
      analise_visual: payload.analise_palma ?? '',
      palma_imagem_url: payload.palma_imagem_url ?? null,
      audio_url: payload.audio_url ?? null,
      produto: payload.produto ?? null,
      bluen_tx_id: payload.bluen_tx_id ?? null,
    }

    // Caso 1: webhook-bluen ja criou a conta — vincula direto
    const { data: usersData } = await supabase.auth.admin.listUsers()
    // deno-lint-ignore no-explicit-any
    const existingUser = usersData?.users?.find((u: any) => u.email === email)

    if (existingUser) {
      await vincularSessao(supabase, existingUser.id, record)
      console.log(`Sessao vinculada direto para ${email} (${existingUser.id})`)
      return new Response(JSON.stringify({ received: true, linked: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Caso 2: conta ainda nao existe (webhook-bluen nao processou ainda) — guarda pendente
    const { error: pendErr } = await supabase.from('quiz_externo_pendente').insert({
      email,
      nome: record.nome,
      data_nascimento: record.data_nascimento,
      cidade_nascimento: record.cidade_nascimento,
      gender: record.gender,
      respostas: record.respostas,
      analise_visual: record.analise_visual,
      palma_imagem_url: record.palma_imagem_url,
      audio_url: record.audio_url,
      produto: record.produto,
      bluen_tx_id: record.bluen_tx_id,
      processado: false,
    })
    if (pendErr) throw pendErr

    console.log(`Dados guardados como pendentes para ${email} (conta ainda nao existe)`)
    return new Response(JSON.stringify({ received: true, linked: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('intake-quiz-externo error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
