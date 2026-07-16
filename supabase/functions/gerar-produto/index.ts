import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'npm:@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const LANG_MAP: Record<string, string> = {
  'pt-BR': 'português brasileiro',
  es: 'español',
  en: 'English',
}

interface Capitulo {
  numero: number
  titulo: string
  conteudo: string
}

function buildFullContent(capitulos: Capitulo[]): string {
  return capitulos.map((c) => `${c.titulo}\n\n${c.conteudo}`).join('\n\n---\n\n')
}

function normalizarPalavras(texto: string): Set<string> {
  return new Set(
    texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 4),
  )
}

function medirSobreposicao(capitulosNovos: Capitulo[], capitulosCore: Capitulo[]): number {
  const textoNovo = capitulosNovos.map((c) => c.conteudo).join(' ')
  const textoCore = capitulosCore.map((c) => c.conteudo).join(' ')
  const palavrasNovo = normalizarPalavras(textoNovo)
  const palavrasCore = normalizarPalavras(textoCore)
  if (palavrasNovo.size === 0) return 1
  let comuns = 0
  for (const p of palavrasNovo) if (palavrasCore.has(p)) comuns++
  return comuns / palavrasNovo.size
}

function normalizarTexto(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (test.length > maxCharsPerLine && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines
}

function buildSentencaSvg(frase: string, marcaAdormecida: string): string {
  const linhas = wrapText(frase, 28)
  const lineHeight = 64
  const totalHeight = linhas.length * lineHeight
  const startY = 960 - totalHeight / 2 + lineHeight / 2

  const textos = linhas
    .map(
      (linha, i) =>
        `<text x="540" y="${startY + i * lineHeight}" text-anchor="middle" font-family="Georgia, serif" font-size="52" font-style="italic" fill="#F5EFE0">${escapeXml(linha)}</text>`,
    )
    .join('\n')

  return `<svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0D0B08"/>
      <stop offset="100%" stop-color="#1A150D"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1920" fill="url(#bg)"/>
  <text x="540" y="180" text-anchor="middle" font-family="sans-serif" font-size="28" letter-spacing="6" fill="#C9A961">MADAME AURORA</text>
  <text x="540" y="240" text-anchor="middle" font-family="sans-serif" font-size="20" letter-spacing="3" fill="#8A8172">${escapeXml(marcaAdormecida.toUpperCase())}</text>
  ${textos}
  <text x="540" y="1780" text-anchor="middle" font-family="sans-serif" font-size="22" letter-spacing="4" fill="#8A8172">ALMA</text>
</svg>`
}

async function gerarJsonComClaude(anthropic: Anthropic, prompt: string): Promise<Record<string, unknown> | null> {
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  })
  const rawText = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''
  const jsonMatch = rawText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null
  try {
    return JSON.parse(jsonMatch[0])
  } catch {
    return null
  }
}

// deno-lint-ignore no-explicit-any
async function salvarLeituraSimples(supabase: any, userId: string, sessaoId: string, tipo: string, capitulos: Capitulo[]) {
  const fullContent = buildFullContent(capitulos)
  await supabase.from('readings').insert({
    user_id: userId,
    sessao_id: sessaoId,
    reading_type: tipo,
    produto: tipo,
    capitulos,
    full_content: fullContent,
    preview_content: fullContent.slice(0, 400),
    word_count: fullContent.split(/\s+/).length,
    qualidade_aprovada: true,
    tentativas_qualidade: 1,
  })
}

