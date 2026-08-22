import { useEffect, useState } from 'react'

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
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none" className="animate-pulse-gold">
        <circle cx="36" cy="36" r="34" stroke="#C9A961" strokeWidth="0.75" strokeDasharray="4 4" />
        <path d="M12 52c8-16 40-16 48 0" stroke="#C9A961" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M18 52c6-12 30-12 36 0" stroke="#C9A961" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M24 52c4-8 20-8 24 0" stroke="#C9A961" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="36" cy="36" r="3" fill="#C9A961" />
      </svg>

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
            background: 'var(--accent-gold)',
            borderRadius: 1,
            animation: 'slideProgress 2s ease-in-out infinite',
          }}
        />
      </div>
    </div>
  )
}
