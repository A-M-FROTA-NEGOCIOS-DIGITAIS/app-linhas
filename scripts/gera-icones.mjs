import sharp from 'sharp'
import { writeFileSync } from 'fs'

// Ícone da Alma no visual aurora: a lua crescente dourada do logo (a mesma do splash)
// sobre o céu noturno com manchas de aurora e estrelas. Sem texto: o SVG vira PNG pelo
// sharp/librsvg, que não tem a Cormorant, e a lua lê bem até em 32px.
//
//   node scripts/gera-icones.mjs
const LUA = 'M15.5 3.2a8.8 8.8 0 1 0 5.3 13.6A7.2 7.2 0 0 1 15.5 3.2z'

/** raio: cantos (0 = sangra até a borda, para o maskable). escala: tamanho da lua. */
const icone = ({ raio, escala }) => {
  // centro visual da lua ~ (11.6, 12) no grid de 24
  const tx = 256 - 11.6 * escala
  const ty = 256 - 12 * escala
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="ceu" cx="50%" cy="28%" r="80%">
      <stop offset="0" stop-color="#2A2470"/><stop offset=".5" stop-color="#0C1031"/><stop offset="1" stop-color="#05071A"/>
    </radialGradient>
    <radialGradient id="violeta"><stop offset="0" stop-color="#7C5CFF" stop-opacity=".75"/><stop offset="1" stop-color="#7C5CFF" stop-opacity="0"/></radialGradient>
    <radialGradient id="rosa"><stop offset="0" stop-color="#E26AA0" stop-opacity=".6"/><stop offset="1" stop-color="#E26AA0" stop-opacity="0"/></radialGradient>
    <radialGradient id="agua"><stop offset="0" stop-color="#3FD6C2" stop-opacity=".45"/><stop offset="1" stop-color="#3FD6C2" stop-opacity="0"/></radialGradient>
    <linearGradient id="lua" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFE3A8"/><stop offset=".6" stop-color="#E7B865"/><stop offset="1" stop-color="#F49AC1"/>
    </linearGradient>
    <radialGradient id="halo"><stop offset="0" stop-color="#F2C879" stop-opacity=".45"/><stop offset=".55" stop-color="#E26AA0" stop-opacity=".12"/><stop offset="1" stop-color="#E26AA0" stop-opacity="0"/></radialGradient>
    <clipPath id="forma"><rect width="512" height="512" rx="${raio}"/></clipPath>
  </defs>
  <g clip-path="url(#forma)">
    <rect width="512" height="512" fill="url(#ceu)"/>
    <circle cx="130" cy="150" r="230" fill="url(#violeta)"/>
    <circle cx="420" cy="380" r="210" fill="url(#rosa)"/>
    <circle cx="150" cy="470" r="200" fill="url(#agua)"/>
    <g fill="#FFFFFF">
      <circle cx="96" cy="92" r="3" opacity=".8"/><circle cx="410" cy="110" r="2.4" opacity=".7"/>
      <circle cx="440" cy="250" r="1.8" opacity=".6"/><circle cx="76" cy="300" r="2" opacity=".55"/>
      <circle cx="360" cy="440" r="2.2" opacity=".6"/><circle cx="210" cy="64" r="1.6" opacity=".6"/>
    </g>
    <path d="M396 150l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" fill="#FFE7B8" opacity=".9"/>
    <g transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${escala})">
      <circle cx="11.6" cy="12" r="12.5" fill="url(#halo)"/>
      <path d="${LUA}" fill="url(#lua)"/>
    </g>
  </g>
</svg>`
}

// Ícone normal: cantos arredondados como o iOS espera.
const normal = icone({ raio: 112, escala: 15 })
// Maskable: o sistema pode recortar em círculo, então o fundo vai até a borda e a lua
// encolhe para caber na zona segura de 80%.
const maskable = icone({ raio: 0, escala: 12 })
// Favicon: lua maior, para ler em 16–32px.
const favicon = icone({ raio: 112, escala: 17 })

writeFileSync('public/icons/app-icon.svg', favicon)
writeFileSync('public/icons/apple-touch-icon.svg', normal)

const saidas = [
  ['public/icons/icon-512.png', normal, 512],
  ['public/icons/icon-192.png', normal, 192],
  ['public/icons/apple-touch-icon.png', normal, 180],
  ['public/icons/icon-maskable.png', maskable, 512],
  ['public/icons/favicon-32.png', favicon, 32],
]

for (const [caminho, svg, tamanho] of saidas) {
  await sharp(Buffer.from(svg), { density: 288 }).resize(tamanho, tamanho).png().toFile(caminho)
  console.log(caminho.padEnd(38), tamanho + 'x' + tamanho)
}