// --- Leitura Mestra: aprofunda sem repetir o core (portao de incremento) ---
async function gerarMestra(
  anthropic: Anthropic,
  // deno-lint-ignore no-explicit-any
  supabase: any,
  userId: string,
  // deno-lint-ignore no-explicit-any
  sessao: any,
  // deno-lint-ignore no-explicit-any
  profile: any,
  // deno-lint-ignore no-explicit-any
  core: any,
  idioma: string,
) {
  const nome = profile.name ?? 'você'
  const marca = sessao.marca_adormecida ?? ''
  const coreResumo = ((core.capitulos as Capitulo[]) ?? [])
    .map((c) => `${c.titulo}: ${c.conteudo.slice(0, 150)}...`)
    .join('\n')
  const lang = LANG_MAP[idioma] ?? 'português brasileiro'

  const buildPrompt = (reforcar: boolean) => `Você é Madame Aurora. ${nome} já recebeu a leitura principal revelando a Marca Adormecida "${marca}". Agora ela comprou a Leitura Mestra — um mergulho mais fundo.

LEITURA PRINCIPAL JÁ ENTREGUE (resumo, NÃO REPITA este conteúdo):
${coreResumo}

Gere 6 NOVOS capítulos (números 7 a 12) que aprofundem sem repetir o que já foi dito:
7. As Raízes da Marca — de onde vem esse padrão (origem, primeiras experiências)
8. O Padrão Escondido — como a marca aparece em outras áreas da vida, além do amor
9. O Espelho — o tipo de pessoa que ela atrai ou é atraída por causa da marca
10. A Sombra — o lado mais difícil de admitir sobre esse padrão
11. O Caminho — passos concretos (não genéricos) para começar a mudar
12. A Nova História — como seria viver fora dessa marca

${reforcar ? 'IMPORTANTE: a tentativa anterior repetiu demais o conteúdo já entregue. Explore ângulos genuinamente novos, não reformule o que já foi dito.' : ''}

Retorne APENAS o JSON:
{ "capitulos": [ { "numero": 7, "titulo": "...", "conteudo": "2-3 parágrafos" }, ... até 12 ] }

Escreva em ${lang}. Cada capítulo: 200-350 palavras.`

  let capitulos: Capitulo[] | null = null
  for (let tentativa = 0; tentativa < 2 && !capitulos; tentativa++) {
    const resultado = await gerarJsonComClaude(anthropic, buildPrompt(tentativa > 0))
    const candidato = resultado?.capitulos as Capitulo[] | undefined
    if (!Array.isArray(candidato) || candidato.length < 6) continue
    const densidadeOk = candidato.every((c) => (c.conteudo?.length ?? 0) >= 400)
    const overlap = medirSobreposicao(candidato, (core.capitulos as Capitulo[]) ?? [])
    if (densidadeOk && overlap < 0.5) capitulos = candidato
  }

  if (!capitulos) {
    console.error(`Mestra: sem incremento suficiente para ${userId}`)
    return { erro: true }
  }

  await salvarLeituraSimples(supabase, userId, sessao.id, 'mestra', capitulos)
  return { ok: true }
}

// --- Ritual: protocolo pratico, nao leitura expandida ---
async function gerarRitual(
  anthropic: Anthropic,
  // deno-lint-ignore no-explicit-any
  supabase: any,
  userId: string,
  // deno-lint-ignore no-explicit-any
  sessao: any,
  // deno-lint-ignore no-explicit-any
  profile: any,
  idioma: string,
) {
  const nome = profile.name ?? 'você'
  const marca = sessao.marca_adormecida ?? ''
  const lang = LANG_MAP[idioma] ?? 'português brasileiro'

  const prompt = `Você é Madame Aurora. Crie um Ritual/Protocolo prático (não é uma leitura expandida) para ${nome} começar a romper o padrão "${marca}".

3 a 5 passos concretos e acionáveis — nada genérico tipo "medite mais". Tom íntimo, direto, místico mas prático. Em ${lang}.

Retorne APENAS o JSON:
{
  "titulo": "nome do ritual",
  "passos": [ { "numero": 1, "texto": "..." } ],
  "frase_final": "uma frase de fechamento memorável"
}`

  const resultado = await gerarJsonComClaude(anthropic, prompt)
  const passos = resultado?.passos as Array<{ numero: number; texto: string }> | undefined
  if (!passos || passos.length === 0) {
    console.error(`Ritual: falha ao gerar para ${userId}`)
    return { erro: true }
  }

  const conteudo = [...passos.map((p) => `${p.numero}. ${p.texto}`), '', String(resultado?.frase_final ?? '')].join('\n')
  const capitulos: Capitulo[] = [{ numero: 1, titulo: String(resultado?.titulo ?? 'Ritual'), conteudo }]
  await salvarLeituraSimples(supabase, userId, sessao.id, 'ritual', capitulos)
  return { ok: true }
}

