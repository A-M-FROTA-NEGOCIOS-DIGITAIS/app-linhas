import { describe, it, expect } from 'vitest'
import { cruzarBiblioteca } from './useBiblioteca'
import type { Compra, Reading, ProdutoCatalogo } from '@/types'

const catalogo: ProdutoCatalogo[] = [
  { produto: 'mestra', nome: 'Leitura Mestra', ordem: 1, ativo: true, checkout_url: 'https://pay/mestra' },
  { produto: 'quem_ama', nome: 'Quem Você Ama', ordem: 2, ativo: true },
  { produto: 'audio', nome: 'Áudio', ordem: 3, ativo: true },
]

const compra = (produto: string): Compra => ({
  id: `c-${produto}`, user_id: 'u1', produto: produto as Compra['produto'],
  status: 'aprovado', created_at: '2026-08-01T00:00:00Z',
})

const leitura = (produto: string, extra: Partial<Reading> = {}): Reading => ({
  id: `r-${produto}`, user_id: 'u1', reading_type: 'mestra' as Reading['reading_type'],
  produto: produto as Reading['produto'], created_at: '2026-08-02T00:00:00Z', ...extra,
})

describe('cruzarBiblioteca', () => {
  it('marca comprado e pronto quando ha compra e leitura', () => {
    const itens = cruzarBiblioteca(catalogo, [compra('mestra')], [leitura('mestra')])
    const mestra = itens.find((i) => i.produto === 'mestra')!
    expect(mestra.comprado).toBe(true)
    expect(mestra.pronto).toBe(true)
    expect(mestra.reading?.id).toBe('r-mestra')
  })

  it('marca comprado sem pronto quando a leitura ainda nao existe', () => {
    const itens = cruzarBiblioteca(catalogo, [compra('mestra')], [])
    expect(itens.find((i) => i.produto === 'mestra')!.pronto).toBe(false)
  })

  it('nao marca comprado quando nao ha compra', () => {
    const itens = cruzarBiblioteca(catalogo, [], [])
    expect(itens.every((i) => !i.comprado)).toBe(true)
  })

  it('trata o audio como pronto pelo audio_url da leitura core', () => {
    const core = leitura('leitura_core', { audio_url: 'https://cdn/a.mp3' })
    const itens = cruzarBiblioteca(catalogo, [compra('audio')], [core])
    expect(itens.find((i) => i.produto === 'audio')!.pronto).toBe(true)
  })

  it('marca precisaAcao para quem_ama comprado e nao gerado', () => {
    const itens = cruzarBiblioteca(catalogo, [compra('quem_ama')], [])
    expect(itens.find((i) => i.produto === 'quem_ama')!.precisaAcao).toBe(true)
  })

  it('nao marca precisaAcao para mestra, que gera sozinha', () => {
    const itens = cruzarBiblioteca(catalogo, [compra('mestra')], [])
    expect(itens.find((i) => i.produto === 'mestra')!.precisaAcao).toBe(false)
  })

  it('respeita a ordem do catalogo', () => {
    const itens = cruzarBiblioteca(catalogo, [], [])
    expect(itens.map((i) => i.produto)).toEqual(['mestra', 'quem_ama', 'audio'])
  })
})
