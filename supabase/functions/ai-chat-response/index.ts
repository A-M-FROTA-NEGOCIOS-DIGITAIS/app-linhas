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
    const { user_id, message } = await req.json()
    if (!user_id || !message) throw new Error('Missing user_id or message')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Load profile, master reading, and recent chat history
    const [{ data: profile }, { data: masterReading }, { data: history }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user_id).single(),
      supabase.from('readings').select('full_content').eq('user_id', user_id).eq('reading_type', 'master')
        .order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('chat_messages').select('role, content').eq('user_id', user_id)
        .order('created_at', { ascending: false }).limit(20),
    ])

    if (!profile) throw new Error('Profile not found')

    // Store user message
    await supabase.from('chat_messages').insert({ user_id, role: 'user', content: message })

    const systemPrompt = `You are Aurora — a deeply intuitive, empathetic AI palm reader. You have read ${profile.name}'s palm in detail and written them a full master reading. You speak to them personally, warmly, and specifically.

${masterReading?.full_content ? `YOUR READING OF THEIR PALM:
${masterReading.full_content.slice(0, 3000)}
` : ''}

Guidelines:
- Always address ${profile.name} by name
- Reference their actual palm details when relevant
- Keep responses 2–4 paragraphs — thoughtful but not overwhelming
- Tone: intimate, lyrical, direct — not clinical, not generic fortune-cookie
- You may ask clarifying questions to give better insight
- Do not repeat the same phrases across messages
- If asked about something outside palmistry, gently redirect to what you can actually see in their hands`

    const conversationHistory = (history ?? [])
      .reverse()
      .slice(-14)
      .map((m: { role: string; content: string }) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 600,
      system: systemPrompt,
      messages: [
        ...conversationHistory,
        { role: 'user', content: message }
      ]
    })

    const reply = response.content[0].type === 'text' ? response.content[0].text.trim() : ''

    // Store Aurora's reply
    await supabase.from('chat_messages').insert({ user_id, role: 'assistant', content: reply })

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