// --- Compatibilidade / Quem Ama: le a compradora, terceiro so como contexto ---
async function gerarVinculo(
  anthropic: Anthropic,
  // deno-lint-ignore no-explicit-any
  supabase: any,
  userId: string,
  // deno-lint-ignore no-explicit-any
  sessao: any,
  // deno-lint-ignore no-explicit-any
  profile: any,
  tipo: string,
  contextoTerceiro: Record<string, unknown> | undefined,
  idioma: string,
) {
  if (!contextoTerceiro) {
    console.log(`Vinculo (${tipo}) para ${userId} aguardando dados do terceiro`)
    return { aguardando_dados: true }
  }

  const nome = profile.name ?? 'você'
  const marca = sessao.marca_adormecida ?? ''
  const lang = LANG_MAP[idioma] ?? 'português brasileiro'

  const prompt = `Você é Madame Aurora. ${nome} tem a Marca Adormecida "${marca}". Ela quer entender como esse padrão aparece especificamente na relação com esta pessoa: ${JSON.stringify(contextoTerceiro)}.

Escreva uma leitura de vínculo — NÃO é uma leitura da outra pessoa, é sobre como ${nome} vive seu próprio padrão nessa relação específica. Em ${lang}.

Retorne APENAS o JSON:
{
  "capitulos": [
    { "numero": 1, "titulo": "O Que Essa Pessoa Ativa Em Você", "conteudo": "2-3 parágrafos" },
    { "numero": 2, "titulo": "Onde a Marca Aparece Nessa Relação", "conteudo": "2-3 parágrafos" },
    { "numero": 3, "titulo": "O Que Fazer Com Isso", "conteudo": "2-3 parágrafos" }
  ]
}`

  const resultado = await gerarJsonComClaude(anthropic, prompt)
  const capitulos = resultado?.capitulos as Capitulo[] | undefined
  if (!capitulos || capitulos.length === 0) {
    console.error(`Vinculo (${tipo}): falha ao gerar para ${userId}`)
    return { erro: true }
  }

  await salvarLeituraSimples(supabase, userId, sessao.id, tipo, capitulos)
  return { ok: true }
}

// --- O Seu Ano Interior: 12 blocos mensais distintos ---
async function gerarAnoInterior(
  anthropic: Anthropic,
  // deno-lint-ignore no-explicit-any
  supabase: any,
  userId: string,
  // deno-lint-ignore no-explicit-any
  sessao: any,
  // deno-lint-ignore no-explicit-any
  profile: any,
  idioma: string,
) {
  const nome = profile.name ?? 'você'
  const marca = sessao.marca_adormecida ?? ''
  const lang = LANG_MAP[idioma] ?? 'português brasileiro'

  const prompt = `Você é Madame Aurora. Gere "O Seu Ano Interior" para ${nome}, cuja Marca Adormecida é "${marca}".

12 blocos, um por mês, cada um revelando como esse padrão tende a se manifestar ou pedir atenção naquele período do ano (não é previsão de eventos — é ciclo emocional). Cada bloco: 80-150 palavras, distinto dos demais, em ${lang}.

Retorne APENAS o JSON:
{ "meses": [ { "mes": 1, "titulo": "...", "texto": "..." } ] }
(12 objetos no array, mes de 1 a 12)`

  let meses: Array<{ mes: number; titulo: string; texto: string }> | null = null
  for (let tentativa = 0; tentativa < 2 && !meses; tentativa++) {
    const resultado = await gerarJsonComClaude(anthropic, prompt)
    const candidato = resultado?.meses as Array<{ mes: number; titulo: string; texto: string }> | undefined
    if (!Array.isArray(candidato) || candidato.length !== 12) continue
    const distintos = new Set(candidato.map((m) => normalizarTexto(m.texto).slice(0, 40))).size
    if (distintos === 12) meses = candidato
  }

  if (!meses) {
    console.error(`Ano Interior: falha ao gerar 12 blocos distintos para ${userId}`)
    return { erro: true }
  }

  const fullContent = meses.map((m) => `${m.titulo}\n\n${m.texto}`).join('\n\n---\n\n')
  await supabase.from('readings').insert({
    user_id: userId,
    sessao_id: sessao.id,
    reading_type: '12meses',
    produto: '12meses',
    capitulos: meses,
    full_content: fullContent,
    preview_content: fullContent.slice(0, 400),
    word_count: fullContent.split(/\s+/).length,
    qualidade_aprovada: true,
    tentativas_qualidade: 1,
  })
  return { ok: true }
}

