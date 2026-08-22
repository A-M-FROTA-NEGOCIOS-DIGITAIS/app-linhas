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
  // O Despertar e assinatura: quem manda no status e a tabela assinaturas, nao
  // a de compras. A Estante resolve isso antes de chamar esta funcao.
  if (!item.comprado) return item.checkout_url ? 'Comprar' : 'Em breve'
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
    if (item.produto === 'despertar') {
      onOpenDespertar()
      return
    }
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
      <p style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
        Sua Estante
      </p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', lineHeight: 1.5, marginTop: 6, marginBottom: 16 }}>
        Cada peça parte da mesma mão — a sua. O que você já tem abre aqui; o resto espera.
      </p>

      <div className="flex flex-col gap-2">
        {itens.map((item) => {
          const ehDespertar = item.produto === 'despertar'
          // A assinatura, nao a compra, diz se o Despertar esta ativo.
          const ativo = ehDespertar ? !!assinatura : item.comprado
          const vendavel = !ativo && !!item.checkout_url
          const clicavel = ehDespertar || ativo || vendavel
          const destacado = ehDespertar ? !!assinatura : item.pronto || item.precisaAcao || vendavel
          const preco = precoFormatado(item.preco_brl)
          const status = ehDespertar ? (assinatura ? 'Ativo' : 'Ver') : labelStatus(item)

          return (
            <button
              key={item.produto}
              onClick={() => handleClick(item)}
              disabled={!clicavel}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 6,
                padding: '14px 16px', borderRadius: 8, width: '100%', textAlign: 'left',
                border: `1px solid ${destacado ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
                background: (ehDespertar ? !!assinatura : item.pronto) ? 'rgba(201,169,97,0.06)' : 'var(--bg-surface)',
                // Sem link de checkout o item segue legivel: ela precisa saber o
                // que e o produto mesmo antes de poder compra-lo.
                opacity: clicavel ? 1 : 0.75,
                cursor: clicavel ? 'pointer' : 'default',
              }}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 min-w-0">
                  {item.pronto && !ehDespertar && <CheckIcon />}
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-primary)' }}>
                    {item.nome}
                  </span>
                  {preco && !ativo && (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', flexShrink: 0 }}>
                      {preco}
                    </span>
                  )}
                </span>
                <span style={{ fontSize: 12, color: destacado ? 'var(--accent-gold)' : 'var(--text-muted)', fontFamily: 'var(--font-sans)', flexShrink: 0 }}>
                  {status}
                </span>
              </span>

              {item.descricao && (
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, lineHeight: 1.55, color: 'var(--text-secondary)' }}>
                  {item.descricao}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export { labelStatus }
