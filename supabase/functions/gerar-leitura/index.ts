import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'npm:@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const LANG_MAP: Record<string, string> = {
  'pt-BR': 'português brasileiro',
  'es': 'español',
  'en': 'English',
}

// Claude pode retornar blocos de "thinking" antes do texto — nunca assumir
// que o texto está em content[0]. Procura o primeiro bloco de texto de fato.
function extractText(content: Array<{ type: string; text?: string }>): string {
  const bloco = content.find((c) => c.type === 'text')
  return bloco?.text?.trim() ?? ''
}

function buildCorePrompt(
  profile: Record<string, unknown>,
  sessao: Record<string, unknown>,
  palmResumo: string,
  idioma: string,
): string {
  const lang = LANG_MAP[idioma] ?? 'português brasileiro'
  const respostas = sessao.respostas as Record<string, string> ?? {}
  const nome = String(profile.name ?? 'você')

  return `Você é Madame Aurora. Você não tenta adivinhar o futuro — você revela o padrão emocional que ${nome} repete no amor e a Marca Adormecida que o criou.

Você trabalha com o Método das 3 Marcas:
- MARCA DO CORAÇÃO: como ela ama (estilo emocional dominante)
- MARCA DA MENTE: como ela decide quando o coração está envolvido
- MARCA DA VIDA: o que a esgota (o padrão que ela repete até se esgotar)

A combinação das 3 revela a MARCA ADORMECIDA — o padrão central que rege os relacionamentos dela.

---

DADOS DESTA SESSÃO:
Nome: ${nome}
Palma: ${palmResumo}
Respostas do quiz:
${Object.entries(respostas).map(([k, v]) => `• ${k}: ${v}`).join('\n')}

---

Retorne APENAS o JSON abaixo. Sem markdown, sem texto antes ou depois:

{
  "marca_adormecida": "nome curto e memorável da marca (ex: A Protetora Exausta, A Que Controla Para Não Sofrer)",
  "marca_coracao": "uma frase descritiva do estilo emocional dominante",
  "marca_mente": "uma frase descritiva de como ela decide quando o coração está envolvido",
  "marca_vida": "uma frase descritiva do padrão que a esgota",
  "capitulos": [
    {
      "numero": 1,
      "titulo": "O Diagnóstico",
      "conteudo": "2-3 parágrafos revelando a Marca Adormecida. Seja direta e específica. Use os dados do quiz e da palma."
    },
    {
      "numero": 2,
      "titulo": "A Marca do Coração",
      "conteudo": "2-3 parágrafos sobre como ela ama — o estilo emocional dominante, com exemplos concretos do que isso significa na prática."
    },
    {
      "numero": 3,
      "titulo": "A Marca da Mente",
      "conteudo": "2-3 parágrafos sobre o que a mente faz quando o coração está envolvido — os mecanismos de defesa, as racionalizações, os sabotadores silenciosos."
    },
    {
      "numero": 4,
      "titulo": "A Marca da Vida",
      "conteudo": "2-3 parágrafos sobre o padrão que a esgota — o papel que ela assume, o custo que paga, por que continua repetindo."
    },
    {
      "numero": 5,
      "titulo": "O Padrão no Amor",
      "conteudo": "2-3 parágrafos conectando as 3 marcas — como elas se combinam para criar o padrão que ela repete. Este é o coração da leitura."
    },
    {
      "numero": 6,
      "titulo": "O Despertar",
      "conteudo": "2-3 parágrafos sobre o que muda quando ela reconhece e nomeia a marca. Não é prescrição. É reconhecimento. Termine com uma frase que ela vai querer salvar."
    }
  ]
}

REGRAS:
- Escreva TUDO em ${lang}
- Cada capítulo: 150-300 palavras
- Fale com ela diretamente (você)
- Use os dados reais — não seja genérica
- Sem previsões de futuro
- Sem clichês de horóscopo
- Sem listas com marcadores dentro dos capítulos
- Tom: íntimo, preciso, levemente místico`
}