// --- Outra Mao: precisa de um novo scan antes de gerar ---
// deno-lint-ignore no-explicit-any
async function processarOutraMao(supabase: any, userId: string, sessao: any, segundaPalmaAnalise: string | undefined) {
  if (!segundaPalmaAnalise) {
    console.log(`Outra mao para ${userId} aguardando novo scan`)
    return { aguardando_scan: true }
  }
  await supabase
    .from('sessoes')
    .update({ analise_visual: `${sessao.analise_visual ?? ''}\n\nMão não-dominante: ${segundaPalmaAnalise}` })
    .eq('id', sessao.id)
  return { ok: true, vinculado: true }
}

// --- Downsell: capitulo isolado (A Marca da Vida) ---
async function gerarDownsell(
  anthropic: Anthropic,
  // deno-lint-ignore no-explicit-any
  supabase: any,
  userId: string,
  // deno-lint-ignore no-explicit-any
  sessao: any,
  // deno-lint-ignore no-explicit-any
  profile: any,
  idioma: string,
) {
  const nome = profile.name ?? 'você'
  const lang = LANG_MAP[idioma] ?? 'português brasileiro'

  const prompt = `Você é Madame Aurora. Escreva APENAS um capítulo isolado para ${nome}, revelando "A Marca da Vida" — o padrão que a esgota nos relacionamentos — com base em:

Respostas do quiz: ${JSON.stringify(sessao.respostas ?? {})}
Palma: ${sessao.analise_visual ?? 'não disponível'}

Retorne APENAS o JSON:
{ "titulo": "A Marca da Vida", "conteudo": "3-4 parágrafos, tom íntimo e direto, em ${lang}" }`

  const resultado = await gerarJsonComClaude(anthropic, prompt)
  const conteudo = resultado?.conteudo as string | undefined
  if (!conteudo) {
    console.error(`Downsell: falha ao gerar para ${userId}`)
    return { erro: true }
  }

  const capitulos: Capitulo[] = [{ numero: 1, titulo: String(resultado?.titulo ?? 'A Marca da Vida'), conteudo }]
  await salvarLeituraSimples(supabase, userId, sessao.id, 'downsell', capitulos)
  return { ok: true }
}

// --- Sentenca: destila a leitura em frase + peca visual compartilhavel ---
async function gerarSentenca(
  anthropic: Anthropic,
  // deno-lint-ignore no-explicit-any
  supabase: any,
  userId: string,
  // deno-lint-ignore no-explicit-any
  sessao: any,
  // deno-lint-ignore no-explicit-any
  profile: any,
  // deno-lint-ignore no-explicit-any
  core: any,
  idioma: string,
) {
  const nome = profile.name ?? 'você'
  const marca = sessao.marca_adormecida ?? ''
  const lang = LANG_MAP[idioma] ?? 'português brasileiro'
  const resumoCore = ((core.capitulos as Capitulo[]) ?? [])
    .map((c) => c.conteudo)
    .join(' ')
    .slice(0, 1500)

  const prompt = `Você é Madame Aurora. Destile a leitura de ${nome} (Marca Adormecida: "${marca}") em UMA frase curta, poderosa e compartilhável — algo que ela colocaria no story do Instagram porque se reconheceu profundamente.

Leitura completa (resumo):
${resumoCore}

Retorne APENAS o JSON:
{ "frase": "a frase, máximo 140 caracteres, em ${lang}", "legenda": "uma legenda curta de apoio, opcional" }`

  const resultado = await gerarJsonComClaude(anthropic, prompt)
  const frase = resultado?.frase as string | undefined
  if (!frase) {
    console.error(`Sentenca: falha ao gerar para ${userId}`)
    return { erro: true }
  }

  const svg = buildSentencaSvg(frase, marca)
  const path = `${userId}-${Date.now()}.svg`
  await supabase.storage.from('sentencas').upload(path, new Blob([svg], { type: 'image/svg+xml' }), {
    contentType: 'image/svg+xml',
  })
  const { data: urlData } = supabase.storage.from('sentencas').getPublicUrl(path)

  await supabase.from('readings').insert({
    user_id: userId,
    sessao_id: sessao.id,
    reading_type: 'sentenca',
    produto: 'sentenca',
    full_content: frase,
    preview_content: String(resultado?.legenda ?? frase),
    imagem_url: urlData.publicUrl,
    qualidade_aprovada: true,
    tentativas_qualidade: 1,
  })
  return { ok: true, imagem_url: urlData.publicUrl }
}

