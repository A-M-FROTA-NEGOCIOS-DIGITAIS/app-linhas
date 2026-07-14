import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-bluen-signature',
}

// Verificação HMAC correta: formato t=timestamp,v1=hex sobre "timestamp.body"
async function verifySignature(rawBody: string, signatureHeader: string, secret: string): Promise<boolean> {
  const match = /^t=(\d+),v1=([0-9a-f]+)$/.exec((signatureHeader || '').trim())
  if (!match) return false
  const [, ts, received] = match
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign'],
  )
  const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(`${ts}.${rawBody}`))
  const expected = Array.from(new Uint8Array(signed)).map(b => b.toString(16).padStart(2, '0')).join('')
  if (expected.length !== received.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) { diff |= expected.charCodeAt(i) ^ received.charCodeAt(i) }
  if (diff !== 0) return false
  const nowSec = Math.floor(Date.now() / 1000)
  if (Math.abs(nowSec - Number(ts)) > 300) return false
  return true
}

function buildFullContent(capitulos: Array<{ titulo: string; conteudo: string }>): string {
  return capitulos.map((c) => `${c.titulo}\n\n${c.conteudo}`).join('\n\n---\n\n')
}

// Se a leitura completa (produto principal) ja veio pronta do marketing,
// grava direto em readings — sem chamar nossa IA de novo.
async function criarLeituraSePronta(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  userId: string,
  sessaoId: string,
  // deno-lint-ignore no-explicit-any
  pendente: any,
) {
  if (!Array.isArray(pendente.capitulos) || pendente.capitulos.length === 0) return

  const fullContent = buildFullContent(pendente.capitulos)

  await supabase.from('readings').insert({
    user_id: userId,
    sessao_id: sessaoId,
    reading_type: 'core',
    produto: 'leitura_core',
    capitulos: pendente.capitulos,
    full_content: fullContent,
    preview_content: fullContent.slice(0, 400),
    word_count: fullContent.split(/\s+/).length,
    qualidade_aprovada: true,
    tentativas_qualidade: 0,
  })

  await supabase.from('sessoes').update({
    status: 'concluida',
    marca_adormecida: pendente.marca_adormecida,
    marca_coracao: pendente.marca_coracao,
    marca_mente: pendente.marca_mente,
    marca_vida: pendente.marca_vida,
    updated_at: new Date().toISOString(),
  }).eq('id', sessaoId)

  if (pendente.marca_adormecida) {
    await supabase.from('profiles').update({ marca_adormecida: pendente.marca_adormecida }).eq('id', userId)
  }
}

// Verifica se o time de marketing ja enviou o quiz/palma deste email
// (via intake-quiz-externo) antes da conta existir, e vincula agora.
// deno-lint-ignore no-explicit-any
async function vincularQuizPendente(supabase: any, userId: string, email: string) {
  const { data: pendente } = await supabase
    .from('quiz_externo_pendente')
    .select('*')
    .eq('email', email)
    .eq('processado', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!pendente) return

  const profileUpdate: Record<string, unknown> = {}
  if (pendente.nome) profileUpdate.name = pendente.nome
  if (pendente.data_nascimento) profileUpdate.date_of_birth = pendente.data_nascimento
  if (pendente.cidade_nascimento) profileUpdate.city_of_birth = pendente.cidade_nascimento
  if (pendente.gender) profileUpdate.gender = pendente.gender

  if (Object.keys(profileUpdate).length > 0) {
    await supabase.from('profiles').update(profileUpdate).eq('id', userId)
  }

  const { data: sessao, error: sessaoErr } = await supabase
    .from('sessoes')
    .insert({
      user_id: userId,
      respostas: pendente.respostas,
      analise_visual: pendente.analise_visual,
      palma_imagem_url: pendente.palma_imagem_url,
      audio_url: pendente.audio_url,
      status: 'pendente',
    })
    .select('id')
    .single()

  if (!sessaoErr && sessao) {
    await criarLeituraSePronta(supabase, userId, sessao.id, pendente)
  }

  await supabase.from('quiz_externo_pendente').update({ processado: true }).eq('id', pendente.id)
  console.log(`Quiz externo pendente vinculado para ${email} (${userId})`)
}

