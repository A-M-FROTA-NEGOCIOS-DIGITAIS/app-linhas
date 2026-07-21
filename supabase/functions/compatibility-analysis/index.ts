import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.0'

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

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { user_id, other_image_url, other_name } = await req.json()
    if (!user_id || !other_image_url) throw new Error('Missing required fields')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const [{ data: profile }, { data: myScan }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user_id).single(),
      supabase.from('palm_scans').select('analysis').eq('user_id', user_id)
        .order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ])

    if (!profile) throw new Error('Profile not found')

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })

    // Analyze the other person's palm
    const analysisMsg = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'url', url: other_image_url } },
          { type: 'text', text: 'Analyze this palm briefly. Return JSON only: { "hand_shape": "...", "main_lines": { "life_line": { "characteristic": "..." }, "heart_line": { "characteristic": "..." } }, "overall_character": "..." }' }
        ]
      }]
    })

    let otherAnalysis: Record<string, unknown> = {}
    try {
      const raw = extractText(analysisMsg.content) || '{}'
      otherAnalysis = JSON.parse(raw)
    } catch { /* use empty */ }

    // Generate compatibility reading
    const compatMsg = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1200,
      messages: [{
        role: 'user',
        content: `You are Madame Aurora. Write a compatibility palm reading comparing ${profile.name} and ${other_name ?? 'the other person'}.

${profile.name}'s palm: ${JSON.stringify(myScan?.analysis ?? {}, null, 2)}
${other_name ?? 'Their'} palm: ${JSON.stringify(otherAnalysis, null, 2)}

Write 600–800 words. Sections: THE FIRST MEETING OF HANDS, WHERE YOU ALIGN, WHERE YOU DIFFER, THE TENSION THAT CREATES, WHAT COULD GROW. Be specific, not generic.`
      }]
    })

    const fullContent = extractText(compatMsg.content)
    const previewContent = fullContent.slice(0, 350)

    const { data: reading, error } = await supabase
      .from('readings')
      .insert({
        user_id,
        reading_type: 'compatibility',
        full_content: fullContent,
        preview_content: previewContent,
        theme: other_name ?? 'compatibility',
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
