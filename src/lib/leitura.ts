const PALAVRAS_POR_MINUTO = 200

export function tempoDeLeitura(wordCount?: number): number {
  if (!wordCount) return 1
  return Math.max(1, Math.ceil(wordCount / PALAVRAS_POR_MINUTO))
}
