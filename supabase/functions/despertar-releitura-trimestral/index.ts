import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'npm:@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Claude pode retornar blocos de "thinking" antes do texto — nunca assumir
// que o texto está em content[0]. Procura o primeiro bloco de texto de fato.
function extractText(content: Array<{ type: string; text?: string }>): string {
  const bloco = content.find((c) => c.type === 'text')
  return bloco?.text?.trim() ?? ''
}

// Roda diariamente (via pg_cron). Processa toda assinatura Despertar cuja
// proxima_releitura ja venceu — gera nova leitura comparando com a anterior.
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const cronSecret = Deno.env.get('CRON_INTERNAL_SECRET') ?? ''
  const received = req.headers.get('x-cron-secret') ?? ''
  if (!cronSecret || received !== cronSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })

    const { data: assinaturasDue, error } = await supabase
      .from('assinaturas')
      .select('*')
      .eq('status', 'ativa')
      .lte('proxima_releitura', new Date().toISOString())

    if (error) throw error

    const resultados: Array<{ user_id: string; ok: boolean }> = []

    for (const assinatura of assinaturasDue ?? []) {
      try {
        await processarUma(supabase, anthropic, assinatura)
        resultados.push({ user_id: assinatura.user_id, ok: true })
      } catch (err) {
        console.error(`Falha na re-leitura trimestral de ${assinatura.user_id}:`, err)
        resultados.push({ user_id: assinatura.user_id, ok: false })
      }
    }

    return new Response(JSON.stringify({ processadas: resultados.length, resultados }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('despertar-releitura-trimestral error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function processarUma(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  anthropic: Anthropic,
  // deno-lint-ignore no-explicit-any
  assinatura: any,
) {
  const userId = assinatura.user_id

  const [{ data: profile }, { data: ultimaReleitura }, { data: core }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase
      .from('releituras')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('readings')
      .select('*')
      .eq('user_id', userId)
      .eq('produto', 'leitura_core')
      .eq('qualidade_aprovada', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const anterior = ultimaReleitura ?? core
  if (!anterior) {
    console.warn(`Sem leitura anterior para comparar (${userId}) — pulando re-leitura`)
    return
  }

  const nome = profile?.name ?? 'você'

  const prompt = `Você é Madame Aurora. ${nome} é assinante do Despertar — a cada 90 dias ela recebe uma nova leitura comparando como seu padrão evoluiu.

LEITURA ANTERIOR (resumo):
${String(anterior.full_content ?? '').slice(0, 1500)}

Gere uma re-leitura trimestral: o que mudou, o que se repetiu, e um convite para o próximo ciclo. 3 capítulos, 150-250 palavras cada, tom íntimo de Madame Aurora, em português brasileiro.

Retorne APENAS o JSON:
{
  "capitulos": [
    { "numero": 1, "titulo": "O Que Mudou", "conteudo": "..." },
    { "numero": 2, "titulo": "O Que Ainda Se Repete", "conteudo": "..." },
    { "numero": 3, "titulo": "O Próximo Ciclo", "conteudo": "..." }
  ]
}`

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }],
  })
  const rawText = extractText(msg.content)
  const jsonMatch = rawText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Claude nao retornou JSON valido')

  const parsed = JSON.parse(jsonMatch[0])
  const capitulos = parsed.capitulos as Array<{ numero: number; titulo: string; conteudo: string }>
  if (!Array.isArray(capitulos) || capitulos.length === 0) throw new Error('Sem capitulos gerados')

  const fullContent = capitulos.map((c) => `${c.titulo}\n\n${c.conteudo}`).join('\n\n---\n\n')

  await supabase.from('releituras').insert({
    user_id: userId,
    assinatura_id: assinatura.id,
    comparada_com: anterior.id,
    capitulos,
    full_content: fullContent,
  })

  await supabase
    .from('assinaturas')
    .update({
      ultima_releitura: new Date().toISOString(),
      proxima_releitura: emDias(90),
    })
    .eq('id', assinatura.id)

  console.log(`Re-leitura trimestral gerada para ${userId}`)
}

function emDias(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString()
}
