import { useEffect, useState } from 'react'
import { Card, Eyebrow, Hairline, Spinner } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { getMoonPhase, formatDate } from '@/lib/utils'
import { track, Events } from '@/lib/analytics'
import type { Profile, DailyInsight, Reading } from '@/types'

interface Props {
  profile: Profile
  onOpenReading: (reading: Reading) => void
  onOpenChat: () => void
  onReScan: () => void
}

export function Today({ profile, onOpenReading, onOpenChat, onReScan }: Props) {
  const [insight, setInsight] = useState<DailyInsight | null>(null)
  const [masterReading, setMasterReading] = useState<Reading | null>(null)
  const [loading, setLoading] = useState(true)

  const moonPhase = getMoonPhase()
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  useEffect(() => {
    const safetyTimer = setTimeout(() => setLoading(false), 8000)
    const load = async () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0]
        const [insightRes, readingRes] = await Promise.all([
          supabase.from('daily_insights').select('*').eq('user_id', profile.id).eq('scheduled_for', todayStr).maybeSingle(),
          supabase.from('readings').select('*').eq('user_id', profile.id).eq('reading_type', 'master').order('created_at', { ascending: false }).limit(1).maybeSingle(),
        ])
        if (insightRes.data) setInsight(insightRes.data)
        if (readingRes.data) setMasterReading(readingRes.data)
      } catch {
        // silent fail — show empty state
      } finally {
        clearTimeout(safetyTimer)
        setLoading(false)
      }
    }
    load()
    return () => clearTimeout(safetyTimer)
  }, [profile.id])

  const handleOpenInsight = () => {
    if (insight) track(Events.DAILY_INSIGHT_OPENED, { insight_id: insight.id })
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner size={24} className="text-accent-gold" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col scroll-area pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-text-muted tracking-wider uppercase font-sans">{today}</p>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 300, color: 'var(--text-primary)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              Good morning,<br /><em style={{ color: 'var(--accent-gold)' }}>{profile.name}.</em>
            </h1>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-muted">Moon</p>
            <p className="text-xs text-accent-gold tracking-wide">{moonPhase}</p>
          </div>
        </div>
      </div>

      <div className="px-5 flex flex-col gap-4">
        {/* Daily insight */}
        {insight ? (
          <Card goldBorder onClick={handleOpenInsight} className="p-5">
            <Eyebrow className="mb-3">Today's insight</Eyebrow>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, lineHeight: 1.65, color: 'var(--text-primary)' }}>
              {insight.insight_text}
            </p>
            {insight.focused_line && (
              <p className="text-xs text-text-muted mt-3 uppercase tracking-wider">
                Focus: {insight.focused_line.replace('_', ' ')} line
              </p>
            )}
          </Card>
        ) : (
          <Card className="p-5">
            <Eyebrow className="mb-2">Today's insight</Eyebrow>
            <p className="text-sm text-text-secondary">Your daily reading arrives at 7 AM. Come back tomorrow.</p>
          </Card>
        )}

        {/* Master reading quick access */}
        {masterReading && (
          <Card onClick={() => onOpenReading(masterReading)} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <Eyebrow className="mb-2">Master reading</Eyebrow>
                <p className="text-sm text-text-secondary line-clamp-2">
                  {masterReading.preview_content}
                </p>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </div>
          </Card>
        )}

        {/* Ask Aurora */}
        <Card onClick={onOpenChat} className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Eyebrow className="mb-1">Ask Aurora</Eyebrow>
              <p className="text-xs text-text-secondary">She knows your palm. Ask anything.</p>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L9.09 8.26 2 9.27l5 4.87-1.18 6.88L12 17.77l6.18 3.25L17 14.14l5-4.87-7.09-1.01z" />
            </svg>
          </div>
        </Card>

        {/* Re-scan nudge */}
        <Card onClick={onReScan} className="p-5">
          <Eyebrow className="mb-1">Re-scan available</Eyebrow>
          <p className="text-xs text-text-secondary">Lines change. Scan again and see what's shifted.</p>
        </Card>
      </div>
    </div>
  )
}
