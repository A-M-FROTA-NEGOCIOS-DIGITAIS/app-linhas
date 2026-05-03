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
    const { user_id, scheduled_for } = await req.json()
    if (!user_id) throw new Error('Missing user_id')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const targetDate = scheduled_for ?? new Date().toISOString().split('T')[0]

    // Check if already generated
    const { data: existing } = await supabase
      .from('daily_insights')
      .select('id')
      .eq('user_id', user_id)
      .eq('scheduled_for', targetDate)
      .maybeSingle()

    if (existing) {
      return new Response(JSON.stringify({ insight_id: existing.id, already_exists: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Load profile and master reading
    const [{ data: profile }, { data: reading }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user_id).single(),
      supabase.from('readings').select('preview_content').eq('user_id', user_id).eq('reading_type', 'master')
        .order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ])

    if (!profile) throw new Error('Profile not found')

    const LINE_NAMES = ['life_line', 'heart_line', 'head_line', 'fate_line']
    const dayOfYear = Math.ceil((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
    const focusedLine = LINE_NAMES[dayOfYear % LINE_NAMES.length]

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `You are Madame Aurora. Write a single daily insight for ${profile.name} — 2–3 sentences, intimate and specific.

Today's focus: their ${focusedLine.replace('_', ' ')}.
Their master reading preview: ${reading?.preview_content ?? '(not yet generated)'}.
Date: ${targetDate}.

Write the insight directly, no preamble, no "Today:" label. Make it feel like a note written just for them this morning.`
      }]
    })

    const insightText = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

    const { data: insight, error } = await supabase
      .from('daily_insights')
      .insert({ user_id, insight_text: insightText, focused_line: focusedLine, scheduled_for: targetDate })
      .select('id')
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify({ insight_id: insight.id, insight_text: insightText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
