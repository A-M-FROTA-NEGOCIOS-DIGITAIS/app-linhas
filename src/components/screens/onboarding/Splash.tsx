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
        {/* Wordmark — "l" + gold "i" + "nhas" */}
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 76, fontWeight: 300, letterSpacing: '-0.03em', lineHeight: 1 }}>
          <span style={{ color: 'var(--text-primary)' }}>l</span>
          <em style={{ color: 'var(--accent-gold)', fontStyle: 'italic' }}>i</em>
          <span style={{ color: 'var(--text-primary)' }}>nhas</span>
        </div>

        {/* Tagline */}
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 16,
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
