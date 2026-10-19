import { describe, it, expect } from 'vitest'
import {
  lerPedido,
  textoCompleto,
  chaveTransacao,
  dataValida,
  segredoValido,
} from '../../supabase/functions/compra-funil/logica'

// Regras da função compra-funil (supabase/functions/compra-funil), que recebe as
// compras do funil de vendas e libera o app.
describe('compra-funil · lerPedido', () => {
  const base = { email: ' Ana@Exemplo.com ', transacao: 'HP1', produto: 'leitura_core', status: 'aprovado', valor: 47 }

  it('aceita um pedido válido e normaliza o e-mail', () => {
    const r = lerPedido(base)
    expect(r).toMatchObject({ ok: true, pedido: { email: 'ana@exemplo.com', produto: 'leitura_core', valor: 47, dados: null } })
  })

  it.each([
    [{ ...base, email: 'sem-arroba' }, /email/],
    [{ ...base, transacao: '' }, /transacao/],
    [{ ...base, produto: 'upsell_mestra' }, /produto/],
    [{ ...base, status: 'pago' }, /status/],
  ])('recusa pedido inválido %#', (corpo, motivo) => {
    const r = lerPedido(corpo)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toMatch(motivo)
  })

  it('lê os dados do funil e descarta capítulos vazios', () => {
    const r = lerPedido({
      ...base,
      dados: {
        nome: 'Ana',
        data_nascimento: '1991-03-14',
        respostas_quiz: { p1_inicio: 'observo de longe' },
        analise_palma: 'linha longa',
        marca_adormecida: 'A Guardiã',
        capitulos: [
          { numero: 1, titulo: 'A Marca do Coração', conteudo: 'texto 1' },
          { numero: 2, titulo: 'vazio', conteudo: '  ' },
        ],
      },
    })
    expect(r.ok && r.pedido.dados).toEqual({
      nome: 'Ana',
      data_nascimento: '1991-03-14',
      respostas_quiz: { p1_inicio: 'observo de longe' },
      analise_palma: 'linha longa',
      marca_adormecida: 'A Guardiã',
      capitulos: [{ numero: 1, titulo: 'A Marca do Coração', conteudo: 'texto 1' }],
    })
  })
})

describe('compra-funil · auxiliares', () => {
  it('monta o texto completo no mesmo formato do intake', () => {
    expect(textoCompleto([
      { numero: 1, titulo: 'A', conteudo: 'um' },
      { numero: 2, titulo: 'B', conteudo: 'dois' },
    ])).toBe('A\n\num\n\n---\n\nB\n\ndois')
  })

  it('prefixa a transação para não colidir com as da Bluen', () => {
    expect(chaveTransacao('HP1')).toBe('hotmart:HP1')
  })

  it('só aceita data AAAA-MM-DD', () => {
    expect(dataValida('1991-03-14')).toBe('1991-03-14')
    expect(dataValida('14/03/1991')).toBeNull()
    expect(dataValida(null)).toBeNull()
  })

  it('confere o segredo exato', () => {
    expect(segredoValido('abc', 'abc')).toBe(true)
    expect(segredoValido('abd', 'abc')).toBe(false)
    expect(segredoValido(null, 'abc')).toBe(false)
    expect(segredoValido('abc', '')).toBe(false)
  })
})
