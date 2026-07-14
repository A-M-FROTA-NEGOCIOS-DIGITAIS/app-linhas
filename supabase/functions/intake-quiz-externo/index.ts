import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-intake-secret',
}

interface Capitulo {
  numero: number
  titulo: string
  conteudo: string
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
  marca_adormecida: string | null
  marca_coracao: string | null
  marca_mente: string | null
  marca_vida: string | null
  capitulos: Capitulo[] | null
}

function buildFullContent(capitulos: Capitulo[]): string {
  return capitulos.map((c) => `${c.titulo}\n\n${c.conteudo}`).join('\n\n---\n\n')
}

// Se a leitura completa (produto principal) ja veio pronta do marketing,
// grava direto em readings — sem chamar nossa IA de novo.
async function criarLeituraSePronta(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  userId: string,
  sessaoId: string,
  record: Pick<IntakeRecord, 'capitulos' | 'marca_adormecida' | 'marca_coracao' | 'marca_mente' | 'marca_vida'>,
) {
  if (!Array.isArray(record.capitulos) || record.capitulos.length === 0) return

  const fullContent = buildFullContent(record.capitulos)

  await supabase.from('readings').insert({
    user_id: userId,
    sessao_id: sessaoId,
    reading_type: 'core',
    produto: 'leitura_core',
    capitulos: record.capitulos,
    full_content: fullContent,
    preview_content: fullContent.slice(0, 400),
    word_count: fullContent.split(/\s+/).length,
    qualidade_aprovada: true,
    tentativas_qualidade: 0,
  })

  await supabase.from('sessoes').update({
    status: 'concluida',
    marca_adormecida: record.marca_adormecida,
    marca_coracao: record.marca_coracao,
    marca_mente: record.marca_mente,
    marca_vida: record.marca_vida,
    updated_at: new Date().toISOString(),
  }).eq('id', sessaoId)

  if (record.marca_adormecida) {
    await supabase.from('profiles').update({ marca_adormecida: record.marca_adormecida }).eq('id', userId)
  }
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

  const { data: sessao, error: sessaoErr } = await supabase
    .from('sessoes')
    .insert({
      user_id: userId,
      respostas: record.respostas,
      analise_visual: record.analise_visual,
      palma_imagem_url: record.palma_imagem_url,
      audio_url: record.audio_url,
      status: 'pendente',
    })
    .select('id')
    .single()
  if (sessaoErr) throw sessaoErr

  await criarLeituraSePronta(supabase, userId, sessao.id, record)
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
      marca_adormecida: payload.marca_adormecida ?? null,
      marca_coracao: payload.marca_coracao ?? null,
      marca_mente: payload.marca_mente ?? null,
      marca_vida: payload.marca_vida ?? null,
      capitulos: Array.isArray(payload.capitulos) ? payload.capitulos : null,
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
      marca_adormecida: record.marca_adormecida,
      marca_coracao: record.marca_coracao,
      marca_mente: record.marca_mente,
      marca_vida: record.marca_vida,
      capitulos: record.capitulos,
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
