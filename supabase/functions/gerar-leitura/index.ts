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
    await supabase.from('sessoes').update({ status: 'processando', updated_at: new Date().toISOString() }).eq('id', sessao_id)

    // Carrega sessão e perfil em paralelo
    const [{ data: sessao, error: sessaoErr }, { data: profile, error: profileErr }] = await Promise.all([
      supabase.from('sessoes').select('*').eq('id', sessao_id).eq('user_id', user_id).single(),
      supabase.from('profiles').select('*').eq('id', user_id).single(),
    ])

    if (sessaoErr || !sessao) throw new Error('Sessão não encontrada')
    if (profileErr || !profile) throw new Error('Perfil não encontrado')

    // Resumo textual da palma: usa analise_visual da sessão ou busca o último scan
    let palmResumo = sessao.analise_visual as string ?? ''
    if (!palmResumo) {
      const { data: scan } = await supabase
        .from('palm_scans')
        .select('analysis')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (scan?.analysis) palmResumo = palmAnalysisToText(scan.analysis as Record<string, unknown>)
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
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        debugUltimoErro = 'Nenhum JSON encontrado na resposta'
        continue
      }

      try {
        leituraJson = JSON.parse(jsonMatch[0])
      } catch (parseErr) {
        debugUltimoErro = `JSON.parse falhou: ${String(parseErr)}`
        continue
      }

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
      await supabase.from('sessoes').update({ status: 'erro', updated_at: new Date().toISOString() }).eq('id', sessao_id)
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

    await Promise.all([
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
