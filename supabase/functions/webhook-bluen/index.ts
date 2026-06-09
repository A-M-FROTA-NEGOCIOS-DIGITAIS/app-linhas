import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-bluen-signature',
}

// Verify HMAC-SHA256 signature from Bluen
async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
  const computed = btoa(String.fromCharCode(...new Uint8Array(signed)))
  return computed === signature
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.text()
    const signature = req.headers.get('x-bluen-signature') ?? ''
    const secret = Deno.env.get('BLUEN_WEBHOOK_SECRET') ?? ''

    // Validate signature if secret is configured
    if (secret) {
      const valid = await verifySignature(body, signature, secret)
      if (!valid) {
        console.warn('Invalid Bluen signature')
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    const event = JSON.parse(body)
    console.log('Bluen webhook event:', JSON.stringify(event))

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Extract status and customer email from Bluen payload
    // Bluen may nest data under event.data or send flat
    const status: string = event.status ?? event.data?.status ?? event.event ?? ''
    const email: string = (
      event.customer?.email ??
      event.data?.customer?.email ??
      event.buyer?.email ??
      event.email ??
      ''
    ).toLowerCase().trim()

    if (!email) {
      console.warn('No email in Bluen payload', JSON.stringify(event))
      return new Response(JSON.stringify({ received: true, warning: 'no email found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const isApproved =
      status === 'approved' ||
      status === 'paid' ||
      status === 'complete' ||
      status === 'completed' ||
      status === 'APPROVED' ||
      status === 'PAID' ||
      status === 'purchase.approved'

    const isCancelled =
      status === 'cancelled' ||
      status === 'canceled' ||
      status === 'refunded' ||
      status === 'chargeback' ||
      status === 'CANCELLED' ||
      status === 'REFUNDED'

    if (isApproved) {
      // Find profile by email via auth.users
      const { data: authUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      let profileId = authUser?.id ?? null

      // Fallback: look up via auth admin API
      if (!profileId) {
        const { data: usersData } = await supabase.auth.admin.listUsers()
        const match = usersData?.users?.find((u) => u.email === email)
        if (match) profileId = match.id
      }

      if (profileId) {
        await supabase.from('profiles').update({
          subscription_status: 'active',
          trial_ends_at: null,
        }).eq('id', profileId)
        console.log(`Activated subscription for profile ${profileId} (${email})`)
      } else {
        console.warn(`Purchase approved but no profile found for email: ${email}`)
      }
    }

    if (isCancelled) {
      const { data: usersData } = await supabase.auth.admin.listUsers()
      const match = usersData?.users?.find((u) => u.email === email)
      if (match) {
        await supabase.from('profiles').update({
          subscription_status: 'expired',
        }).eq('id', match.id)
        console.log(`Cancelled subscription for ${email}`)
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('webhook-bluen error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
