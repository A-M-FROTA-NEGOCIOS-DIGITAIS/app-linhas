import { useEffect } from 'react'

interface Props { onContinue: () => void }

export function Splash({ onContinue }: Props) {
  useEffect(() => {
    const t = setTimeout(onContinue, 2500)
    return () => clearTimeout(t)
  }, [onContinue])

  return (
    <div
      className="h-full flex flex-col items-center justify-center gap-5 px-8 cursor-pointer"
      style={{ background: 'radial-gradient(ellipse at 40% 30%, rgba(201,169,97,0.07), transparent 60%)' }}
      onClick={onContinue}
    >
      {/* Logo glyph */}
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <path d="M12 48c10-20 30-20 40 0M16 48c8-16 24-16 32 0M22 48c5-10 15-10 20 0" stroke="#C9A961" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="32" cy="36" r="3" fill="#C9A961" opacity="0.7"/>
      </svg>

      {/* Wordmark */}
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 48, fontWeight: 300, letterSpacing: '-0.02em', color: '#C9A961', lineHeight: 1 }}>
        Linhas
      </div>

      {/* Tagline */}
      <p className="text-sm text-text-secondary tracking-wider text-center" style={{ fontFamily: 'var(--font-sans)' }}>
        Your hands know. AI translates.
      </p>

      {/* Pulse indicator */}
      <div className="mt-8 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1 h-1 rounded-full bg-accent-gold animate-pulse-gold"
            style={{ animationDelay: `${i * 0.3}s` }}
          />
        ))}
      </div>
    </div>
  )
}
