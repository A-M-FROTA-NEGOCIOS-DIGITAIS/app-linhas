import sharp from 'sharp'
import { writeFileSync } from 'fs'

const PRETO = '#070A14'
const AZUL = '#7C9CE4'

// O "A" da Aurora. Serifada com contraste, no mesmo registro do resto da marca
// (Cormorant no app). O fundo e o mesmo preto-azulado do app, para o icone na
// tela inicial parecer continuacao dele e nao um adesivo colado.
const icone = ({ raio, tamanhoFonte, baseline }) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="${raio}" fill="${PRETO}"/>
  <text x="256" y="${baseline}" text-anchor="middle"
        font-family="Cormorant Garamond, Cormorant, Garamond, Georgia, serif"
        font-weight="300" font-size="${tamanhoFonte}" fill="${AZUL}">A</text>
</svg>`

// Icone normal: cantos arredondados como o iOS espera.
const normal = icone({ raio: 96, tamanhoFonte: 404, baseline: 392 })

// Maskable: o sistema pode recortar em circulo, entao o fundo vai ate a borda
// (sem raio) e a letra encolhe para caber na zona segura de 80%.
const maskable = icone({ raio: 0, tamanhoFonte: 310, baseline: 358 })

writeFileSync('public/icons/app-icon.svg', normal)
writeFileSync('public/icons/apple-touch-icon.svg', normal)

const saidas = [
  ['public/icons/icon-512.png', normal, 512],
  ['public/icons/icon-192.png', normal, 192],
  ['public/icons/apple-touch-icon.png', normal, 180],
  ['public/icons/icon-maskable.png', maskable, 512],
]

for (const [caminho, svg, tamanho] of saidas) {
  await sharp(Buffer.from(svg)).resize(tamanho, tamanho).png().toFile(caminho)
  console.log(caminho.padEnd(38), tamanho + 'x' + tamanho)
}
