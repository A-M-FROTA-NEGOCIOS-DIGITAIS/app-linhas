import { useState } from 'react'
import { Button, Eyebrow } from '@/components/ui'

interface Props { onContinue: () => void }

const PalmIcon = () => (
  <svg width="68" height="90" viewBox="0 0 68 90" fill="none">
    {/* Thumb */}
    <path d="M10,68 C8,56 10,44 14,38 C17,32 22,33 24,40 L24,62"
      stroke="#C9A961" strokeWidth="1.3" strokeLinecap="round"/>
    {/* Index */}
    <path d="M24,62 L24,18 C24,12 29,12 32,18 L32,60"
      stroke="#C9A961" strokeWidth="1.3" strokeLinecap="round"/>
    {/* Middle */}
    <path d="M32,60 L32,10 C32,5 37,5 40,10 L40,60"
      stroke="#C9A961" strokeWidth="1.3" strokeLinecap="round"/>
    {/* Ring */}
    <path d="M40,60 L40,16 C40,11 45,11 48,16 L48,62"
      stroke="#C9A961" strokeWidth="1.3" strokeLinecap="round"/>
    {/* Pinky */}
    <path d="M48,62 L48,28 C48,23 53,23 56,28 L56,66"
      stroke="#C9A961" strokeWidth="1.3" strokeLinecap="round"/>
    {/* Palm base */}
    <path d="M56,66 C58,76 54,86 46,88 C38,90 24,88 16,82 C10,78 10,72 10,68"
      stroke="#C9A961" strokeWidth="1.3" strokeLinecap="round"/>
    {/* Palm lines */}
    <path d="M28,62 C28,72 27,80 27,86" stroke="#C9A961" strokeWidth="1" strokeLinecap="round" opacity="0.7"/>
    <path d="M36,60 C36,70 36,78 35,84" stroke="#C9A961" strokeWidth="1" strokeLinecap="round" opacity="0.7"/>
    <path d="M44,62 C44,72 44,80 44,86" stroke="#C9A961" strokeWidth="1" strokeLinecap="round" opacity="0.7"/>
  </svg>
)

const ScanIcon = () => (
  <svg width="68" height="68" viewBox="0 0 68 68" fill="none">
    <circle cx="34" cy="34" r="28" stroke="#C9A961" strokeWidth="0.8" opacity="0.2" strokeDasharray="4 4"/>
    <circle cx="34" cy="34" r="18" stroke="#C9A961" strokeWidth="0.8" opacity="0.4"/>
    <circle cx="34" cy="34" r="9" stroke="#C9A961" strokeWidth="1" opacity="0.65"/>
    <circle cx="34" cy="34" r="2.5" fill="#C9A961" opacity="0.9"/>
    <path d="M34 6v5M34 57v5M6 34h5M57 34h5" stroke="#C9A961" strokeWidth="1" strokeLinecap="round" opacity="0.35"/>
  </svg>
)

const ReadingIcon = () => (
  <svg width="60" height="72" viewBox="0 0 60 72" fill="none">
    <rect x="8" y="4" width="44" height="64" rx="7" stroke="#C9A961" strokeWidth="1" opacity="0.3"/>
    <path d="M18 26 h24M18 38 h16M18 50 h20" stroke="#C9A961" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
    <circle cx="46" cy="54" r="9" fill="var(--bg-primary)" stroke="#C9A961" strokeWidth="1" opacity="0.9"/>
    <path d="M42 54 l3 3 5-6" stroke="#C9A961" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const SLIDES = [
  {
    chapter: 'Chapter one',
    title: 'Your hands tell\na unique story.',
    body: 'Every line, every mount — a map drawn before you were born. Most people never learn to read it.',
    glyph: <PalmIcon />,
  },
  {
    chapter: 'Chapter two',
    title: 'Our AI studied\n1 million palms.',
    body: 'Claude Vision analyzes your lines, mounts, and hand shape with clinical precision — not a quiz.',
    glyph: <ScanIcon />,
  },
  {
    chapter: 'Chapter three',
    title: "In 30 seconds,\nyou'll know.",
    body: 'Scan your dominant palm. Receive a personalized 1,000-word reading — identity, love, career, future.',
    glyph: <ReadingIcon />,
  },
]

export function Intro({ onContinue }: Props) {
  const [slide, setSlide] = useState(0)
  const isLast = slide === SLIDES.length - 1
  const s = SLIDES[slide]

  return (
    <div className="h-full flex flex-col px-6 pt-10 pb-8">

      {/* Progress bars + counter */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex gap-1.5 flex-1">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className="h-px flex-1 transition-all duration-500"
              style={{ background: i <= slide ? 'var(--accent-gold)' : 'var(--border-subtle)' }}
            />
          ))}
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.06em', flexShrink: 0 }}>
          {slide + 1}/{SLIDES.length}
        </p>
      </div>

      {/* Glyph + chapter label */}
      <div
        key={`glyph-${slide}`}
        className="flex flex-col items-center gap-5 py-8"
        style={{ animation: 'fade-in 400ms ease forwards' }}
      >
        {s.glyph}
        <Eyebrow>{s.chapter}</Eyebrow>
      </div>

      {/* Text */}
      <div
        key={`text-${slide}`}
        className="flex-1 flex flex-col justify-center gap-4"
        style={{ animation: 'fade-in 400ms ease forwards' }}
      >
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 34,
          fontWeight: 300,
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
          color: 'var(--text-primary)',
          whiteSpace: 'pre-line',
        }}>
          {s.title}
        </h2>
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 14,
          color: 'var(--text-secondary)',
          lineHeight: 1.65,
        }}>
          {s.body}
        </p>
      </div>

      {/* CTA */}
      <div className="pt-6">
        <Button
          variant="primary"
          fullWidth
          onClick={isLast ? onContinue : () => setSlide((p) => p + 1)}
        >
          {isLast ? 'Begin my reading' : 'Next'}
        </Button>
      </div>
    </div>
  )
}
