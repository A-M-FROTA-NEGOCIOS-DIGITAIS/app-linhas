import { useEffect, useState } from 'react'
import { OrbitaAurora } from '@/components/ui/Orbita'

interface Props {
  /** Mensagens que se alternam. A primeira aparece imediatamente. */
  mensagens: string[]
  /** Aviso de duracao, para a espera nao parecer travamento. */
  rodape?: string
}

/**
 * Tela de espera para geracoes longas.
 *
 * Existe porque gerar um produto leva de 16 a 33 segundos. Um spinner mudo
 * nesse tempo faz o sucesso parecer travamento — foi exatamente o que o dono do
 * produto relatou ("fica gerando infinito e nao vai") num fluxo que na verdade
 * tinha funcionado e salvo a leitura.
 *
 * Visual aurora: órbitas com o retrato da Aurora no núcleo (padrão do Processando
 * do quiz) e a frase em Cormorant que troca a cada 3,5s.
 */
export function TelaGerando({ mensagens, rodape }: Props) {
  const [indice, setIndice] = useState(0)

  useEffect(() => {
    if (mensagens.length <= 1) return
    const t = setInterval(() => setIndice((i) => (i + 1) % mensagens.length), 3500)
    return () => clearInterval(t)
  }, [mensagens.length])

  return (
    <div className="h-full flex flex-col items-center justify-center px-8 gap-7">
      <OrbitaAurora tamanho={260} />

      <div className="text-center flex flex-col gap-3">
        <p key={indice} className="alma-display italic text-[26px]" style={{ animation: 'alma-reveal .8s ease-out both' }}>
          {mensagens[indice]}
        </p>
        {rodape && <p className="text-[13px] text-text-muted">{rodape}</p>}
      </div>

      <div className="alma-progress w-40 overflow-hidden">
        <div className="alma-progress__fill" style={{ width: '100%' }} />
      </div>
    </div>
  )
}
