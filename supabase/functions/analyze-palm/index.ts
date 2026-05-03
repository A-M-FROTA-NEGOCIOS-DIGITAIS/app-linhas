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
    const { user_id, image_url, hand_type = 'dominant' } = await req.json()

    if (!user_id || !image_url) {
      return new Response(JSON.stringify({ error: 'Missing user_id or image_url' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'url', url: image_url },
          },
          {
            type: 'text',
            text: `You are an expert palmist. Analyze this palm image and return a JSON object (no markdown, just raw JSON) with this exact structure:
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
          }
        ]
      }]
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

    // Store scan record
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: scan, error: scanError } = await supabase
      .from('palm_scans')
      .insert({ user_id, image_url, hand_type, analysis })
      .select('id')
      .single()

    if (scanError) throw scanError

    return new Response(
      JSON.stringify({ analysis, scan_id: scan.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
