import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { ehAutomatico } from '../../supabase/functions/_shared/produtos'
import type { ItemBiblioteca } from '@/types'

/** Comprados, gerados sozinhos, ainda não prontos. */
export function pendentesDeGeracao(itens: ItemBiblioteca[]): ItemBiblioteca[] {
  return itens.filter((i) => i.comprado && !i.pronto && ehAutomatico(i.produto))
}

const INTERVALO_MS = 20_000
const LIMITE_MS = 15 * 60_000

/**
 * Garante que o que a pessoa comprou fique pronto. O compra-funil já manda gerar quando
 * a compra chega; isto cobre o que falhou ou chegou antes da leitura completa: ao abrir
 * o app, pede a geração (uma vez por produto nesta sessão) e recarrega a biblioteca a
 * cada 20 s até ficar pronto. O gerar-produto ignora o que já existe ou está em andamento.
 */
export function useGeracaoPendente(
  userId: string | null,
  itens: ItemBiblioteca[],
  recarregar: () => Promise<unknown>,
) {
  const pedidos = useRef(new Set<string>())
  const inicio = useRef(Date.now())
  const pendentes = pendentesDeGeracao(itens).map((i) => i.produto)
  const chave = pendentes.join(',')

  useEffect(() => {
    if (!userId || pendentes.length === 0) return
    for (const produto of pendentes) {
      if (pedidos.current.has(produto)) continue
      pedidos.current.add(produto)
      void supabase.functions
        .invoke('gerar-produto', { body: { user_id: userId, produto, assincrono: true } })
        .then(({ error }) => { if (error) console.error(`gerar ${produto}:`, error.message) })
    }
    if (Date.now() - inicio.current > LIMITE_MS) return
    const id = setTimeout(() => { void recarregar() }, INTERVALO_MS)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, chave, itens])
}
