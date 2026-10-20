import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useAppStore } from '@/store/app'
import { Spinner } from '@/components/ui'
import { Lua, Wordmark } from '@/components/ui/Wordmark'
import { supabase } from '@/lib/supabase'
import { Onboarding } from '@/components/screens/Onboarding'
import { AppShell } from '@/components/screens/AppShell'
import { SemAcesso } from '@/components/screens/SemAcesso'

type CompraStatus = 'verificando' | 'aprovado' | 'sem_compra'

// Emails com acesso total ao app para testes, independente de compra
const ADMIN_EMAILS = ['jmorais@unigranrio.br']

export function App() {
  const { authState, email } = useAuth()
  const profile = useAppStore((s) => s.profile)
  const [compraStatus, setCompraStatus] = useState<CompraStatus>('verificando')
  const isAdmin = !!email && ADMIN_EMAILS.includes(email.toLowerCase())

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
      .eq('status', 'aprovado')
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setCompraStatus(data ? 'aprovado' : 'sem_compra'))
  }, [profile?.id])

  if ((authState === 'loading' && !profile) || (profile?.name && compraStatus === 'verificando')) {
    return (
      <div className="h-full flex items-center justify-center">
        {/* Carregando: a lua e o logo da Alma, como no splash */}
        <div className="flex flex-col items-center gap-3" role="status" aria-label="Carregando">
          <Lua tamanho={34} />
          <Wordmark tamanho={52} />
          <Spinner size={18} className="text-gold opacity-60 mt-2" />
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

  // Cliente pagante e admin veem exatamente a mesma casca. A bifurcacao antiga
  // mandava o pagante para a LeituraCompleta (2 abas) e so o admin para o
  // AppShell (4 abas), o que fez as telas do AppShell apodrecerem sem que
  // ninguem percebesse — nenhum cliente as abria.
  if (compraStatus === 'aprovado' || isAdmin) {
    return (
      <AppShell
        onSignOut={() => {
          // reset() in Profile.tsx already clears the store (profile → null),
          // which triggers App to re-render and show Onboarding — no reload needed
        }}
      />
    )
  }

  return <SemAcesso />
}
