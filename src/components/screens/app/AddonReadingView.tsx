import type { Reading } from '@/types'

interface Props {
  reading: Reading
  titulo: string
  onBack: () => void
}

const BackIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M11 5l-7 7 7 7" />
  </svg>
)

export function AddonReadingView({ reading, titulo, onBack }: Props) {
  const capitulos = reading.capitulos ?? []

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto scroll-area">
        <div className="px-6 pt-12 pb-6">
          <button onClick={onBack} className="text-text-secondary active:text-text-primary transition-colors mb-6">
            <BackIcon />
          </button>
          <p style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent-gold)', fontFamily: 'var(--font-sans)', marginBottom: 8 }}>
            Madame Aurora
          </p>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1.25 }}>
            {titulo}
          </h1>
        </div>

        <div className="px-6 flex flex-col gap-10 pb-12">
          {capitulos.map((cap, i) => (
            <div key={cap.numero ?? i}>
              {capitulos.length > 1 && (
                <div className="flex items-center gap-3 mb-4">
                  <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--accent-gold)', opacity: 0.7 }}>
                    {i + 1}
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
                </div>
              )}
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 19, fontWeight: 300, fontStyle: 'italic', color: 'var(--text-primary)', marginBottom: 14 }}>
                {cap.titulo}
              </h2>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                {cap.conteudo.split('\n\n').map((para, j) => (
                  <p key={j} style={{ marginBottom: 14, whiteSpace: 'pre-line' }}>{para}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
