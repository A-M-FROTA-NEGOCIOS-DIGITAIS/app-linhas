import { useEffect } from 'react'
import { Button } from '@/components/ui'

interface Props { onContinue: () => void }

export function Splash({ onContinue }: Props) {
  return (
    <div
      className="h-full flex flex-col items-center justify-between px-8 pt-20 pb-10"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div />

      {/* Center content */}
      <div className="flex flex-col items-center gap-6">
        {/* Wordmark — "li" + palm-line "n" + "has" */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <span style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 56,
            fontWeight: 300,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            lineHeight: 1,
          }}>
            li
          </span>
          {/* The "n" with a palm line through it */}
          <span style={{ position: 'relative', display: 'inline-block' }}>
            <span style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 56,
              fontWeight: 300,
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
              lineHeight: 1,
            }}>n</span>
            {/* Horizontal gold line through the letter */}
            <span style={{
              position: 'absolute',
              left: '-2px',
              right: '-2px',
              top: '52%',
              height: '1.5px',
              background: 'var(--accent-gold)',
              display: 'block',
            }} />
          </span>
          <span style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 56,
            fontWeight: 300,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            lineHeight: 1,
          }}>
            has
          </span>
        </div>

        {/* Tagline */}
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
          color: 'var(--text-secondary)',
          letterSpacing: '0.04em',
          textAlign: 'center',
        }}>
          Your hands know. <em style={{ fontFamily: 'var(--font-serif)', color: 'var(--accent-gold)', fontStyle: 'italic' }}>AI translates.</em>
        </p>
      </div>

      {/* Bottom */}
      <div className="w-full flex flex-col items-center gap-5">
        <Button variant="primary" fullWidth onClick={onContinue}>
          Continue
        </Button>
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 10,
          color: 'var(--text-muted)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}>
          Linhas · 2026
        </p>
      </div>
    </div>
  )
}
