import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/app'
import { track, Events } from '@/lib/analytics'
import { Splash } from './onboarding/Splash'
import { Intro } from './onboarding/Intro'
import { BasicData } from './onboarding/BasicData'
import { Intention } from './onboarding/Intention'
import { PalmScan } from './onboarding/PalmScan'
import { Scanning } from './onboarding/Scanning'
import { Revelation } from './onboarding/Revelation'
import { Paywall } from './onboarding/Paywall'
import { Welcome } from './onboarding/Welcome'
import type { PalmAnalysis, Intention as IntentionType } from '@/types'

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
  dateOfBirth: string
  timeOfBirth?: string
  cityOfBirth?: string
}

interface Props {
  onComplete: () => void
}

export function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState<Step>('splash')
  const [basicData, setBasicData] = useState<BasicDataValues | null>(null)
  const [intention, setIntention] = useState<IntentionType | null>(null)
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
      date_of_birth: data.dateOfBirth,
      time_of_birth: data.timeOfBirth ?? null,
      city_of_birth: data.cityOfBirth ?? null,
    })

    return uid
  }

  const handleBasicDataNext = async (data: BasicDataValues) => {
    setBasicData(data)
    try {
      await createAnonymousUser(data)
    } catch (e) {
      console.error('Failed to create user:', e)
    }
    setStep('intention')
  }

  const handleIntentionNext = async (chosen: IntentionType) => {
    setIntention(chosen)
    if (userId) {
      await supabase.from('profiles').update({ intention: chosen }).eq('id', userId)
    }
    setStep('palm-scan')
  }

  const handleScanComplete = (imageUrl: string) => {
    setImageDataUrl(imageUrl)
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

  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    if (!userId) return
    await supabase.from('profiles').update({
      subscription_status: 'trial',
      trial_ends_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    }).eq('id', userId)

    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (profileData) setProfile(profileData)

    setStep('welcome')
  }

  const handleSkipPaywall = async () => {
    if (!userId) return
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (profileData) setProfile(profileData)
    setStep('welcome')
  }

  const handleWelcomeReadNow = () => {
    onComplete()
  }

  const handleSetupPush = () => {
    if ('Notification' in window) {
      Notification.requestPermission()
    }
    onComplete()
  }

  const name = basicData?.name ?? ''

  switch (step) {
    case 'splash':
      return <Splash onComplete={() => { track(Events.ONBOARDING_STARTED, {}); setStep('intro') }} />

    case 'intro':
      return <Intro onComplete={() => setStep('basic-data')} />

    case 'basic-data':
      return <BasicData onNext={handleBasicDataNext} />

    case 'intention':
      return <Intention onNext={handleIntentionNext} />

    case 'palm-scan':
      return (
        <PalmScan
          onCapture={handleScanComplete}
          onBack={() => setStep('intention')}
        />
      )

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
          onReadNow={handleWelcomeReadNow}
          onSetupPush={handleSetupPush}
        />
      )

    default:
      return null
  }
}
