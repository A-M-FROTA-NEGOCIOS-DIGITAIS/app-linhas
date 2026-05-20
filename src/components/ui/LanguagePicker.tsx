import { useTranslation } from 'react-i18next'
import { setLanguage } from '@/lib/i18n'

type Lang = 'en' | 'es' | 'pt-BR'

const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
  { code: 'pt-BR', label: 'PT' },
]

interface Props {
  className?: string
}

export function LanguagePicker({ className }: Props) {
  const { i18n } = useTranslation()
  const active = i18n.language as Lang

  return (
    <div className={`flex items-center gap-1 ${className ?? ''}`}>
      {LANGS.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => setLanguage(code)}
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 11,
            letterSpacing: '0.1em',
            padding: '5px 10px',
            borderRadius: 20,
            border: `1px solid ${active === code ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
            background: active === code ? 'rgba(201,169,97,0.1)' : 'transparent',
            color: active === code ? 'var(--accent-gold)' : 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
