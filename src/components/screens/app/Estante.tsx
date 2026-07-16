import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Compra, Reading, Assinatura, ProdutoAlma } from '@/types'
import { PRODUTOS_ESTANTE } from '@/types'

interface Props {
  userId: string
  onOpenReading: (reading: Reading) => void
  onOpenDespertar: () => void
  onPreencherTerceiro: (produto: 'compatibilidade' | 'quem_ama') => void
  onEscanearOutraMao: () => void
}

interface ItemEstante {
  produto: ProdutoAlma
  nome: string
  comprado: boolean
  pronto: boolean
}

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A961" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12l5 5L20 6" />
  </svg>
)

export function Estante({ userId, onOpenReading, onOpenDespertar, onPreencherTerceiro, onEscanearOutraMao }: Props) {
  const [itens, setItens] = useState<ItemEstante[] | null>(null)
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null)
  const [readingsPorProduto, setReadingsPorProduto] = useState<Record<string, Reading>>({})

  useEffect(() => {
    carregar()
  }, [userId])

  const carregar = async () => {
    const [{ data: compras }, { data: readings }, { data: assinaturaData }] = await Promise.all([
      supabase.from('compras').select('*').eq('user_id', userId).eq('status', 'aprovado'),
      supabase.from('readings').select('*').eq('user_id', userId).eq('qualidade_aprovada', true),
      supabase.from('assinaturas').select('*').eq('user_id', userId).eq('status', 'ativa').maybeSingle(),
    ])

    const comprasSet = new Set((compras as Compra[] | null)?.map((c) => c.produto) ?? [])
    const readingsList = (readings as Reading[] | null) ?? []
    const readingsMap: Record<string, Reading> = {}
    for (const r of readingsList) if (r.produto) readingsMap[r.produto] = r
    setReadingsPorProduto(readingsMap)

    setItens(
      PRODUTOS_ESTANTE.map(({ produto, nome }) => ({
        produto,
        nome,
        comprado: comprasSet.has(produto),
        pronto: produto in readingsMap,
      })),
    )
    setAssinatura(assinaturaData as Assinatura | null)
  }

  const handleClick = (item: ItemEstante) => {
    if (!item.comprado) return
    if (item.pronto) {
      const reading = readingsPorProduto[item.produto]
      if (reading) onOpenReading(reading)
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
    // Mestra/Ritual/12meses/Downsell/Sentenca/Audio: geracao automatica via webhook.
    // Se ainda nao ficou pronta, so recarrega para checar de novo.
    carregar()
  }

  if (!itens) return null

  return (
    <div className="mx-6 mt-10 mb-12">
      <p style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', marginBottom: 12 }}>
        Sua Estante
      </p>

      <div className="flex flex-col gap-2">
        {/* Despertar — assinatura, tratamento a parte */}
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
            {assinatura ? 'Ativo' : 'Indisponível'}
          </span>
        </button>

        {itens.map((item) => (
          <button
            key={item.produto}
            onClick={() => handleClick(item)}
            disabled={!item.comprado}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', borderRadius: 8, width: '100%', textAlign: 'left',
              border: `1px solid ${item.pronto ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
              background: item.pronto ? 'rgba(201,169,97,0.06)' : 'var(--bg-surface)',
              opacity: item.comprado ? 1 : 0.5,
              cursor: item.comprado ? 'pointer' : 'default',
            }}
          >
            <span className="flex items-center gap-2">
              {item.pronto && <CheckIcon />}
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-primary)' }}>{item.nome}</span>
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
              {!item.comprado ? 'Indisponível' : item.pronto ? 'Ver' : 'Preparando…'}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
