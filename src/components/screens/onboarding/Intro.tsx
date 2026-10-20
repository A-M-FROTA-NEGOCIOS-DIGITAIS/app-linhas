import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFundo } from '@/components/ui/AuroraFundo'

interface Props { onContinue: () => void; onBack: () => void }

// Referência: app/reference/L02-Onboarding — ilustração em órbita, um ícone por capítulo.

const Mao = () => (
  <g fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M38 110 L30 70 C28 62 36 58 40 66 L44 76 L42 28 C42 20 52 20 52 28 L54 62 L55 18 C55 10 66 10 66 18 L66 60 L70 26 C71 18 81 19 80 27 L76 66 L82 44 C84 37 93 39 91 46 L84 82 C81 98 74 108 70 112" stroke="#F2C879" strokeOpacity=".7" strokeWidth="2" />
    <path className="alma-intro-ln" d="M40 84 C52 76 66 74 80 78" stroke="url(#alma-intro-g)" strokeWidth="2.4" />
    <path className="alma-intro-ln alma-intro-ln--2" d="M42 72 C54 64 68 62 78 66" stroke="url(#alma-intro-g)" strokeWidth="2.4" />
    <path className="alma-intro-ln alma-intro-ln--3" d="M46 70 C42 84 46 98 56 108" stroke="url(#alma-intro-g)" strokeWidth="2.4" />
  </g>
)

const Olho = () => (
  <g fill="none" strokeLinecap="round">
    <path d="M10 60 C 30 30, 90 30, 110 60 C 90 90, 30 90, 10 60z" stroke="#F2C879" strokeOpacity=".75" strokeWidth="2" />
    <circle cx="60" cy="60" r="18" stroke="url(#alma-intro-g)" strokeWidth="2.4" />
    <circle cx="60" cy="60" r="7" fill="#FFE3A8" />
    <path className="alma-intro-ln" d="M60 10 V24 M60 96 V110 M10 60 H2 M118 60 H110" stroke="url(#alma-intro-g)" strokeWidth="2" />
  </g>
)

const Documento = () => (
  <g fill="none" strokeLinecap="round" strokeLinejoin="round">
    <rect x="26" y="14" width="62" height="84" rx="8" stroke="#F2C879" strokeOpacity=".75" strokeWidth="2" />
    <path className="alma-intro-ln" d="M38 36 H76 M38 50 H76 M38 64 H62" stroke="url(#alma-intro-g)" strokeWidth="2.4" />
    <circle cx="86" cy="90" r="18" fill="#0C1031" stroke="url(#alma-intro-g)" strokeWidth="2.4" />
    <path d="M78 90 l6 6 l10 -12" stroke="#FFE3A8" strokeWidth="2.6" />
  </g>
)

const ICONES = [<Mao key="mao" />, <Olho key="olho" />, <Documento key="doc" />]

export function Intro({ onContinue, onBack }: Props) {
  const { t } = useTranslation()
  const [slide, setSlide] = useState(0)
  useFundo('onboarding')

  const SLIDES = [
    { chapter: t('intro.ch1'), titleA: t('intro.t1a'), titleB: t('intro.t1b'), body: t('intro.b1') },
    { chapter: t('intro.ch2'), titleA: t('intro.t2a'), titleB: t('intro.t2b'), body: t('intro.b2') },
    { chapter: t('intro.ch3'), titleA: t('intro.t3a'), titleB: t('intro.t3b'), body: t('intro.b3') },
  ]

  const isLast = slide === SLIDES.length - 1
  const s = SLIDES[slide]

  return (
    <div className="h-full flex flex-col px-6 pt-[calc(22px+env(safe-area-inset-top,0px))] pb-[30px]">
      <div className="flex items-center justify-between h-11">
        <button
          type="button"
          aria-label={t('common.back')}
          onClick={slide === 0 ? onBack : () => setSlide((p) => p - 1)}
          className="w-11 h-11 -ml-2.5 flex items-center justify-center"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9C3DD" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
        </button>
        <div className="flex gap-1.5" aria-label={`${slide + 1}/3`}>
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className="block h-1 rounded transition-all duration-300"
              style={
                i === slide
                  ? { width: 30, background: 'linear-gradient(90deg, #FFD98E, #F49AC1)', boxShadow: '0 0 10px rgba(244,154,193,.6)' }
                  : { width: 18, background: i < slide ? 'rgba(242,200,121,.6)' : 'rgba(255,255,255,.15)' }
              }
            />
          ))}
        </div>
        <span className="w-[34px]" />
      </div>

      {/* Ilustração em órbita: anéis girando + núcleo pulsando + ícone do capítulo */}
      <div aria-hidden="true" className="relative mx-auto mt-[46px]" style={{ width: 240, height: 240 }}>
        <svg className="absolute inset-0" width="240" height="240" viewBox="0 0 240 240" style={{ animation: 'alma-spin 30s linear infinite' }}>
          <circle cx="120" cy="120" r="116" fill="none" stroke="#F2C879" strokeOpacity=".4" strokeDasharray="2 7" />
          <circle cx="120" cy="4" r="3.5" fill="#FFE3A8" />
          <circle cx="20" cy="178" r="2.5" fill="#E26AA0" />
        </svg>
        <svg className="absolute" width="196" height="196" viewBox="0 0 196 196" style={{ left: 22, top: 22, animation: 'alma-spinr 18s linear infinite' }}>
          <defs>
            <linearGradient id="alma-intro-oa" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#7C5CFF" /><stop offset=".5" stopColor="#E26AA0" /><stop offset="1" stopColor="#3FD6C2" />
            </linearGradient>
          </defs>
          <circle cx="98" cy="98" r="94" fill="none" stroke="url(#alma-intro-oa)" strokeWidth="1.5" strokeDasharray="180 120" />
        </svg>
        <div className="absolute rounded-full" style={{ left: 50, top: 50, width: 140, height: 140, background: 'radial-gradient(circle, rgba(124,92,255,.35) 0%, rgba(124,92,255,0) 70%)', animation: 'alma-core 3s ease-in-out infinite' }} />
        <svg key={slide} className="absolute" width="120" height="120" viewBox="0 0 120 120" style={{ left: 60, top: 60 }}>
          <defs>
            <linearGradient id="alma-intro-g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#FFE3A8" /><stop offset=".6" stopColor="#F49AC1" /><stop offset="1" stopColor="#9C86FF" />
            </linearGradient>
          </defs>
          {ICONES[slide]}
        </svg>
      </div>

      <div key={`t${slide}`} className="flex flex-col items-center mt-[30px]" style={{ animation: 'alma-rise .6s ease-out both' }}>
        <span className="text-[12px] tracking-[4px] uppercase text-gold font-medium">{s.chapter}</span>
        <h1 className="alma-display mt-3.5 text-center text-[36px]" style={{ whiteSpace: 'pre-line' }}>
          {s.titleA}
          <span className="alma-grad-text">{s.titleB}</span>
        </h1>
        <p className="mt-4 text-center text-[16px] leading-[1.55] text-text-secondary max-w-[310px]">{s.body}</p>
      </div>

      <div className="flex-grow" />
      <button type="button" className="alma-btn" onClick={isLast ? onContinue : () => setSlide((p) => p + 1)}>
        <span>{isLast ? t('intro.begin') : t('common.next')}</span>
        {!isLast && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2A1A05" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        )}
      </button>
    </div>
  )
}
