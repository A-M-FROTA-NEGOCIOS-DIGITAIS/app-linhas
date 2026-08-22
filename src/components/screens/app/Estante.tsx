import type { Assinatura, ItemBiblioteca, Reading } from '@/types'

interface Props {
  itens: ItemBiblioteca[]
  assinatura: Assinatura | null
  onOpenReading: (reading: Reading) => void
  onOpenDespertar: () => void
  onPreencherTerceiro: (produto: 'compatibilidade' | 'quem_ama') => void
  onEscanearOutraMao: () => void
  onRecarregar: () => void
}

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A961" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12l5 5L20 6" />
  </svg>
)

function labelStatus(item: ItemBiblioteca): string {
  if (!item.comprado) return item.checkout_url ? 'Comprar' : 'Indisponível'
  if (item.produto === 'audio') return item.pronto ? 'Ouça na leitura ↑' : 'Preparando…'
  if (item.pronto) return 'Ver'
  if (item.produto === 'compatibilidade' || item.produto === 'quem_ama') return 'Preencher dados →'
  if (item.produto === 'outra_mao') return 'Escanear mão →'
  return 'Preparando…'
}

function precoFormatado(preco?: number): string | null {
  if (preco == null) return null
  return `R$ ${preco.toFixed(0)}`
}

export function Estante({
  itens, assinatura, onOpenReading, onOpenDespertar,
  onPreencherTerceiro, onEscanearOutraMao, onRecarregar,
}: Props) {
  const handleClick = (item: ItemBiblioteca) => {
    if (!item.comprado) {
      if (item.checkout_url) window.open(item.checkout_url, '_blank', 'noopener')
      return
    }
    if (item.produto === 'audio') return
    if (item.pronto) {
      if (item.reading) onOpenReading(item.reading)
      return
    }
    if (item.produto === 'compatibilidade' || item.produto === 'quem_ama') {
      onPreencherTerceiro(item.produto)
      return
    }
    if (item.produto === 'outra_mao') {
      onEscanearOutraMao()
      return
    }
    // Mestra/Ritual/12meses/Downsell/Sentenca geram sozinhos apos a compra.
    // Se ainda nao ficou pronto, so recarrega para checar de novo.
    onRecarregar()
  }

  return (
    <div className="h-full scroll-area px-6 pt-12 pb-28">
      <p style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', marginBottom: 12 }}>
        Sua Estante
      </p>

      <div className="flex flex-col gap-2">
        <button
          onClick={onOpenDespertar}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', borderRadius: 8, width: '100%', textAlign: 'left',
            border: `1px solid ${assinatura ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
            background: assinatura ? 'rgba(201,169,97,0.06)' : 'var(--bg-surface)',
          }}
        >
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-primary)' }}>O Despertar</span>
          <span style={{ fontSize: 12, color: assinatura ? 'var(--accent-gold)' : 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
            {assinatura ? 'Ativo' : 'Ver'}
          </span>
        </button>

        {itens.map((item) => {
          const vendavel = !item.comprado && !!item.checkout_url
          const destacado = item.pronto || item.precisaAcao || vendavel
          const preco = precoFormatado(item.preco_brl)
          return (
            <button
              key={item.produto}
              onClick={() => handleClick(item)}
              disabled={!item.comprado && !vendavel}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', borderRadius: 8, width: '100%', textAlign: 'left',
                border: `1px solid ${destacado ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
                background: item.pronto ? 'rgba(201,169,97,0.06)' : 'var(--bg-surface)',
                opacity: item.comprado || vendavel ? 1 : 0.4,
                cursor: item.comprado || vendavel ? 'pointer' : 'default',
              }}
            >
              <span className="flex items-center gap-2">
                {item.pronto && <CheckIcon />}
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-primary)' }}>{item.nome}</span>
                {vendavel && preco && (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>{preco}</span>
                )}
              </span>
              <span style={{ fontSize: 12, color: destacado ? 'var(--accent-gold)' : 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
                {labelStatus(item)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export { labelStatus }
