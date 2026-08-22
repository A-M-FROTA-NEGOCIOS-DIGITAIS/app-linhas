import { supabase } from '@/lib/supabase'

/**
 * Marca a leitura como aberta agora. Falha em silencio de proposito: e um dado
 * de conveniencia, nao pode interromper a leitura de quem esta lendo.
 */
export async function marcarAberta(readingId: string): Promise<void> {
  const { error } = await supabase
    .from('readings')
    .update({ aberta_em: new Date().toISOString() })
    .eq('id', readingId)
  if (error) console.error('marcarAberta falhou:', error.message)
}

/**
 * Guarda o capitulo mais avancado que a pessoa ja alcancou. Nunca retrocede:
 * voltar para reler o capitulo 1 nao deve zerar o progresso.
 */
export async function salvarCapitulo(
  readingId: string,
  indice: number,
  atual: number,
): Promise<number> {
  if (indice <= atual) return atual
  const { error } = await supabase
    .from('readings')
    .update({ ultimo_capitulo_lido: indice })
    .eq('id', readingId)
  if (error) {
    console.error('salvarCapitulo falhou:', error.message)
    return atual
  }
  return indice
}
