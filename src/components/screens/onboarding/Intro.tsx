import { useState } from 'react'
import { Button, Eyebrow } from '@/components/ui'

interface Props { onContinue: () => void }

const PalmIcon = () => (
  <svg width="110" height="128" viewBox="0 0 76 90" fill="none">
    {/* Thumb */}
    <path d="M2,58 L2,36 C2,28 14,28 14,36 L14,60"
      stroke="#C9A961" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
    {/* Index */}
    <path d="M16,60 L16,16 C16,8 26,8 26,16 L26,60"
      stroke="#C9A961" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
    {/* Middle — tallest */}
    <path d="M28,60 L28,8 C28,1 38,1 38,8 L38,60"
      stroke="#C9A961" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
    {/* Ring */}
    <path d="M40,60 L40,16 C40,8 50,8 50,16 L50,60"
      stroke="#C9A961" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
    {/* Pinky */}
    <path d="M52,60 L52,26 C52,18 62,18 62,26 L62,64"
      stroke="#C9A961" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
    {/* Palm base */}
    <path d="M62,64 C64,74 60,84 50,87 C40,89 22,87 13,80 C6,75 2,68 2,58"
      stroke="#C9A961" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
    {/* Heart line — horizontal across upper palm */}
    <path d="M5,66 C22,63 50,63 64,66"
      stroke="#C9A961" strokeWidth="1.1" strokeLinecap="round" fill="none" opacity="0.85"/>
    {/* Head line — horizontal across mid palm */}
    <path d="M5,75 C22,72 50,72 63,75"
      stroke="#C9A961" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.7"/>
  </svg>
)

const ScanIcon = () => (
  <svg width="100" height="100" viewBox="0 0 72 72" fill="none">
    <circle cx="36" cy="36" r="30" stroke="#C9A961" strokeWidth="0.8" opacity="0.2" strokeDasharray="4 4"/>
    <circle cx="36" cy="36" r="20" stroke="#C9A961" strokeWidth="0.9" opacity="0.4"/>
    <circle cx="36" cy="36" r="10" stroke="#C9A961" strokeWidth="1" opacity="0.65"/>
    <circle cx="36" cy="36" r="2.5" fill="#C9A961" opacity="0.9"/>
    <path d="M36 6v6M36 60v6M6 36h6M60 36h6"
      stroke="#C9A961" strokeWidth="1" strokeLinecap="round" opacity="0.35"/>
  </svg>
)

const ReadingIcon = () => (
  <svg width="86" height="100" viewBox="0 0 60 72" fill="none">
    <rect x="8" y="4" width="44" height="64" rx="7"
      stroke="#C9A961" strokeWidth="1" opacity="0.3" fill="none"/>
    <path d="M18 26 h24M18 38 h16M18 50 h20"
      stroke="#C9A961" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
    <circle cx="46" cy="54" r="9"
      fill="var(--bg-primary)" stroke="#C9A961" strokeWidth="1" opacity="0.9"/>
    <path d="M42 54 l3 3 5-6"
      stroke="#C9A961" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
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
    <div className="h-full flex flex-col pb-8">

      {/* Progress bars — topo */}
      <div className="flex gap-1.5 px-6 pt-6">
        {SLIDES.map((_, i) => (
          <div
            key={i}
            className="h-px flex-1 transition-all duration-500"
            style={{ background: i <= slide ? 'var(--accent-gold)' : 'var(--border-subtle)' }}
          />
        ))}
      </div>

      {/* Conteúdo central */}
      <div
        key={slide}
        className="flex-1 flex flex-col px-6"
        style={{ animation: 'fade-in 350ms ease forwards' }}
      >
        {/* Glyph + chapter — upper half */}
        <div className="flex flex-col items-center gap-5" style={{ paddingTop: '10%' }}>
          {s.glyph}
          <Eyebrow>{s.chapter}</Eyebrow>
        </div>

        {/* Title + body — below glyph */}
        <div className="flex flex-col gap-4 mt-8">
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 36,
            fontWeight: 300,
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
            color: 'var(--text-primary)',
            whiteSpace: 'pre-line',
          }}>
            {s.title[0]}<em style={{ color: 'var(--accent-gold)', fontStyle: 'italic' }}>{s.title[1]}</em>
          </h2>
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            color: 'var(--text-secondary)',
            lineHeight: 1.65,
            textAlign: 'center',
          }}>
            {s.body}
          </p>
        </div>
      </div>

      {/* Botão */}
      <div className="px-6">
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
