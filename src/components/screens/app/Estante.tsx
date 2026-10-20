import type { Assinatura, ItemBiblioteca, Reading } from '@/types'
import { useFundo } from '@/components/ui/AuroraFundo'

interface Props {
  itens: ItemBiblioteca[]
  assinatura: Assinatura | null
  onOpenReading: (reading: Reading) => void
  onOpenDespertar: () => void
  onPreencherTerceiro: (produto: 'compatibilidade' | 'quem_ama') => void
  onEscanearOutraMao: () => void
  /** O audio nao e uma leitura propria: o player vive dentro da Leitura Completa. */
  onAbrirLeituraCore: () => void
  onRecarregar: () => void
}

// Ícone e cores do tile de cada produto (referência L13-Estante). Produto sem entrada
// aqui usa o padrão; preço, nome e descrição vêm sempre do catálogo (produtos_catalogo).
const VISUAL: Record<string, { glifo: string; c1: string; c2: string }> = {
  quem_ama: { glifo: '♡', c1: '#E26AA0', c2: '#F49AC1' },
  '12meses': { glifo: '☾', c1: '#7C5CFF', c2: '#9C86FF' },
  compatibilidade: { glifo: '∞', c1: '#F49AC1', c2: '#7C5CFF' },
  downsell: { glifo: '✦', c1: '#E7B865', c2: '#E26AA0' },
  audio: { glifo: '♪', c1: '#3FD6C2', c2: '#7C5CFF' },
  outra_mao: { glifo: '✋︎', c1: '#E7B865', c2: '#7C5CFF' },
  ritual: { glifo: '◈', c1: '#9C86FF', c2: '#E26AA0' },
  sentenca: { glifo: '❝', c1: '#F2C879', c2: '#C98F35' },
}
const VISUAL_PADRAO = { glifo: '✦', c1: '#9C86FF', c2: '#7C5CFF' }
const CINZA = { c1: '#5A5F8C', c2: '#2A2E5E' }

/** Uma linha da descrição atual (a primeira frase). */
const primeiraFrase = (texto?: string) => (texto ?? '').split(/(?<=[.!?])\s/)[0]

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2A1A05" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12l5 5L20 6" />
  </svg>
)

