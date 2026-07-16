import type { Reading } from '@/types'

interface Props {
  reading: Reading
  onBack: () => void
}

const BackIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M11 5l-7 7 7 7" />
  </svg>
)

export function SentencaView({ reading, onBack }: Props) {
  const handleDownload = () => {
    if (!reading.imagem_url) return
    const a = document.createElement('a')
    a.href = reading.imagem_url
    a.download = 'minha-sentenca-alma.svg'
    a.click()
  }

  return (
    <div className="h-full flex flex-col px-6 pt-12 pb-8">
      <button onClick={onBack} className="text-text-secondary active:text-text-primary transition-colors mb-6 self-start">
        <BackIcon />
      </button>

      <p style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent-gold)', fontFamily: 'var(--font-sans)', marginBottom: 8 }}>
        A Sentença
      </p>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 300, color: 'var(--text-primary)', marginBottom: 24 }}>
        Sua leitura em uma frase.
      </h1>

      <div className="flex-1 flex items-center justify-center">
        {reading.imagem_url ? (
          <img
            src={reading.imagem_url}
            alt="Sua Sentença"
            style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: 12, border: '1px solid var(--border-subtle)' }}
          />
        ) : (
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontStyle: 'italic', color: 'var(--accent-gold)', textAlign: 'center' }}>
            {reading.full_content}
          </p>
        )}
      </div>

      {reading.imagem_url && (
        <button
          onClick={handleDownload}
          style={{
            marginTop: 24, padding: '12px 24px', borderRadius: 6,
            border: '1px solid var(--accent-gold)', color: 'var(--accent-gold)',
            fontFamily: 'var(--font-sans)', fontSize: 14, background: 'transparent',
          }}
        >
          Baixar para compartilhar
        </button>
      )}
    </div>
  )
}
