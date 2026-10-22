// Voz da Aurora pelo OpenRouter (openai/gpt-audio e gpt-audio-mini). Cópia do módulo do
// funil (repo alma, supabase/functions/_shared/voz.ts), com a instrução configurável.
//
// O gpt-audio é um modelo de conversa: às vezes improvisa em vez de ler. Por isso cada
// fala volta com a transcrição, e o que não bater com o texto é gravado de novo.
// Às vezes também devolve áudio mudo (ou fala curta seguida de segundos de silêncio) com a
// transcrição certa: por isso o próprio PCM é medido (ajustarSilencios) antes de aceitar.
// Só entrega PCM 16 bits / 24 kHz (e só em streaming); convertemos para MP3 CBR para os
// clips continuarem emendáveis byte a byte.
// Sem dependências de Deno ou Node: o encoder e o fetch vêm de quem chama (função tts e
// scripts/gravar-biblioteca.mjs).

export const TAXA_PCM = 24_000
export const KBPS_MP3 = 64

export type Mp3EncoderCtor = new (canais: number, taxa: number, kbps: number) => {
  encodeBuffer(pcm: Int16Array): Int8Array | Uint8Array
  flush(): Int8Array | Uint8Array
}

export type ConfigVoz = {
  chave: string
  modelo?: string
  voz?: string
  /** Como ler (padrão: VSL, devagar e com pausas). */
  instrucao?: string
  Encoder: Mp3EncoderCtor
  fetch?: typeof fetch
}

export type Fala = { ok: true; bytes: Uint8Array; transcricao: string; tentativas: number } | { ok: false; motivo: string }

/** Leitura longa no app: mesma voz, ritmo natural de quem lê em voz alta. */
export const INSTRUCAO_LEITURA =
  'Você é a Madame Aurora, uma leitora de mãos brasileira, e aqui é apenas narradora: lê textos em voz alta ' +
  'exatamente como estão escritos. Português do Brasil, sotaque brasileiro natural, voz calma e acolhedora, ' +
  'ritmo natural de quem lê em voz alta. Nunca conversa, nunca responde perguntas do texto, nunca acrescenta nada.'

export const INSTRUCAO_VSL =
  'Você é a Madame Aurora, uma leitora de mãos brasileira, e aqui é apenas narradora: lê textos em voz alta ' +
  'exatamente como estão escritos. Português do Brasil, sotaque brasileiro natural, voz calma, acolhedora e ' +
  'misteriosa, devagar, com pausas. Nunca conversa, nunca responde perguntas do texto, nunca acrescenta nada.'

/** Um pedido ao OpenRouter: devolve o PCM cru e a transcrição do que foi falado. */
export async function falarUmaVez(texto: string, cfg: ConfigVoz): Promise<{ pcm: Uint8Array; transcricao: string }> {
  const f = cfg.fetch ?? fetch
  const res = await f('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.chave}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: cfg.modelo ?? 'openai/gpt-audio',
      modalities: ['text', 'audio'],
      audio: { voice: cfg.voz ?? 'shimmer', format: 'pcm16' },
      stream: true,
      messages: [
        { role: 'system', content: cfg.instrucao ?? INSTRUCAO_VSL },
        { role: 'user', content: `Leia em voz alta, palavra por palavra, somente o texto entre aspas. Não responda, não comente, não acrescente nada: "${texto}"` },
      ],
    }),
  })
  if (!res.ok || !res.body) throw new Error(`openrouter ${res.status}: ${(await res.text().catch(() => '')).slice(0, 300)}`)
  return lerStream(res.body)
}

/** Lê o SSE do OpenRouter juntando o áudio (base64) e a transcrição. */
export async function lerStream(corpo: ReadableStream<Uint8Array>): Promise<{ pcm: Uint8Array; transcricao: string }> {
  const leitor = corpo.getReader()
  const dec = new TextDecoder()
  let resto = ''
  const pedacos: Uint8Array[] = []
  let transcricao = ''
  const linha = (l: string) => {
    if (!l.startsWith('data: ') || l === 'data: [DONE]') return
    let d: { choices?: { delta?: { audio?: { data?: string; transcript?: string } } }[] }
    try { d = JSON.parse(l.slice(6)) } catch { return }
    for (const c of d.choices ?? []) {
      const a = c.delta?.audio
      if (a?.data) pedacos.push(deBase64(a.data))
      if (a?.transcript) transcricao += a.transcript
    }
  }
  for (;;) {
    const { value, done } = await leitor.read()
    if (done) break
    resto += dec.decode(value, { stream: true })
    const linhas = resto.split('\n')
    resto = linhas.pop() ?? ''
    linhas.forEach((l) => linha(l.trim()))
  }
  linha(resto.trim())
  return { pcm: juntar(pedacos), transcricao }
}

