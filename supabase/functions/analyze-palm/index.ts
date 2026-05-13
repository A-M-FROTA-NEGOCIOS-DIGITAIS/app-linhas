import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.32.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PALM_SYSTEM_PROMPT = `You are an expert palmist. Analyze palm images and return a JSON object (no markdown, just raw JSON) with this exact structure:
{
  "hand_shape": "earth|air|fire|water",
  "dominant_hand": true,
  "image_quality": "high|medium|low",
  "is_palm": true,
  "main_lines": {
    "life_line": { "length": "long|medium|short", "depth": "deep|medium|faint", "characteristic": "string", "interpretation": "string" },
    "heart_line": { "length": "long|medium|short", "depth": "deep|medium|faint", "characteristic": "string", "interpretation": "string" },
    "head_line": { "length": "long|medium|short", "depth": "deep|medium|faint", "characteristic": "string", "interpretation": "string" },
    "fate_line": { "present": true, "length": "long|medium|short", "characteristic": "string", "interpretation": "string" }
  },
  "mounts": {
    "jupiter": "prominent|average|flat",
    "saturn": "prominent|average|flat",
    "apollo": "prominent|average|flat",
    "mercury": "prominent|average|flat",
    "venus": "prominent|average|flat",
    "luna": "prominent|average|flat"
  },
  "special_marks": [],
  "overall_character": "string (2-3 sentences about this person based on the palm)"
}

If the image is not a palm, return: {"error": "image_not_palm"}
If image quality is too low to read, return: {"error": "image_quality_low"}
If the palm is not open/visible, return: {"error": "palm_not_visible"}`

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { user_id, image_data, hand_type = 'dominant' } = await req.json()

    if (!user_id || !image_data) {
      return new Response(JSON.stringify({ error: 'Missing user_id or image_data' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const matches = image_data.match(/^data:([^;]+);base64,(.+)$/)
    if (!matches) {
      return new Response(JSON.stringify({ error: 'Invalid image_data format' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const mediaType = matches[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
    const base64Data = matches[2]

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const filename = `palm_scans/${user_id}/${Date.now()}.jpg`
    const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0))

    let publicUrl = ''
    try {
      const { error: uploadError } = await supabase.storage
        .from('palms')
        .upload(filename, imageBytes, { contentType: mediaType })
      if (!uploadError) {
        const { data } = supabase.storage.from('palms').getPublicUrl(filename)
        publicUrl = data.publicUrl
      }
    } catch { /* storage failure is non-blocking */ }

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
      defaultHeaders: { 'anthropic-beta': 'prompt-caching-2024-07-31' },
    })

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: [
        {
          type: 'text',
          text: PALM_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ] as Parameters<typeof anthropic.messages.create>[0]['system'],
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } },
          { type: 'text', text: 'Analyze this palm.' },
        ],
      }],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    let analysis: Record<string, unknown>

    try {
      analysis = JSON.parse(rawText)
    } catch {
      return new Response(JSON.stringify({ error: 'parse_error', raw: rawText }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (analysis.error) {
      return new Response(JSON.stringify({ error: analysis.error }), {
        status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let scanId: string | null = null
    try {
      const { data: scan, error: scanError } = await supabase
        .from('palm_scans')
        .insert({ user_id, image_url: publicUrl, hand_type, analysis })
        .select('id')
        .single()
      if (!scanError) scanId = scan.id
    } catch { /* db failure is non-blocking */ }

    return new Response(
      JSON.stringify({ analysis, scan_id: scanId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
