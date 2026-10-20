import { useTranslation } from 'react-i18next'
import { LanguagePicker } from '@/components/ui/LanguagePicker'
import { useFundo } from '@/components/ui/AuroraFundo'
import { Lua, Wordmark } from '@/components/ui/Wordmark'

interface Props {
  onContinue: () => void
}

// Referência: app/reference/L01-Splash
export function Splash({ onContinue }: Props) {
  const { t } = useTranslation()
  useFundo('splash')

  return (
    <div className="h-full flex flex-col items-center px-[26px] pb-[30px] pt-[env(safe-area-inset-top,0px)]">
      <div className="flex-grow" />
      <Lua className="alma-r1" />
      <div className="alma-r1 mt-3.5">
        <Wordmark />
      </div>
      <p className="alma-r2 mt-[18px] text-center text-[17px] text-text-secondary">
        {t('splash.tagline')}{' '}
        <span className="font-serif italic text-[20px] text-gold">{t('splash.taglineItalic')}</span>
      </p>
      <div style={{ flexGrow: 1.3 }} />

      <LanguagePicker className="alma-r3" />

      <button type="button" className="alma-btn alma-r3 mt-[18px]" onClick={onContinue}>
        <span>{t('splash.start')}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2A1A05" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>
      <p className="alma-r3 mt-4 text-[11px] tracking-[3px] text-[#8E89AE]">✦ {t('splash.footer')} ✦</p>
    </div>
  )
}
