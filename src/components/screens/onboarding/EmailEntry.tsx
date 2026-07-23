import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui'
import { supabase } from '@/lib/supabase'

interface Props {
  onSuccess: (email: string) => void
  onBack: () => void
  isLogin?: boolean
}

export function EmailEntry({ onSuccess, onBack, isLogin }: Props) {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    <div className="h-full flex flex-col px-6 pt-6 pb-8">
      <button onClick={onBack} className="text-text-secondary active:text-text-primary transition-colors mb-8 self-start">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M11 5l-7 7 7 7" />
        </svg>
      </button>

      <div className="flex-1 flex flex-col justify-center gap-8">
        <div className="flex flex-col gap-3">
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 34, fontWeight: 300, lineHeight: 1.2, color: 'var(--text-primary)' }}>
            {isLogin
              ? <>{t('emailEntry.titleReturning')}<br /><em style={{ color: 'var(--accent-gold)', fontStyle: 'italic' }}>{t('emailEntry.titleReturningItalic')}</em></>
              : <>{t('emailEntry.titleNew')}<br /><em style={{ color: 'var(--accent-gold)', fontStyle: 'italic' }}>{t('emailEntry.titleNewItalic')}</em></>}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', lineHeight: 1.6 }}>
            {isLogin ? t('emailEntry.subtitleReturning') : t('emailEntry.subtitleNew')}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <input
            type="email"
            inputMode="email"
            autoFocus
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null) }}
            placeholder={t('emailEntry.placeholder')}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            style={{
              background: 'var(--bg-surface)',
              border: `1px solid ${error ? '#8B4040' : email ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
              borderRadius: 8,
              padding: '14px 16px',
              fontSize: 15,
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)',
              outline: 'none',
              width: '100%',
            }}
          />
          {error && (
            <p style={{ fontSize: 13, color: '#8B4040', fontFamily: 'var(--font-sans)' }}>{error}</p>
          )}
        </div>
      </div>

      <Button variant="primary" fullWidth loading={loading} disabled={!email.trim()} onClick={handleSend}>
        {t('emailEntry.sendCode')}
      </Button>
    </div>
  )
}
