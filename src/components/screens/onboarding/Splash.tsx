import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui'
import { LanguagePicker } from '@/components/ui/LanguagePicker'

interface Props {
  onContinue: () => void
}

export function Splash({ onContinue }: Props) {
  const { t } = useTranslation()

  return (
    <div
      className="h-full flex flex-col items-center justify-between px-8 pt-20 pb-10"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div />

      <div className="flex flex-col items-center gap-6">
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 76, fontWeight: 300, letterSpacing: '-0.03em', lineHeight: 1 }}>
          <span style={{ color: 'var(--text-primary)' }}>l</span>
          <em style={{ color: 'var(--accent-gold)', fontStyle: 'italic' }}>i</em>
          <span style={{ color: 'var(--text-primary)' }}>nhas</span>
        </div>

        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 16, color: 'var(--text-secondary)', letterSpacing: '0.04em', textAlign: 'center' }}>
          {t('splash.tagline')}{' '}
          <em style={{ fontFamily: 'var(--font-serif)', color: 'var(--accent-gold)', fontStyle: 'italic' }}>{t('splash.taglineItalic')}</em>
        </p>
      </div>

      <div className="w-full flex flex-col items-center gap-4">
        <LanguagePicker />
        <Button variant="primary" fullWidth onClick={onContinue}>
          {t('splash.start')}
        </Button>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {t('splash.footer')}
        </p>
      </div>
    </div>
  )
}
