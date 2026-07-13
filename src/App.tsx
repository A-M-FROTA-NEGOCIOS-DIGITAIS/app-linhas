import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useAppStore } from '@/store/app'
import { Spinner } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { Onboarding } from '@/components/screens/Onboarding'
import { AppShell } from '@/components/screens/AppShell'
import { LeituraCompleta } from '@/components/screens/LeituraCompleta'

type CompraStatus = 'verificando' | 'pago' | 'sem_compra'

export function App() {
  const { authState } = useAuth()
  const profile = useAppStore((s) => s.profile)
  const [compraStatus, setCompraStatus] = useState<CompraStatus>('verificando')

  useEffect(() => {
    if (!profile?.id) {
      setCompraStatus('sem_compra')
      return
    }
    setCompraStatus('verificando')
    supabase
      .from('compras')
      .select('id')
      .eq('user_id', profile.id)
      .eq('produto', 'leitura_core')
      .eq('status', 'pago')
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setCompraStatus(data ? 'pago' : 'sem_compra'))
  }, [profile?.id])

  if ((authState === 'loading' && !profile) || (profile?.name && compraStatus === 'verificando')) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path d="M5 30c7-14 23-14 30 0" stroke="#C9A961" strokeWidth="1.5" strokeLinecap="round" className="animate-pulse-gold"/>
            <path d="M9 30c5-10 17-10 22 0" stroke="#C9A961" strokeWidth="1.5" strokeLinecap="round" className="animate-pulse-gold" style={{ animationDelay: '0.2s' }}/>
            <path d="M14 30c3-6 9-6 12 0" stroke="#C9A961" strokeWidth="1.5" strokeLinecap="round" className="animate-pulse-gold" style={{ animationDelay: '0.4s' }}/>
          </svg>
          <Spinner size={20} className="text-accent-gold opacity-50" />
        </div>
      </div>
    )
  }

  if (!profile || !profile.name) {
    return (
      <Onboarding
        onComplete={() => {
          // Profile already set in store by Welcome — App re-renders automatically
        }}
        preAuthenticated={authState === 'authenticated' && !!profile && !profile.name}
      />
    )
  }

  if (compraStatus === 'pago') {
    return <LeituraCompleta />
  }

  return (
    <AppShell
      onSignOut={() => {
        // reset() in Profile.tsx already clears the store (profile → null),
        // which triggers App to re-render and show Onboarding — no reload needed
      }}
    />
  )
}
