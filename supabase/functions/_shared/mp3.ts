// Emenda de clips MP3 (VSL montada da Biblioteca de Marcas). Os clips são CBR (ElevenLabs
// em 128 kbps, OpenRouter convertido para 64 kbps): dá para emendar os bytes direto, e a
// duração sai do tamanho e do bitrate do primeiro quadro, sem decodificar.

export const BYTES_POR_SEGUNDO = 128_000 / 8

// kbps por índice (camada III): MPEG-1 e MPEG-2/2.5
const KBPS_V1 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320]
const KBPS_V2 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160]

/** Bitrate (bits/s) do primeiro quadro MP3; 128 kbps se não achar. */
export function bitrate(b: Uint8Array): number {
  for (let i = 0; i + 3 < b.length && i < 4096; i++) {
    if (b[i] !== 0xff || (b[i + 1] & 0xe0) !== 0xe0) continue
    const versao = (b[i + 1] >> 3) & 3 // 3 = MPEG-1, 2 = MPEG-2, 0 = MPEG-2.5
    const camada = (b[i + 1] >> 1) & 3 // 1 = camada III
    const idx = b[i + 2] >> 4
    if (versao === 1 || camada !== 1 || idx === 0 || idx === 15) continue
    return (versao === 3 ? KBPS_V1 : KBPS_V2)[idx] * 1000
  }
  return 128_000
}

/** Tira as tags ID3 (v2 no começo, v1 no fim), que no meio do arquivo viram ruído. */
export function semId3(b: Uint8Array): Uint8Array {
  let ini = 0
  let fim = b.length
  if (b.length >= 10 && b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) {
    const tam = ((b[6] & 0x7f) << 21) | ((b[7] & 0x7f) << 14) | ((b[8] & 0x7f) << 7) | (b[9] & 0x7f)
    ini = Math.min(b.length, 10 + tam + (b[5] & 0x10 ? 10 : 0))
  }
  if (fim - ini >= 128 && b[fim - 128] === 0x54 && b[fim - 127] === 0x41 && b[fim - 126] === 0x47) fim -= 128
  return b.subarray(ini, fim)
}

export function duracaoSegundos(b: Uint8Array): number {
  return (b.length * 8) / bitrate(b)
}

export function emendar(partes: Uint8Array[]): Uint8Array {
  const total = partes.reduce((s, p) => s + p.length, 0)
  const out = new Uint8Array(total)
  let o = 0
  for (const p of partes) {
    out.set(p, o)
    o += p.length
  }
  return out
}

/**
 * 'gancho:chama' → '<voz>/gancho/chama.mp3' (caminho no bucket vsl-clips). Cada voz tem a
 * sua pasta: trocar de voz nunca mistura clips de vozes diferentes na mesma VSL.
 */
export function caminhoDoClip(clip: string, voz: string): string {
  const [grupo, ...resto] = clip.split(':')
  return `${voz}/${resto.length ? `${grupo}/${resto.join(':')}` : `fixo/${grupo}`}.mp3`
}
