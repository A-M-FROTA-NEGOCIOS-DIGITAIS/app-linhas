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
import type { PalmAnalysis, Intention } from '@/types'

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
}

interface Props {
  onComplete: () => void
}

export function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState<Step>('splash')
  const [basicData, setBasicData] = useState<BasicDataValues | null>(null)
  const [intention, setIntention] = useState<Intention | null>(null)
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<PalmAnalysis | null>(null)
  const [readingPreview, setReadingPreview] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [scanId, setScanId] = useState<string | null>(null)

  const { setProfile, setUserId: storeSetUserId } = useAppStore()

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
    setIntention(chosen)
    if (userId) {
      supabase.from('profiles').update({ intention: chosen }).eq('id', userId).then(() => {})
    }
    setStep('palm-scan')
  }

  const handleScanComplete = async (imageUrl: string) => {
    setImageDataUrl(imageUrl)
    if (!userId && basicData) {
      try {
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
        await Promise.race([createAnonymousUser(basicData), timeout])
      } catch (e) {
        console.error('Retry user creation failed:', e)
      }
    }
    // Fallback: use a local UUID so the scan can still run even without auth
    if (!userId) {
      const fallbackId = crypto.randomUUID()
      setUserId(fallbackId)
      storeSetUserId(fallbackId)
    }
    setStep('scanning')
    track(Events.PALM_SCAN_COMPLETED, {})
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

  const getFallbackProfile = (uid: string) => ({
    id: uid,
    name: basicData?.name ?? 'You',
    date_of_birth: basicData?.birthDate ?? null,
    time_of_birth: basicData?.birthTime ?? null,
    city_of_birth: basicData?.birthCity ?? null,
    intention: intention ?? 'everything',
    subscription_status: 'trial',
    trial_ends_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  })

  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    if (!userId) return
    await supabase.from('profiles').update({
      subscription_status: 'trial',
      trial_ends_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    }).eq('id', userId)

    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(profileData ?? getFallbackProfile(userId))

    setStep('welcome')
  }

  const handleSkipPaywall = async () => {
    if (!userId) return
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(profileData ?? getFallbackProfile(userId))
    setStep('welcome')
  }

  const name = basicData?.name ?? ''

  switch (step) {
    case 'splash':
      return <Splash onContinue={() => { track(Events.ONBOARDING_STARTED, {}); setStep('intro') }} />

    case 'intro':
      return <Intro onContinue={() => setStep('basic-data')} />

    case 'basic-data':
      return <BasicData onContinue={handleBasicDataNext} />

    case 'intention':
      return <IntentionScreen onContinue={handleIntentionNext} />

    case 'palm-scan':
      return <PalmScan onCapture={handleScanComplete} />

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

    case 'welcome':
      return (
        <Welcome
          name={name}
          onReadNow={onComplete}
          onSetupPush={() => {
            if ('Notification' in window) Notification.requestPermission()
            onComplete()
          }}
        />
      )

    default:
      return null
  }
}
