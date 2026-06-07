import { useRef, useState } from 'react'
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
import { Welcome } from './onboarding/Welcome'
import type { PalmAnalysis, Intention, Profile, Gender } from '@/types'

type Step =
  | 'splash'
  | 'intro'
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
}

export function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState<Step>('splash')
  const [basicData, setBasicData] = useState<BasicDataValues | null>(null)

  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<PalmAnalysis | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [scanId, setScanId] = useState<string | null>(null)
  const [pendingProfile, setPendingProfile] = useState<Profile | null>(null)

  const { setUserId: storeSetUserId, setProfile } = useAppStore()
  const userCreationPromise = useRef<Promise<string> | null>(null)
  // Stores the definitively resolved auth user ID to avoid stale closure issues
  const resolvedUserIdRef = useRef<string | null>(null)

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

  const createAnonymousUser = async (data: BasicDataValues) => {
    // Pass form data as metadata so the DB trigger creates the profile atomically
    const { data: authData, error } = await supabase.auth.signInAnonymously({
      options: {
        data: {
          name: data.name,
          date_of_birth: data.birthDate || null,
          time_of_birth: data.birthTime || null,
          city_of_birth: data.birthCity || null,
          gender: data.gender || null,
        },
      },
    })
    if (error) throw new Error(error.message)
    if (!authData.user) throw new Error('Auth returned no user')

    const uid = authData.user.id
    setUserId(uid)
    storeSetUserId(uid)

    return uid
  }

  const handleBasicDataNext = async (data: BasicDataValues) => {
    setBasicData(data)
    setStep('intention')
    // Save promise so handleScanComplete can await it instead of creating a second user
    userCreationPromise.current = createAnonymousUser(data)
    userCreationPromise.current.catch((e) => console.error('Failed to create user:', e))
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

    // Resolve the auth user ID — always prefer the real auth session over stale closure
    let resolvedUserId = userId
    if (!resolvedUserId) {
      try {
        const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
        const promise = userCreationPromise.current ?? Promise.reject<string>(new Error('No creation in progress'))
        resolvedUserId = await Promise.race([promise, timeout])
      } catch (e) {
        console.error('User creation failed:', e)
      }
    }
    if (!resolvedUserId) {
      // Last resort: check auth session directly before using random UUID
      const { data: { session } } = await supabase.auth.getSession()
      resolvedUserId = session?.user?.id ?? null
    }
    if (!resolvedUserId) {
      resolvedUserId = crypto.randomUUID()
    }
    // Always explicitly sync component state and ref with the resolved ID
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
        // Use real auth session user ID — bypasses any stale component state
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