function buildQualityPrompt(leituraStr: string): string {
  return `Você é um avaliador de qualidade do sistema ALMA. Avalie esta leitura e retorne APENAS um JSON, sem texto antes ou depois:

${leituraStr}

Critérios (cada um: true ou false):
1. especificidade: usa dados concretos do quiz/palma? não é texto genérico?
2. voz: tom íntimo e preciso, sem clichês de horóscopo?
3. profundidade: tem insight emocional real, vai além do óbvio?
4. estrutura: tem 6 capítulos com conteúdo substancial?
5. sem_previsoes: não faz previsões de futuro?

Retorne:
{
  "aprovada": true,
  "criterios": {
    "especificidade": true,
    "voz": true,
    "profundidade": true,
    "estrutura": true,
    "sem_previsoes": true
  },
  "motivo_reprovacao": null
}`
}

/**
 * A sessao ja descreve a mao dominante? Se o texto comeca com o rotulo da
 * nao-dominante, e porque so ela esta la — o campo esta preenchido mas
 * incompleto. Mesma funcao existe no gerar-produto.
 */
function temMaoDominante(analiseVisual: string | null | undefined): boolean {
  const texto = (analiseVisual ?? '').trim()
  if (!texto) return false
  return !texto.startsWith('Mão não-dominante:')
}


/**
 * Escolhe o scan da mao dominante que vale a pena usar.
 *
 * A regra antiga era "o mais recente vence", e isso descartava silenciosamente
 * uma foto boa em favor de uma ruim: em 22/08 a mesma mao, fotografada com luz
 * e sem luz, foi lida como "ar, linhas longas" e "agua, linhas medias". Como o
 * tipo de mao atravessa a leitura inteira, a diferenca nao e cosmetica.
 *
 * Agora prefere a maior qualidade declarada pelo analyze-palm e so usa a data
 * como desempate.
 */
const ORDEM_QUALIDADE: Record<string, number> = { high: 0, medium: 1, low: 2 }

// deno-lint-ignore no-explicit-any
async function melhorScanDominante(supabase: any, userId: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase
    .from('palm_scans')
    .select('analysis, created_at')
    .eq('user_id', userId)
    .eq('hand_type', 'dominant')
    .order('created_at', { ascending: false })
    .limit(8)

  if (error) {
    console.error(`melhorScanDominante (${userId}):`, error.message)
    return null
  }

  const candidatos = (data ?? []).filter((s: { analysis?: unknown }) => s.analysis)
  if (candidatos.length === 0) return null

  candidatos.sort((a: { analysis: Record<string, string>; created_at: string },
                   b: { analysis: Record<string, string>; created_at: string }) => {
    const qa = ORDEM_QUALIDADE[a.analysis.image_quality] ?? 3
    const qb = ORDEM_QUALIDADE[b.analysis.image_quality] ?? 3
    if (qa !== qb) return qa - qb
    return b.created_at.localeCompare(a.created_at)
  })

  return candidatos[0].analysis as Record<string, unknown>
}

/**
 * Escapa caracteres de controle crus dentro de strings JSON.
 *
 * O modelo escreve prosa com paragrafos e as vezes emite o byte de nova linha
 * DE VERDADE dentro do valor da string, em vez do escape de dois caracteres.
 * JSON proibe controles crus dentro de strings, entao o JSON.parse morre com
 * "Bad control character in string literal" na primeira mudanca de paragrafo.
 *
 * Aqui isso custava caro: cada falha de parse queimava uma das 3 tentativas,
 * cada uma com uma geracao Sonnet mais a avaliacao Haiku. Tres tentativas
 * estouravam o limite de 150s da plataforma e a funcao morria sem gravar nada.
 * O timeout era sintoma deste bug.
 */
function escaparControlesEmStrings(texto: string): string {
  let resultado = ''
  let dentroDeString = false
  let escapado = false

  for (const ch of texto) {
    if (escapado) { resultado += ch; escapado = false; continue }
    if (ch === '\\') { resultado += ch; escapado = true; continue }
    if (ch === '"') { dentroDeString = !dentroDeString; resultado += ch; continue }

    if (dentroDeString) {
      if (ch === '\n') { resultado += '\\n'; continue }
      if (ch === '\r') { resultado += '\\r'; continue }
      if (ch === '\t') { resultado += '\\t'; continue }
      if (ch < ' ') continue
    }
    resultado += ch
  }
  return resultado
}

