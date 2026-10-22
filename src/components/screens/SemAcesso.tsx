import { useTranslation } from 'react-i18next'
import { useFundo } from '@/components/ui/AuroraFundo'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/app'

// A venda acontece no funil (quiz + checkout da Hotmart); a Bluen está desativada.
const CHECKOUT_URL = import.meta.env.VITE_COMPRA_URL ?? 'https://quiz.almaurora.com'

export function SemAcesso() {
  const { t } = useTranslation()
  const reset = useAppStore((s) => s.reset)
  useFundo('login')

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    reset()
    window.location.href = '/'
  }

  return (
    <div className="h-full flex flex-col items-center justify-center px-8 gap-6 text-center">
      <div className="alma-r1 flex items-center justify-center w-[74px] h-[74px] rounded-[22px]" style={{ background: 'linear-gradient(135deg, rgba(242,200,121,.25), rgba(124,92,255,.25))', border: '1px solid rgba(242,200,121,.45)', boxShadow: '0 10px 40px rgba(124,92,255,.35)', animation: 'alma-floaty 5s ease-in-out infinite' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FFE3A8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 1 1 8 0v4" />
        </svg>
      </div>

      <div className="alma-r2 flex flex-col gap-3">
        <h1 className="alma-display text-[32px]">
          {t('semAcesso.title')}<br />
          <span className="alma-grad-text">{t('semAcesso.titleItalic')}</span>
        </h1>
        <p className="text-[15px] leading-[1.6] text-text-secondary max-w-[320px]">{t('semAcesso.body')}</p>
      </div>

      <div className="alma-r3 flex flex-col gap-3 w-full">
        <button type="button" className="alma-btn" onClick={() => { window.location.href = CHECKOUT_URL }}>
          <span>{t('semAcesso.cta')}</span>
        </button>
        <button type="button" onClick={handleSignOut} className="min-h-11 text-[14px] text-text-muted underline underline-offset-2">
          {t('semAcesso.signOut')}
        </button>
      </div>
    </div>
  )
}
