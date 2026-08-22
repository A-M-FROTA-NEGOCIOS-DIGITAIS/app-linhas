import { useEffect, useState } from 'react'
import { AuroraRetrato } from '@/components/ui/Aurora'

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
 * Segue o padrao que a Scanning e a LeituraCompleta ja usam: frase serifada que
 * troca a cada 3,5s sobre um glifo pulsando.
 */
export function TelaGerando({ mensagens, rodape }: Props) {
  const [indice, setIndice] = useState(0)

  useEffect(() => {
    if (mensagens.length <= 1) return
    const t = setInterval(() => setIndice((i) => (i + 1) % mensagens.length), 3500)
    return () => clearInterval(t)
  }, [mensagens.length])

  return (
    <div className="h-full flex flex-col items-center justify-center px-8 gap-8">
      <AuroraRetrato tamanho={112} />

      <div className="text-center flex flex-col gap-3">
        <p
          key={indice}
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 20,
            fontWeight: 300,
            color: 'var(--text-primary)',
            lineHeight: 1.4,
            transition: 'opacity 0.5s',
          }}
        >
          {mensagens[indice]}
        </p>
        {rodape && (
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-muted)' }}>
            {rodape}
          </p>
        )}
      </div>

      <div style={{ width: 120, height: 1, background: 'var(--border-subtle)', borderRadius: 1, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: '40%',
            background: 'var(--accent)',
            borderRadius: 1,
            animation: 'slideProgress 2s ease-in-out infinite',
          }}
        />
      </div>
    </div>
  )
}