function extrairJson(raw: string): { json: Record<string, unknown> | null; erro?: string } {
  const limpo = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  const candidatos = [limpo]

  const inicio = limpo.indexOf('{')
  const fim = limpo.lastIndexOf('}')
  if (inicio !== -1 && fim > inicio) candidatos.push(limpo.slice(inicio, fim + 1))

  candidatos.push(escaparControlesEmStrings(candidatos[candidatos.length - 1]))

  let ultimoErro: string | undefined
  for (const candidato of candidatos) {
    try {
      return { json: JSON.parse(candidato) }
    } catch (err) {
      ultimoErro = String(err)
    }
  }
  return { json: null, erro: ultimoErro }
}

function palmAnalysisToText(analysis: Record<string, unknown>): string {
  if (!analysis || Object.keys(analysis).length === 0) return 'análise visual não disponível'
  const lines = analysis.main_lines as Record<string, Record<string, string>> ?? {}
  const parts: string[] = []
  if (analysis.hand_shape) parts.push(`mão tipo ${analysis.hand_shape}`)
  if (lines.heart_line) parts.push(`linha do coração ${lines.heart_line.length ?? ''} e ${lines.heart_line.depth ?? ''} — ${lines.heart_line.interpretation ?? ''}`)
  if (lines.head_line) parts.push(`linha da cabeça ${lines.head_line.length ?? ''} — ${lines.head_line.interpretation ?? ''}`)
  if (lines.life_line) parts.push(`linha da vida ${lines.life_line.length ?? ''} — ${lines.life_line.interpretation ?? ''}`)
  if (analysis.overall_character) parts.push(String(analysis.overall_character))
  return parts.join('; ')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { user_id, sessao_id, idioma = 'pt-BR' } = await req.json()

    if (!user_id || !sessao_id) {
      return new Response(JSON.stringify({ error: 'Missing user_id or sessao_id' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })

    // Verifica leitura core já aprovada para esta sessão (idempotência)
    const { data: existing } = await supabase
      .from('readings')
      .select('id, capitulos, marca_adormecida:sessoes(marca_adormecida)')
      .eq('sessao_id', sessao_id)
      .eq('reading_type', 'core')
      .eq('qualidade_aprovada', true)
      .maybeSingle()

    if (existing) {
      return new Response(
        JSON.stringify({ reading_id: existing.id, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Marca como processando
    const { error: processandoErr } = await supabase
      .from('sessoes')
      .update({ status: 'processando', updated_at: new Date().toISOString() })
      .eq('id', sessao_id)
    if (processandoErr) console.error(`Falha ao marcar sessao como processando (${sessao_id}):`, processandoErr.message)

    // Carrega sessão e perfil em paralelo
    const [{ data: sessao, error: sessaoErr }, { data: profile, error: profileErr }] = await Promise.all([
      supabase.from('sessoes').select('*').eq('id', sessao_id).eq('user_id', user_id).single(),
      supabase.from('profiles').select('*').eq('id', user_id).single(),
    ])

    if (sessaoErr || !sessao) throw new Error('Sessão não encontrada')
    if (profileErr || !profile) throw new Error('Perfil não encontrado')

    // Resumo textual da palma. Nao basta checar se analise_visual existe: o
    // processarOutraMao ANEXA a mao nao-dominante nesse campo, entao uma sessao
    // que so passou pela Outra Mao tem o campo preenchido e mesmo assim nao tem
    // a mao principal — e o fallback nunca rodava.
    let palmResumo = sessao.analise_visual as string ?? ''
    if (!temMaoDominante(palmResumo)) {
      const analise = await melhorScanDominante(supabase, user_id)
      if (analise) {
        const dominante = `Mão dominante: ${palmAnalysisToText(analise)}`
        palmResumo = [dominante, palmResumo.trim()].filter(Boolean).join('\n\n')
      }
    }

    const prompt = buildCorePrompt(profile, sessao, palmResumo, idioma)

    let leituraJson: Record<string, unknown> | null = null
    let qualidadeAprovada = false
    let tentativas = 0
    const MAX_TENTATIVAS = 3
    let debugUltimoRawText = ''
    let debugUltimoErro = ''

    while (!qualidadeAprovada && tentativas < MAX_TENTATIVAS) {
      tentativas++

      let msg
      try {
        msg = await anthropic.messages.create({
          model: 'claude-sonnet-5',
          max_tokens: 4000,
          messages: [{ role: 'user', content: prompt }],
        })
      } catch (apiErr) {
        debugUltimoErro = `anthropic.messages.create falhou: ${String(apiErr)}`
        continue
      }

      const rawText = extractText(msg.content)
      debugUltimoRawText = rawText

      const { json, erro: erroParse } = extrairJson(rawText)
      if (!json) {
        debugUltimoErro = `Sem JSON valido: ${erroParse ?? 'nenhum candidato'} | stop_reason=${msg.stop_reason}`
        console.error(`gerar-leitura tentativa ${tentativas}: ${debugUltimoErro}`)
        continue
      }
      leituraJson = json

      // Portão de qualidade via Haiku (rápido e barato)
      const qualMsg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        messages: [{ role: 'user', content: buildQualityPrompt(JSON.stringify(leituraJson, null, 2)) }],
      })

      const qualRaw = extractText(qualMsg.content)
      const qualMatch = qualRaw.match(/\{[\s\S]*\}/)
      if (qualMatch) {
        try {
          const qualResult = JSON.parse(qualMatch[0])
          qualidadeAprovada = qualResult.aprovada === true
          if (!qualidadeAprovada) debugUltimoErro = `Reprovado no portão de qualidade: ${qualRaw}`
        } catch { /* tenta de novo */ }
      }
    }

    if (!leituraJson) {
      const { error: erroStatusErr } = await supabase
        .from('sessoes')
        .update({ status: 'erro', updated_at: new Date().toISOString() })
        .eq('id', sessao_id)
      if (erroStatusErr) console.error(`Falha ao marcar sessao com erro (${sessao_id}):`, erroStatusErr.message)
      return new Response(JSON.stringify({
        error: 'Falha ao gerar leitura após 3 tentativas',
        debug_ultimo_raw_text: debugUltimoRawText,
        debug_ultimo_erro: debugUltimoErro,
      }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const capitulos = leituraJson.capitulos as Array<Record<string, unknown>>
    const fullContent = Array.isArray(capitulos)
      ? capitulos.map((c) => `${c.titulo}\n\n${c.conteudo}`).join('\n\n---\n\n')
      : ''

    const { data: reading, error: readingErr } = await supabase
      .from('readings')
      .insert({
        user_id,
        sessao_id,
        reading_type: 'core',
        produto: 'leitura_core',
        capitulos: leituraJson.capitulos,
        full_content: fullContent,
        preview_content: fullContent.slice(0, 400),
        word_count: fullContent.split(/\s+/).length,
        qualidade_aprovada: qualidadeAprovada,
        tentativas_qualidade: tentativas,
      })
      .select('id')
      .single()

    if (readingErr) throw readingErr

    const marcaAdormecida = String(leituraJson.marca_adormecida ?? '')

    // A leitura ja foi salva com sucesso acima (readingErr checado) — essas
    // duas atualizacoes sao complementares (status da sessao, sync de perfil).
    // Se falharem, so loga alto: nao vale derrubar a resposta ja bem-sucedida.
    const [{ error: sessaoUpdateErr }, { error: profileUpdateErr }] = await Promise.all([
      supabase.from('sessoes').update({
        status: 'concluida',
        marca_adormecida: marcaAdormecida,
        marca_coracao: String(leituraJson.marca_coracao ?? ''),
        marca_mente: String(leituraJson.marca_mente ?? ''),
        marca_vida: String(leituraJson.marca_vida ?? ''),
        updated_at: new Date().toISOString(),
      }).eq('id', sessao_id),
      supabase.from('profiles').update({ marca_adormecida: marcaAdormecida }).eq('id', user_id),
    ])
    if (sessaoUpdateErr) console.error(`Falha ao concluir sessao (${sessao_id}):`, sessaoUpdateErr.message)
    if (profileUpdateErr) console.error(`Falha ao sincronizar marca_adormecida no perfil (${user_id}):`, profileUpdateErr.message)

    return new Response(
      JSON.stringify({
        reading_id: reading.id,
        marca_adormecida: marcaAdormecida,
        capitulos: leituraJson.capitulos,
        qualidade_aprovada: qualidadeAprovada,
        tentativas,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
