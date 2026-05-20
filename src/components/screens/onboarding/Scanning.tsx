import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  onComplete: (analysis: unknown) => void
  imageDataUrl: string
  userId: string
}

const isDevBypass = () => localStorage.getItem('dev_bypass') === 'true'

const FAKE_SCAN_RESULT = {
  analysis: {
    hand_shape: 'fire',
    dominant_hand: true,
    image_quality: 'high',
    is_palm: true,
    main_lines: {
      life_line: { length: 'long', depth: 'deep', characteristic: 'clear and unbroken', interpretation: 'strong vitality' },
      heart_line: { length: 'long', depth: 'deep', characteristic: 'branches near Mercury', interpretation: 'idealistic in love' },
      head_line: { length: 'long', depth: 'medium', characteristic: 'slopes toward Luna', interpretation: 'creative thinker' },
      fate_line: { present: true, length: 'medium', characteristic: 'begins mid-palm', interpretation: 'self-made' },
    },
    mounts: { jupiter: 'prominent', saturn: 'average', apollo: 'prominent', mercury: 'average', venus: 'prominent', luna: 'average' },
    special_marks: [],
    overall_character: 'A person of deep feeling and creative fire.',
  },
  scan_id: 'dev-bypass-scan-id',
}

export function Scanning({ onComplete, imageDataUrl, userId }: Props) {
  const { t } = useTranslation()
  const [msgIndex, setMsgIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const calledRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const MESSAGES = [
    t('scanning.msg0'),
    t('scanning.msg1'),
    t('scanning.msg2'),
    t('scanning.msg3'),
    t('scanning.msg4'),
  ]

  useEffect(() => {
    if (calledRef.current) return
    calledRef.current = true

    const msgInterval = setInterval(() => {
      setMsgIndex((p) => Math.min(p + 1, MESSAGES.length - 1))
    }, 3500)

    const progInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 2, 95))
    }, 300)

    const analyze = async () => {
      if (isDevBypass()) {
        setTimeout(() => { setProgress(100); setTimeout(() => onCompleteRef.current(FAKE_SCAN_RESULT), 600) }, 3000)
        return
      }
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
        const res = await fetch(`${supabaseUrl}/functions/v1/analyze-palm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${supabaseKey}` },
          body: JSON.stringify({ user_id: userId, image_data: imageDataUrl, hand_type: 'dominant' }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || data.message || JSON.stringify(data))
        setProgress(100)
        setTimeout(() => onCompleteRef.current(data), 600)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        setError(msg)
      }
    }

    analyze()
    return () => { clearInterval(msgInterval); clearInterval(progInterval) }
  }, [])

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-8 gap-6">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#8B4040" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
        </svg>
        <div className="text-center">
          <p className="text-base text-text-primary mb-2">
            {error === 'image_not_palm' ? t('scanning.errorNotPalm') :
             error === 'image_quality_low' ? t('scanning.errorQuality') :
             error === 'palm_not_visible' ? t('scanning.errorNotVisible') : error}
          </p>
          <p className="text-sm text-text-secondary">{t('scanning.errorBack')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col items-center justify-center px-8 gap-10" style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(201,169,97,0.06), transparent 60%)' }}>
      <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
        <svg width="160" height="160" viewBox="0 0 160 160" className="absolute animate-spin-slow">
          <circle cx="80" cy="80" r="72" stroke="#C9A961" strokeWidth="0.5" strokeDasharray="8 6" opacity="0.4"/>
        </svg>
        <svg width="120" height="120" viewBox="0 0 120 120" className="absolute" style={{ animation: 'spin-slow 4s linear infinite reverse' }}>
          <circle cx="60" cy="60" r="52" stroke="#C9A961" strokeWidth="0.8" strokeDasharray="4 8" opacity="0.3"/>
        </svg>
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <path d="M8 48c10-20 38-20 48 0" stroke="#C9A961" strokeWidth="1.5" strokeLinecap="round" className="animate-pulse-gold"/>
          <path d="M14 48c8-14 28-14 36 0" stroke="#C9A961" strokeWidth="1.5" strokeLinecap="round" className="animate-pulse-gold" style={{ animationDelay: '0.3s' }}/>
          <path d="M22 48c4-8 16-8 20 0" stroke="#C9A961" strokeWidth="1.5" strokeLinecap="round" className="animate-pulse-gold" style={{ animationDelay: '0.6s' }}/>
          <circle cx="32" cy="38" r="3" fill="#C9A961" opacity="0.6"/>
        </svg>
      </div>

      <div className="text-center flex flex-col gap-3" key={msgIndex} style={{ animation: 'fade-in 400ms ease forwards' }}>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 400, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          {MESSAGES[msgIndex]}
        </p>
      </div>

      <div className="w-full max-w-[220px] h-px bg-border-subtle rounded-full overflow-hidden">
        <div className="h-full bg-accent-gold rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}
