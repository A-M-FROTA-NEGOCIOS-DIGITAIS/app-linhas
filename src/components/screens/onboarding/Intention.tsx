import { useState } from 'react'
import { Button, Eyebrow, cn } from '@/components/ui'
import type { Intention } from '@/types'

const OPTIONS: { value: Intention; label: string; sub: string }[] = [
  { value: 'love_patterns',    label: 'Love patterns',     sub: 'Why I attract who I attract' },
  { value: 'life_purpose',     label: 'Life purpose',      sub: 'What I\'m truly here to do' },
  { value: 'career_money',     label: 'Career & money',    sub: 'Financial cycles and path' },
  { value: 'whats_coming',     label: 'What\'s coming',   sub: 'The next chapter' },
  { value: 'repeating_cycles', label: 'Repeating cycles',  sub: 'Why I keep ending up here' },
  { value: 'everything',       label: 'Everything',        sub: 'Full deep-dive reading' },
]

interface Props { onContinue: (intention: Intention) => void }

export function IntentionScreen({ onContinue }: Props) {
  const [selected, setSelected] = useState<Intention | null>(null)

  return (
    <div className="h-full flex flex-col px-6 pt-14 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-3 mb-8">
        <Eyebrow>Step 2 of 2</Eyebrow>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 300, lineHeight: 1.2, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
          What do you want<br />to <em style={{ color: 'var(--accent-gold)' }}>understand?</em>
        </h2>
        <p className="text-sm text-text-secondary">Choose one — you can explore everything later.</p>
      </div>

      {/* Options */}
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto scroll-area -mx-1 px-1">
        {OPTIONS.map(({ value, label, sub }) => {
          const isActive = selected === value
          return (
            <button
              key={value}
              onClick={() => setSelected(value)}
              className={cn(
                'w-full text-left px-5 py-4 rounded-md border transition-all duration-300',
                isActive
                  ? 'border-accent-gold bg-accent-gold/8'
                  : 'border-border-subtle bg-bg-surface hover:border-border-medium',
              )}
            >
              <div className={cn('text-sm font-medium font-sans transition-colors', isActive ? 'text-accent-gold' : 'text-text-primary')}>
                {label}
              </div>
              <div className="text-xs text-text-secondary mt-0.5">{sub}</div>
            </button>
          )
        })}
      </div>

      <div className="pt-6">
        <Button variant="primary" fullWidth disabled={!selected} onClick={() => selected && onContinue(selected)}>
          Continue
        </Button>
      </div>
    </div>
  )
}
