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
  const meiaNoite = (d: string) => new Date(`${d}T00:00:00`).getTime()

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
