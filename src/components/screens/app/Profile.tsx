import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Card, Eyebrow, Hairline } from '@/components/ui'
import { LanguagePicker } from '@/components/ui/LanguagePicker'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/app'
import { track, Events } from '@/lib/analytics'
import { getZodiacSign } from '@/lib/utils'
import type { Profile as ProfileType } from '@/types'

interface Props {
  profile: ProfileType
  onReScan: () => void
  onSignOut: () => void
  onChangeIntention: () => void
}

const INTENTION_LABELS_KEY: Record<string, string> = {
  love_patterns: 'intention.loveLabel',
  life_purpose: 'intention.purposeLabel',
  career_money: 'intention.careerLabel',
  whats_coming: 'intention.comingLabel',
  repeating_cycles: 'intention.cyclesLabel',
  everything: 'intention.everythingLabel',
}

export function Profile({ profile, onReScan, onSignOut, onChangeIntention }: Props) {
  const { t } = useTranslation()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [readingCount, setReadingCount] = useState(0)
  const reset = useAppStore((s) => s.reset)

  const zodiac = profile.date_of_birth ? getZodiacSign(profile.date_of_birth) : null
  const daysActive = Math.max(1, Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)))

  useEffect(() => {
    supabase
      .from('readings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .then(({ count }) => { if (count) setReadingCount(count) })
  }, [profile.id])

  const handleSignOut = async () => {
    setSigningOut(true)
    await supabase.auth.signOut()
    reset()
    window.location.href = '/'
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      await supabase.from('profiles').update({ deleted_at: new Date().toISOString() }).eq('id', profile.id)
      await supabase.auth.signOut()
      reset()
      window.location.href = '/'
    } catch (e) {
      console.error(e)
      setDeleting(false)
    }
  }

  const handleDownloadData = async () => {
    try {
      const [profileRes, readingsRes, scansRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', profile.id).single(),
        supabase.from('readings').select('*').eq('user_id', profile.id),
        supabase.from('palm_scans').select('*').eq('user_id', profile.id),
      ])
      const payload = { profile: profileRes.data, readings: readingsRes.data, scans: scansRes.data, exported_at: new Date().toISOString() }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `linhas-data-${profile.id}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="h-full flex flex-col scroll-area pb-24">
      <div className="px-5 pt-12 pb-4">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
          style={{ background: 'rgba(201,169,97,0.08)', border: '1px solid rgba(201,169,97,0.3)' }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 36, color: 'var(--accent-gold)', fontWeight: 300, lineHeight: 1 }}>
            {profile.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 300, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          {profile.name}
        </h1>
        {zodiac && <p className="text-xs text-text-muted tracking-wider uppercase mt-1">{zodiac}</p>}
      </div>

      <div className="flex mx-5 mb-4 py-4" style={{ borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
        {[
          { value: readingCount, label: t('profile.readings') },
          { value: readingCount, label: t('profile.chapters') },
          { value: daysActive, label: t('profile.days') },
        ].map(({ value, label }, i) => (
          <>
            {i > 0 && <div key={`div-${i}`} style={{ width: 1, background: 'var(--border-subtle)' }} />}
            <div key={label} className="flex-1 text-center">
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-widest mt-1.5">{label}</p>
            </div>
          </>
        ))}
      </div>

      <div className="px-5 flex flex-col gap-5">
        <Card className="p-5">
          <Eyebrow className="mb-3">{t('profile.yourPalm')}</Eyebrow>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}>
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <path d="M4 24c6-12 18-12 24 0" stroke="#C9A961" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/>
                <path d="M7 24c4-8 14-8 18 0" stroke="#C9A961" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
                <path d="M11 24c2-4 8-4 10 0" stroke="#C9A961" strokeWidth="1.2" strokeLinecap="round" opacity="0.4"/>
                <circle cx="16" cy="20" r="2" fill="#C9A961" opacity="0.5"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm text-text-secondary">{t('profile.dominantScan')}</p>
              <p className="text-xs text-text-muted mt-0.5">{t('profile.reScanNote')}</p>
            </div>
            <button
              onClick={() => { track(Events.RESCAN_INITIATED, {}); onReScan() }}
              className="text-xs font-medium px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(201,169,97,0.1)', color: 'var(--accent-gold)', border: '1px solid rgba(201,169,97,0.25)', fontFamily: 'var(--font-sans)' }}
            >
              {t('profile.reScan')}
            </button>
          </div>
        </Card>

        <Card className="p-5">
          <Eyebrow className="mb-3">{t('profile.yourIntention')}</Eyebrow>
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-primary">
              {profile.intention ? t(INTENTION_LABELS_KEY[profile.intention] ?? 'intention.everythingLabel') : t('profile.intentionNotSet')}
            </p>
            <button className="text-xs text-text-muted underline underline-offset-2" style={{ fontFamily: 'var(--font-sans)' }} onClick={onChangeIntention}>
              {t('profile.change')}
            </button>
          </div>
        </Card>

        {/* Language */}
        <Card className="p-5">
          <Eyebrow className="mb-3">{t('profile.language')}</Eyebrow>
          <LanguagePicker />
        </Card>

        <Hairline />

        <div className="flex flex-col gap-1">
          <Eyebrow className="mb-3">{t('profile.account')}</Eyebrow>

          <button onClick={handleDownloadData} className="flex items-center justify-between px-4 py-3.5 rounded-md text-sm text-text-secondary text-left" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            {t('profile.downloadData')}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>

          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center justify-between px-4 py-3.5 rounded-md text-sm text-text-secondary text-left mt-1"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', opacity: signingOut ? 0.6 : 1 }}
          >
            {signingOut ? t('profile.signingOut') : t('profile.signOut')}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>

          <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center justify-between px-4 py-3.5 rounded-md text-sm text-left mt-1" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: '#8B4040' }}>
            {t('profile.deleteAccount')}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B4040" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>
        </div>

        <p className="text-center text-[11px] text-text-muted pb-2">{t('profile.footer')}</p>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-bg-surface rounded-t-2xl px-6 pt-6 pb-10" style={{ border: '1px solid var(--border-subtle)', borderBottom: 'none' }}>
            <div className="w-10 h-0.5 bg-border-subtle rounded-full mx-auto mb-5" />
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 300, color: 'var(--text-primary)', marginBottom: 8 }}>
              {t('profile.deleteTitle')}
            </h3>
            <p className="text-sm text-text-secondary mb-6 leading-relaxed">{t('profile.deleteBody')}</p>
            <div className="flex flex-col gap-3">
              <Button variant="primary" fullWidth loading={deleting} onClick={handleDeleteAccount}>
                {t('profile.deleteConfirm')}
              </Button>
              <button onClick={() => setShowDeleteConfirm(false)} className="text-sm text-text-muted text-center py-2">
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
