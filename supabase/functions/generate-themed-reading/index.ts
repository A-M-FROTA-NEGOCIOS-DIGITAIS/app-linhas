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

const THEME_PROMPTS: Record<string, string> = {
  love: 'love, relationships, and emotional connection — how do their heart line and Venus mount speak to their romantic life?',
  career: 'career, money, and ambition — what do their head line, fate line, and Mercury mount reveal?',
  decision: 'a major decision they are facing — which lines suggest clarity or hesitation, and what their palm advises?',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { user_id, theme, language } = await req.json()
    if (!user_id || !theme) throw new Error('Missing user_id or theme')

    const langMap: Record<string, string> = {
      'pt-BR': 'Brazilian Portuguese',
      'es': 'Spanish',
      'en': 'English',
    }
    const outputLang = langMap[language] ?? 'English'
    const langInstruction = language && language !== 'en'
      ? `\n\nIMPORTANT: Write the entire reading in ${outputLang}. All text must be in ${outputLang}.`
      : ''

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const [{ data: profile }, { data: scan }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user_id).single(),
      supabase.from('palm_scans').select('analysis').eq('user_id', user_id)
        .order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ])

    if (!profile) throw new Error('Profile not found')

    const themeDesc = THEME_PROMPTS[theme] ?? THEME_PROMPTS.decision
    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })

    const genderHint = profile.gender && profile.gender !== 'neutral'
      ? `\nUser's gender: ${profile.gender}. Use correct gendered pronouns.`
      : ''

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1200,
      messages: [{
        role: 'user',
        content: `You are Madame Aurora. Write a focused themed palm reading for ${profile.name} about ${themeDesc}.

Their palm analysis: ${JSON.stringify(scan?.analysis ?? {}, null, 2)}

Write 500–700 words. Be specific to their actual palm data, not generic. Intimate and literary tone. Address ${profile.name} directly throughout. No disclaimers.${genderHint}${langInstruction}`
      }]
    })

    const fullContent = extractText(message.content)
    const previewContent = fullContent.slice(0, 350)

    const { data: reading, error } = await supabase
      .from('readings')
      .insert({
        user_id,
        reading_type: 'themed',
        full_content: fullContent,
        preview_content: previewContent,
        theme,
        word_count: fullContent.split(/\s+/).length,
      })
      .select('id')
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify({ reading_id: reading.id, preview: previewContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