// --- Audio: TTS via ElevenLabs (aguarda configuracao se a chave nao existir) ---
// deno-lint-ignore no-explicit-any
async function gerarAudioTts(supabase: any, userId: string, core: any) {
  const apiKey = Deno.env.get('ELEVENLABS_API_KEY')
  if (!apiKey) {
    console.warn(`ELEVENLABS_API_KEY nao configurada — audio para ${userId} fica pendente`)
    return { aguardando_configuracao: true }
  }

  const voiceId = Deno.env.get('ELEVENLABS_VOICE_ID') ?? '21m00Tcm4TlvDq8ikWAM'
  const texto = String(core.full_content ?? '').slice(0, 5000)

  const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: texto, model_id: 'eleven_multilingual_v2' }),
  })
  if (!resp.ok) throw new Error(`ElevenLabs falhou: ${resp.status}`)

  const audioBuffer = await resp.arrayBuffer()
  const path = `${userId}-${Date.now()}.mp3`
  await supabase.storage.from('audios').upload(path, audioBuffer, { contentType: 'audio/mpeg' })
  const { data: urlData } = supabase.storage.from('audios').getPublicUrl(path)
  await supabase.from('readings').update({ audio_url: urlData.publicUrl }).eq('id', core.id)
  return { audio_url: urlData.publicUrl }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { user_id, produto, idioma = 'pt-BR', contexto_terceiro, segunda_palma_analise } = await req.json()

    if (!user_id || !produto) {
      return new Response(JSON.stringify({ error: 'Missing user_id or produto' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })
    const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' }

    const [{ data: sessao }, { data: profile }, { data: core }] = await Promise.all([
      supabase.from('sessoes').select('*').eq('user_id', user_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('profiles').select('*').eq('id', user_id).single(),
      supabase
        .from('readings')
        .select('*')
        .eq('user_id', user_id)
        .eq('produto', 'leitura_core')
        .eq('qualidade_aprovada', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    if (!sessao) return new Response(JSON.stringify({ error: 'Sessão não encontrada' }), { status: 404, headers: jsonHeaders })
    if (!profile) return new Response(JSON.stringify({ error: 'Perfil não encontrado' }), { status: 404, headers: jsonHeaders })

    let resultado: Record<string, unknown>

    switch (produto) {
      case 'mestra':
        if (!core) return new Response(JSON.stringify({ error: 'Leitura core ainda não existe' }), { status: 409, headers: jsonHeaders })
        resultado = await gerarMestra(anthropic, supabase, user_id, sessao, profile, core, idioma)
        break
      case 'ritual':
        resultado = await gerarRitual(anthropic, supabase, user_id, sessao, profile, idioma)
        break
      case 'compatibilidade':
      case 'quem_ama':
        resultado = await gerarVinculo(anthropic, supabase, user_id, sessao, profile, produto, contexto_terceiro, idioma)
        break
      case '12meses':
        resultado = await gerarAnoInterior(anthropic, supabase, user_id, sessao, profile, idioma)
        break
      case 'outra_mao':
        resultado = await processarOutraMao(supabase, user_id, sessao, segunda_palma_analise)
        break
      case 'downsell':
        resultado = await gerarDownsell(anthropic, supabase, user_id, sessao, profile, idioma)
        break
      case 'sentenca':
        if (!core) return new Response(JSON.stringify({ error: 'Leitura core ainda não existe' }), { status: 409, headers: jsonHeaders })
        resultado = await gerarSentenca(anthropic, supabase, user_id, sessao, profile, core, idioma)
        break
      case 'audio':
        if (!core) return new Response(JSON.stringify({ error: 'Leitura core ainda não existe' }), { status: 409, headers: jsonHeaders })
        resultado = await gerarAudioTts(supabase, user_id, core)
        break
      default:
        return new Response(JSON.stringify({ error: `produto desconhecido: ${produto}` }), { status: 400, headers: jsonHeaders })
    }

    return new Response(JSON.stringify({ received: true, produto, ...resultado }), { headers: jsonHeaders })
  } catch (err) {
    console.error('gerar-produto error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