function labelStatus(item: ItemBiblioteca): string {
  // O Despertar e assinatura: quem manda no status e a tabela assinaturas, nao
  // a de compras. A Estante resolve isso antes de chamar esta funcao.
  if (!item.comprado) return item.checkout_url ? 'Comprar' : 'Em breve'
  if (item.produto === 'audio') return item.pronto ? 'Ouvir →' : 'Preparando…'
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
  onPreencherTerceiro, onEscanearOutraMao, onAbrirLeituraCore, onRecarregar,
}: Props) {
  useFundo('estante')
  const handleClick = (item: ItemBiblioteca) => {
    if (item.produto === 'despertar') {
      onOpenDespertar()
      return
    }
    if (!item.comprado) {
      if (item.checkout_url) window.open(item.checkout_url, '_blank', 'noopener')
      return
    }
    // O audio fica anexado a leitura core (readings.audio_url), nao como leitura
    // separada. Antes o clique caia aqui e nao fazia nada: o item parecia
    // clicavel, o rotulo dizia "ouca" e tocar nele nao produzia efeito nenhum.
    if (item.produto === 'audio') {
      if (item.pronto) onAbrirLeituraCore()
      return
    }
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

  // Estado de cada item, igual para destaque, grade e Despertar.
  const estado = (item: ItemBiblioteca) => {
    const ehDespertar = item.produto === 'despertar'
    // A assinatura, nao a compra, diz se o Despertar esta ativo.
    const ativo = ehDespertar ? !!assinatura : item.comprado
    const vendavel = !ativo && !!item.checkout_url
    const clicavel = ehDespertar || ativo || vendavel
    const status = ehDespertar ? (assinatura ? 'Ativo' : 'Ver') : labelStatus(item)
    return { ativo, vendavel, clicavel, status, preco: precoFormatado(item.preco_brl) }
  }

  const mestra = itens.find((i) => i.produto === 'mestra')
  const despertar = itens.find((i) => i.produto === 'despertar')
  const grade = itens.filter((i) => i !== mestra && i !== despertar)

  return (
    <div className="h-full scroll-area px-[18px] pt-[calc(30px+env(safe-area-inset-top,0px))] alma-com-tabbar">
      <span className="alma-r1 block text-[12px] tracking-[2.5px] uppercase text-text-muted">Sua Estante</span>
      <h1 className="alma-r1 alma-display mt-2.5 text-[34px] leading-[1.05]">
        Cada peça parte da mesma mão — <span className="alma-grad-text">a sua.</span>
      </h1>
      <p className="alma-r1 mt-2 text-[14px] text-text-muted">O que você já tem abre aqui; o resto espera.</p>

      {/* Leitura Mestra em destaque, com borda aurora */}
      {mestra && (() => {
        const e = estado(mestra)
        return (
          <div className="alma-r2 alma-aurora-border mt-5" style={{ boxShadow: '0 20px 60px rgba(226,106,160,.25)' }}>
            <div className="relative overflow-hidden p-5 rounded-[25px]" style={{ background: 'linear-gradient(160deg, rgba(36,30,92,.97), rgba(12,16,49,.97))' }}>
              <svg aria-hidden="true" width="180" height="180" viewBox="0 0 180 180" className="absolute" style={{ right: -50, top: -50, opacity: 0.6, animation: 'alma-spin 40s linear infinite' }}>
                <circle cx="90" cy="90" r="80" fill="none" stroke="#F2C879" strokeOpacity=".5" strokeDasharray="2 6" />
                <circle cx="90" cy="10" r="4" fill="#FFE3A8" /><circle cx="20" cy="120" r="3" fill="#F49AC1" />
              </svg>
              <span className="inline-block px-3 py-[5px] rounded-pill text-[10.5px] tracking-[2px] font-semibold text-rose-text" style={{ background: 'linear-gradient(90deg, rgba(226,106,160,.3), rgba(124,92,255,.3))', border: '1px solid rgba(244,154,193,.5)' }}>
                DESTAQUE
              </span>
              <h2 className="alma-display mt-3 text-[30px]">{mestra.nome}</h2>
              {mestra.descricao && <p className="relative mt-2 text-[14px] leading-[1.5] text-text-secondary max-w-[280px]">{mestra.descricao}</p>}
              <div className="relative flex items-center justify-between mt-4 gap-3">
                {e.ativo ? (
                  mestra.pronto
                    ? <span className="flex items-center justify-center w-7 h-7 rounded-full" style={{ background: 'linear-gradient(135deg, #FFE3A8, #E7B865)' }}><CheckIcon /></span>
                    : <span />
                ) : e.preco ? (
                  <span className="font-serif text-[34px] font-semibold" style={{ background: 'linear-gradient(180deg, #FFF0CC, #E7B865 60%, #C98F35)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{e.preco}</span>
                ) : <span />}
                <button
                  type="button"
                  onClick={() => handleClick(mestra)}
                  disabled={!e.clicavel}
                  className="alma-btn !w-auto !h-[46px] px-5 text-[14px] disabled:opacity-60"
                >
                  <span>{e.status}</span>
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Demais produtos em grade de 2 colunas */}
      <div className="alma-r3 grid grid-cols-2 gap-3 mt-4">
        {grade.map((item) => {
          const e = estado(item)
          const v = VISUAL[item.produto] ?? VISUAL_PADRAO
          const cores = e.clicavel || e.preco ? v : { ...v, ...CINZA }
          return (
            <button
              key={item.produto}
              type="button"
              onClick={() => handleClick(item)}
              disabled={!e.clicavel}
              className="alma-card alma-card--link flex flex-col items-start text-left !p-3.5 min-h-[196px]"
              style={{ cursor: e.clicavel ? 'pointer' : 'default', borderColor: e.ativo ? 'rgba(242,200,121,.35)' : undefined }}
            >
              <span className="flex items-center justify-center w-[46px] h-[46px] rounded-[14px]" style={{ background: `linear-gradient(160deg, ${cores.c1}, ${cores.c2})`, boxShadow: `0 6px 18px ${cores.c1}44` }}>
                <span className="font-serif text-[24px] text-cream">{v.glifo}</span>
              </span>
              <span className="mt-3 font-serif text-[20px] leading-[1.1] text-cream">{item.nome}</span>
              <span className="mt-1.5 text-[12.5px] leading-[1.4] text-text-muted flex-grow">{primeiraFrase(item.descricao)}</span>
              {e.ativo ? (
                <span className="mt-2.5 flex items-center gap-1.5 text-[13px] font-semibold text-gold">
                  {item.pronto && <span className="flex items-center justify-center w-5 h-5 rounded-full" style={{ background: 'linear-gradient(135deg, #FFE3A8, #E7B865)' }}><CheckIcon /></span>}
                  {e.status}
                </span>
              ) : e.preco ? (
                <span className="mt-2.5 font-serif text-[22px] font-semibold text-gold">{e.preco}</span>
              ) : (
                <span className="mt-2.5 px-2.5 py-1 rounded-pill text-[11px] tracking-[1px] text-[#8E89AE]" style={{ background: 'rgba(255,255,255,.08)' }}>{e.status}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* O Despertar como faixa verde-água no fim */}
      {despertar && (() => {
        const e = estado(despertar)
        return (
          <button
            type="button"
            onClick={() => handleClick(despertar)}
            className="alma-r4 alma-card--link flex items-center gap-3.5 mt-3.5 p-4 rounded-[22px] text-left w-full"
            style={{ background: 'linear-gradient(135deg, rgba(63,214,194,.14), rgba(124,92,255,.14))', border: '1px solid rgba(63,214,194,.35)' }}
          >
            <span className="flex items-center justify-center w-[50px] h-[50px] rounded-2xl flex-shrink-0" style={{ background: 'linear-gradient(160deg, #3FD6C2, #7C5CFF)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5" /></svg>
            </span>
            <span className="flex-grow">
              <span className="block font-serif text-[21px] text-cream">{despertar.nome}</span>
              {despertar.descricao && <span className="block mt-0.5 text-[12.5px] leading-[1.4] text-text-muted">{primeiraFrase(despertar.descricao)}</span>}
            </span>
            <span className="text-[13px] font-semibold text-teal-text">{e.status}</span>
          </button>
        )
      })()}
    </div>
  )
}

export { labelStatus }
