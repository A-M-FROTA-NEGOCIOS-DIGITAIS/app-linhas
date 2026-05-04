import { useRef, useState, useCallback } from 'react'
import { Spinner } from '@/components/ui'
import { compressImage } from '@/lib/utils'
import { track, Events } from '@/lib/analytics'

interface Props {
  onCapture: (dataUrl: string) => void
}

const PalmGuide = () => (
  <svg width="130" height="170" viewBox="0 0 60 84" fill="none">
    <path d="M4,52 C3,42 4,32 7,25 C9,19 15,19 15,25 L15,52"
      stroke="#C9A961" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <path d="M17,52 L17,15 C17,7 25,7 25,15 L25,52"
      stroke="#C9A961" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <path d="M27,52 L27,7 C27,1 35,1 35,7 L35,52"
      stroke="#C9A961" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <path d="M37,52 L37,15 C37,7 45,7 45,15 L45,52"
      stroke="#C9A961" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <path d="M47,52 L47,26 C47,18 55,18 55,26 L55,56"
      stroke="#C9A961" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <path d="M55,56 C57,66 53,76 44,79 C34,82 20,80 12,74 C5,68 3,60 4,52"
      stroke="#C9A961" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <path d="M8,61 C22,57 42,57 54,60"
      stroke="#C9A961" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.85"/>
    <path d="M7,71 C20,67 43,67 53,70"
      stroke="#C9A961" strokeWidth="1.1" strokeLinecap="round" fill="none" opacity="0.7"/>
  </svg>
)

export function PalmScan({ onCapture }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setProcessing(true)
    try {
      const compressed = await compressImage(file)
      setPreview(compressed)
    } finally {
      setProcessing(false)
    }
  }, [])

  const handleConfirm = () => {
    if (!preview) return
    track(Events.PALM_SCAN_STARTED, { hand_type: 'dominant' })
    onCapture(preview)
  }

  const openCamera = () => cameraRef.current?.click()
  const openGallery = () => galleryRef.current?.click()

  return (
    <div className="h-full flex flex-col pb-4">

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-6 pb-2">
        <p style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-sans)' }}>
          Chapter 05
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.06em', fontFamily: 'var(--font-sans)' }}>
          5 of 9
        </p>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-2 px-6 mt-3 mb-4">
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 30, fontWeight: 300, lineHeight: 1.2, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
          Start with the hand<br />you use to{' '}
          <em style={{ color: 'var(--accent-gold)', fontStyle: 'italic' }}>write.</em>
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', lineHeight: 1.55 }}>
          It shows your <strong style={{ color: 'var(--text-primary)', fontWeight: 500 }}>present</strong>. Then we scan the other (potential).
        </p>
      </div>

      {/* Viewfinder */}
      <div className="flex-1 px-6 flex flex-col min-h-0">
        <div
          className="relative flex-1 rounded-2xl flex flex-col overflow-hidden"
          style={{ background: 'rgba(201,169,97,0.04)', border: '1px solid var(--border-subtle)' }}
        >
          {/* Corner brackets */}
          <div className="absolute top-3 left-3 w-6 h-6" style={{ borderTop: '1.5px solid var(--accent-gold)', borderLeft: '1.5px solid var(--accent-gold)', opacity: 0.7 }} />
          <div className="absolute top-3 right-3 w-6 h-6" style={{ borderTop: '1.5px solid var(--accent-gold)', borderRight: '1.5px solid var(--accent-gold)', opacity: 0.7 }} />
          <div className="absolute bottom-14 left-3 w-6 h-6" style={{ borderBottom: '1.5px solid var(--accent-gold)', borderLeft: '1.5px solid var(--accent-gold)', opacity: 0.7 }} />
          <div className="absolute bottom-14 right-3 w-6 h-6" style={{ borderBottom: '1.5px solid var(--accent-gold)', borderRight: '1.5px solid var(--accent-gold)', opacity: 0.7 }} />

          {/* Center label */}
          <div className="pt-5 flex justify-center">
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Center your palm
            </p>
          </div>

          {/* Palm area */}
          <div
            className="flex-1 flex items-center justify-center cursor-pointer"
            onClick={!preview ? openCamera : undefined}
          >
            {preview ? (
              <img src={preview} alt="palm preview" className="absolute inset-0 w-full h-full object-cover" style={{ borderRadius: 16 }} />
            ) : (
              <PalmGuide />
            )}
            {processing && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', borderRadius: 16 }}>
                <Spinner size={28} className="text-accent-gold" />
              </div>
            )}
          </div>

          {/* Bottom row inside frame: GALLERY | AUTO */}
          <div className="flex items-center justify-between px-5 pb-4 pt-2">
            <button
              onClick={openGallery}
              className="flex items-center gap-2"
              style={{ fontFamily: 'var(--font-sans)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
              Gallery
            </button>
            <button
              onClick={openCamera}
              className="flex items-center gap-2"
              style={{ fontFamily: 'var(--font-sans)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              Auto
            </button>
          </div>
        </div>
      </div>

      {/* Italic instruction */}
      <p style={{
        fontFamily: 'var(--font-serif)',
        fontSize: 13,
        fontStyle: 'italic',
        color: 'var(--accent-gold)',
        textAlign: 'center',
        opacity: 0.75,
        marginTop: 14,
        marginBottom: 10,
      }}>
        No makeup. Natural light. Hold steady.
      </p>

      {/* Circular capture / confirm button */}
      <div className="flex justify-center pb-2">
        <button
          onClick={preview ? handleConfirm : openCamera}
          disabled={processing}
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'var(--accent-gold)',
            border: '4px solid rgba(201,169,97,0.25)',
            outline: '1px solid rgba(201,169,97,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'opacity 0.2s',
            opacity: processing ? 0.6 : 1,
          }}
        >
          {preview ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--bg-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--bg-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          )}
        </button>
      </div>

      {/* Hidden inputs */}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
    </div>
  )
}
