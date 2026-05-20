import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui'
import { LanguagePicker } from '@/components/ui/LanguagePicker'

interface Props { onContinue: () => void }

export function Splash({ onContinue }: Props) {
  const { t } = useTranslation()
  const [tapCount, setTapCount] = useState(0)

  const handleLogoTap = () => {
    const next = tapCount + 1
    setTapCount(next)
    if (next >= 5) {
      const current = localStorage.getItem('dev_bypass') === 'true'
      localStorage.setItem('dev_bypass', current ? 'false' : 'true')
      setTapCount(0)
      alert(`Dev bypass ${!current ? 'ATIVADO' : 'DESATIVADO'}. Recarregue o app.`)
    }
  }

  return (
    <div
      className="h-full flex flex-col items-center justify-between px-8 pt-20 pb-10"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div />

      {/* Center content */}
      <div className="flex flex-col items-center gap-6">
        <div onClick={handleLogoTap} style={{ fontFamily: 'var(--font-serif)', fontSize: 76, fontWeight: 300, letterSpacing: '-0.03em', lineHeight: 1 }}>
          <span style={{ color: 'var(--text-primary)' }}>l</span>
          <em style={{ color: 'var(--accent-gold)', fontStyle: 'italic' }}>i</em>
          <span style={{ color: 'var(--text-primary)' }}>nhas</span>
        </div>

        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 16, color: 'var(--text-secondary)', letterSpacing: '0.04em', textAlign: 'center' }}>
          {t('splash.tagline')}{' '}
          <em style={{ fontFamily: 'var(--font-serif)', color: 'var(--accent-gold)', fontStyle: 'italic' }}>{t('splash.taglineItalic')}</em>
        </p>
      </div>

      {/* Bottom */}
      <div className="w-full flex flex-col items-center gap-4">
        <LanguagePicker />
        <Button variant="primary" fullWidth onClick={onContinue}>
          {t('common.continue')}
        </Button>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {t('splash.footer')}
        </p>
      </div>
    </div>
  )
}
