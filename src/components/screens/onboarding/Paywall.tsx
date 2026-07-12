import { Button, Eyebrow, Hairline } from '@/components/ui'
import { track, Events } from '@/lib/analytics'

interface Props {
  preview: string
  name: string
  onSkip?: () => void
}

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A961" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12l5 5L20 6" />
  </svg>
)

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 1 1 8 0v4" />
  </svg>
)

const FEATURES = [
  'Leitura completa com 6 capítulos personalizados',
  'Identificação da sua Marca Adormecida no amor',
  'Análise das 3 marcas: Coração, Mente e Vida',
  'O padrão que você repete — e como reconhecê-lo',
  'Acesso vitalício à sua leitura no app',
]

const CHECKOUT_URL = import.meta.env.VITE_BLUEN_CHECKOUT_URL ?? '#'

export function Paywall({ preview, name, onSkip }: Props) {
  const handleComprar = () => {
    track(Events.TRIAL_STARTED, { product: 'leitura_core', amount_cents: 4700 })
    window.location.href = CHECKOUT_URL
  }

  return (
    <div className="h-full flex flex-col">
      {/* Preview da leitura */}
      <div className="relative px-6 pt-10 pb-2" style={{ maxHeight: '34%' }}>
        <Eyebrow className="mb-4">Sua leitura foi gerada</Eyebrow>
        <div className="relative overflow-hidden" style={{ maxHeight: 180 }}>
          <p className="reading-text text-sm leading-relaxed line-clamp-6">
            {preview || `${name}, sua palma revela um padrão que você provavelmente já sentiu, mas nunca soube nomear...`}
          </p>
          <div
            className="absolute bottom-0 left-0 right-0 h-24"
            style={{ background: 'linear-gradient(transparent, var(--bg-primary))' }}
          />
        </div>
        <div className="flex items-center gap-2 mt-2 text-text-secondary text-xs">
          <LockIcon />
          <span>Leitura completa bloqueada</span>
        </div>
      </div>

      <Hairline className="mx-6 mt-2" />

      <div className="flex-1 flex flex-col px-6 pt-4 pb-6 scroll-area gap-4">
        {/* Título da oferta */}
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1.3 }}>
            Leitura Completa<br />
            <em style={{ color: 'var(--accent-gold)', fontStyle: 'italic' }}>por Madame Aurora</em>
          </h2>
        </div>

        {/* Features */}
        <div className="flex flex-col gap-2">
          {FEATURES.map((f) => (
            <div key={f} className="flex items-start gap-3 text-sm text-text-primary">
              <span className="mt-0.5 flex-shrink-0"><CheckIcon /></span>
              {f}
            </div>
          ))}
        </div>

        <Hairline />

        {/* Preço */}
        <div
          style={{
            padding: '16px', borderRadius: 8,
            border: '1px solid var(--accent-gold)',
            background: 'rgba(201,169,97,0.06)',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>
                Pagamento único
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Acesso vitalício, sem assinatura
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, color: 'var(--accent-gold)', lineHeight: 1 }}>
                R$47
              </p>
            </div>
          </div>
        </div>

        <Button variant="primary" fullWidth onClick={handleComprar}>
          Revelar minha leitura completa
        </Button>

        <p className="text-xs text-text-muted text-center">
          Pagamento seguro • Acesso imediato após confirmação
        </p>

        {onSkip && (
          <button
            className="text-xs text-text-muted underline underline-offset-2 text-center"
            onClick={onSkip}
          >
            Talvez depois
          </button>
        )}
      </div>
    </div>
  )
}
