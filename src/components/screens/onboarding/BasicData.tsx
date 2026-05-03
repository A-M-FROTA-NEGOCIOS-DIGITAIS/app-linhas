import { useState } from 'react'
import { Button, Field, Eyebrow } from '@/components/ui'
import type { Intention } from '@/types'

interface Props {
  onContinue: (data: { name: string; birthDate: string; birthTime?: string; birthCity?: string }) => void
}

export function BasicData({ onContinue }: Props) {
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [birthTime, setBirthTime] = useState('')
  const [birthCity, setBirthCity] = useState('')

  const valid = name.trim().length > 0 && birthDate.length > 0

  return (
    <div className="h-full flex flex-col px-6 pt-14 pb-8 scroll-area">
      <div className="flex-1 flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <Eyebrow>Step 1 of 2</Eyebrow>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 300, lineHeight: 1.2, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
            Tell me a little<br /><em style={{ color: 'var(--accent-gold)' }}>about you.</em>
          </h2>
          <p className="text-sm text-text-secondary">
            This shapes your reading — your name, birth details, and intention.
          </p>
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-5">
          <Field
            label="First name"
            value={name}
            onChange={setName}
            placeholder="e.g. Maya"
            required
          />
          <Field
            label="Date of birth"
            type="date"
            value={birthDate}
            onChange={setBirthDate}
            required
          />
          <Field
            label="Time of birth (optional)"
            type="time"
            value={birthTime}
            onChange={setBirthTime}
            placeholder="For deeper astro context"
          />
          <Field
            label="City of birth (optional)"
            value={birthCity}
            onChange={setBirthCity}
            placeholder="e.g. São Paulo, New York"
          />
        </div>
      </div>

      <div className="pt-6">
        <Button variant="primary" fullWidth disabled={!valid} onClick={() => onContinue({ name, birthDate, birthTime: birthTime || undefined, birthCity: birthCity || undefined })}>
          Continue
        </Button>
      </div>
    </div>
  )
}
