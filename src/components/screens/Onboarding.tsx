import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/app'
import { track, Events } from '@/lib/analytics'
import { Splash } from './onboarding/Splash'
import { Intro } from './onboarding/Intro'
import { BasicData } from './onboarding/BasicData'
import { IntentionScreen } from './onboarding/Intention'
import { PalmScan } from './onboarding/PalmScan'
import { Scanning } from './onboarding/Scanning'
import { Revelation } from './onboarding/Revelation'
import { Paywall } from './onboarding/Paywall'
import { Welcome } from './onboarding/Welcome'
import type { PalmAnalysis, Intention, SubscriptionStatus, Profile, Gender } from '@/types'

type Step =
  | 'splash'
  | 'intro'
  | 'basic-data'
  | 'intention'
  | 'palm-scan'
  | 'scanning'
  | 'revelation'
  | 'paywall'
  | 'welcome'

interface BasicDataValues {
  name: string
  birthDate: string
  birthTime?: string
  birthCity?: string
  gender?: Gender
}

interface Props {
  onComplete: () => void
}

export function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState<Step>('splash')
  const [basicData, setBasicData] = useState<BasicDataValues | null>(null)

  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<PalmAnalysis | null>(null)
  const [readingPreview, setReadingPreview] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [scanId, setScanId] = useState<string | null>(null)
  const [pendingProfile, setPendingProfile] = useState<Profile | null>(null)

  const { setUserId: storeSetUserId, setProfile } = useAppStore()

  const buildFallbackProfile = (uid: string): Profile => ({
    id: uid,
    name: basicData?.name ?? 'You',
    date_of_birth: basicData?.birthDate ?? undefined,
    time_of_birth: basicData?.birthTime ?? undefined,
    city_of_birth: basicData?.birthCity ?? undefined,
    gender: basicData?.gender ?? undefined,
    intention: 'everything' as Intention,
    subscription_status: 'trial' as SubscriptionStatus,
    trial_ends_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  const createAnonymousUser = async (data: BasicDataValues) => {
    const { data: authData, error } = await supabase.auth.signInAnonymously()
    if (error || !authData.user) throw error

    const uid = authData.user.id
    setUserId(uid)
    storeSetUserId(uid)

    await supabase.from('profiles').insert({
      id: uid,
      name: data.name,
      date_of_birth: data.birthDate,
      time_of_birth: data.birthTime ?? null,
      city_of_birth: data.birthCity ?? null,
      gender: data.gender ?? null,
    })

    return uid
  }

  const handleBasicDataNext = async (data: BasicDataValues) => {
    setBasicData(data)
    setStep('intention')
    // Run auth in background — don't block UI
    createAnonymousUser(data).catch((e) => console.error('Failed to create user:', e))
  }

  const handleIntentionNext = (chosen: Intention) => {
    if (userId) {
      supabase.from('profiles').update({ intention: chosen }).eq('id', userId).then(() => {})
    }
    setStep('palm-scan')
  }

  const handleScanComplete = async (imageUrl: string) => {
    setImageDataUrl(imageUrl)
    track(Events.PALM_SCAN_COMPLETED, {})

    // Dev bypass: pula auth e analise, vai direto para Revelation com dados falsos
    if (localStorage.getItem('dev_bypass') === 'true') {
      const fallbackId = userId ?? crypto.randomUUID()
      if (!userId) { setUserId(fallbackId); storeSetUserId(fallbackId) }
      setAnalysis({
        hand_shape: 'fire', dominant_hand: true, image_quality: 'high', is_palm: true,
        main_lines: {
          life_line: { length: 'long', depth: 'deep', characteristic: 'clear and unbroken', interpretation: 'strong vitality' },
          heart_line: { length: 'long', depth: 'deep', characteristic: 'branches near Mercury', interpretation: 'idealistic in love' },
          head_line: { length: 'long', depth: 'medium', characteristic: 'slopes toward Luna', interpretation: 'creative thinker' },
          fate_line: { present: true, length: 'medium', characteristic: 'begins mid-palm', interpretation: 'self-made' },
        },
        mounts: { jupiter: 'prominent', saturn: 'average', apollo: 'prominent', mercury: 'average', venus: 'prominent', luna: 'average' },
        special_marks: [],
        overall_character: 'A person of deep feeling and creative fire.',
      } as PalmAnalysis)
      setScanId('dev-bypass-scan-id')
      setStep('revelation')
      return
    }

    if (!userId && basicData) {
      try {
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
        await Promise.race([createAnonymousUser(basicData), timeout])
      } catch (e) {
        console.error('Retry user creation failed:', e)
      }
    }
    if (!userId) {
      const fallbackId = crypto.randomUUID()
      setUserId(fallbackId)
      storeSetUserId(fallbackId)
    }
    setStep('scanning')
  }

  const handleAnalysisComplete = (data: unknown) => {
    const d = data as { analysis: PalmAnalysis; scan_id: string }
    setAnalysis(d.analysis)
    setScanId(d.scan_id)
    setStep('revelation')
  }

  const handleRevelationContinue = (preview: string) => {
    setReadingPreview(preview)
    track(Events.PAYWALL_VIEWED, { source: 'revelation' })
    setStep('paywall')
  }

  const handleSubscribe = (_plan: 'monthly' | 'yearly') => {
    const uid = userId ?? crypto.randomUUID()
    if (userId) {
      void Promise.resolve(supabase.from('profiles').update({
        subscription_status: 'trial' as SubscriptionStatus,
        trial_ends_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      }).eq('id', uid)).catch(() => {})
    }
    setPendingProfile(buildFallbackProfile(uid))
    setStep('welcome')
  }

  const handleSkipPaywall = () => {
    const uid = userId ?? crypto.randomUUID()
    setPendingProfile(buildFallbackProfile(uid))
    setStep('welcome')
  }

  const name = basicData?.name ?? ''

  switch (step) {
    case 'splash':
      return <Splash onContinue={() => { track(Events.ONBOARDING_STARTED, {}); setStep('intro') }} />

    case 'intro':
      return <Intro onContinue={() => setStep('basic-data')} onBack={() => setStep('splash')} />

    case 'basic-data':
      return <BasicData onContinue={handleBasicDataNext} onBack={() => setStep('intro')} />

    case 'intention':
      return <IntentionScreen onContinue={handleIntentionNext} onBack={() => setStep('basic-data')} />

    case 'palm-scan':
      return <PalmScan onCapture={handleScanComplete} onBack={() => setStep('intention')} />

    case 'scanning':
      return (
        <Scanning
          imageDataUrl={imageDataUrl!}
          userId={userId!}
          onComplete={handleAnalysisComplete}
        />
      )

    case 'revelation':
      return (
        <Revelation
          analysis={analysis!}
          name={name}
          scanId={scanId!}
          userId={userId!}
          onContinue={handleRevelationContinue}
        />
      )

    case 'paywall':
      return (
        <Paywall
          preview={readingPreview}
          name={name}
          onSubscribe={handleSubscribe}
          onSkip={handleSkipPaywall}
        />
      )

    case 'welcome': {
      const finishOnboarding = () => {
        if (pendingProfile) setProfile(pendingProfile)
        // Try to fetch real profile from DB in background
        if (userId) {
          void Promise.resolve(
            supabase.from('profiles').select('*').eq('id', userId).single()
          ).then(({ data }) => { if (data) setProfile(data as Profile) }).catch(() => {})
        }
        onComplete()
      }
      return (
        <Welcome
          name={name}
          gender={basicData?.gender}
          onReadNow={finishOnboarding}
          onSetupPush={() => {
            if ('Notification' in window) Notification.requestPermission()
            finishOnboarding()
          }}
        />
      )
    }

    default:
      return null
  }
}
