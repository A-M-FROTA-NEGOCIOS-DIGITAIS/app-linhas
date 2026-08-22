import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Assinatura, Compra, ItemBiblioteca, ProdutoCatalogo, Reading } from '@/types'

/** Produtos que so ficam prontos depois de uma acao da propria pessoa. */
const EXIGEM_ACAO = new Set(['compatibilidade', 'quem_ama', 'outra_mao'])

/**
 * Cruza catalogo, compras e leituras num unico estado por produto.
 * Funcao pura, separada do hook para poder ser testada sem Supabase.
 */
export function cruzarBiblioteca(
  catalogo: ProdutoCatalogo[],
  compras: Compra[],
  readings: Reading[],
): ItemBiblioteca[] {
  const compradas = new Set(compras.map((c) => c.produto))

  const porProduto: Record<string, Reading> = {}
  for (const r of readings) if (r.produto) porProduto[r.produto] = r

  // O audio nao vira uma leitura propria: ele e anexado a leitura core.
  const coreTemAudio = !!porProduto['leitura_core']?.audio_url

  return [...catalogo]
    .sort((a, b) => a.ordem - b.ordem)
    .map(({ produto, nome, descricao, preco_brl, checkout_url }) => {
      const comprado = compradas.has(produto)
      const pronto = produto === 'audio' ? coreTemAudio : produto in porProduto
      return {
        produto,
        nome,
        descricao,
        preco_brl,
        checkout_url,
        comprado,
        pronto,
        precisaAcao: comprado && !pronto && EXIGEM_ACAO.has(produto),
        reading: porProduto[produto],
      }
    })
}

export function useBiblioteca(userId: string | null) {
  const [itens, setItens] = useState<ItemBiblioteca[]>([])
  const [readings, setReadings] = useState<Reading[]>([])
  const [compras, setCompras] = useState<Compra[]>([])
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null)
  const [loading, setLoading] = useState(true)

  const recarregar = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    setLoading(true)

    const [catalogoRes, comprasRes, readingsRes, assinaturaRes] = await Promise.all([
      supabase.from('produtos_catalogo').select('*').eq('ativo', true),
      supabase.from('compras').select('*').eq('user_id', userId).eq('status', 'aprovado'),
      supabase.from('readings').select('*').eq('user_id', userId).eq('qualidade_aprovada', true),
      supabase.from('assinaturas').select('*').eq('user_id', userId).eq('status', 'ativa').maybeSingle(),
    ])

    if (catalogoRes.error) console.error('useBiblioteca: catalogo', catalogoRes.error.message)
    if (comprasRes.error) console.error('useBiblioteca: compras', comprasRes.error.message)
    if (readingsRes.error) console.error('useBiblioteca: readings', readingsRes.error.message)

    const catalogo = (catalogoRes.data as ProdutoCatalogo[] | null) ?? []
    const listaCompras = (comprasRes.data as Compra[] | null) ?? []
    const listaReadings = (readingsRes.data as Reading[] | null) ?? []

    setCompras(listaCompras)
    setReadings(listaReadings)
    setAssinatura(assinaturaRes.data as Assinatura | null)
    setItens(cruzarBiblioteca(catalogo, listaCompras, listaReadings))
    setLoading(false)
  }, [userId])

  useEffect(() => { void recarregar() }, [recarregar])

  return { itens, readings, compras, assinatura, loading, recarregar }
}
