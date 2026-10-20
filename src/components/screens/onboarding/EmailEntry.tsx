import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BotaoVoltar, SetaCta, Spinner, semSeta } from '@/components/ui'
import { useFundo } from '@/components/ui/AuroraFundo'
import { supabase } from '@/lib/supabase'

interface Props {
  onSuccess: (email: string) => void
  onBack: () => void
  isLogin?: boolean
}

/** Envelope flutuando (login e verificação). Referência: app/reference/L03-Login */
export function IconeEnvelope() {
  return (
    <div
      aria-hidden="true"
      className="flex items-center justify-center"
      style={{
        width: 74, height: 74, borderRadius: 22, animation: 'alma-floaty 5s ease-in-out infinite',
        background: 'linear-gradient(135deg, rgba(242,200,121,.25), rgba(124,92,255,.25))',
        border: '1px solid rgba(242,200,121,.45)', boxShadow: '0 10px 40px rgba(124,92,255,.35)',
      }}
    >
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#FFE3A8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3.5 7l8.5 6 8.5-6" />
      </svg>
    </div>
  )
}

export function EmailEntry({ onSuccess, onBack, isLogin }: Props) {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useFundo('login')

  const handleSend = async () => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed.includes('@')) { setError(t('emailEntry.emailInvalid')); return }
    setLoading(true)
    setError(null)
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: { shouldCreateUser: false },
      })
      if (otpError) throw otpError
      onSuccess(trimmed)
    } catch (err) {
      const code = (err as { code?: number; error_code?: string })?.error_code
      if (code === 'over_email_send_rate_limit') {
        setError(t('emailEntry.rateLimitError'))
      } else {
        setError(t('emailEntry.noAccountError'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col px-6 pt-[calc(22px+env(safe-area-inset-top,0px))] pb-[30px] overflow-y-auto no-scrollbar">
      <BotaoVoltar onClick={onBack} />

      <div className="mt-[70px]"><IconeEnvelope /></div>

      <div className="flex flex-col" style={{ animation: 'alma-rise .5s ease-out both' }}>
        <h1 className="alma-display mt-[26px] text-[38px] leading-[1.05]">
          {isLogin ? t('emailEntry.titleReturning') : t('emailEntry.titleNew')}
          <br />
          <span className="alma-grad-text">{isLogin ? t('emailEntry.titleReturningItalic') : t('emailEntry.titleNewItalic')}</span>
        </h1>
        <p className="mt-3.5 text-[15px] leading-[1.5] text-text-secondary">
          {isLogin ? t('emailEntry.subtitleReturning') : t('emailEntry.subtitleNew')}
        </p>

        <input
          type="email"
          inputMode="email"
          autoFocus
          aria-label={t('emailEntry.placeholder')}
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(null) }}
          placeholder={t('emailEntry.placeholder')}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="alma-input w-full mt-7"
          style={{ height: 58, padding: '0 18px', borderRadius: 18, fontSize: 17, backdropFilter: 'blur(8px)', ...(error ? { borderColor: 'var(--danger)' } : {}) }}
        />
        {error && <p role="alert" className="mt-2.5 text-[13px] text-status-error">{error}</p>}
      </div>

      <div className="flex-grow min-h-6" />
      <button type="button" className="alma-btn" disabled={!email.trim() || loading} onClick={handleSend} style={{ opacity: !email.trim() ? 0.55 : 1 }}>
        {loading ? <Spinner size={18} /> : <><span>{semSeta(t('emailEntry.sendCode'))}</span><SetaCta /></>}
      </button>
    </div>
  )
}
