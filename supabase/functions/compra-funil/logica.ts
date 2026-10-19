// Regras puras da função compra-funil (sem rede nem banco), testadas no Vitest.

export const PRODUTOS_APP = [
  'leitura_core', 'mestra', 'ritual', 'compatibilidade', 'quem_ama', '12meses',
  'outra_mao', 'downsell', 'audio', 'sentenca', 'despertar',
] as const
export type ProdutoApp = (typeof PRODUTOS_APP)[number]

export const STATUS_APP = ['aprovado', 'cancelado', 'reembolsado'] as const
export type StatusApp = (typeof STATUS_APP)[number]

export type Capitulo = { numero: number; titulo: string; conteudo: string }

export type DadosFunil = {
  nome: string | null
  data_nascimento: string | null
  respostas_quiz: Record<string, string>
  analise_palma: string | null
  marca_adormecida: string | null
  capitulos: Capitulo[] | null
}

export type PedidoCompra = {
  email: string
  transacao: string
  produto: ProdutoApp
  status: StatusApp
  valor: number | null
  dados: DadosFunil | null
}

type Obj = Record<string, unknown>
const texto = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null)

/** Valida o corpo vindo do funil. Devolve o pedido ou o motivo da recusa. */
export function lerPedido(corpo: unknown): { ok: true; pedido: PedidoCompra } | { ok: false; motivo: string } {
  const c = (corpo && typeof corpo === 'object' ? corpo : {}) as Obj
  const email = texto(c.email)?.toLowerCase() ?? null
  const transacao = texto(c.transacao)
  const produto = texto(c.produto) as ProdutoApp | null
  const status = texto(c.status) as StatusApp | null
  if (!email || !email.includes('@')) return { ok: false, motivo: 'email inválido' }
  if (!transacao) return { ok: false, motivo: 'transacao obrigatória' }
  if (!produto || !PRODUTOS_APP.includes(produto)) return { ok: false, motivo: `produto desconhecido: ${c.produto}` }
  if (!status || !STATUS_APP.includes(status)) return { ok: false, motivo: `status desconhecido: ${c.status}` }
  const valor = typeof c.valor === 'number' && Number.isFinite(c.valor) ? c.valor : null

  let dados: DadosFunil | null = null
  if (c.dados && typeof c.dados === 'object') {
    const d = c.dados as Obj
    const respostas = (d.respostas_quiz && typeof d.respostas_quiz === 'object' ? d.respostas_quiz : {}) as Record<string, string>
    const caps = Array.isArray(d.capitulos)
      ? (d.capitulos as Obj[])
          .map((x, i) => ({ numero: Number(x.numero) || i + 1, titulo: texto(x.titulo) ?? '', conteudo: texto(x.conteudo) ?? '' }))
          .filter((x) => x.conteudo)
      : []
    dados = {
      nome: texto(d.nome),
      data_nascimento: texto(d.data_nascimento),
      respostas_quiz: respostas,
      analise_palma: texto(d.analise_palma),
      marca_adormecida: texto(d.marca_adormecida),
      capitulos: caps.length ? caps : null,
    }
  }
  return { ok: true, pedido: { email, transacao, produto, status, valor, dados } }
}

/** Mesmo formato que o intake-quiz-externo usa para full_content. */
export function textoCompleto(capitulos: Capitulo[]): string {
  return capitulos.map((c) => `${c.titulo}\n\n${c.conteudo}`).join('\n\n---\n\n')
}

/** Chave da compra no app: prefixo evita colisão com transações antigas da Bluen. */
export function chaveTransacao(transacao: string): string {
  return `hotmart:${transacao}`
}

/** Data do funil vem como texto livre do input date (AAAA-MM-DD); só aceita esse formato. */
export function dataValida(v: string | null): string | null {
  return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null
}

/** Comparação de segredo em tempo constante. */
export function segredoValido(recebido: string | null, esperado: string): boolean {
  if (!recebido || !esperado) return false
  const a = new TextEncoder().encode(recebido)
  const b = new TextEncoder().encode(esperado)
  let dif = a.length ^ b.length
  for (let i = 0; i < b.length; i++) dif |= (a[i] ?? 0) ^ b[i]
  return dif === 0
}
