const PALAVRAS_POR_MINUTO = 200

export function tempoDeLeitura(wordCount?: number): number {
  if (!wordCount) return 1
  return Math.max(1, Math.ceil(wordCount / PALAVRAS_POR_MINUTO))
}

/**
 * Conta dias consecutivos a partir de hoje (ou de ontem, para nao zerar o
 * streak de quem ainda nao abriu o app hoje).
 *
 * `datas` sao strings YYYY-MM-DD ja no fuso de Sao Paulo.
 */
export function calcularStreak(datas: string[], agora = new Date()): number {
  if (datas.length === 0) return 0

  const unicas = [...new Set(datas)].sort().reverse()
  const umDia = 24 * 60 * 60 * 1000
  // O sufixo Z e obrigatorio: sem ele o parse usa o fuso local, e em fusos com
  // horario de verao duas meia-noites consecutivas distam 23h ou 25h, o que
  // quebraria a contagem no dia da virada.
  const meiaNoite = (d: string) => new Date(`${d}T00:00:00Z`).getTime()

  const hoje = meiaNoite(
    new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(agora),
  )

  const diferencaInicial = (hoje - meiaNoite(unicas[0])) / umDia
  if (diferencaInicial > 1) return 0

  let streak = 1
  for (let i = 1; i < unicas.length; i++) {
    const diff = (meiaNoite(unicas[i - 1]) - meiaNoite(unicas[i])) / umDia
    if (diff !== 1) break
    streak++
  }
  return streak
}

const FASES = [
  'Lua nova', 'Lua crescente', 'Quarto crescente', 'Crescente gibosa',
  'Lua cheia', 'Minguante gibosa', 'Quarto minguante', 'Lua minguante',
]

/** Fase da lua por idade sinodica. Precisao de ~1 dia, suficiente para exibicao. */
export function faseDaLua(data = new Date()): string {
  const SINODICO = 29.530588853
  const NOVA_CONHECIDA = Date.UTC(2000, 0, 6, 18, 14)
  const dias = (data.getTime() - NOVA_CONHECIDA) / 86400000
  const idade = ((dias % SINODICO) + SINODICO) % SINODICO
  const indice = Math.floor((idade / SINODICO) * 8 + 0.5) % 8
  return FASES[indice]
}
