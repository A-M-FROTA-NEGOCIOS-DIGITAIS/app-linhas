import { useState } from 'react'
import { Button, Eyebrow } from '@/components/ui'

interface Props { onContinue: () => void }

const PalmIcon = () => (
  <svg width="72" height="90" viewBox="0 0 72 92" fill="none">
    {/* Thumb */}
    <path d="M10,70 C8,57 10,45 14,39 C17,33 23,34 25,41 L25,63"
      stroke="#C9A961" strokeWidth="1.3" strokeLinecap="round"/>
    {/* Index */}
    <path d="M25,63 L25,20 C25,14 30,14 33,20 L33,61"
      stroke="#C9A961" strokeWidth="1.3" strokeLinecap="round"/>
    {/* Middle */}
    <path d="M33,61 L33,12 C33,7 38,7 41,12 L41,61"
      stroke="#C9A961" strokeWidth="1.3" strokeLinecap="round"/>
    {/* Ring */}
    <path d="M41,61 L41,18 C41,13 46,13 49,18 L49,63"
      stroke="#C9A961" strokeWidth="1.3" strokeLinecap="round"/>
    {/* Pinky */}
    <path d="M49,63 L49,30 C49,25 54,25 57,30 L57,67"
      stroke="#C9A961" strokeWidth="1.3" strokeLinecap="round"/>
    {/* Palm base */}
    <path d="M57,67 C59,77 55,88 47,90 C39,92 25,90 17,84 C11,80 10,74 10,70"
      stroke="#C9A961" strokeWidth="1.3" strokeLinecap="round"/>
    {/* Heart line (horizontal, upper palm) */}
    <path d="M26,67 C33,63 45,63 56,67"
      stroke="#C9A961" strokeWidth="1" strokeLinecap="round" opacity="0.75"/>
    {/* Head line (horizontal, mid palm) */}
    <path d="M22,76 C31,72 45,72 55,75"
      stroke="#C9A961" strokeWidth="0.9" strokeLinecap="round" opacity="0.6"/>
  </svg>
)

const ScanIcon = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
    <circle cx="36" cy="36" r="30" stroke="#C9A961" strokeWidth="0.8" opacity="0.2" strokeDasharray="4 4"/>
    <circle cx="36" cy="36" r="20" stroke="#C9A961" strokeWidth="0.8" opacity="0.4"/>
    <circle cx="36" cy="36" r="10" stroke="#C9A961" strokeWidth="1" opacity="0.65"/>
    <circle cx="36" cy="36" r="2.5" fill="#C9A961" opacity="0.9"/>
    <path d="M36 6v6M36 60v6M6 36h6M60 36h6" stroke="#C9A961" strokeWidth="1" strokeLinecap="round" opacity="0.35"/>
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
    title: ['Your hands tell\na unique ', 'story.'],
    body: 'Every line, every mount — a map drawn before you were born. Most people never learn to read it.',
    glyph: <PalmIcon />,
  },
  {
    chapter: 'Chapter two',
    title: ['Our AI studied\n', '1 million palms.'],
    body: 'Claude Vision analyzes your lines, mounts, and hand shape with clinical precision — not a quiz.',
    glyph: <ScanIcon />,
  },
  {
    chapter: 'Chapter three',
    title: ["In 30 seconds,\nyou'll ", 'know.'],
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
      <div className="flex items-center gap-3">
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

      {/* Center: everything grouped */}
      <div
        key={slide}
        className="flex-1 flex flex-col items-center justify-center gap-6"
        style={{ animation: 'fade-in 350ms ease forwards' }}
      >
        {/* Glyph */}
        {s.glyph}

        {/* Chapter label */}
        <Eyebrow>{s.chapter}</Eyebrow>

        {/* Title + body */}
        <div className="w-full flex flex-col gap-3">
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 34,
            fontWeight: 300,
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
            color: 'var(--text-primary)',
            whiteSpace: 'pre-line',
          }}>
            {s.title[0]}
            <em style={{ color: 'var(--accent-gold)', fontStyle: 'italic' }}>{s.title[1]}</em>
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
