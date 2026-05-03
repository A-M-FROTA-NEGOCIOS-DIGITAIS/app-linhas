import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.text()
    const event = JSON.parse(body)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Handle RevenueCat / Stripe webhook events
    const { type, data } = event

    if (type === 'customer.subscription.created' || type === 'customer.subscription.updated') {
      const subscription = data.object
      const userId = subscription.metadata?.user_id
      if (!userId) {
        console.warn('No user_id in subscription metadata')
        return new Response('ok', { headers: corsHeaders })
      }

      const isActive = subscription.status === 'active'
      const isTrial = subscription.status === 'trialing'
      const status = isActive ? 'active' : isTrial ? 'trial' : 'expired'

      await supabase.from('profiles').update({
        subscription_status: status,
        trial_ends_at: isTrial && subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null,
      }).eq('id', userId)
    }

    if (type === 'customer.subscription.deleted') {
      const subscription = data.object
      const userId = subscription.metadata?.user_id
      if (userId) {
        await supabase.from('profiles').update({ subscription_status: 'expired' }).eq('id', userId)
      }
    }

    // RevenueCat INITIAL_PURCHASE / RENEWAL events
    if (type === 'INITIAL_PURCHASE' || type === 'RENEWAL') {
      const userId = event.app_user_id
      if (userId) {
        await supabase.from('profiles').update({ subscription_status: 'active' }).eq('id', userId)
      }
    }

    if (type === 'CANCELLATION' || type === 'EXPIRATION') {
      const userId = event.app_user_id
      if (userId) {
        await supabase.from('profiles').update({ subscription_status: 'expired' }).eq('id', userId)
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