// Mapeia o evento/produto Bluen para o tipo interno
function mapProduto(eventType: string, event: Record<string, unknown>): string {
  const productName = String(
    (event.product as Record<string, unknown>)?.name ??
    (event.offer as Record<string, unknown>)?.name ??
    (event.product_name as string) ?? ''
  ).toLowerCase()

  if (eventType === 'subscription_paid' || eventType === 'subscription_reactivated') return 'assinatura_despertar'
  if (productName.includes('mestra') || eventType === 'upsell_paid') return 'upsell_mestra'
  if (productName.includes('quem')) return 'upsell_quem_ama'
  if (productName.includes('sentença') || productName.includes('sentenca')) return 'pos_sentenca'
  if (productName.includes('compatibilidade')) return 'bump_compatibilidade'
  if (productName.includes('ritual')) return 'bump_ritual'
  if (productName.includes('ano interior')) return 'bump_ano_interior'
  if (productName.includes('outra mão') || productName.includes('outra mao')) return 'bump_outra_mao'
  if (productName.includes('áudio') || productName.includes('audio')) return 'bump_audio'
  if (productName.includes('capítulo') || productName.includes('capitulo')) return 'downsell_cap_marca'
  return 'leitura_core'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const rawBody = await req.text()
    const signatureHeader = req.headers.get('x-bluen-signature') ?? ''
    const secret = Deno.env.get('BLUEN_WEBHOOK_SECRET') ?? ''

    if (secret) {
      const valid = await verifySignature(rawBody, signatureHeader, secret)
      if (!valid) {
        console.warn('Invalid Bluen signature')
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    const event = JSON.parse(rawBody) as Record<string, unknown>
    console.log('Bluen webhook event:', JSON.stringify(event))

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const eventType: string = String(event.event ?? event.status ?? '')
    const customer = (event.customer ?? (event.data as Record<string, unknown>)?.customer) as Record<string, unknown> | undefined
    const email: string = String(customer?.email ?? event.email ?? '').toLowerCase().trim()

    const txId: string = String(
      event.transaction_id ??
      (event.transaction as Record<string, unknown>)?.id ??
      event.id ?? ''
    )

    const valorBrl: number | null = (() => {
      const v = (event.transaction as Record<string, unknown>)?.amount ??
        event.amount ?? event.value ?? null
      return v !== null ? Number(v) / 100 : null // Bluen envia em centavos
    })()

    if (!email) {
      console.warn('No email in Bluen payload')
      return new Response(JSON.stringify({ received: true, warning: 'no email found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const isApproved = ['paid', 'subscription_paid', 'upsell_paid', 'subscription_reactivated'].includes(eventType)
    const isCancelled = ['refunded', 'chargeback', 'subscription_cancelled'].includes(eventType)

    if (isApproved) {
      const { data: usersData } = await supabase.auth.admin.listUsers()
      const existingUser = usersData?.users?.find((u: { email?: string }) => u.email === email)
      let userId: string | null = null

      if (existingUser) {
        userId = existingUser.id
        await supabase.from('profiles').update({
          subscription_status: 'active',
          trial_ends_at: null,
        }).eq('id', userId)
        console.log(`Reactivated subscription for ${email} (${userId})`)
        await vincularQuizPendente(supabase, userId, email)
      } else {
        const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email)
        if (inviteError) {
          console.error(`Failed to invite user ${email}:`, inviteError.message)
        } else {
          userId = inviteData?.user?.id ?? null
          if (userId) {
            await new Promise((resolve) => setTimeout(resolve, 500))
            await supabase.from('profiles').update({
              subscription_status: 'active',
              trial_ends_at: null,
            }).eq('id', userId)
            console.log(`Created account for ${email} (${userId})`)
            await vincularQuizPendente(supabase, userId, email)
          }
        }
      }

      // Registra compra na esteira (idempotente via bluen_tx_id UNIQUE)
      if (userId && txId) {
        const produto = mapProduto(eventType, event)
        const { error: compraErr } = await supabase.from('compras').upsert(
          {
            user_id: userId,
            bluen_tx_id: txId,
            produto,
            valor_brl: valorBrl,
            status: 'aprovado',
            payload_bluen: event,
          },
          { onConflict: 'bluen_tx_id', ignoreDuplicates: true }
        )
        if (compraErr) {
          console.error('Erro ao registrar compra:', compraErr.message)
        } else {
          console.log(`Compra registrada: ${produto} para ${email} (tx: ${txId})`)
        }
      }
    }

    if (isCancelled) {
      const { data: usersData } = await supabase.auth.admin.listUsers()
      const match = usersData?.users?.find((u: { email?: string; id: string }) => u.email === email)
      if (match) {
        await supabase.from('profiles').update({ subscription_status: 'expired' }).eq('id', match.id)

        // Marca compra como cancelada/reembolsada
        if (txId) {
          const cancelStatus = eventType === 'refunded' ? 'reembolsado' : 'cancelado'
          await supabase.from('compras').update({ status: cancelStatus }).eq('bluen_tx_id', txId)
        }

        console.log(`Cancelled subscription for ${email}`)
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('webhook-bluen error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
