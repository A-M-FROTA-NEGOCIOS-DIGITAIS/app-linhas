import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { BotaoVoltar, SetaCta, Spinner, semSeta } from '@/components/ui'
import { useFundo } from '@/components/ui/AuroraFundo'
import { supabase } from '@/lib/supabase'
import { IconeEnvelope } from './EmailEntry'

interface Props {
  email: string
  onSuccess: (userId: string) => void
  onBack: () => void
}

// Referência: app/reference/L03-Login (passo do código)
export function VerifyEmail({ email, onSuccess, onBack }: Props) {
  const { t } = useTranslation()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [focado, setFocado] = useState(true)
  const verificandoRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  useFundo('login')

  const handleVerify = async () => {
    if (code.length !== 6 || verificandoRef.current) return
    verificandoRef.current = true
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
      verificandoRef.current = false
    } finally {
      setLoading(false)
    }
  }

  // Autopreenchimento (email/SMS) às vezes atualiza o valor visível do input
  // sem disparar o onChange do React em sincronia — reagir direto ao estado
  // "code" aqui garante o envio mesmo se o clique no botão não pegar a tempo.
  useEffect(() => {
    if (code.length === 6) handleVerify()
  }, [code])

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

  // "Não recebeu? Reenviar código" → pergunta normal + link dourado
  const reenviar = t('verifyEmail.resend')
  const corte = reenviar.indexOf('?')
  const [antesLink, textoLink] = corte >= 0 ? [reenviar.slice(0, corte + 1), reenviar.slice(corte + 1).trim()] : ['', reenviar]

  return (
    <div className="h-full flex flex-col px-6 pt-[calc(22px+env(safe-area-inset-top,0px))] pb-[30px] overflow-y-auto no-scrollbar">
      <BotaoVoltar onClick={onBack} />

      <div className="mt-[70px]"><IconeEnvelope /></div>

      <div className="flex flex-col" style={{ animation: 'alma-rise .5s ease-out both' }}>
        <h1 className="alma-display mt-[26px] text-[38px] leading-[1.05]">
          {t('verifyEmail.title')}
          <br />
          <span className="alma-grad-text">{t('verifyEmail.titleItalic')}</span>
        </h1>
        <p className="mt-3.5 text-[15px] leading-[1.5] text-text-secondary">
          {t('verifyEmail.codeSent')} <strong className="text-cream font-medium">{email}</strong>
        </p>

        {/* 6 caixas desenhadas sobre o campo real (que segue recebendo o autopreenchimento do código) */}
        <div className="relative mt-7" onClick={() => inputRef.current?.focus()}>
          <div role="presentation" className="grid grid-cols-6 gap-2">
            {Array.from({ length: 6 }, (_, i) => {
              const digito = code[i]
              const atual = focado && i === code.length && code.length < 6
              return (
                <span
                  key={i}
                  className="flex items-center justify-center"
                  style={{
                    height: 62, borderRadius: 16, fontFamily: 'var(--font-display)', fontSize: 32, color: '#FFE3A8',
                    background: digito ? 'rgba(242,200,121,.12)' : 'rgba(255,255,255,.06)',
                    border: `1.5px solid ${error ? 'var(--danger)' : digito ? 'rgba(242,200,121,.6)' : atual ? '#F2C879' : 'rgba(255,255,255,.14)'}`,
                    boxShadow: atual ? '0 0 0 4px rgba(242,200,121,.15), 0 0 24px rgba(226,106,160,.3)' : 'none',
                  }}
                >
                  {digito ?? (atual && <span className="cursor-blink" style={{ width: 2, height: 28, background: '#FFE3A8' }} />)}
                </span>
              )
            })}
          </div>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            autoFocus
            aria-label={t('verifyEmail.codeSent')}
            onFocus={() => setFocado(true)}
            onBlur={() => setFocado(false)}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="absolute inset-0 w-full h-full opacity-0"
            style={{ caretColor: 'transparent' }}
          />
        </div>
        {error && <p role="alert" className="mt-2.5 text-[13px] text-status-error">{error}</p>}

        <p className="mt-[18px] text-[14px] text-text-muted">
          {resent ? (
            <span className="text-gold">{t('verifyEmail.resent')}</span>
          ) : resending ? (
            t('verifyEmail.resending')
          ) : (
            <>
              {antesLink}{' '}
              <button type="button" onClick={handleResend} className="text-gold underline underline-offset-2">{textoLink}</button>
            </>
          )}
        </p>
      </div>

      <div className="flex-grow min-h-6" />
      <button type="button" className="alma-btn" disabled={code.length !== 6 || loading} onClick={handleVerify} style={{ opacity: code.length !== 6 ? 0.55 : 1 }}>
        {loading ? <Spinner size={18} /> : <><span>{semSeta(t('verifyEmail.confirm'))}</span><SetaCta /></>}
      </button>
    </div>
  )
}
