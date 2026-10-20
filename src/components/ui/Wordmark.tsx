/** Logo da Alma: lua crescente dourada + "alma" em Cormorant, o "l" em itálico dourado→rosa. */
export function Lua({ tamanho = 38, className }: { tamanho?: number; className?: string }) {
  return (
    <svg className={className} width={tamanho} height={tamanho} viewBox="0 0 24 24" aria-hidden="true"
      style={{ animation: 'alma-lua-brilho 4s ease-in-out infinite' }}>
      <defs>
        <linearGradient id="alma-lua" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFE3A8" />
          <stop offset=".6" stopColor="#E7B865" />
          <stop offset="1" stopColor="#F49AC1" />
        </linearGradient>
      </defs>
      <path d="M15.5 3.2a8.8 8.8 0 1 0 5.3 13.6A7.2 7.2 0 0 1 15.5 3.2z" fill="url(#alma-lua)" />
    </svg>
  )
}

export function Wordmark({ tamanho = 84 }: { tamanho?: number }) {
  return (
    <div
      role="img"
      aria-label="Alma"
      style={{
        fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: tamanho, lineHeight: 1,
        letterSpacing: tamanho >= 60 ? -1 : 0, color: 'var(--cream)',
      }}
    >
      a
      <span
        style={{
          fontStyle: 'italic',
          background: 'linear-gradient(180deg, #FFE3A8, #E7B865 45%, #F49AC1)',
          WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
        }}
      >
        l
      </span>
      ma
    </div>
  )
}
