import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Spinner } from '@/components/ui'
import { AuroraAvatar } from '@/components/ui/Aurora'
import { useFundo } from '@/components/ui/AuroraFundo'
import type { PalmAnalysis } from '@/types'
import { track, Events } from '@/lib/analytics'
import i18n from '@/lib/i18n'

interface Props {
  analysis: PalmAnalysis
  name: string
  scanId: string
  userId: string
  onContinue: (readingPreview: string) => void
}

// Ícone da pílula do tipo de mão (referência L07-Revelacao).
const ICONE_MAO: Record<string, JSX.Element> = {
  earth: <path d="M3 20l6-10 4 6 3-4 5 8z" />,
  air: <path d="M3 9h11a3 3 0 1 0-3-3M3 15h15a3 3 0 1 1-3 3M3 12h8" />,
  fire: <path d="M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-3.5 2-5 .8 1.6 1.6 2 2.5 2C11 8 11 5.5 12 3z" />,
  water: <path d="M12 3.5c3 4 6 7.2 6 10.5a6 6 0 0 1-12 0c0-3.3 3-6.5 6-10.5z" />,
}

// Intervalo entre as frases da revelação (~0,9s, como na referência).
const PASSO_MS = 900

const isDevBypass = () => localStorage.getItem('dev_bypass') === 'true'
const FAKE_PREVIEW = `__NAME__, your palm carries a rare mark — the double break in the heart line near the mount of Venus. I see this in one in fifty hands.\n\nIt is not damage. It is editing. You rewrite rather than discard — you love in chapters, not seasons. That story at 23 was not a mistake. It was vocabulary.\n\nYour head line slopes deeply toward Luna, which means your instincts arrive before your logic does. Trust that.`

