import { useState } from 'react'
import { Button, Eyebrow } from '@/components/ui'
import type { Intention } from '@/types'

const OPTIONS: {
  value: Intention
  label: string
  sub: string
  icon: React.ReactNode
}[] = [
  {
    value: 'love_patterns',
    label: 'Love & patterns',
    sub: 'Why I attract who I attract',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    value: 'life_purpose',
    label: 'Life purpose',
    sub: 'What I\'m truly here to do',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
        <line x1="12" y1="2" x2="12" y2="5" /><line x1="12" y1="19" x2="12" y2="22" />
        <line x1="2" y1="12" x2="5" y2="12" /><line x1="19" y1="12" x2="22" y2="12" />
      </svg>
    ),
  },
  {
    value: 'career_money',
    label: 'Career & money',
    sub: 'Financial cycles and path',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
      </svg>
    ),
  },
  {
    value: 'whats_coming',
    label: "What's coming",
    sub: 'The next chapter',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 0 1 0 20" /><path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    value: 'repeating_cycles',
    label: 'Repeating cycles',
    sub: 'Why I keep ending up here',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>
    ),
  },
  {
    value: 'everything',
    label: 'Everything',
    sub: 'Full deep-dive reading',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
]

interface Props { onContinue: (intention: Intention) => void }

export function IntentionScreen({ onContinue }: Props) {
  const [selected, setSelected] = useState<Intention | null>(null)

  return (
    <div className="h-full flex flex-col px-6 pt-14 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-3 mb-8">
        <Eyebrow>Step 2 of 2</Eyebrow>
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 30,
          fontWeight: 300,
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
          color: 'var(--text-primary)',
        }}>
          What do you want<br />
          <em style={{ color: 'var(--accent-gold)', fontStyle: 'italic' }}>to understand?</em>
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', lineHeight: 1.55 }}>
          Choose one — you can explore everything later.
        </p>
      </div>

      {/* Options */}
      <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto scroll-area -mx-1 px-1">
        {OPTIONS.map(({ value, label, sub, icon }) => {
          const isActive = selected === value
          return (
            <button
              key={value}
              onClick={() => setSelected(value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                textAlign: 'left',
                padding: '14px 16px',
                borderRadius: 8,
                border: `1px solid ${isActive ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
                background: isActive ? 'rgba(201,169,97,0.07)' : 'var(--bg-surface)',
                transition: 'all 0.2s ease',
                width: '100%',
                cursor: 'pointer',
              }}
            >
              {/* Icon */}
              <span style={{ color: isActive ? 'var(--accent-gold)' : 'var(--text-muted)', flexShrink: 0, transition: 'color 0.2s' }}>
                {icon}
              </span>

              {/* Text */}
              <span className="flex-1 min-w-0">
                <span style={{
                  display: 'block',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 14,
                  fontWeight: 500,
                  color: isActive ? 'var(--accent-gold)' : 'var(--text-primary)',
                  transition: 'color 0.2s',
                }}>
                  {label}
                </span>
                <span style={{
                  display: 'block',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  marginTop: 2,
                  lineHeight: 1.4,
                }}>
                  {sub}
                </span>
              </span>

              {/* Radio indicator */}
              <span style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                border: `1.5px solid ${isActive ? 'var(--accent-gold)' : 'var(--border-medium)'}`,
                background: isActive ? 'var(--accent-gold)' : 'transparent',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}>
                {isActive && (
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--bg-primary)' }} />
                )}
              </span>
            </button>
          )
        })}
      </div>

      <div className="pt-6">
        <Button
          variant="primary"
          fullWidth
          disabled={!selected}
          onClick={() => selected && onContinue(selected)}
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
