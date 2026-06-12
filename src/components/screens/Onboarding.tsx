import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/app'
import { track, Events } from '@/lib/analytics'
import { Splash } from './onboarding/Splash'
import { Intro } from './onboarding/Intro'
import { EmailEntry } from './onboarding/EmailEntry'
import { VerifyEmail } from './onboarding/VerifyEmail'
import { BasicData } from './onboarding/BasicData'
import { IntentionScreen } from './onboarding/Intention'
import { PalmScan } from './onboarding/PalmScan'
import { Scanning } from './onboarding/Scanning'
import { Revelation } from './onboarding/Revelation'
import { Welcome } from './onboarding/Welcome'
import type { PalmAnalysis, Intention, Profile, Gender } from '@/types'

type Step =
  | 'splash'
  | 'intro'
  | 'email-entry'
  | 'verify-email'
  | 'basic-data'
  | 'intention'
  | 'palm-scan'
  | 'scanning'
  | 'revelation'
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
  preAuthenticated?: boolean
}

export function Onboarding({ onComplete, preAuthenticated }: Props) {
  const hasAccount = localStorage.getItem('linhas-has-account') === '1'
  const [step, setStep] = useState<Step>(
    preAuthenticated ? 'basic-data' : hasAccount ? 'email-entry' : 'splash'
  )
  const [email, setEmail] = useState('')
  const [basicData, setBasicData] = useState<BasicDataValues | null>(null)
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<PalmAnalysis | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [scanId, setScanId] = useState<string | null>(null)
  const [pendingProfile, setPendingProfile] = useState<Profile | null>(null)

  const { setUserId: storeSetUserId, setProfile } = useAppStore()
  const resolvedUserIdRef = useRef<string | null>(null)

  // When user arrives via invite link (already authenticated), load their userId
  useEffect(() => {
    if (preAuthenticated) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.id) {
          setUserId(session.user.id)
          storeSetUserId(session.user.id)
          resolvedUserIdRef.current = session.user.id
        }
      })
    }
  }, [preAuthenticated])

  const buildFallbackProfile = (uid: string): Profile => ({
    id: uid,
    name: basicData?.name ?? 'You',
    date_of_birth: basicData?.birthDate ?? undefined,
    time_of_birth: basicData?.birthTime ?? undefined,
    city_of_birth: basicData?.birthCity ?? undefined,
    gender: basicData?.gender ?? undefined,
    intention: 'everything' as Intention,
    subscription_status: 'none',
    trial_ends_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  // Called after OTP verified — handles both new and returning users
  const handleVerified = async (uid: string) => {
    setUserId(uid)
    storeSetUserId(uid)
    resolvedUserIdRef.current = uid
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', uid).single()
      if (data?.name) {
        // Returning user — profile complete, go straight to app
        localStorage.setItem('linhas-has-account', '1')
        setProfile(data as Profile)
        onComplete()
        return
      }
    } catch {
      // No profile yet — new user, continue onboarding
    }
    setStep('basic-data')
  }

  const handleBasicDataNext = (data: BasicDataValues) => {
    setBasicData(data)
    const uid = resolvedUserIdRef.current
    if (uid) {
      supabase.from('profiles').update({
        name: data.name,
        date_of_birth: data.birthDate || null,
        time_of_birth: data.birthTime || null,
        city_of_birth: data.birthCity || null,
        gender: data.gender || null,
      }).eq('id', uid).then(() => {})
    }
    setStep('intention')
  }

  const handleIntentionNext = (chosen: Intention) => {
    const uid = resolvedUserIdRef.current ?? userId
    if (uid) {
      supabase.from('profiles').update({ intention: chosen }).eq('id', uid).then(() => {})
    }
    setStep('palm-scan')
  }

  const handleScanComplete = async (imageUrl: string) => {
    setImageDataUrl(imageUrl)
    track(Events.PALM_SCAN_COMPLETED, {})

    let resolvedUserId = resolvedUserIdRef.current ?? userId
    if (!resolvedUserId) {
      const { data: { session } } = await supabase.auth.getSession()
      resolvedUserId = session?.user?.id ?? null
    }
    if (!resolvedUserId) {
      resolvedUserId = crypto.randomUUID()
    }
    setUserId(resolvedUserId)
    storeSetUserId(resolvedUserId)
    resolvedUserIdRef.current = resolvedUserId
    setStep('scanning')
  }

  const handleAnalysisComplete = (data: unknown) => {
    const d = data as { analysis: PalmAnalysis; scan_id: string }
    setAnalysis(d.analysis)
    setScanId(d.scan_id)
    setStep('revelation')
  }

  const handleRevelationContinue = (_preview: string) => {
    const uid = resolvedUserIdRef.current ?? userId ?? crypto.randomUUID()
    setPendingProfile(buildFallbackProfile(uid))
    setStep('welcome')
  }

  const name = basicData?.name ?? ''

  switch (step) {
    case 'splash':
      return (
        <Splash
          onContinue={() => { track(Events.ONBOARDING_STARTED, {}); setStep('intro') }}
        />
      )

    case 'intro':
      return <Intro onContinue={() => setStep('email-entry')} onBack={() => setStep('splash')} />

    case 'email-entry':
      return (
        <EmailEntry
          onSuccess={(e) => { setEmail(e); setStep('verify-email') }}
          onBack={() => setStep(hasAccount ? 'splash' : 'intro')}
          isLogin={hasAccount}
        />
      )

    case 'verify-email':
      return (
        <VerifyEmail
          email={email}
          onSuccess={handleVerified}
          onBack={() => setStep('email-entry')}
        />
      )

    case 'basic-data':
      return <BasicData onContinue={handleBasicDataNext} onBack={() => setStep('email-entry')} />

    case 'intention':
      return <IntentionScreen onContinue={handleIntentionNext} onBack={() => setStep('basic-data')} />

    case 'palm-scan':
      return <PalmScan onCapture={handleScanComplete} onBack={() => setStep('intention')} />

    case 'scanning':
      return (
        <Scanning
          imageDataUrl={imageDataUrl!}
          userId={resolvedUserIdRef.current ?? userId ?? ''}
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

    case 'welcome': {
      const finishOnboarding = () => {
        localStorage.setItem('linhas-has-account', '1')
        supabase.auth.getSession().then(({ data: { session } }) => {
          const realUid = session?.user?.id ?? resolvedUserIdRef.current ?? userId
          if (realUid) {
            storeSetUserId(realUid)
            void (async () => {
              try {
                const { data } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', realUid)
                  .single()
                setProfile(data ? (data as Profile) : pendingProfile)
              } catch {
                if (pendingProfile) setProfile(pendingProfile)
              }
            })()
          } else if (pendingProfile) {
            setProfile(pendingProfile)
          }
        })
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
