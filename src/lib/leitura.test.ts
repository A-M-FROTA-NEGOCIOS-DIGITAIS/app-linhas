import { describe, it, expect } from 'vitest'
import { tempoDeLeitura, calcularStreak } from './leitura'

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

describe('calcularStreak', () => {
  const hoje = new Date('2026-08-12T12:00:00-03:00')

  it('conta dias consecutivos terminando hoje', () => {
    const datas = ['2026-08-12', '2026-08-11', '2026-08-10']
    expect(calcularStreak(datas, hoje)).toBe(3)
  })

  it('aceita que a sequencia termine ontem', () => {
    const datas = ['2026-08-11', '2026-08-10']
    expect(calcularStreak(datas, hoje)).toBe(2)
  })

  it('para no primeiro buraco', () => {
    const datas = ['2026-08-12', '2026-08-11', '2026-08-08', '2026-08-07']
    expect(calcularStreak(datas, hoje)).toBe(2)
  })

  it('devolve zero quando a ultima data e antiga demais', () => {
    expect(calcularStreak(['2026-08-01'], hoje)).toBe(0)
  })

  it('devolve zero para lista vazia', () => {
    expect(calcularStreak([], hoje)).toBe(0)
  })

  it('ignora datas repetidas', () => {
    const datas = ['2026-08-12', '2026-08-12', '2026-08-11']
    expect(calcularStreak(datas, hoje)).toBe(2)
  })

  it('nao quebra o streak na virada do horario de verao de outros fusos', () => {
    // 08 -> 09 de marco de 2026 e a virada do DST nos EUA. Com parse em fuso
    // local a diferenca daria 23h e o streak quebraria; com parse em UTC da 24h.
    const datas = ['2026-03-09', '2026-03-08', '2026-03-07']
    expect(calcularStreak(datas, new Date('2026-03-09T12:00:00Z'))).toBe(3)
  })
})