export function Revelation({ analysis, name, scanId, userId, onContinue }: Props) {
  const { t } = useTranslation()
  const [phase, setPhase] = useState(0)
  const [readingPreview, setReadingPreview] = useState('')
  const [generatingReading, setGeneratingReading] = useState(false)
  const [generatingTimedOut, setGeneratingTimedOut] = useState(false)
  const generationStartedRef = useRef(false)
  useFundo('revelacao')

  const lifeLine = analysis.main_lines.life_line
  const heartLine = analysis.main_lines.heart_line

  const HAND_LABELS: Record<string, string> = {
    earth: t('revelation.earth'),
    air: t('revelation.air'),
    fire: t('revelation.fire'),
    water: t('revelation.water'),
  }

  const PALM_VALUE_MAP: Record<string, Record<string, string>> = {
    'pt-BR': {
      long: 'longa', short: 'curta', medium: 'média', strong: 'forte',
      deep: 'profunda', faint: 'suave', light: 'suave', distinct: 'distinta', defined: 'definida',
    },
    es: {
      long: 'larga', short: 'corta', medium: 'media', strong: 'fuerte',
      deep: 'profunda', faint: 'suave', light: 'suave', distinct: 'distinta', defined: 'definida',
    },
  }

  const tv = (value: string) => PALM_VALUE_MAP[i18n.language]?.[value.toLowerCase()] ?? value

  const lines = [
    { text: t('revelation.line1', { name }) },
    { text: t('revelation.line2', { handType: HAND_LABELS[analysis.hand_shape] ?? analysis.hand_shape }) },
    { text: t('revelation.line3', { length: tv(lifeLine?.length ?? 'distinct'), depth: tv(lifeLine?.depth ?? 'defined') }) },
    { text: t('revelation.line4', { characteristic: heartLine?.characteristic ?? 'tells a story' }) },
    { text: t('revelation.line5'), gold: true },
  ]

  // As frases aparecem uma a uma; a geração da leitura começa na 4ª (phase >= 3), como antes.
  useEffect(() => {
    if (phase >= lines.length - 1) return
    const id = setTimeout(() => setPhase((p) => p + 1), phase === 0 ? 1200 : PASSO_MS)
    return () => clearTimeout(id)
  }, [phase, lines.length])

  // Linha 1: última palavra em itálico. Linha 2: o tipo de mão vira uma pílula com ícone.
  const linha1 = lines[0].text
  const corte1 = linha1.lastIndexOf(' ')
  const MARCA = '\u0001'
  const [antesMao, depoisMao] = t('revelation.line2', { handType: MARCA }).split(MARCA)
  const rotuloMao = HAND_LABELS[analysis.hand_shape] ?? analysis.hand_shape

  useEffect(() => {
    if (phase >= 3 && !generationStartedRef.current) {
      generationStartedRef.current = true
      if (isDevBypass()) { setReadingPreview(FAKE_PREVIEW.replace('__NAME__', name)); return }
      setGeneratingReading(true)
      const timeoutId = setTimeout(() => setGeneratingTimedOut(true), 40000)
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      fetch(`${supabaseUrl}/functions/v1/generate-master-reading`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${supabaseKey}` },
        body: JSON.stringify({ user_id: userId, scan_id: scanId, language: i18n.language }),
      })
        .then((r) => r.json())
        .then((d) => { if (d.preview) setReadingPreview(d.preview); track(Events.READING_GENERATED, { reading_id: d.reading_id, word_count: d.word_count }) })
        .catch(console.error)
        .finally(() => { clearTimeout(timeoutId); setGeneratingReading(false) })
    }
  }, [phase, name, userId, scanId])

  return (
    <div className="h-full flex flex-col px-7 pt-[calc(54px+env(safe-area-inset-top,0px))] pb-[30px] overflow-y-auto no-scrollbar">
      <div className="alma-revelar" style={{ animationDelay: '.3s' }}>
        <div className="relative flex items-center justify-center" style={{ width: 112, height: 112 }}>
          <svg aria-hidden="true" width="112" height="112" viewBox="0 0 112 112" className="absolute inset-0" style={{ animation: 'alma-spin 40s linear infinite' }}>
            <circle cx="56" cy="56" r="53" fill="none" stroke="#F2C879" strokeOpacity=".55" strokeDasharray="2 6" />
            <circle cx="56" cy="3" r="3" fill="#FFE3A8" />
          </svg>
          <AuroraAvatar tamanho={88} destacado />
        </div>
      </div>

      <div className="flex flex-col gap-[18px] mt-[34px] font-serif text-[27px] leading-[1.2] text-cream" aria-live="polite">
        {phase >= 0 && (
          <p className="alma-revelar m-0">
            {corte1 > 0 ? <>{linha1.slice(0, corte1)} <em>{linha1.slice(corte1 + 1)}</em></> : linha1}
          </p>
        )}
        {phase >= 1 && (
          <p className="alma-revelar m-0 flex flex-wrap items-center gap-2.5">
            {antesMao}
            <span className="inline-flex items-center">
            <span
              className="inline-flex items-center gap-2 pl-2 pr-3.5 py-1 rounded-pill italic text-[22px]"
              style={{ background: 'linear-gradient(135deg, rgba(242,200,121,.22), rgba(63,214,194,.16))', border: '1px solid rgba(242,200,121,.5)', color: '#FFE3A8' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFE3A8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {ICONE_MAO[analysis.hand_shape] ?? ICONE_MAO.earth}
              </svg>
              {rotuloMao}
            </span>
            {depoisMao}
            </span>
          </p>
        )}
        {phase >= 2 && <p className="alma-revelar m-0">{lines[2].text}</p>}
        {phase >= 3 && <p className="alma-revelar m-0">{lines[3].text}</p>}
        {phase >= 4 && <p className="alma-revelar m-0 alma-grad-text text-[30px]">{lines[4].text}</p>}
      </div>

      <div className="flex-grow min-h-6" />
      {phase >= lines.length - 1 && (
        <button
          type="button"
          className="alma-btn alma-revelar"
          style={{ animationDelay: '.3s' }}
          disabled={generatingReading && !readingPreview && !generatingTimedOut}
          onClick={() => onContinue(readingPreview)}
        >
          {generatingReading && !readingPreview && !generatingTimedOut ? <Spinner size={18} /> : <span>{t('revelation.seeReading')}</span>}
        </button>
      )}
    </div>
  )
}