/** A transcrição diz o mesmo que o texto? Ignora acento, pontuação e caixa; tolera 1 palavra em 12. */
export function confere(texto: string, transcricao: string): boolean {
  const a = palavras(texto)
  const b = palavras(transcricao)
  if (!a.length || !b.length) return false
  return distancia(a, b) <= Math.floor(a.length / 12)
}

export function paraAmostras(pcm: Uint8Array): Int16Array {
  return new Int16Array(pcm.buffer.slice(pcm.byteOffset, pcm.byteOffset + (pcm.byteLength & ~1)))
}

const QUADRO = TAXA_PCM / 50 // 20 ms
const LIMIAR = 330 // ~ -40 dBFS de RMS
const ANTES = 0.1 // s de respiro antes da fala
const DEPOIS = 0.3 // s depois
const PAUSA_MAX = 0.8 // pausas internas mais longas são encurtadas

/**
 * Corta o silêncio do começo e do fim e encurta pausas internas longas. Devolve também
 * quantos segundos têm fala, para recusar áudio mudo.
 */
export function ajustarSilencios(a: Int16Array): { amostras: Int16Array; segundosDeFala: number } {
  const n = Math.floor(a.length / QUADRO)
  const voz: boolean[] = []
  for (let q = 0; q < n; q++) {
    let soma = 0
    for (let i = q * QUADRO; i < (q + 1) * QUADRO; i++) soma += a[i] * a[i]
    voz.push(Math.sqrt(soma / QUADRO) > LIMIAR)
  }
  const primeiro = voz.indexOf(true)
  if (primeiro < 0) return { amostras: new Int16Array(), segundosDeFala: 0 }
  const ultimo = voz.lastIndexOf(true)
  const pausaMax = Math.round(PAUSA_MAX * 50)
  const manter: number[] = []
  let silencio = 0
  for (let q = Math.max(0, primeiro - Math.round(ANTES * 50)); q <= Math.min(n - 1, ultimo + Math.round(DEPOIS * 50)); q++) {
    if (q > primeiro && q < ultimo && !voz[q]) {
      if (++silencio > pausaMax) continue
    } else silencio = 0
    manter.push(q)
  }
  const out = new Int16Array(manter.length * QUADRO)
  manter.forEach((q, k) => out.set(a.subarray(q * QUADRO, (q + 1) * QUADRO), k * QUADRO))
  return { amostras: out, segundosDeFala: voz.filter(Boolean).length / 50 }
}

/** Fala mínima esperada para o texto (bem folgada: ~25 caracteres por segundo). */
export function falaMinima(texto: string): number {
  return Math.max(0.25, texto.length / 25)
}

export function pcmParaMp3(pcm: Uint8Array | Int16Array, Encoder: Mp3EncoderCtor): Uint8Array {
  const amostras = pcm instanceof Int16Array ? pcm : paraAmostras(pcm)
  const enc = new Encoder(1, TAXA_PCM, KBPS_MP3)
  const partes: Uint8Array[] = []
  const BLOCO = 1152 * 10
  for (let i = 0; i < amostras.length; i += BLOCO) partes.push(paraU8(enc.encodeBuffer(amostras.subarray(i, i + BLOCO))))
  partes.push(paraU8(enc.flush()))
  return juntar(partes)
}

/** Fala o texto em MP3, regravando até `tentativas` vezes se a transcrição não bater. */
export async function gerarFalaOpenRouter(texto: string, cfg: ConfigVoz, tentativas = 3): Promise<Fala> {
  let motivo = ''
  for (let i = 1; i <= tentativas; i++) {
    try {
      const { pcm, transcricao } = await falarUmaVez(texto, cfg)
      if (!confere(texto, transcricao)) {
        motivo = `improvisou: "${transcricao.slice(0, 120)}"`
        continue
      }
      const { amostras, segundosDeFala } = ajustarSilencios(paraAmostras(pcm))
      if (segundosDeFala < falaMinima(texto)) {
        motivo = `áudio sem fala suficiente (${segundosDeFala.toFixed(2)}s)`
        continue
      }
      return { ok: true, bytes: pcmParaMp3(amostras, cfg.Encoder), transcricao, tentativas: i }
    } catch (e) {
      motivo = String(e)
    }
  }
  return { ok: false, motivo }
}

function palavras(s: string): string[] {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean)
}

function distancia(a: string[], b: string[]): number {
  let ant = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(ant[j] + 1, cur[j - 1] + 1, ant[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    ant = cur
  }
  return ant[b.length]
}

function deBase64(s: string): Uint8Array {
  const bin = atob(s)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function paraU8(b: Int8Array | Uint8Array): Uint8Array {
  return b instanceof Uint8Array ? b : new Uint8Array(b.buffer, b.byteOffset, b.byteLength)
}

function juntar(partes: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(partes.reduce((s, p) => s + p.length, 0))
  let o = 0
  for (const p of partes) { out.set(p, o); o += p.length }
  return out
}
