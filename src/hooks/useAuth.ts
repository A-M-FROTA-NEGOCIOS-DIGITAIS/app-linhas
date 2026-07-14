import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/app'
import type { Profile } from '@/types'

export type AuthState = 'loading' | 'authenticated' | 'unauthenticated'

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>('loading')
  const [email, setEmail] = useState<string | null>(null)
  const { userId, setUserId, setProfile } = useAppStore()

  useEffect(() => {
    const timeout = setTimeout(() => setAuthState('unauthenticated'), 8000)

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(timeout)
      if (session?.user) {
        setUserId(session.user.id)
        setEmail(session.user.email ?? null)
        const profile = await loadProfile(session.user.id)
        // Anonymous session with no profile = incomplete onboarding, restart
        if (!profile && session.user.is_anonymous) {
          await supabase.auth.signOut()
          setAuthState('unauthenticated')
          return
        }
        setAuthState('authenticated')
      } else {
        setAuthState('unauthenticated')
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUserId(session.user.id)
        setEmail(session.user.email ?? null)
        // SIGNED_IN fires during onboarding's signInAnonymously — skip setProfile here
        // to avoid interrupting the onboarding flow. finishOnboarding sets it explicitly.
        if (event !== 'SIGNED_IN') {
          await loadProfile(session.user.id)
        }
        setAuthState('authenticated')
      } else {
        setUserId(null)
        setProfile(null)
        setEmail(null)
        setAuthState('unauthenticated')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (uid: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle()
    if (data) setProfile(data as Profile)
    return data
  }

  return { authState, userId, email }
}
