import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui'
import { useFundo } from '@/components/ui/AuroraFundo'
import { LanguagePicker } from '@/components/ui/LanguagePicker'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/app'
import { track, Events } from '@/lib/analytics'
import { getZodiacSign, SIMBOLO_SIGNO } from '@/lib/utils'
import { calcularStreak } from '@/lib/leitura'
import type { useBiblioteca } from '@/hooks/useBiblioteca'
import type { Profile as ProfileType } from '@/types'

interface Props {
  profile: ProfileType
  biblioteca: ReturnType<typeof useBiblioteca>
  onReScan: () => void
  onSignOut: () => void
  onChangeIntention: () => void
  onAbrirDespertar: () => void
}

const INTENTION_LABELS_KEY: Record<string, string> = {
  love_patterns: 'intention.loveLabel',
  life_purpose: 'intention.purposeLabel',
  career_money: 'intention.careerLabel',
  whats_coming: 'intention.comingLabel',
  repeating_cycles: 'intention.cyclesLabel',
  everything: 'intention.everythingLabel',
}

export function Profile({ profile, biblioteca, onReScan, onSignOut, onChangeIntention, onAbrirDespertar }: Props) {
  const { t } = useTranslation()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const reset = useAppStore((s) => s.reset)

  useFundo('voce')
  const signo = profile.date_of_birth ? getZodiacSign(profile.date_of_birth) : null
  // Signo traduzido (antes saía em inglês, "PISCES", com o app em português)
  const zodiac = signo ? `${SIMBOLO_SIGNO[signo] ?? ''} ${t(`zodiac.${signo}`)}`.trim() : null

  // O tipo de mao ("mao de fogo") vem de palm_scans.analysis.hand_shape, que o
  // useBiblioteca ainda nao carrega. Entra no Plano 2, junto com a miniatura da
  // palma. Ate la a linha mostra so signo e cidade.
  const maoLabel: string | null = null
  const mesEntrada = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' })
    .format(new Date(profile.created_at))
  const plano = biblioteca.assinatura ? t('profile.planoDespertar') : null

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
      a.download = `alma-dados-${profile.id}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
    }
  }

  const leituras = biblioteca.readings.length
  const capitulos = biblioteca.readings.reduce((soma, r) => soma + (r.capitulos?.length ?? 0), 0)
  const dias = calcularStreak(
    biblioteca.readings
      .filter((r) => r.reading_type === 'daily' && r.aberta_em)
      .map((r) => (r.data_carta ?? r.created_at).slice(0, 10)),
  )
  // Estatísticas em cartões coloridos: Leituras dourado, Capítulos rosa, Dias verde-água
  const stats = [
    { valor: leituras, label: t('profile.readings'), cor: '#FFE3A8', fundo: 'rgba(242,200,121,.08)', borda: 'rgba(242,200,121,.3)' },
    { valor: capitulos, label: t('profile.chapters'), cor: '#F7C9DD', fundo: 'rgba(226,106,160,.08)', borda: 'rgba(244,154,193,.3)' },
    { valor: dias, label: t('profile.days'), cor: '#9FF0E2', fundo: 'rgba(63,214,194,.08)', borda: 'rgba(127,240,221,.3)' },
  ]

  return (
    <div className="h-full flex flex-col scroll-area px-[18px] pt-[calc(34px+env(safe-area-inset-top,0px))] alma-com-tabbar">
      {/* Avatar com a inicial dentro da moldura aurora e anel girando */}
      <div className="alma-r1 flex flex-col items-center">
        <div className="relative flex items-center justify-center" style={{ width: 116, height: 116 }}>
          <svg aria-hidden="true" width="116" height="116" viewBox="0 0 116 116" className="absolute inset-0" style={{ animation: 'alma-spin 40s linear infinite' }}>
            <circle cx="58" cy="58" r="55" fill="none" stroke="#F2C879" strokeOpacity=".55" strokeDasharray="2 6" />
            <circle cx="58" cy="3" r="3" fill="#FFE3A8" /><circle cx="10" cy="86" r="2.5" fill="#F49AC1" />
          </svg>
          <div className="alma-retrato__moldura alma-retrato__moldura--halo" style={{ width: 92, height: 92 }}>
            <div className="w-full h-full rounded-full flex items-center justify-center font-serif text-[44px] text-gold-light" style={{ background: 'radial-gradient(circle at 35% 30%, #2A2E6E, #0C1031)' }}>
              {profile.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
        <h1 className="alma-display mt-3 text-[32px] text-center">{profile.name}</h1>
        {(zodiac || profile.city_of_birth) && (
          <span className="mt-1 text-[12px] tracking-[2px] uppercase text-gold text-center">
            {[zodiac, maoLabel, profile.city_of_birth].filter(Boolean).join(' · ')}
          </span>
        )}
        <span className="mt-1 text-[12.5px] text-[#8E89AE]">
          {t('profile.memberSince', { mes: mesEntrada })}{plano ? ` · ${plano}` : ''}
        </span>
      </div>

      <div className="alma-r2 grid grid-cols-3 gap-2.5 mt-5">
        {stats.map(({ valor, label, cor, fundo, borda }) => (
          <div key={label} className="py-3.5 px-1.5 rounded-[18px] text-center" style={{ background: fundo, border: `1px solid ${borda}` }}>
            <div className="font-serif text-[32px] leading-none" style={{ color: cor }}>{valor}</div>
            <div className="mt-1 text-[10.5px] tracking-[2px] uppercase text-text-muted">{label}</div>
          </div>
        ))}
      </div>

      {/* Sua palma: miniatura animada + Re-escanear */}
      <div className="alma-r3 alma-card mt-3.5 !p-4">
        <span className="text-[11px] tracking-[2.5px] uppercase text-gold">{t('profile.yourPalm')}</span>
        <div className="flex items-center gap-3.5 mt-3">
          <div aria-hidden="true" className="w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center" style={{ background: 'radial-gradient(circle, rgba(124,92,255,.35), rgba(12,16,49,.9))', border: '1px solid rgba(242,200,121,.3)' }}>
            <svg width="44" height="44" viewBox="0 0 60 60">
              <defs><linearGradient id="alma-voce-pp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFE3A8" /><stop offset="1" stopColor="#F49AC1" /></linearGradient></defs>
              <path d="M18 56 L12 34 C11 30 15 28 17 32 L20 38 L19 12 C19 8 25 8 25 12 L26 30 L27 8 C27 4 33 4 33 8 L33 30 L35 12 C36 8 41 9 41 13 L39 33 L42 22 C43 19 47 20 46 23 L42 42 C40 50 36 54 34 56" fill="none" stroke="#F2C879" strokeOpacity=".6" strokeWidth="1.4" />
              <path className="alma-intro-ln" d="M18 42 C25 37 32 36 40 38" fill="none" stroke="url(#alma-voce-pp)" strokeWidth="2" strokeLinecap="round" />
              <path className="alma-intro-ln alma-intro-ln--2" d="M21 36 C24 44 26 50 30 54" fill="none" stroke="url(#alma-voce-pp)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex-grow">
            <div className="text-[15px] text-cream">{t('profile.dominantScan')}</div>
            <div className="mt-0.5 text-[12.5px] text-[#8E89AE]">{t('profile.reScanNote')}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => { track(Events.RESCAN_INITIATED, {}); onReScan() }}
          className="alma-btn-secondary w-full mt-3 !h-11 !text-[14px]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F2D9A6" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5" /></svg>
          {t('profile.reScan')}
        </button>
      </div>

      {/* Sua intenção em cartão rosa/violeta */}
      <div className="alma-r3 mt-3.5 p-4 rounded-[22px]" style={{ background: 'linear-gradient(135deg, rgba(226,106,160,.12), rgba(124,92,255,.12))', border: '1px solid rgba(244,154,193,.3)' }}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] tracking-[2.5px] uppercase text-rose-text">{t('profile.yourIntention')}</span>
          <button type="button" className="text-[13px] text-gold" onClick={onChangeIntention}>{t('profile.change')}</button>
        </div>
        <p className="m-0 mt-2 font-serif italic text-[21px] leading-[1.3] text-cream">
          {profile.intention ? t(INTENTION_LABELS_KEY[profile.intention] ?? 'intention.everythingLabel') : t('profile.intentionNotSet')}
        </p>
      </div>

      <div className="alma-r4 alma-card mt-3.5 !p-4">
        <span className="text-[11px] tracking-[2.5px] uppercase text-gold">{t('profile.language')}</span>
        <LanguagePicker largo className="mt-2.5" />
      </div>

      {/* Conta: linhas de lista */}
      <div className="alma-r4 mt-3.5 rounded-[22px] overflow-hidden" style={{ background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.1)' }}>
        <div className="px-4 pt-3.5 pb-1.5 text-[11px] tracking-[2.5px] uppercase text-gold">{t('profile.account')}</div>
        <button type="button" onClick={onAbrirDespertar} className="flex items-center justify-between min-h-[52px] px-4 text-left w-full" style={{ borderTop: '1px solid rgba(255,255,255,.06)' }}>
          <span className="text-[15px] text-[#EDE6D6]">{t('profile.subscription')}</span>
          <span className="text-[14px] text-[#8E89AE]">{biblioteca.assinatura ? t('profile.subscriptionActive') : t('profile.subscriptionNone')}</span>
        </button>
        <button type="button" onClick={handleDownloadData} className="flex items-center justify-between min-h-[52px] px-4 text-left w-full" style={{ borderTop: '1px solid rgba(255,255,255,.06)' }}>
          <span className="text-[15px] text-[#EDE6D6]">{t('profile.downloadData')}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8E89AE" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
        </button>
        <button type="button" onClick={handleSignOut} disabled={signingOut} className="flex items-center justify-between min-h-[52px] px-4 text-left w-full" style={{ borderTop: '1px solid rgba(255,255,255,.06)', opacity: signingOut ? 0.6 : 1 }}>
          <span className="text-[15px] text-[#EDE6D6]">{signingOut ? t('profile.signingOut') : t('profile.signOut')}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8E89AE" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
        </button>
        <button type="button" onClick={() => setShowDeleteConfirm(true)} className="flex items-center justify-between min-h-[52px] px-4 text-left w-full" style={{ borderTop: '1px solid rgba(255,255,255,.06)' }}>
          <span className="text-[15px] text-status-error">{t('profile.deleteAccount')}</span>
        </button>
      </div>
      <p className="mt-4 text-center text-[11px] tracking-[2px] uppercase text-[#8E89AE]">✦ {t('profile.footer')} ✦</p>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative rounded-t-[28px] px-6 pt-6 pb-10" style={{ background: 'linear-gradient(180deg, rgba(28,33,86,.98), rgba(12,16,49,.99))', border: '1px solid rgba(255,157,176,.35)', borderBottom: 'none' }}>
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(255,255,255,.2)' }} />
            <h3 className="alma-display text-[26px] mb-2">
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
