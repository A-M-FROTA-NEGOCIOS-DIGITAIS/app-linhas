import { useState } from 'react'
import { Button, Eyebrow } from '@/components/ui'

interface Props { onContinue: () => void }

const PalmIcon = () => (
  <svg width="80" height="110" viewBox="0 0 60 84" fill="none">
    {/* Thumb */}
    <path d="M4,52 C3,42 4,32 7,25 C9,19 15,19 15,25 L15,52"
      stroke="#C9A961" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    {/* Index */}
    <path d="M17,52 L17,15 C17,7 25,7 25,15 L25,52"
      stroke="#C9A961" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    {/* Middle — tallest */}
    <path d="M27,52 L27,7 C27,1 35,1 35,7 L35,52"
      stroke="#C9A961" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    {/* Ring */}
    <path d="M37,52 L37,15 C37,7 45,7 45,15 L45,52"
      stroke="#C9A961" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    {/* Pinky */}
    <path d="M47,52 L47,26 C47,18 55,18 55,26 L55,56"
      stroke="#C9A961" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    {/* Palm base */}
    <path d="M55,56 C57,66 53,76 44,79 C34,82 20,80 12,74 C5,68 3,60 4,52"
      stroke="#C9A961" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    {/* Heart line */}
    <path d="M8,61 C22,57 42,57 54,60"
      stroke="#C9A961" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.85"/>
    {/* Head line */}
    <path d="M7,71 C20,67 43,67 53,70"
      stroke="#C9A961" strokeWidth="1.1" strokeLinecap="round" fill="none" opacity="0.7"/>
  </svg>
)

const ScanIcon = () => (
  <svg width="88" height="88" viewBox="0 0 72 72" fill="none">
    <circle cx="36" cy="36" r="30" stroke="#C9A961" strokeWidth="0.8" opacity="0.2" strokeDasharray="4 4"/>
    <circle cx="36" cy="36" r="20" stroke="#C9A961" strokeWidth="0.9" opacity="0.4"/>
    <circle cx="36" cy="36" r="10" stroke="#C9A961" strokeWidth="1" opacity="0.65"/>
    <circle cx="36" cy="36" r="2.5" fill="#C9A961" opacity="0.9"/>
    <path d="M36 6v6M36 60v6M6 36h6M60 36h6"
      stroke="#C9A961" strokeWidth="1" strokeLinecap="round" opacity="0.35"/>
  </svg>
)

const ReadingIcon = () => (
  <svg width="78" height="96" viewBox="0 0 60 72" fill="none">
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

      {/* Contador + barras no topo */}
      <div className="flex items-center justify-between px-6 pt-6">
        <p style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
          {slide + 1}/{SLIDES.length}
        </p>
        <div className="flex gap-1.5">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              style={{
                width: 28,
                height: 1.5,
                background: i <= slide ? 'var(--accent-gold)' : 'var(--border-subtle)',
                borderRadius: 1,
                transition: 'background 0.5s',
              }}
            />
          ))}
        </div>
      </div>

      {/* Conteúdo */}
      <div
        key={slide}
        className="flex-1 flex flex-col justify-center px-6"
        style={{
          animation: 'fade-in 350ms ease forwards',
        }}
      >
        {/* Glyph + chapter — centralizados */}
        <div className="flex flex-col items-center gap-5 mb-8">
          {s.glyph}
          <Eyebrow>{s.chapter}</Eyebrow>
        </div>

        {/* Título — alinhado à esquerda */}
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 36,
          fontWeight: 300,
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
          color: 'var(--text-primary)',
          whiteSpace: 'pre-line',
          marginBottom: 16,
        }}>
          {s.title[0]}
          <em style={{ color: 'var(--accent-gold)', fontStyle: 'italic' }}>{s.title[1]}</em>
        </h2>

        {/* Corpo — centralizado */}
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
