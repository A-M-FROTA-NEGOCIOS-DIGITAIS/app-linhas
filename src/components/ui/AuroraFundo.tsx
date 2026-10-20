import { useEffect, useRef } from 'react'
import { create } from 'zustand'

/**
 * Fundo noturno com aurora: manchas de cor em deriva, estrelas e, no splash, estrela
 * cadente e linhas da mão se desenhando. Montado UMA vez (App) atrás de tudo; cada tela
 * só escolhe a variante com useFundo('hoje'), e as manchas mudam de lugar sem reiniciar.
 *
 * Posições e cores de cada variante vêm das referências (app/reference/L01…L14).
 * Parallax: até ±18px no sentido oposto ao ponteiro, com requestAnimationFrame.
 * Com prefers-reduced-motion nada se mexe (alma-tokens.css) e o parallax nem liga.
 */

export type VarianteFundo =
  | 'splash' | 'onboarding' | 'login' | 'perfil' | 'pergunta' | 'scan' | 'revelacao'
  | 'paywall' | 'boasvindas' | 'hoje' | 'leituras' | 'aurora' | 'estante' | 'voce'

type Cor = 'violeta' | 'rosa' | 'agua'
type Mancha = { cor: Cor; tam: number; pos: React.CSSProperties; op: number }

const RGB: Record<Cor, string> = { violeta: '124,92,255', rosa: '226,106,160', agua: '63,214,194' }
const ALFA: Record<Cor, number> = { violeta: 0.85, rosa: 0.75, agua: 0.55 }
const BLUR: Record<Cor, number> = { violeta: 30, rosa: 30, agua: 34 }

const VARIANTES: Record<VarianteFundo, Mancha[]> = {
  splash: [
    { cor: 'violeta', tam: 460, pos: { left: -140, top: 120 }, op: 0.65 },
    { cor: 'rosa', tam: 400, pos: { right: -130, top: 260 }, op: 0.55 },
    { cor: 'agua', tam: 460, pos: { left: 0, bottom: -150 }, op: 0.5 },
  ],
  onboarding: [
    { cor: 'violeta', tam: 440, pos: { left: -80, top: 80 }, op: 0.6 },
    { cor: 'agua', tam: 400, pos: { right: -100, top: 380 }, op: 0.45 },
  ],
  login: [
    { cor: 'rosa', tam: 420, pos: { right: -120, top: -40 }, op: 0.5 },
    { cor: 'violeta', tam: 440, pos: { left: -120, top: 420 }, op: 0.55 },
  ],
  perfil: [
    { cor: 'violeta', tam: 420, pos: { left: -140, top: -30 }, op: 0.55 },
    { cor: 'agua', tam: 420, pos: { right: -120, bottom: -80 }, op: 0.45 },
  ],
  pergunta: [
    { cor: 'rosa', tam: 420, pos: { right: -150, top: -50 }, op: 0.5 },
    { cor: 'violeta', tam: 460, pos: { left: -160, top: 360 }, op: 0.55 },
  ],
  scan: [{ cor: 'violeta', tam: 480, pos: { left: -60, top: 200 }, op: 0.6 }],
  revelacao: [
    { cor: 'violeta', tam: 440, pos: { left: -60, top: -40 }, op: 0.65 },
    { cor: 'rosa', tam: 380, pos: { right: -100, top: 360 }, op: 0.5 },
    { cor: 'agua', tam: 420, pos: { left: -80, bottom: -140 }, op: 0.45 },
  ],
  paywall: [
    { cor: 'violeta', tam: 440, pos: { left: -100, top: 0 }, op: 0.6 },
    { cor: 'rosa', tam: 400, pos: { right: -60, top: 440 }, op: 0.5 },
    { cor: 'agua', tam: 440, pos: { left: -40, bottom: -80 }, op: 0.45 },
  ],
  boasvindas: [
    { cor: 'violeta', tam: 460, pos: { left: -40, top: 40 }, op: 0.6 },
    { cor: 'rosa', tam: 380, pos: { right: -80, top: 300 }, op: 0.5 },
    { cor: 'agua', tam: 420, pos: { left: -60, bottom: -120 }, op: 0.45 },
  ],
  hoje: [
    { cor: 'violeta', tam: 440, pos: { right: -80, top: -40 }, op: 0.6 },
    { cor: 'rosa', tam: 400, pos: { left: -120, top: 420 }, op: 0.45 },
    { cor: 'agua', tam: 440, pos: { right: -60, bottom: -60 }, op: 0.45 },
  ],
  leituras: [
    { cor: 'rosa', tam: 420, pos: { left: -120, top: -30 }, op: 0.45 },
    { cor: 'violeta', tam: 460, pos: { right: -140, top: 380 }, op: 0.55 },
  ],
  aurora: [
    { cor: 'violeta', tam: 440, pos: { left: -150, top: 100 }, op: 0.55 },
    { cor: 'rosa', tam: 400, pos: { right: -150, top: 420 }, op: 0.45 },
  ],
  estante: [
    { cor: 'rosa', tam: 440, pos: { right: -80, top: -20 }, op: 0.5 },
    { cor: 'violeta', tam: 460, pos: { left: -120, top: 480 }, op: 0.55 },
  ],
  voce: [
    { cor: 'violeta', tam: 460, pos: { left: -60, top: -80 }, op: 0.6 },
    { cor: 'agua', tam: 420, pos: { right: -120, top: 520 }, op: 0.45 },
  ],
}

