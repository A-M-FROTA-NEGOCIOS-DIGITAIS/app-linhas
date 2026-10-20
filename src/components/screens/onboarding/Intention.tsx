import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BotaoVoltar, SetaCta } from '@/components/ui'
import { useFundo } from '@/components/ui/AuroraFundo'
import type { Intention } from '@/types'

interface Props {
  onContinue: (intention: Intention) => void
  onBack?: () => void
  initialValue?: Intention
  eyebrow?: string
}

export function IntentionScreen({ onContinue, onBack, initialValue, eyebrow }: Props) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<Intention | null>(initialValue ?? null)
  useFundo('pergunta')

  const OPTIONS: { value: Intention; label: string; sub: string; icon: React.ReactNode }[] = [
    {
      value: 'love_patterns',
      label: t('intention.loveLabel'),
      sub: t('intention.loveSub'),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      ),
    },
    {
      value: 'life_purpose',
      label: t('intention.purposeLabel'),
      sub: t('intention.purposeSub'),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
          <line x1="12" y1="2" x2="12" y2="5" /><line x1="12" y1="19" x2="12" y2="22" />
          <line x1="2" y1="12" x2="5" y2="12" /><line x1="19" y1="12" x2="22" y2="12" />
        </svg>
      ),
    },
    {
      value: 'career_money',
      label: t('intention.careerLabel'),
      sub: t('intention.careerSub'),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
        </svg>
      ),
    },
    {
      value: 'whats_coming',
      label: t('intention.comingLabel'),
      sub: t('intention.comingSub'),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a10 10 0 0 1 0 20" /><path d="M12 6v6l4 2" />
        </svg>
      ),
    },
    {
      value: 'repeating_cycles',
      label: t('intention.cyclesLabel'),
      sub: t('intention.cyclesSub'),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
          <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
      ),
    },
    {
      value: 'everything',
      label: t('intention.everythingLabel'),
      sub: t('intention.everythingSub'),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
  ]

  return (
    <div className="h-full flex flex-col px-6 pt-[calc(22px+env(safe-area-inset-top,0px))] pb-[26px]">
      {onBack && <BotaoVoltar onClick={onBack} />}
      <div className="alma-r1 flex flex-col gap-2 mt-3 mb-6">
        <span className="text-[12px] tracking-[2px] uppercase text-gold">{eyebrow ?? t('intention.eyebrow')}</span>
        <h1 className="alma-display text-[34px]">
          {t('intention.title')}<br />
          <span className="alma-grad-text">{t('intention.titleItalic')}</span>
        </h1>
        <p className="text-[14px] leading-[1.55] text-text-muted">{t('intention.subtitle')}</p>
      </div>

      <div className="alma-r2 flex-1 flex flex-col gap-2.5 overflow-y-auto scroll-area -mx-1 px-1">
        {OPTIONS.map(({ value, label, sub, icon }) => {
          const isActive = selected === value
          return (
            <button key={value} type="button" aria-pressed={isActive} onClick={() => setSelected(value)} className="alma-option" style={{ backdropFilter: 'blur(8px)' }}>
              <span
                className="flex items-center justify-center flex-shrink-0 rounded-full"
                style={{
                  width: 34, height: 34,
                  ...(isActive
                    ? { background: 'linear-gradient(135deg, #FFE3A8, #E7B865)', color: '#2A1A05' }
                    : { background: 'rgba(242,200,121,.1)', color: '#F2C879', boxShadow: 'inset 0 0 0 1px rgba(242,200,121,.35)' }),
                }}
              >
                {icon}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[15.5px] font-medium text-text-primary">{label}</span>
                <span className="block mt-0.5 text-[13px] leading-[1.4] text-text-muted">{sub}</span>
              </span>
            </button>
          )
        })}
      </div>

      <button type="button" className="alma-btn mt-5" disabled={!selected} style={{ height: 56, opacity: selected ? 1 : 0.55 }} onClick={() => selected && onContinue(selected)}>
        <span>{t('common.continue')}</span><SetaCta />
      </button>
    </div>
  )
}
