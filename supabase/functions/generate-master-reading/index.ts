import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { user_id, scan_id } = await req.json()
    if (!user_id) throw new Error('Missing user_id')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Load profile and latest scan
    const [{ data: profile }, { data: scan }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user_id).single(),
      scan_id
        ? supabase.from('palm_scans').select('*').eq('id', scan_id).single()
        : supabase.from('palm_scans').select('*').eq('user_id', user_id).order('created_at', { ascending: false }).limit(1).single()
    ])

    if (!profile) throw new Error('Profile not found')

    const analysis = scan?.analysis ?? {}
    const intention = profile.intention ?? 'everything'

    const intentionMap: Record<string, string> = {
      love_patterns: 'love and relationships',
      life_purpose: 'life purpose and calling',
      career_money: 'career and finances',
      whats_coming: 'what is approaching in the near future',
      repeating_cycles: 'patterns and cycles that keep recurring',
      everything: 'all aspects of their life',
    }

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })

    const prompt = `You are Madame Aurora, a brilliant and empathetic AI palm reader with a Vogue editorial voice — lyrical, specific, never generic. You are writing a personalized master reading for ${profile.name}.

Their palm analysis:
${JSON.stringify(analysis, null, 2)}

Their main intention: they came here seeking insight into ${intentionMap[intention] ?? 'all aspects of their life'}.
Date of birth: ${profile.date_of_birth ?? 'unknown'}.

Write a master palm reading of 900–1200 words. Structure it with these sections (use the section name as a header on its own line, followed by paragraphs):

THE HAND ITSELF
LIFE LINE
HEART LINE
HEAD LINE
THE MOUNTS
YOUR PATTERN
WHAT IS COMING
A FINAL WORD

Guidelines:
- Address ${profile.name} directly throughout
- Be specific to their actual palm data, not generic
- Tone: intimate, literary, slightly mystical — not clinical, not carnival
- No disclaimers, no "palmistry believes", no hedging
- Each section 2–4 paragraphs
- The final section should feel like a personal letter written specifically for them`

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    })

    const fullContent = message.content[0].type === 'text' ? message.content[0].text : ''
    const previewContent = fullContent.slice(0, 400).split('\n').slice(0, 6).join('\n')
    const wordCount = fullContent.split(/\s+/).length

    const { data: reading, error } = await supabase
      .from('readings')
      .insert({
        user_id,
        scan_id: scan?.id ?? null,
        reading_type: 'master',
        full_content: fullContent,
        preview_content: previewContent,
        word_count: wordCount,
      })
      .select('id')
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify({ reading_id: reading.id, preview: previewContent, word_count: wordCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