const useFundoStore = create<{ variante: VarianteFundo; set: (v: VarianteFundo) => void }>((set) => ({
  variante: 'splash',
  set: (variante) => set({ variante }),
}))

/** A tela escolhe a variante do fundo enquanto estiver montada. */
export function useFundo(variante: VarianteFundo) {
  const set = useFundoStore((s) => s.set)
  useEffect(() => {
    set(variante)
  }, [variante, set])
}

const ANIM = ['alma-bg__blob--a', 'alma-bg__blob--b', 'alma-bg__blob--c']

export function AuroraFundo() {
  const variante = useFundoStore((s) => s.variante)
  const camada = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = camada.current
    if (!el || typeof window.matchMedia !== 'function') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let quadro = 0
    let x = 0
    let y = 0
    const aplicar = () => {
      quadro = 0
      el.style.transform = `translate(${x}px, ${y}px)`
    }
    const mover = (e: PointerEvent) => {
      x = Math.round((e.clientX / window.innerWidth - 0.5) * -36)
      y = Math.round((e.clientY / window.innerHeight - 0.5) * -36)
      if (!quadro) quadro = requestAnimationFrame(aplicar)
    }
    window.addEventListener('pointermove', mover, { passive: true })
    return () => {
      window.removeEventListener('pointermove', mover)
      if (quadro) cancelAnimationFrame(quadro)
    }
  }, [])

  const manchas = VARIANTES[variante]

  return (
    <div className="alma-bg" aria-hidden="true">
      <div ref={camada} className="alma-bg__layer">
        {/* sempre 3 manchas montadas: a que sobra some, e a troca de tela não reinicia a deriva */}
        {[0, 1, 2].map((i) => {
          const m = manchas[i]
          const cor = m?.cor ?? 'violeta'
          return (
            <div
              key={i}
              className={`alma-bg__blob ${ANIM[i]}`}
              style={{
                width: m?.tam ?? 400,
                height: m?.tam ?? 400,
                ...(m?.pos ?? { left: 0, top: 0 }),
                background: `radial-gradient(circle, rgba(${RGB[cor]},${ALFA[cor]}) 0%, rgba(${RGB[cor]},0) 65%)`,
                filter: `blur(${BLUR[cor]}px)`,
                opacity: m ? m.op : 0,
              }}
            />
          )
        })}
      </div>
      <div className="alma-stars1" />
      <div className="alma-stars2" />
      {variante === 'splash' && (
        <>
          <div className="alma-shooting-star" />
          <svg className="alma-bg__palma" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="alma-palma-linha" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#FFD98E" stopOpacity="0" />
                <stop offset=".5" stopColor="#F49AC1" />
                <stop offset="1" stopColor="#9C86FF" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M-10 260 C 90 220, 200 300, 400 230" fill="none" stroke="url(#alma-palma-linha)" strokeWidth="1.5" />
            <path d="M-10 560 C 120 520, 260 610, 400 540" fill="none" stroke="url(#alma-palma-linha)" strokeWidth="1.5" />
            <path d="M60 -10 C 40 200, 140 420, 120 860" fill="none" stroke="url(#alma-palma-linha)" strokeWidth="1.2" />
          </svg>
        </>
      )}
    </div>
  )
}
