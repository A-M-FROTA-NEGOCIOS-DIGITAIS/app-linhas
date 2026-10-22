import { describe, it, expect } from 'vitest'
import { pendentesDeGeracao } from './geracao'
import { ehAutomatico, travaExpirada, dispararGeracoes, TRAVA_MINUTOS } from '../../supabase/functions/_shared/produtos'
import type { ItemBiblioteca } from '@/types'

const item = (produto: string, extra: Partial<ItemBiblioteca> = {}): ItemBiblioteca =>
  ({ produto, nome: produto, comprado: true, pronto: false, precisaAcao: false, ...extra }) as ItemBiblioteca

describe('produtos gerados sozinhos', () => {
  it('automáticos geram com a compra; os que pedem dados esperam a pessoa', () => {
    for (const p of ['mestra', 'ritual', '12meses', 'downsell', 'sentenca', 'audio']) expect(ehAutomatico(p)).toBe(true)
    for (const p of ['compatibilidade', 'quem_ama', 'outra_mao', 'leitura_core', 'despertar']) expect(ehAutomatico(p)).toBe(false)
  })

  it('pendentes: comprado, automático e ainda não pronto', () => {
    const itens = [
      item('mestra'),
      item('audio', { pronto: true }),
      item('12meses', { comprado: false }),
      item('quem_ama'),
      item('ritual'),
    ]
    expect(pendentesDeGeracao(itens).map((i) => i.produto)).toEqual(['mestra', 'ritual'])
  })
})

describe('trava da geração', () => {
  const agora = Date.parse('2026-10-22T12:00:00Z')
  it('livre sem geração anterior', () => {
    expect(travaExpirada(null, agora)).toBe(true)
  })
  it('travada durante uma geração recente', () => {
    expect(travaExpirada('2026-10-22T11:55:00Z', agora)).toBe(false)
  })
  it(`libera depois de ${TRAVA_MINUTOS} minutos (geração que morreu no meio)`, () => {
    expect(travaExpirada('2026-10-22T11:40:00Z', agora)).toBe(true)
  })
})

describe('dispararGeracoes', () => {
  it('pede em segundo plano só os automáticos, uma vez cada', async () => {
    const pedidos: { produto: string; assincrono: boolean }[] = []
    const fakeFetch = (async (_u: string, init: RequestInit) => {
      pedidos.push(JSON.parse(String(init.body)))
      return new Response('{}', { status: 202 })
    }) as unknown as typeof fetch
    const r = await dispararGeracoes(['leitura_core', 'mestra', 'mestra', 'quem_ama', 'audio'], {
      userId: 'u1', supabaseUrl: 'https://x.supabase.co', chaveServico: 'k', fetch: fakeFetch,
    })
    expect(r).toEqual(['mestra', 'audio'])
    expect(pedidos).toEqual([
      { user_id: 'u1', produto: 'mestra', assincrono: true },
      { user_id: 'u1', produto: 'audio', assincrono: true },
    ])
  })

  it('falha num produto não impede os outros', async () => {
    let n = 0
    const fakeFetch = (async () => (++n === 1 ? new Response('erro', { status: 500 }) : new Response('{}', { status: 202 }))) as unknown as typeof fetch
    const r = await dispararGeracoes(['mestra', 'ritual'], { userId: 'u1', supabaseUrl: 'x', chaveServico: 'k', fetch: fakeFetch })
    expect(r).toEqual(['ritual'])
  })
})
