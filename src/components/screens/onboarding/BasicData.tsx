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
    borderRadius: 8,
    padding: '14px 16px',
    fontSize: 15,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-sans)',
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  } as React.CSSProperties)

  return (
    <div className="h-full flex flex-col pb-8">

      {/* Top bar: chapter + counter */}
      <div className="flex items-center justify-between px-6 pt-6 pb-2">
        <p style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-sans)' }}>
          Chapter 03
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.06em', fontFamily: 'var(--font-sans)' }}>
          3 of 9
        </p>
      </div>

      <div className="flex-1 flex flex-col px-6 overflow-y-auto scroll-area">
        <div className="my-auto flex flex-col gap-8 py-6">

        {/* Title */}
        <div className="flex flex-col gap-3">
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 34,
            fontWeight: 300,
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
            color: 'var(--text-primary)',
          }}>
            Before anything —<br />
            tell me a little about{' '}
            <em style={{ color: 'var(--accent-gold)', fontStyle: 'italic' }}>you.</em>
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', lineHeight: 1.55 }}>
            Five fields. We'll calculate the rest.
          </p>
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-5">

          {/* Name */}
          <div className="flex flex-col gap-2">
            <Eyebrow>Name</Eyebrow>
            <input
              type="text"
              value={name}
              placeholder="What Aurora should call you"
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
              style={fieldStyle('name')}
            />
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Eyebrow>Date of birth</Eyebrow>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                onFocus={() => setFocusedField('date')}
                onBlur={() => setFocusedField(null)}
                style={{ ...fieldStyle('date'), colorScheme: 'dark' }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Eyebrow>Time</Eyebrow>
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
          <div className="flex flex-col gap-2">
            <Eyebrow>City of birth</Eyebrow>
            <input
              type="text"
              value={birthCity}
              placeholder="City, state"
              onChange={(e) => setBirthCity(e.target.value)}
              onFocus={() => setFocusedField('city')}
              onBlur={() => setFocusedField(null)}
              style={fieldStyle('city')}
            />
          </div>

          {/* Time tip box */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            padding: '12px 14px',
            borderRadius: 8,
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface)',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <em style={{ fontFamily: 'var(--font-serif)', color: 'var(--accent-gold)', fontStyle: 'italic' }}>Exact time</em>{' '}
              is optional, but sharpens the reading. Ask your mom.
            </p>
          </div>

        </div>
        </div>{/* end my-auto wrapper */}
      </div>

      {/* CTA + privacy */}
      <div className="px-6 pt-6 flex flex-col gap-3">
        <Button
          variant="primary"
          fullWidth
          disabled={!valid}
          onClick={() => onContinue({ name, birthDate, birthTime: birthTime || undefined, birthCity: birthCity || undefined })}
        >
          Continue →
        </Button>
        <p style={{
          textAlign: 'center',
          fontSize: 11,
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-sans)',
          letterSpacing: '0.04em',
        }}>
          Your data is private. Never sold.
        </p>
      </div>
    </div>
  )
}
