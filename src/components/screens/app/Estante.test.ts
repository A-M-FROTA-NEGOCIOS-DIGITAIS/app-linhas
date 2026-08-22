import { describe, it, expect } from 'vitest'
import { labelStatus } from './Estante'
import type { ItemBiblioteca } from '@/types'

const item = (extra: Partial<ItemBiblioteca> = {}): ItemBiblioteca => ({
  produto: 'mestra', nome: 'Leitura Mestra',
  comprado: false, pronto: false, precisaAcao: false, ...extra,
})

describe('labelStatus', () => {
  it('oferece Comprar quando nao comprou e existe link', () => {
    expect(labelStatus(item({ checkout_url: 'https://pay/x' }))).toBe('Comprar')
  })

  it('mostra Em breve quando o link ainda nao chegou', () => {
    expect(labelStatus(item())).toBe('Em breve')
  })

  it('mostra Ver quando comprou e esta pronto', () => {
    expect(labelStatus(item({ comprado: true, pronto: true }))).toBe('Ver')
  })

  it('pede os dados do terceiro para quem_ama comprado e nao gerado', () => {
    expect(labelStatus(item({ produto: 'quem_ama', comprado: true }))).toBe('Preencher dados →')
  })

  it('mostra Preparando para produto comprado que gera sozinho', () => {
    expect(labelStatus(item({ comprado: true }))).toBe('Preparando…')
  })
})
