import { useTranslation } from 'react-i18next'
import { useFundo } from '@/components/ui/AuroraFundo'
import type { Gender } from '@/types'

interface Props { name: string; gender?: Gender; onReadNow: () => void; onSetupPush: () => void }

// Estrelas caindo devagar (referência L09-BoasVindas)
const ESTRELAS = [
  { left: 40, cor: '#F2C879', tam: 14, dur: 7, atraso: 0, s: '✦' },
  { left: 120, cor: '#F49AC1', tam: 10, dur: 9, atraso: 2, s: '✧' },
  { left: 250, cor: '#9FF0E2', tam: 12, dur: 8, atraso: 4, s: '✦' },
  { left: 320, cor: '#FFE3A8', tam: 9, dur: 10, atraso: 1, s: '✧' },
  { left: 190, cor: '#CFC4FF', tam: 13, dur: 7.5, atraso: 5, s: '✦' },
]

export function Welcome({ name, gender, onReadNow, onSetupPush }: Props) {
  const { t } = useTranslation()
  const ctx = gender ?? 'neutral'
  useFundo('boasvindas')

  // "Bem-vinda, Marina." → nome em itálico no gradiente
  const titulo = t('welcome.title', { name, context: ctx })
  const iNome = name ? titulo.lastIndexOf(name) : -1

  return (
    <div className="relative h-full flex flex-col items-center px-[26px] pb-[30px] overflow-hidden pt-[env(safe-area-inset-top,0px)]">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        {ESTRELAS.map((e, i) => (
          <span key={i} className="absolute top-0" style={{ left: `${(e.left / 390) * 100}%`, color: e.cor, fontSize: e.tam, animation: `alma-cair ${e.dur}s linear infinite ${e.atraso}s` }}>{e.s}</span>
        ))}
      </div>

      <div className="flex-grow" />
      {/* Número grande dourado dentro de órbita, com ondas saindo */}
      <div className="alma-r1 relative flex items-center justify-center" aria-hidden="true" style={{ width: 220, height: 220 }}>
        <span className="absolute rounded-full" style={{ inset: 30, border: '1.5px solid rgba(242,200,121,.7)', animation: 'alma-onda 3s ease-out infinite' }} />
        <span className="absolute rounded-full" style={{ inset: 30, border: '1.5px solid rgba(226,106,160,.6)', animation: 'alma-onda 3s ease-out infinite 1.5s' }} />
        <svg width="220" height="220" viewBox="0 0 220 220" className="absolute inset-0" style={{ animation: 'alma-spin 26s linear infinite' }}>
          <circle cx="110" cy="110" r="106" fill="none" stroke="#F2C879" strokeOpacity=".45" strokeDasharray="2 7" />
          <circle cx="110" cy="4" r="3.5" fill="#FFE3A8" /><circle cx="216" cy="110" r="2.5" fill="#3FD6C2" />
        </svg>
        <svg width="170" height="170" viewBox="0 0 170 170" className="absolute" style={{ left: 25, top: 25, animation: 'alma-spinr 16s linear infinite' }}>
          <defs>
            <linearGradient id="alma-bv-oa" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#FFE3A8" /><stop offset=".5" stopColor="#E26AA0" /><stop offset="1" stopColor="#7C5CFF" stopOpacity="0" />
            </linearGradient>
          </defs>
          <circle cx="85" cy="85" r="81" fill="none" stroke="url(#alma-bv-oa)" strokeWidth="2" strokeLinecap="round" strokeDasharray="300 300" />
        </svg>
        <span className="font-serif text-[92px] font-medium leading-none" style={{ background: 'linear-gradient(180deg, #FFF0CC, #E7B865 55%, #F49AC1)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>09</span>
      </div>

      <span className="alma-r2 mt-1.5 text-[12px] tracking-[5px] uppercase text-gold">{t('welcome.label', { context: ctx })}</span>
      <h1 className="alma-r2 alma-display mt-3.5 text-center text-[38px] leading-[1.05]">
        {iNome >= 0 ? (
          <>{titulo.slice(0, iNome)}<span className="alma-grad-text">{titulo.slice(iNome)}</span></>
        ) : titulo}
      </h1>
      <p className="alma-r2 mt-3.5 text-center text-[16px] leading-[1.55] text-text-secondary">
        {t('welcome.subtitle')}<br />{t('welcome.subtitleSub')}
      </p>
      <div style={{ flexGrow: 1.2 }} />

      <button type="button" className="alma-btn alma-r3" onClick={onReadNow}>
        <span>{t('welcome.readNow')}</span>
      </button>
      <button type="button" className="alma-btn-secondary alma-r3 w-full mt-3" style={{ height: 52 }} onClick={onSetupPush}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F2D9A6" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
        {t('welcome.setupPush')}
      </button>
      <p className="alma-r3 mt-3.5 text-center text-[12.5px] text-[#8E89AE]">{t('welcome.auroraNote')}</p>
    </div>
  )
}
