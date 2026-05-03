import { useState } from 'react'
import { Button } from '@/components/ui'

interface Props { onContinue: () => void }

const SLIDES = [
  {
    title: 'Your hands tell\na unique story.',
    body: 'Every line, every mount — a map drawn before you were born. Most people never learn to read it.',
    glyph: (
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
        <path d="M10 60c15-30 45-30 60 0" stroke="#C9A961" strokeWidth="1.2" strokeLinecap="round" opacity="0.4"/>
        <path d="M16 60c12-24 36-24 48 0" stroke="#C9A961" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/>
        <path d="M26 60c7-14 21-14 28 0" stroke="#C9A961" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="40" cy="48" r="3" fill="#C9A961" opacity="0.8"/>
      </svg>
    ),
  },
  {
    title: 'Our AI studied\n1 million palms.',
    body: 'Claude Vision analyzes your lines, mounts, and hand shape with clinical-level precision — not a quiz.',
    glyph: (
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
        <circle cx="40" cy="40" r="28" stroke="#C9A961" strokeWidth="1" opacity="0.3" strokeDasharray="4 4"/>
        <circle cx="40" cy="40" r="18" stroke="#C9A961" strokeWidth="1" opacity="0.5"/>
        <circle cx="40" cy="40" r="8" fill="#C9A961" opacity="0.2"/>
        <circle cx="40" cy="40" r="3" fill="#C9A961"/>
      </svg>
    ),
  },
  {
    title: 'In 30 seconds,\nyou\'ll know.',
    body: 'Scan your dominant palm. Receive a personalized 1,000-word reading — identity, love, career, future.',
    glyph: (
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
        <rect x="20" y="10" width="40" height="60" rx="8" stroke="#C9A961" strokeWidth="1" opacity="0.3"/>
        <path d="M30 30h20M30 40h14M30 50h18" stroke="#C9A961" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="55" cy="55" r="8" fill="#0A0805" stroke="#C9A961" strokeWidth="1"/>
        <path d="M52 55l2 2 4-4" stroke="#C9A961" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
]

export function Intro({ onContinue }: Props) {
  const [slide, setSlide] = useState(0)
  const isLast = slide === SLIDES.length - 1
  const s = SLIDES[slide]

  return (
    <div className="h-full flex flex-col px-6 pt-16 pb-8">
      {/* Progress dots */}
      <div className="flex gap-2 justify-center mb-14">
        {SLIDES.map((_, i) => (
          <div
            key={i}
            className="h-px transition-all duration-500"
            style={{
              width: i === slide ? 28 : 10,
              background: i === slide ? 'var(--accent-gold)' : 'var(--border-medium)',
            }}
          />
        ))}
      </div>

      {/* Glyph */}
      <div className="flex justify-center mb-10 animate-fade-up" key={`glyph-${slide}`}>
        {s.glyph}
      </div>

      {/* Text */}
      <div className="flex-1 flex flex-col justify-center gap-5 animate-fade-up" key={`text-${slide}`} style={{ animationDelay: '60ms' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 34, fontWeight: 300, lineHeight: 1.15, letterSpacing: '-0.01em', color: 'var(--text-primary)', whiteSpace: 'pre-line' }}>
          {s.title}
        </h2>
        <p className="text-base text-text-secondary leading-relaxed" style={{ fontFamily: 'var(--font-sans)' }}>
          {s.body}
        </p>
      </div>

      {/* CTA */}
      <div className="pt-6">
        {isLast ? (
          <Button variant="primary" fullWidth onClick={onContinue}>
            Begin my reading
          </Button>
        ) : (
          <Button variant="secondary" fullWidth onClick={() => setSlide((p) => p + 1)}>
            Continue
          </Button>
        )}
      </div>
    </div>
  )
}
