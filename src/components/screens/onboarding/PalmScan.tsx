import { useRef, useState, useCallback } from 'react'
import { Button, Eyebrow, Spinner } from '@/components/ui'
import { compressImage } from '@/lib/utils'
import { track, Events } from '@/lib/analytics'

interface Props {
  onCapture: (dataUrl: string) => void
}

export function PalmScan({ onCapture }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
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

  return (
    <div className="h-full flex flex-col px-6 pt-14 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-3 mb-8">
        <Eyebrow>Palm scan</Eyebrow>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 300, lineHeight: 1.2, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
          Start with your<br /><em style={{ color: 'var(--accent-gold)' }}>dominant hand.</em>
        </h2>
        <p className="text-sm text-text-secondary">
          The hand you write with — it shows your present. Open palm, fingers spread, good light.
        </p>
      </div>

      {/* Scan frame */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div
          className="relative w-full max-w-[280px] aspect-square rounded-xl overflow-hidden border border-border-medium flex items-center justify-center cursor-pointer"
          style={{ background: 'var(--bg-surface)' }}
          onClick={() => fileRef.current?.click()}
        >
          {preview ? (
            <img src={preview} alt="palm preview" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-4 text-text-muted">
              {/* Frame guides */}
              {[
                'top-3 left-3 border-t border-l',
                'top-3 right-3 border-t border-r',
                'bottom-3 left-3 border-b border-l',
                'bottom-3 right-3 border-b border-r',
              ].map((cls, i) => (
                <div key={i} className={`absolute w-8 h-8 ${cls} border-accent-gold/60`} />
              ))}
              {/* Palm icon */}
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                <path d="M14 40c5-12 23-12 28 0M17 40c4-10 18-10 22 0M22 40c2-6 10-6 12 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
                <circle cx="28" cy="32" r="2.5" fill="currentColor" opacity="0.3"/>
              </svg>
              <span className="text-xs tracking-wide">Tap to add photo</span>
            </div>
          )}

          {processing && (
            <div className="absolute inset-0 bg-bg-primary/70 flex items-center justify-center">
              <Spinner size={28} className="text-accent-gold" />
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="flex flex-col gap-2 w-full">
          {['Good natural light', 'Fingers open and spread', 'Palm facing the camera'].map((tip) => (
            <div key={tip} className="flex items-center gap-3 text-xs text-text-secondary">
              <div className="w-1 h-1 rounded-full bg-accent-gold/60 flex-shrink-0" />
              {tip}
            </div>
          ))}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {/* Gallery option */}
      <div className="pt-2 text-center">
        <button
          className="text-xs text-text-muted underline underline-offset-2"
          onClick={() => {
            if (fileRef.current) {
              fileRef.current.removeAttribute('capture')
              fileRef.current.click()
              fileRef.current.setAttribute('capture', 'environment')
            }
          }}
        >
          Choose from gallery instead
        </button>
      </div>

      <div className="pt-4">
        <Button variant="primary" fullWidth disabled={!preview || processing} onClick={handleConfirm}>
          Analyze my palm
        </Button>
      </div>
    </div>
  )
}
