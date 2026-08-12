import { describe, it, expect } from 'vitest'
import { tempoDeLeitura } from './leitura'

describe('tempoDeLeitura', () => {
  it('converte palavras em minutos arredondando para cima', () => {
    expect(tempoDeLeitura(1000)).toBe(5)
    expect(tempoDeLeitura(1001)).toBe(6)
  })

  it('nunca devolve menos de 1 minuto', () => {
    expect(tempoDeLeitura(0)).toBe(1)
    expect(tempoDeLeitura(undefined)).toBe(1)
  })
})
