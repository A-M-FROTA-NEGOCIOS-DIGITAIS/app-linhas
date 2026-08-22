/**
 * O rosto da Madame Aurora.
 *
 * Ela e a persona que fala com a cliente o app inteiro, mas ate aqui existia
 * so como a letra "A" num circulo. Ver o rosto muda o registro da conversa:
 * a leitura passa a ter alguem por tras dela.
 *
 * Os arquivos ficam em /aurora, ja recortados e em webp (31 e 34 KB).
 */

interface AvatarProps {
  /** Diametro em pixels. */
  tamanho?: number
  /** Anel de destaque, para quando ela e o assunto da tela e nao so o emissor. */
  destacado?: boolean
  className?: string
}

export function AuroraAvatar({ tamanho = 32, destacado = false, className }: AvatarProps) {
  return (
    <img
      src="/aurora/avatar.webp"
      alt="Madame Aurora"
      width={tamanho}
      height={tamanho}
      loading="lazy"
      decoding="async"
      className={className}
      style={{
        width: tamanho,
        height: tamanho,
        borderRadius: '50%',
        objectFit: 'cover',
        flexShrink: 0,
        border: `1px solid ${destacado ? 'var(--accent)' : 'var(--border-subtle)'}`,
        boxShadow: destacado ? '0 0 0 4px rgba(124, 156, 228, 0.10)' : 'none',
      }}
    />
  )
}

interface RetratoProps {
  /** Diametro do circulo em pixels. */
  tamanho?: number
}

/**
 * Retrato grande em circulo, com um halo suave atras — o tratamento do mockup.
 * Para telas onde ela se apresenta: o vazio do chat, a espera da geracao.
 */
export function AuroraRetrato({ tamanho = 140 }: RetratoProps) {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: tamanho, height: tamanho }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: -tamanho * 0.22,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124, 156, 228, 0.18), transparent 68%)',
        }}
      />
      <img
        src="/aurora/retrato.webp"
        alt="Madame Aurora"
        decoding="async"
        style={{
          width: tamanho,
          height: tamanho,
          borderRadius: '50%',
          objectFit: 'cover',
          objectPosition: '50% 22%',
          border: '1px solid var(--border-medium)',
          position: 'relative',
        }}
      />
    </div>
  )
}
