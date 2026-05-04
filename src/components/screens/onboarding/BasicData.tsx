import { useState } from 'react'
import { Button, Eyebrow } from '@/components/ui'

interface Props {
  onContinue: (data: { name: string; birthDate: string; birthTime?: string; birthCity?: string }) => void
}

export function BasicData({ onContinue }: Props) {
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [birthTime, setBirthTime] = useState('')
  const [birthCity, setBirthCity] = useState('')
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const valid = name.trim().length > 0 && birthDate.length > 0

  const fieldStyle = (id: string) => ({
    background: 'var(--bg-surface)',
    border: `1px solid ${focusedField === id ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
    boxShadow: focusedField === id ? '0 0 0 2px rgba(201,169,97,0.18)' : 'none',
    borderRadius: 6,
    padding: '13px 14px',
    fontSize: 15,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-sans)',
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  } as React.CSSProperties)

  return (
    <div className="h-full flex flex-col px-6 pt-14 pb-8">
      <div className="flex-1 flex flex-col gap-8 overflow-y-auto scroll-area">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <Eyebrow>Step 1 of 2</Eyebrow>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 30,
            fontWeight: 300,
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
            color: 'var(--text-primary)',
          }}>
            Tell me a little<br />
            <em style={{ color: 'var(--accent-gold)', fontStyle: 'italic' }}>about you.</em>
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', lineHeight: 1.55 }}>
            Your birth details help calibrate the reading to your unique cosmic moment.
          </p>
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-5">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Eyebrow>First name <span style={{ color: 'var(--accent-gold)' }}>*</span></Eyebrow>
            <input
              type="text"
              value={name}
              placeholder="e.g. Maya"
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
              style={fieldStyle('name')}
            />
          </div>

          {/* Date + Time side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Eyebrow>Date of birth <span style={{ color: 'var(--accent-gold)' }}>*</span></Eyebrow>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                onFocus={() => setFocusedField('date')}
                onBlur={() => setFocusedField(null)}
                style={{ ...fieldStyle('date'), colorScheme: 'dark' }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Eyebrow>Time <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opt.)</span></Eyebrow>
              <input
                type="time"
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
                onFocus={() => setFocusedField('time')}
                onBlur={() => setFocusedField(null)}
                style={{ ...fieldStyle('time'), colorScheme: 'dark' }}
              />
            </div>
          </div>

          {/* City */}
          <div className="flex flex-col gap-1.5">
            <Eyebrow>City of birth <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></Eyebrow>
            <input
              type="text"
              value={birthCity}
              placeholder="e.g. São Paulo, New York"
              onChange={(e) => setBirthCity(e.target.value)}
              onFocus={() => setFocusedField('city')}
              onBlur={() => setFocusedField(null)}
              style={fieldStyle('city')}
            />
          </div>
        </div>
      </div>

      {/* Privacy note + CTA */}
      <div className="pt-6 flex flex-col gap-4">
        <div className="flex items-center justify-center gap-2">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Your data is never shared or sold
          </p>
        </div>
        <Button
          variant="primary"
          fullWidth
          disabled={!valid}
          onClick={() => onContinue({ name, birthDate, birthTime: birthTime || undefined, birthCity: birthCity || undefined })}
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
