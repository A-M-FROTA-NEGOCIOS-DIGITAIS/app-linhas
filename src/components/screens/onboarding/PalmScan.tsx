import { useRef, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { BotaoVoltar, Spinner } from '@/components/ui'
import { useFundo } from '@/components/ui/AuroraFundo'
import { compressImage } from '@/lib/utils'
import { track, Events } from '@/lib/analytics'

interface Props {
  onCapture: (dataUrl: string) => void
  onBack: () => void
}

// Mão pontilhada com as linhas da palma se desenhando (referência L06-Scan).
const PalmGuide = () => (
  <svg aria-hidden="true" width="230" height="300" viewBox="0 0 220 290" className="absolute left-1/2 top-1/2" style={{ transform: 'translate(-50%, -48%)' }}>
    <defs>
      <linearGradient id="alma-scan-pl" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FFE3A8" /><stop offset=".6" stopColor="#F49AC1" /><stop offset="1" stopColor="#9C86FF" />
      </linearGradient>
      <filter id="alma-scan-gl"><feGaussianBlur stdDeviation="2.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
    </defs>
    <path d="M62 280 C52 240 40 205 30 170 C22 142 14 120 22 110 C32 100 46 112 54 132 L62 154 L58 60 C57 44 66 36 76 36 C86 36 92 44 92 58 L95 130 L96 30 C96 16 104 8 114 8 C124 8 132 16 132 30 L132 128 L138 46 C139 32 148 26 157 27 C167 28 173 36 172 50 L166 140 L176 86 C178 74 187 69 195 71 C204 73 208 82 206 94 L192 176 C186 214 172 248 160 280" fill="rgba(242,200,121,.05)" stroke="rgba(242,200,121,.6)" strokeWidth="1.4" strokeDasharray="5 5" />
    <path className="alma-scan-ln" d="M60 196 C88 176 122 170 170 178" fill="none" stroke="url(#alma-scan-pl)" strokeWidth="2.4" strokeLinecap="round" filter="url(#alma-scan-gl)" />
    <path className="alma-scan-ln alma-scan-ln--2" d="M64 168 C90 150 126 146 160 152" fill="none" stroke="url(#alma-scan-pl)" strokeWidth="2.4" strokeLinecap="round" filter="url(#alma-scan-gl)" />
    <path className="alma-scan-ln alma-scan-ln--3" d="M78 162 C70 196 80 232 104 262" fill="none" stroke="url(#alma-scan-pl)" strokeWidth="2.4" strokeLinecap="round" filter="url(#alma-scan-gl)" />
  </svg>
)

/** Canto dourado da moldura da câmera. */
const Canto = ({ lado }: { lado: 'tl' | 'tr' | 'bl' | 'br' }) => {
  const topo = lado[0] === 't'
  const esq = lado[1] === 'l'
  const borda = '2.5px solid #F2C879'
  const estilo: React.CSSProperties = { width: 32, height: 32 }
  if (topo) { estilo.top = 16; estilo.borderTop = borda } else { estilo.bottom = 16; estilo.borderBottom = borda }
  if (esq) { estilo.left = 16; estilo.borderLeft = borda } else { estilo.right = 16; estilo.borderRight = borda }
  if (topo && esq) estilo.borderTopLeftRadius = 14
  if (topo && !esq) estilo.borderTopRightRadius = 14
  if (!topo && esq) estilo.borderBottomLeftRadius = 14
  if (!topo && !esq) estilo.borderBottomRightRadius = 14
  return <span aria-hidden="true" className="absolute" style={estilo} />
}

export function PalmScan({ onCapture, onBack }: Props) {
  const { t } = useTranslation()
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  useFundo('scan')

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setProcessing(true)
    try {
      const compressed = await compressImage(file, 512, 0.80)
      setPreview(compressed)
    } finally {
      setProcessing(false)
    }
  }, [])

  const handleConfirm = () => {
    if (!preview || confirming) return
    setConfirming(true)
    track(Events.PALM_SCAN_STARTED, { hand_type: 'dominant' })
    onCapture(preview)
  }

  const openCamera = () => cameraRef.current?.click()
  const openGallery = () => galleryRef.current?.click()

  return (
    <div className="h-full flex flex-col px-[22px] pt-[calc(22px+env(safe-area-inset-top,0px))] pb-6">
      <div className="flex items-center justify-between h-11">
        <BotaoVoltar onClick={onBack} />
        <span className="text-[12px] tracking-[2px] uppercase text-gold">{t('palmScan.counter')}</span>
      </div>
      <h1 className="alma-display mt-2.5 text-[30px]">
        {t('palmScan.title')} <span className="alma-grad-text">{t('palmScan.titleItalic')}</span>
      </h1>
      <p className="mt-2 text-[14px] text-text-muted">
        {t('palmScan.subtitle')} <strong className="text-cream font-medium">{t('palmScan.subtitleBold')}</strong>{t('palmScan.subtitleSuffix')}
      </p>

      {/* Moldura da câmera: cantos dourados, mão pontilhada, linhas se desenhando, scanner verde-água */}
      <div
        className="relative flex-grow mt-[18px] rounded-[30px] overflow-hidden cursor-pointer min-h-[260px]"
        style={{ background: 'radial-gradient(70% 55% at 50% 50%, rgba(124,92,255,.3), rgba(8,10,32,.85))', border: '1px solid rgba(242,200,121,.28)' }}
        onClick={!preview ? openCamera : undefined}
      >
        {preview ? (
          <img src={preview} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <>
            <span className="absolute top-4 inset-x-0 text-center text-[11px] tracking-[3px] uppercase text-gold" style={{ animation: 'alma-respira 2.4s ease-in-out infinite' }}>
              {t('palmScan.centerPalm')}
            </span>
            <PalmGuide />
            <div aria-hidden="true" className="absolute left-5 right-5 h-0.5" style={{ background: 'linear-gradient(90deg, rgba(63,214,194,0), #7FF0DD, rgba(63,214,194,0))', boxShadow: '0 0 18px 4px rgba(63,214,194,.45)', animation: 'alma-scan 3.4s ease-in-out infinite' }} />
          </>
        )}
        <Canto lado="tl" /><Canto lado="tr" /><Canto lado="bl" /><Canto lado="br" />
        {processing && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(5,7,26,0.6)' }}>
            <Spinner size={28} className="text-gold" />
          </div>
        )}
      </div>

      {/* Galeria · captura dourada com 2 anéis pulsando · Auto */}
      <div className="grid items-center mt-[18px]" style={{ gridTemplateColumns: '1fr auto 1fr' }}>
        <button type="button" onClick={openGallery} className="justify-self-start flex items-center gap-2 h-11 px-3.5 rounded-pill text-[13px] text-text-secondary" style={{ border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.06)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4CFE6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-9 9" />
          </svg>
          {t('palmScan.gallery')}
        </button>
        <div className="relative" style={{ width: 78, height: 78 }}>
          <span aria-hidden="true" className="absolute inset-0 rounded-full" style={{ border: '2px solid rgba(242,200,121,.7)', animation: 'alma-ring 2s ease-out infinite' }} />
          <span aria-hidden="true" className="absolute inset-0 rounded-full" style={{ border: '2px solid rgba(226,106,160,.6)', animation: 'alma-ring 2s ease-out infinite 1s' }} />
          <button
            type="button"
            aria-label={preview ? t('common.continue') : t('palmScan.centerPalm')}
            onClick={preview ? handleConfirm : openCamera}
            disabled={processing || confirming}
            className="absolute rounded-full flex items-center justify-center"
            style={{ inset: 6, background: 'linear-gradient(180deg, #FBE0A6, #E7B865 55%, #C98F35)', boxShadow: '0 8px 30px rgba(242,180,90,.5), inset 0 1px 0 rgba(255,255,255,.6)', opacity: processing || confirming ? 0.6 : 1 }}
          >
            {confirming ? (
              <Spinner size={22} className="text-ink" />
            ) : preview ? (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2A1A05" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2A1A05" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
            )}
          </button>
        </div>
        <button type="button" onClick={openCamera} className="justify-self-end flex items-center gap-2 h-11 px-3.5 rounded-pill text-[13px] text-teal-text" style={{ border: '1px solid rgba(63,214,194,.4)', background: 'rgba(63,214,194,.1)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9FF0E2" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M13 3L5 14h6l-1 7 8-11h-6z" /></svg>
          {t('palmScan.auto')}
        </button>
      </div>
      <p className="mt-3.5 text-center font-serif italic text-[16px] text-text-muted">{t('palmScan.tip')}</p>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
    </div>
  )
}
