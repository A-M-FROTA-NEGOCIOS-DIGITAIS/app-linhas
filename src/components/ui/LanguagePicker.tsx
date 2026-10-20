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
  /** Ocupa a largura toda (tela Você); no splash fica do tamanho do conteúdo. */
  largo?: boolean
}

/** Seletor de idioma em pílula segmentada (ativo = dourado). */
export function LanguagePicker({ className, largo }: Props) {
  const { i18n, t } = useTranslation()
  const active = i18n.language as Lang

  return (
    <div role="group" aria-label={t('splash.language')} className={`alma-seg ${largo ? 'w-full' : ''} ${className ?? ''}`}>
      {LANGS.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => setLanguage(code)}
          aria-pressed={active === code}
          style={{ letterSpacing: 2 }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
