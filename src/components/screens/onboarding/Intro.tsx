import { useState } from 'react'
import { Button, Eyebrow } from '@/components/ui'

interface Props { onContinue: () => void }

/* Hand drawn as one continuous outline path — gaps between fingers are V-shapes */
const PalmIcon = () => (
  <svg width="90" height="130" viewBox="0 0 64 92" fill="none">
    <path
      d="
        M 2,60
        C 0,48 0,36 4,28
        C 6,22 10,22 12,28
        C 14,34 12,46 12,60
        L 13,64 L 14,60
        L 14,18
        C 14,10 24,10 24,18
        L 24,60
        L 25,64 L 26,60
        L 26,10
        C 26,2 36,2 36,10
        L 36,60
        L 37,64 L 38,60
        L 38,18
        C 38,10 48,10 48,18
        L 48,60
        L 49,64 L 50,60
        L 50,30
        C 50,22 60,22 60,30
        L 60,64
        C 62,74 58,86 46,90
        C 34,93 18,91 10,85
        C 4,80 2,72 2,60
        Z
      "
      stroke="#C9A961"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Heart line */}
    <path d="M 6,68 C 22,64 44,64 60,68"
      stroke="#C9A961" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.9"/>
    {/* Head line */}
    <path d="M 5,78 C 20,74 44,74 58,78"
      stroke="#C9A961" strokeWidth="1.1" strokeLinecap="round" fill="none" opacity="0.75"/>
  </svg>
)

const ScanIcon = () => (
  <svg width="90" height="90" viewBox="0 0 72 72" fill="none">
    <circle cx="36" cy="36" r="30" stroke="#C9A961" strokeWidth="0.8" opacity="0.2" strokeDasharray="4 4"/>
    <circle cx="36" cy="36" r="20" stroke="#C9A961" strokeWidth="0.9" opacity="0.4"/>
    <circle cx="36" cy="36" r="10" stroke="#C9A961" strokeWidth="1" opacity="0.65"/>
    <circle cx="36" cy="36" r="2.5" fill="#C9A961" opacity="0.9"/>
    <path d="M36 6v6M36 60v6M6 36h6M60 36h6"
      stroke="#C9A961" strokeWidth="1" strokeLinecap="round" opacity="0.35"/>
  </svg>
)

const ReadingIcon = () => (
  <svg width="80" height="96" viewBox="0 0 60 72" fill="none">
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

      {/* Topo: contador à esquerda, barras à direita */}
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
                transition: 'background 0.5s',
              }}
            />
          ))}
        </div>
      </div>

      {/* Conteúdo centralizado */}
      <div
        key={slide}
        className="flex-1 flex flex-col justify-center px-6"
        style={{ animation: 'fade-in 350ms ease forwards' }}
      >
        {/* Ícone + capítulo — centralizados */}
        <div className="flex flex-col items-center gap-5 mb-8">
          {s.glyph}
          <Eyebrow>{s.chapter}</Eyebrow>
        </div>

        {/* Título */}
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

        {/* Corpo */}
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
