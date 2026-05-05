import { useState } from 'react'
import { Button, Eyebrow } from '@/components/ui'

interface Props { onContinue: () => void }

const PalmIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" width="110" height="132" fill="none" stroke="#C9A961" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M58 230 C 50 200 44 178 44 158 C 44 142 38 130 36 116 C 34 102 40 96 48 100 C 54 102 60 110 64 122 C 64 110 62 76 64 56 C 66 42 78 40 80 54 C 82 76 82 100 84 116 C 86 100 88 70 92 54 C 94 42 106 42 108 56 C 110 78 108 102 110 118 C 112 102 116 78 120 66 C 124 54 134 54 134 68 C 134 86 130 110 130 122 C 134 112 142 100 150 96 C 160 92 166 102 162 114 C 154 132 144 152 140 168 C 134 188 130 210 126 230"/>
    <path d="M52 138 C 78 126 110 124 142 132" opacity="0.85"/>
    <path d="M50 158 C 78 152 112 150 138 156" opacity="0.7"/>
    <path d="M66 130 C 60 152 60 178 70 200" opacity="0.6"/>
    <path d="M104 230 C 102 200 100 174 102 152" opacity="0.5"/>
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

      {/* Contador + barras no topo — grid 3 colunas: counter | bars centralizadas | vazio */}
      <div className="grid grid-cols-3 items-center px-6 pt-6">
        <p style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
          {slide + 1}/{SLIDES.length}
        </p>
        <div className="flex gap-1.5 justify-center">
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
        <div />
      </div>

      {/* Conteúdo */}
      <div
        key={slide}
        className="flex-1 flex flex-col px-6"
        style={{ animation: 'fade-in 350ms ease forwards' }}
      >
        <div className="my-auto flex flex-col items-center gap-6">
          {/* Glyph + chapter */}
          <div className="flex flex-col items-center gap-4">
            {s.glyph}
            <Eyebrow>{s.chapter}</Eyebrow>
          </div>

          {/* Título — centralizado */}
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 36,
            fontWeight: 300,
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
            color: 'var(--text-primary)',
            whiteSpace: 'pre-line',
            textAlign: 'center',
            width: '100%',
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
