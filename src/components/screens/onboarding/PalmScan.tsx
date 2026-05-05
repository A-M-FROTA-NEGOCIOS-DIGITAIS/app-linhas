import { useRef, useState, useCallback } from 'react'
import { Spinner } from '@/components/ui'
import { compressImage } from '@/lib/utils'
import { track, Events } from '@/lib/analytics'

interface Props {
  onCapture: (dataUrl: string) => void
}

const PalmGuide = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" width="120" height="144" fill="none" stroke="#C9A961" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M58 230 C 50 200 44 178 44 158 C 44 142 38 130 36 116 C 34 102 40 96 48 100 C 54 102 60 110 64 122 C 64 110 62 76 64 56 C 66 42 78 40 80 54 C 82 76 82 100 84 116 C 86 100 88 70 92 54 C 94 42 106 42 108 56 C 110 78 108 102 110 118 C 112 102 116 78 120 66 C 124 54 134 54 134 68 C 134 86 130 110 130 122 C 134 112 142 100 150 96 C 160 92 166 102 162 114 C 154 132 144 152 140 168 C 134 188 130 210 126 230"/>
    <path d="M52 138 C 78 126 110 124 142 132" opacity="0.85"/>
    <path d="M50 158 C 78 152 112 150 138 156" opacity="0.7"/>
    <path d="M66 130 C 60 152 60 178 70 200" opacity="0.6"/>
    <path d="M104 230 C 102 200 100 174 102 152" opacity="0.5"/>
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
