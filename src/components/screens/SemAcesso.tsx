import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/app'

const CHECKOUT_URL = import.meta.env.VITE_BLUEN_CHECKOUT_URL ?? '#'

export function SemAcesso() {
  const { t } = useTranslation()
  const reset = useAppStore((s) => s.reset)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    reset()
    window.location.href = '/'
  }

  return (
    <div className="h-full flex flex-col items-center justify-center px-8 gap-6 text-center">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C9A961" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7">
        <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 1 1 8 0v4" />
      </svg>

      <div className="flex flex-col gap-3">
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1.3 }}>
          {t('semAcesso.title')}<br />
          <em style={{ color: 'var(--accent-gold)', fontStyle: 'italic' }}>{t('semAcesso.titleItalic')}</em>
        </h1>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 320 }}>
          {t('semAcesso.body')}
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full" style={{ maxWidth: 280 }}>
        <Button variant="primary" fullWidth onClick={() => { window.location.href = CHECKOUT_URL }}>
          {t('semAcesso.cta')}
        </Button>
        <button onClick={handleSignOut} className="text-xs text-text-muted underline underline-offset-2">
          {t('semAcesso.signOut')}
        </button>
      </div>
    </div>
  )
}
