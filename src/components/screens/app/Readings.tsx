import { useEffect, useState } from 'react'
import { Card, Eyebrow, Chip, Spinner, Hairline } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import { track, Events } from '@/lib/analytics'
import type { Profile, Reading } from '@/types'

interface Props {
  profile: Profile
  onOpenReading: (reading: Reading) => void
}

type Filter = 'all' | 'master' | 'daily' | 'themed' | 'compatibility'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'master', label: 'Master' },
  { key: 'daily', label: 'Daily' },
  { key: 'themed', label: 'Themed' },
  { key: 'compatibility', label: 'Compat.' },
]

const TYPE_LABELS: Record<string, string> = {
  master: 'Master reading',
  daily: 'Daily insight',
  themed: 'Themed reading',
  compatibility: 'Compatibility',
}

const TYPE_ICONS: Record<string, JSX.Element> = {
  master: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L9.09 8.26 2 9.27l5 4.87-1.18 6.88L12 17.77l6.18 3.25L17 14.14l5-4.87-7.09-1.01z" />
    </svg>
  ),
  daily: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  ),
  themed: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  compatibility: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
}

const THEMED_OPTIONS = [
  { key: 'love', label: 'Love & relationships', icon: '♡' },
  { key: 'career', label: 'Career & money', icon: '◈' },
  { key: 'decision', label: 'A decision I\'m facing', icon: '◎' },
]

export function Readings({ profile, onOpenReading }: Props) {
  const [readings, setReadings] = useState<Reading[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState(true)
  const [showThemedSheet, setShowThemedSheet] = useState(false)
  const [generatingThemed, setGeneratingThemed] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      let query = supabase
        .from('readings')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
      if (filter !== 'all') query = query.eq('reading_type', filter)
      const { data } = await query
      if (data) setReadings(data)
      setLoading(false)
    }
    load()
  }, [profile.id, filter])

  const handleNewThemed = async (theme: string) => {
    setGeneratingThemed(theme)
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      const res = await fetch(`${supabaseUrl}/functions/v1/generate-themed-reading`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${supabaseKey}` },
        body: JSON.stringify({ user_id: profile.id, theme }),
      })
      const data = await res.json()
      if (data.reading_id) {
        track(Events.READING_GENERATED, { reading_type: 'themed', theme, reading_id: data.reading_id })
        const { data: reading } = await supabase.from('readings').select('*').eq('id', data.reading_id).single()
        if (reading) {
          setReadings((prev) => [reading, ...prev])
          setShowThemedSheet(false)
          onOpenReading(reading)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setGeneratingThemed(null)
    }
  }

  return (
    <div className="flex-1 flex flex-col scroll-area pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 300, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          Your readings
        </h1>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 px-5 pb-4 overflow-x-auto no-scrollbar">
        {FILTERS.map(({ key, label }) => (
          <Chip key={key} active={filter === key} onClick={() => setFilter(key)}>
            {label}
          </Chip>
        ))}
      </div>

      <Hairline className="mx-5 mb-4" />

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Spinner size={24} className="text-accent-gold" />
        </div>
      ) : readings.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 gap-3 text-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <p className="text-sm text-text-muted">No readings yet</p>
        </div>
      ) : (
        <div className="px-5 flex flex-col gap-3">
          {readings.map((reading) => (
            <Card
              key={reading.id}
              onClick={() => {
                track(Events.DAILY_INSIGHT_OPENED, { reading_id: reading.id, type: reading.reading_type })
                onOpenReading(reading)
              }}
              className="p-5"
              goldBorder={reading.reading_type === 'master'}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {TYPE_ICONS[reading.reading_type] ?? TYPE_ICONS.daily}
                    <Eyebrow>{TYPE_LABELS[reading.reading_type] ?? reading.reading_type}</Eyebrow>
                  </div>
                  <p className="text-sm text-text-secondary line-clamp-2 leading-relaxed">
                    {reading.preview_content}
                  </p>
                  <p className="text-[11px] text-text-muted mt-2 uppercase tracking-wider">
                    {formatDate(reading.created_at)}
                  </p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-1">
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* FAB — New themed reading */}
      <button
        onClick={() => setShowThemedSheet(true)}
        className="fixed bottom-24 right-5 flex items-center gap-2 px-4 py-3 rounded-full text-sm font-medium"
        style={{ background: 'var(--accent-gold)', color: 'var(--bg-primary)', fontFamily: 'var(--font-sans)', letterSpacing: '0.02em', boxShadow: '0 4px 24px rgba(201,169,97,0.35)' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        New reading
      </button>

      {/* Themed reading bottom sheet */}
      {showThemedSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowThemedSheet(false)} />
          <div className="relative bg-bg-surface rounded-t-2xl px-6 pt-5 pb-10"
            style={{ border: '1px solid var(--border-subtle)', borderBottom: 'none' }}>
            <div className="w-10 h-0.5 bg-border-subtle rounded-full mx-auto mb-5" />
            <Eyebrow className="mb-4">Choose a theme</Eyebrow>
            <div className="flex flex-col gap-3">
              {THEMED_OPTIONS.map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => handleNewThemed(key)}
                  disabled={generatingThemed !== null}
                  className="flex items-center gap-4 px-5 py-4 rounded-md text-left transition-colors"
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}
                >
                  <span style={{ fontSize: 20, color: 'var(--accent-gold)' }}>{icon}</span>
                  <span className="text-sm text-text-primary">{label}</span>
                  {generatingThemed === key && (
                    <Spinner size={16} className="ml-auto text-accent-gold" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
