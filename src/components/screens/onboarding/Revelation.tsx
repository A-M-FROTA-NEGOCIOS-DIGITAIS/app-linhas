import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui'
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

function TypewriterLine({ text, delay = 0, gold = false, onDone }: { text: string; delay?: number; gold?: boolean; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    let i = 0
    const t = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplayed(text.slice(0, ++i))
        if (i >= text.length) {
          clearInterval(interval)
          setDone(true)
          onDoneRef.current?.()
        }
      }, 28)
      return () => clearInterval(interval)
    }, delay)
    return () => clearTimeout(t)
  }, [text, delay])

  return (
    <p style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 300, lineHeight: 1.35, color: gold ? 'var(--accent-gold)' : 'var(--text-primary)', letterSpacing: '-0.01em', minHeight: '1.35em' }}>
      {displayed}
      {!done && <span className="cursor-blink" style={{ borderRight: `2px solid ${gold ? 'var(--accent-gold)' : 'var(--text-primary)'}`, marginLeft: 2 }} />}
    </p>
  )
}

const isDevBypass = () => localStorage.getItem('dev_bypass') === 'true'
const FAKE_PREVIEW = `__NAME__, your palm carries a rare mark — the double break in the heart line near the mount of Venus. I see this in one in fifty hands.\n\nIt is not damage. It is editing. You rewrite rather than discard — you love in chapters, not seasons. That story at 23 was not a mistake. It was vocabulary.\n\nYour head line slopes deeply toward Luna, which means your instincts arrive before your logic does. Trust that.`

export function Revelation({ analysis, name, scanId, userId, onContinue }: Props) {
  const { t } = useTranslation()
  const [phase, setPhase] = useState(0)
  const [readingPreview, setReadingPreview] = useState('')
  const [generatingReading, setGeneratingReading] = useState(false)
  const [generatingTimedOut, setGeneratingTimedOut] = useState(false)
  const generationStartedRef = useRef(false)

  const lifeLine = analysis.main_lines.life_line
  const heartLine = analysis.main_lines.heart_line

  const HAND_LABELS: Record<string, string> = {
    earth: t('revelation.earth'),
    air: t('revelation.air'),
    fire: t('revelation.fire'),
    water: t('revelation.water'),
  }

  const lines = [
    { text: t('revelation.line1', { name }), delay: 300 },
    { text: t('revelation.line2', { handType: HAND_LABELS[analysis.hand_shape] ?? analysis.hand_shape }), delay: 0 },
    { text: t('revelation.line3', { length: lifeLine?.length ?? 'distinct', depth: lifeLine?.depth ?? 'defined' }), delay: 0 },
    { text: t('revelation.line4', { characteristic: heartLine?.characteristic ?? 'tells a story' }), delay: 0 },
    { text: t('revelation.line5'), delay: 0, gold: true },
  ]

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
    <div className="h-full flex flex-col px-8 pt-16 pb-8" style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(201,169,97,0.05), transparent 55%)' }}>
      <div className="flex-1 flex flex-col justify-center gap-5">
        {lines.slice(0, phase + 1).map(({ text, gold }, i) => (
          <TypewriterLine
            key={i}
            text={text}
            gold={gold}
            delay={i === phase ? lines[i].delay : 0}
            onDone={() => {
              if (i === phase && phase < lines.length - 1) {
                setTimeout(() => setPhase((p) => p + 1), 1600)
              }
            }}
          />
        ))}
      </div>

      {phase >= lines.length - 1 && (
        <div className="animate-fade-up pt-6">
          <Button
            variant="primary"
            fullWidth
            loading={generatingReading && !readingPreview && !generatingTimedOut}
            onClick={() => onContinue(readingPreview)}
          >
            {t('revelation.seeReading')}
          </Button>
        </div>
      )}
    </div>
  )
}
