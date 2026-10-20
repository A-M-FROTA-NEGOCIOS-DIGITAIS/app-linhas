/**
 * O rosto da Madame Aurora, no visual aurora: moldura em gradiente dourado→rosa→violeta,
 * halo pulsando e, nos tamanhos grandes, anel pontilhado dourado girando (alma-spin 40s)
 * e anel colorido girando ao contrário.
 *
 * Os arquivos ficam em /aurora, já recortados e em webp.
 */

interface AvatarProps {
  /** Diâmetro em pixels (36, 46, 50…). */
  tamanho?: number
  /** Halo pulsando, para quando ela é o assunto da tela e não só o emissor. */
  destacado?: boolean
  className?: string
}

/** Retrato pequeno (pergunta, chat, cartões): moldura em gradiente, sem anéis. */
export function AuroraAvatar({ tamanho = 36, destacado = false, className }: AvatarProps) {
  return (
    <div
      className={`alma-retrato__moldura ${destacado ? 'alma-retrato__moldura--halo' : ''} ${className ?? ''}`}
      style={{ width: tamanho, height: tamanho, padding: 2, flexShrink: 0 }}
    >
      <img
        src="/aurora/avatar.webp"
        alt="Madame Aurora"
        width={tamanho}
        height={tamanho}
        loading="lazy"
        decoding="async"
        className="alma-retrato__foto"
      />
    </div>
  )
}

interface RetratoProps {
  /** Diâmetro da foto em pixels (88, 112, 140…). */
  tamanho?: number
  /** Anéis girando em volta (padrão: sim). */
  aneis?: boolean
  /** Voz tocando / gerando: ondas saindo do retrato e halo mais rápido. */
  falando?: boolean
}

/**
 * Retrato grande, para telas onde ela se apresenta: revelação, vazio do chat, espera da
 * geração. O palco reserva espaço para os anéis (1,4× a foto).
 */
export function AuroraRetrato({ tamanho = 112, aneis = true, falando = false }: RetratoProps) {
  const palco = aneis ? Math.round(tamanho * 1.4) : tamanho + 6
  return (
    <div className="alma-retrato" style={{ width: palco, height: palco }}>
      {aneis && (
        <>
          <svg className="alma-retrato__anel" viewBox="0 0 210 210" aria-hidden="true">
            <circle cx="105" cy="105" r="100" fill="none" stroke="#F2C879" strokeOpacity=".55" strokeWidth="1" strokeDasharray="2 7" />
            <circle cx="105" cy="5" r="3.5" fill="#FFE3A8" />
            <circle cx="18" cy="155" r="2.5" fill="#E26AA0" />
            <circle cx="192" cy="150" r="2" fill="#3FD6C2" />
          </svg>
          <svg className="alma-retrato__anel alma-retrato__anel--cor" viewBox="0 0 184 184" aria-hidden="true">
            <defs>
              <linearGradient id="alma-anel-cor" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#7C5CFF" />
                <stop offset=".5" stopColor="#E26AA0" />
                <stop offset="1" stopColor="#3FD6C2" />
              </linearGradient>
            </defs>
            <circle cx="92" cy="92" r="88" fill="none" stroke="url(#alma-anel-cor)" strokeWidth="1.5" />
          </svg>
        </>
      )}
      {falando && (
        <>
          <span className="alma-retrato__onda" style={{ width: tamanho, height: tamanho }} aria-hidden="true" />
          <span className="alma-retrato__onda" style={{ width: tamanho, height: tamanho }} aria-hidden="true" />
        </>
      )}
      <div
        className="alma-retrato__moldura alma-retrato__moldura--halo"
        style={{ width: tamanho, height: tamanho, animationDuration: falando ? '2.2s' : undefined }}
      >
        <img src="/aurora/retrato.webp" alt="Madame Aurora" decoding="async" className="alma-retrato__foto" />
      </div>
    </div>
  )
}
