import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/app'
import type { Profile } from '@/types'

export type AuthState = 'loading' | 'authenticated' | 'unauthenticated'

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>('loading')
  const { userId, setUserId, setProfile } = useAppStore()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id)
        await loadProfile(session.user.id)
        setAuthState('authenticated')
      } else {
        setAuthState('unauthenticated')
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUserId(session.user.id)
        await loadProfile(session.user.id)
        setAuthState('authenticated')
      } else {
        setUserId(null)
        setProfile(null)
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
  }

  return { authState, userId }
}
