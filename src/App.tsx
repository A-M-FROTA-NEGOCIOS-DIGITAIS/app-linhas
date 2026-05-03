import { useAuth } from '@/hooks/useAuth'
import { useAppStore } from '@/store/app'
import { Spinner } from '@/components/ui'
import { Onboarding } from '@/components/screens/Onboarding'
import { AppShell } from '@/components/screens/AppShell'

export function App() {
  const { authState } = useAuth()
  const profile = useAppStore((s) => s.profile)

  if (authState === 'loading') {
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

  // Authenticated but no profile → just signed up anonymously, show onboarding
  if (authState === 'unauthenticated' || !profile) {
    return (
      <Onboarding
        onComplete={() => {
          // Auth state will update via Supabase listener
          window.location.reload()
        }}
      />
    )
  }

  return (
    <AppShell
      onSignOut={() => {
        window.location.reload()
      }}
    />
  )
}
