// Quais produtos o app gera sozinho depois da compra, e como disparar a geração.
// Usado pelo compra-funil (assim que a compra chega da Hotmart) e espelhado no app
// (src/lib/geracao.ts), que tenta de novo ao abrir a Estante. Sem dependências de Deno.

/** Geram só com a compra: não precisam de nada da pessoa. */
export const PRODUTOS_AUTOMATICOS = ['mestra', 'ritual', '12meses', 'downsell', 'sentenca', 'audio'] as const

/** Esperam um dado da pessoa (formulário do terceiro, segunda palma). */
export const PRODUTOS_COM_DADOS = ['compatibilidade', 'quem_ama', 'outra_mao'] as const

export const ehAutomatico = (produto: string) => (PRODUTOS_AUTOMATICOS as readonly string[]).includes(produto)

/** Uma geração em andamento trava novas por este tempo; depois disso considera travada e libera. */
export const TRAVA_MINUTOS = 12

export function travaExpirada(iniciadaEm: string | null | undefined, agora = Date.now()): boolean {
  if (!iniciadaEm) return true
  const t = Date.parse(iniciadaEm)
  return Number.isNaN(t) || agora - t > TRAVA_MINUTOS * 60_000
}

/** Pede ao gerar-produto, em segundo plano, cada produto automático comprado. */
export async function dispararGeracoes(
  produtos: string[],
  cfg: { userId: string; supabaseUrl: string; chaveServico: string; fetch?: typeof fetch },
): Promise<string[]> {
  const f = cfg.fetch ?? fetch
  const disparados: string[] = []
  for (const produto of new Set(produtos.filter(ehAutomatico))) {
    try {
      const res = await f(`${cfg.supabaseUrl}/functions/v1/gerar-produto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.chaveServico}` },
        body: JSON.stringify({ user_id: cfg.userId, produto, assincrono: true }),
      })
      if (res.ok) disparados.push(produto)
      else console.error(`[geracao] ${produto} p/ ${cfg.userId}: ${res.status} ${(await res.text()).slice(0, 200)}`)
    } catch (e) {
      console.error(`[geracao] ${produto} p/ ${cfg.userId}:`, e)
    }
  }
  return disparados
}
