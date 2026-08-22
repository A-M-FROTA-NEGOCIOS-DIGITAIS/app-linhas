import { describe, it, expect, vi, beforeEach } from 'vitest'

const update = vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) }))
vi.mock('@/lib/supabase', () => ({
  supabase: { from: () => ({ update }) },
}))

import { salvarCapitulo } from './progresso'

describe('salvarCapitulo', () => {
  beforeEach(() => update.mockClear())

  it('grava quando o capitulo avanca', async () => {
    expect(await salvarCapitulo('r1', 3, 2)).toBe(3)
    expect(update).toHaveBeenCalledWith({ ultimo_capitulo_lido: 3 })
  })

  it('nao grava quando a pessoa volta para reler', async () => {
    expect(await salvarCapitulo('r1', 1, 4)).toBe(4)
    expect(update).not.toHaveBeenCalled()
  })

  it('nao grava quando o capitulo e o mesmo', async () => {
    expect(await salvarCapitulo('r1', 2, 2)).toBe(2)
    expect(update).not.toHaveBeenCalled()
  })
})
