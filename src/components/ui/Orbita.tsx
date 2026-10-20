import { AuroraRetrato } from './Aurora'

/**
 * Espera em órbita (padrão do "Processando" do quiz): três anéis girando em velocidades
 * diferentes e o retrato da Madame Aurora no núcleo, com ondas de voz.
 * Usado na leitura da palma e nas telas de geração.
 */
export function OrbitaAurora({ tamanho = 300 }: { tamanho?: number }) {
  const k = tamanho / 300
  return (
    <div aria-hidden="true" className="relative" style={{ width: tamanho, height: tamanho }}>
      <svg className="absolute inset-0" width={tamanho} height={tamanho} viewBox="0 0 300 300" style={{ animation: 'alma-spin 60s linear infinite' }}>
        <circle cx="150" cy="150" r="146" fill="none" stroke="#F2C879" strokeOpacity=".35" strokeDasharray="1 9" />
        <g fill="#F2C879" fontFamily="Cormorant Garamond" fontSize="13" textAnchor="middle">
          <text x="150" y="22">✦</text><text x="278" y="154">☾</text><text x="150" y="288">✧</text><text x="22" y="154">✦</text>
        </g>
      </svg>
      <svg className="absolute" width={240 * k} height={240 * k} viewBox="0 0 240 240" style={{ left: 30 * k, top: 30 * k, animation: 'alma-spin 9s linear infinite' }}>
        <defs>
          <linearGradient id="alma-orbita-og" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFE3A8" /><stop offset=".5" stopColor="#E26AA0" /><stop offset="1" stopColor="#7C5CFF" stopOpacity="0" />
          </linearGradient>
        </defs>
        <circle cx="120" cy="120" r="114" fill="none" stroke="url(#alma-orbita-og)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="420 300" />
        <circle cx="120" cy="6" r="5" fill="#FFF3D6" />
      </svg>
      <svg className="absolute" width={180 * k} height={180 * k} viewBox="0 0 180 180" style={{ left: 60 * k, top: 60 * k, animation: 'alma-spinr 14s linear infinite' }}>
        <circle cx="90" cy="90" r="84" fill="none" stroke="#3FD6C2" strokeOpacity=".6" strokeWidth="1.5" strokeDasharray="60 40" />
        <circle cx="174" cy="90" r="4" fill="#3FD6C2" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <AuroraRetrato tamanho={Math.round(104 * k)} aneis={false} falando />
      </div>
    </div>
  )
}

/** Lista de etapas: feito (verde-água com check), atual (dourado piscando), pendente. */
export function EtapasEspera({ etapas, atual }: { etapas: string[]; atual: number }) {
  return (
    <div className="flex flex-col gap-3.5 w-full">
      {etapas.map((texto, i) => {
        const feito = i < atual
        const agora = i === atual
        return (
          <div key={i} className="flex items-center gap-3 text-[15px]" style={{ color: feito ? '#D4CFE6' : agora ? '#FBF4E4' : '#8E89AE', fontWeight: agora ? 500 : 400 }}>
            {feito ? (
              <span className="flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0" style={{ background: '#3FD6C2' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#05271F" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
              </span>
            ) : agora ? (
              <span className="flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0" style={{ border: '2px solid #F2C879', animation: 'alma-blink 1.4s ease-in-out infinite' }}>
                <span className="w-2 h-2 rounded-full" style={{ background: '#F2C879' }} />
              </span>
            ) : (
              <span className="w-6 h-6 rounded-full flex-shrink-0" style={{ border: '1.5px solid rgba(255,255,255,.25)' }} />
            )}
            {texto.replace(/…$/, '')}
          </div>
        )
      })}
    </div>
  )
}
