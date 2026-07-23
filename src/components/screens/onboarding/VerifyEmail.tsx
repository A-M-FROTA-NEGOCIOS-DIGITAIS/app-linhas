import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui'
import { supabase } from '@/lib/supabase'

interface Props {
  email: string
  onSuccess: (userId: string) => void
  onBack: () => void
}

export function VerifyEmail({ email, onSuccess, onBack }: Props) {
  const { t } = useTranslation()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  const handleVerify = async () => {
    if (code.length !== 6) return
    setLoading(true)
    setError(null)
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email',
      })
      if (verifyError) throw verifyError
      if (!data.user) throw new Error(t('verifyEmail.userNotFound'))
      onSuccess(data.user.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('verifyEmail.errorInvalid'))
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    setError(null)
    const { error: resendError } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })
    setResending(false)
    if (resendError) {
      const code = (resendError as { code?: number; error_code?: string })?.error_code
      setError(code === 'over_email_send_rate_limit' ? t('emailEntry.rateLimitError') : resendError.message)
      return
    }
    setResent(true)
    setTimeout(() => setResent(false), 4000)
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
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 300, lineHeight: 1.2, color: 'var(--text-primary)' }}>
            {t('verifyEmail.title')}<br />
            <em style={{ color: 'var(--accent-gold)', fontStyle: 'italic' }}>{t('verifyEmail.titleItalic')}</em>
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', lineHeight: 1.6 }}>
            {t('verifyEmail.codeSent')}{' '}
            <span style={{ color: 'var(--text-primary)' }}>{email}</span>
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            autoFocus
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            style={{
              background: 'var(--bg-surface)',
              border: `1px solid ${error ? '#8B4040' : code.length > 0 ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
              borderRadius: 8,
              padding: '16px',
              fontSize: 28,
              letterSpacing: '0.4em',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)',
              outline: 'none',
              width: '100%',
              textAlign: 'center',
            }}
          />
          {error && (
            <p style={{ fontSize: 13, color: '#8B4040', fontFamily: 'var(--font-sans)' }}>{error}</p>
          )}
        </div>

        <button
          onClick={handleResend}
          disabled={resending || resent}
          style={{
            fontSize: 13,
            color: resent ? 'var(--accent-gold)' : 'var(--text-muted)',
            fontFamily: 'var(--font-sans)',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: resending || resent ? 'default' : 'pointer',
            textAlign: 'left',
          }}
        >
          {resent ? t('verifyEmail.resent') : resending ? t('verifyEmail.resending') : t('verifyEmail.resend')}
        </button>
      </div>

      <Button
        variant="primary"
        fullWidth
        disabled={code.length !== 6}
        loading={loading}
        onClick={handleVerify}
      >
        {t('verifyEmail.confirm')}
      </Button>
    </div>
  )
}
