import { useState } from 'react'
import { Button } from '@/components/ui'

interface Props { onContinue: () => void }

const SLIDES = [
  {
    chapter: 'Chapter one',
    title: 'Your hands tell\na unique story.',
    body: 'Every line, every mount — a map drawn before you were born. Most people never learn to read it.',
    glyph: (
      <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
        {/* Palm outline */}
        <path d="M35 85 C35 85 20 80 18 60 C16 45 20 30 24 20 C26 14 32 12 35 18 C35 18 35 35 35 40" stroke="#C9A961" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.7"/>
        <path d="M35 40 C35 30 36 14 40 10 C43 6 48 8 48 15 C48 15 48 38 48 42" stroke="#C9A961" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.7"/>
        <path d="M48 42 C48 30 50 12 54 9 C57 6 62 9 62 16 C62 16 62 38 62 43" stroke="#C9A961" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.7"/>
        <path d="M62 43 C62 33 63 18 67 16 C70 14 74 18 74 26 C74 40 72 55 70 65 C68 75 62 85 55 88 C48 91 40 89 35 85" stroke="#C9A961" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.7"/>
        {/* Life line */}
        <path d="M35 40 C30 50 28 62 30 72 C32 80 35 85 35 85" stroke="#C9A961" strokeWidth="1.5" strokeLinecap="round" opacity="0.9"/>
        {/* Heart line */}
        <path d="M36 52 C44 48 54 48 64 52" stroke="#C9A961" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/>
        {/* Head line */}
        <path d="M36 60 C44 58 54 59 63 62" stroke="#C9A961" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
      </svg>
    ),
  },
  {
    chapter: 'Chapter two',
    title: 'Our AI studied\n1 million palms.',
    body: 'Claude Vision analyzes your lines, mounts, and hand shape with clinical precision — not a quiz.',
    glyph: (
      <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="36" stroke="#C9A961" strokeWidth="0.8" opacity="0.25" strokeDasharray="4 4"/>
        <circle cx="50" cy="50" r="24" stroke="#C9A961" strokeWidth="0.8" opacity="0.4"/>
        <circle cx="50" cy="50" r="12" stroke="#C9A961" strokeWidth="1" opacity="0.6"/>
        <circle cx="50" cy="50" r="3" fill="#C9A961" opacity="0.9"/>
        <path d="M50 14 L50 20M50 80 L50 86M14 50 L20 50M80 50 L86 50" stroke="#C9A961" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
      </svg>
    ),
  },
  {
    chapter: 'Chapter three',
    title: 'In 30 seconds,\nyou\'ll know.',
    body: 'Scan your dominant palm. Receive a personalized 1,000-word reading — identity, love, career, future.',
    glyph: (
      <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
        <rect x="25" y="12" width="50" height="76" rx="8" stroke="#C9A961" strokeWidth="1" opacity="0.3"/>
        <rect x="25" y="12" width="50" height="76" rx="8" stroke="#C9A961" strokeWidth="0.5" opacity="0.2"/>
        <path d="M36 36 h28M36 48 h20M36 60 h24" stroke="#C9A961" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
        <circle cx="68" cy="68" r="10" fill="var(--bg-primary)" stroke="#C9A961" strokeWidth="1" opacity="0.9"/>
        <path d="M64 68 l3 3 5-6" stroke="#C9A961" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
]

export function Intro({ onContinue }: Props) {
  const [slide, setSlide] = useState(0)
  const isLast = slide === SLIDES.length - 1
  const s = SLIDES[slide]

  return (
    <div className="h-full flex flex-col px-6 pt-12 pb-8">

      {/* Chapter label + counter */}
      <div className="flex items-center justify-between mb-8">
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--accent-gold)',
        }}>
          {s.chapter}
        </p>
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 11,
          color: 'var(--text-muted)',
          letterSpacing: '0.05em',
        }}>
          {slide + 1}/{SLIDES.length}
        </p>
      </div>

      {/* Progress bars */}
      <div className="flex gap-1.5 mb-10">
        {SLIDES.map((_, i) => (
          <div
            key={i}
            className="h-px flex-1 transition-all duration-500"
            style={{ background: i <= slide ? 'var(--accent-gold)' : 'var(--border-subtle)' }}
          />
        ))}
      </div>

      {/* Glyph */}
      <div className="flex justify-center mb-10" key={`glyph-${slide}`}
        style={{ animation: 'fade-in 400ms ease forwards' }}>
        {s.glyph}
      </div>

      {/* Text */}
      <div className="flex-1 flex flex-col justify-center gap-4" key={`text-${slide}`}
        style={{ animation: 'fade-in 400ms ease forwards' }}>
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 32,
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
          fontSize: 15,
          color: 'var(--text-secondary)',
          lineHeight: 1.65,
        }}>
          {s.body}
        </p>
      </div>

      {/* CTA */}
      <div className="pt-6">
        <Button variant="primary" fullWidth onClick={isLast ? onContinue : () => setSlide((p) => p + 1)}>
          {isLast ? 'Begin my reading' : 'Next'}
        </Button>
      </div>
    </div>
  )
}
