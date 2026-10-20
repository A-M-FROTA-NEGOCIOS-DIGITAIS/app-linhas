import { useState } from 'react'
import { BotaoVoltar, SetaCta } from '@/components/ui'
import { AuroraAvatar } from '@/components/ui/Aurora'
import { useFundo } from '@/components/ui/AuroraFundo'

interface Opcao {
  id: string
  texto: string
}

interface Pergunta {
  id: string
  texto: string
  opcoes: Opcao[]
}

const PERGUNTAS: Pergunta[] = [
  {
    id: 'q1',
    texto: 'Quando você se apaixona, o que acontece com você?',
    opcoes: [
      { id: 'a', texto: 'Sinto que preciso cuidar e proteger a pessoa' },
      { id: 'b', texto: 'Me perco — a pessoa vira meu mundo' },
      { id: 'c', texto: 'Fico analisando cada detalhe antes de me entregar' },
      { id: 'd', texto: 'Me abro completamente, sem reservas' },
    ],
  },
  {
    id: 'q2',
    texto: 'Quando alguém que você ama some sem explicação, você...',
    opcoes: [
      { id: 'a', texto: 'Vai atrás para entender o que aconteceu' },
      { id: 'b', texto: 'Sente muito por dentro, mas fica em silêncio' },
      { id: 'c', texto: 'Analisa tudo que disse e fez para encontrar o erro' },
      { id: 'd', texto: 'Fecha e se protege para não sentir mais' },
    ],
  },
  {
    id: 'q3',
    texto: 'O que mais te esgota nos relacionamentos?',
    opcoes: [
      { id: 'a', texto: 'Dar muito mais do que recebo' },
      { id: 'b', texto: 'Não conseguir controlar o que vai acontecer' },
      { id: 'c', texto: 'Sentir que nunca sou suficiente para a pessoa' },
      { id: 'd', texto: 'Perder minha independência e meu espaço' },
    ],
  },
  {
    id: 'q4',
    texto: 'Quando percebe que está sofrendo em um relacionamento, você...',
    opcoes: [
      { id: 'a', texto: 'Tenta resolver e salvar a relação' },
      { id: 'b', texto: 'Aguenta em silêncio por muito tempo' },
      { id: 'c', texto: 'Racionaliza e tenta entender os motivos' },
      { id: 'd', texto: 'Some antes que a pessoa possa te abandonar' },
    ],
  },
  {
    id: 'q5',
    texto: 'O que você mais repete nos seus relacionamentos?',
    opcoes: [
      { id: 'a', texto: 'Escolher pessoas que precisam ser salvas' },
      { id: 'b', texto: 'Amar intensamente e me perder no outro' },
      { id: 'c', texto: 'Ficar na dúvida se estou fazendo a coisa certa' },
      { id: 'd', texto: 'Ir embora quando fica sério demais' },
    ],
  },
  {
    id: 'q6',
    texto: 'Quando um relacionamento termina, o que você sente mais?',
    opcoes: [
      { id: 'a', texto: 'Culpa — acho que poderia ter feito mais' },
      { id: 'b', texto: 'Uma dor profunda que demora muito para passar' },
      { id: 'c', texto: 'Confusão — fico tentando entender onde errei' },
      { id: 'd', texto: 'Alívio — no fundo eu já sabia que era hora' },
    ],
  },
  {
    id: 'q7',
    texto: 'O que você mais deseja em um relacionamento?',
    opcoes: [
      { id: 'a', texto: 'Sentir que faço diferença real na vida da pessoa' },
      { id: 'b', texto: 'Uma conexão profunda e única, diferente de todas as outras' },
      { id: 'c', texto: 'Segurança e clareza sobre o que vai acontecer' },
      { id: 'd', texto: 'Espaço para continuar sendo quem eu sou' },
    ],
  },
]

export type QuizRespostas = Record<string, string>

interface Props {
  onContinue: (respostas: QuizRespostas) => void
  onBack?: () => void
}

export function QuizScreen({ onContinue, onBack }: Props) {
  const [indice, setIndice] = useState(0)
  const [respostas, setRespostas] = useState<QuizRespostas>({})
  const [selecionada, setSelecionada] = useState<string | null>(null)
  const [saindo, setSaindo] = useState(false)

  const pergunta = PERGUNTAS[indice]
  useFundo('pergunta')
  const total = PERGUNTAS.length

  const avancar = () => {
    if (!selecionada) return
    const novas = { ...respostas, [pergunta.id]: selecionada }
    setRespostas(novas)

    if (indice < total - 1) {
      setSaindo(true)
      setTimeout(() => {
        setIndice(indice + 1)
        setSelecionada(null)
        setSaindo(false)
      }, 220)
    } else {
      onContinue(novas)
    }
  }

  const voltar = () => {
    if (indice === 0) {
      onBack?.()
      return
    }
    setSaindo(true)
    setTimeout(() => {
      setIndice(indice - 1)
      setSelecionada(respostas[PERGUNTAS[indice - 1].id] ?? null)
      setSaindo(false)
    }, 180)
  }

  // Destaque em gradiente nas últimas palavras da pergunta, como na referência L05.
  const palavras = pergunta.texto.split(' ')
  const corte = Math.max(1, palavras.length - 3)
  const inicioPergunta = palavras.slice(0, corte).join(' ')
  const fimPergunta = palavras.slice(corte).join(' ')

  return (
    <div className="h-full flex flex-col px-[22px] pt-[calc(22px+env(safe-area-inset-top,0px))] pb-[26px]">
      {/* Cabeçalho: voltar · progresso em 7 segmentos · contador */}
      <div className="flex items-center gap-3 h-11">
        <BotaoVoltar onClick={voltar} />
        <div className="flex-grow grid gap-1" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}>
          {PERGUNTAS.map((_, i) => (
            <span
              key={i}
              className="h-1 rounded transition-all duration-300"
              style={
                i <= indice
                  ? { background: 'linear-gradient(90deg, #FFD98E, #F49AC1)', boxShadow: '0 0 8px rgba(244,154,193,.6)' }
                  : { background: 'rgba(255,255,255,.15)' }
              }
            />
          ))}
        </div>
        <span className="text-[12px] tracking-[1px] text-gold flex-shrink-0">{indice + 1}/{total}</span>
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar transition-opacity duration-200" style={{ opacity: saindo ? 0 : 1 }}>
        <div key={pergunta.id} className="alma-r1 flex items-center gap-3 mt-[26px]">
          <AuroraAvatar tamanho={48} />
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] tracking-[3px] text-gold">MADAME AURORA</span>
            <span className="text-[13px] text-[#C9C3DD]">pergunta</span>
          </div>
        </div>

        <h1 key={`h${pergunta.id}`} className="alma-r1 alma-display mt-4 text-[31px] leading-[1.1]">
          {inicioPergunta} <span className="alma-grad-text">{fimPergunta}</span>
        </h1>

        <div key={`o${pergunta.id}`} className="alma-r2 flex flex-col gap-2.5 mt-[22px]">
          {pergunta.opcoes.map((opcao, i) => {
            const ativa = selecionada === opcao.id
            return (
              <button
                key={opcao.id}
                type="button"
                aria-pressed={ativa}
                onClick={() => setSelecionada(opcao.id)}
                className="alma-option"
                style={{ minHeight: 66, padding: '12px 14px', backdropFilter: 'blur(8px)' }}
              >
                <span
                  className="flex items-center justify-center flex-shrink-0 rounded-full font-serif font-semibold text-[18px]"
                  style={{
                    width: 34, height: 34,
                    ...(ativa
                      ? { background: 'linear-gradient(135deg, #FFE3A8, #E7B865)', color: '#2A1A05' }
                      : { background: 'rgba(242,200,121,.1)', color: '#F2C879', boxShadow: 'inset 0 0 0 1px rgba(242,200,121,.35)' }),
                  }}
                >
                  {'ABCD'[i] ?? opcao.id.toUpperCase()}
                </span>
                <span className="flex-grow text-left text-[15.5px] leading-[1.35] text-text-primary">{opcao.texto}</span>
              </button>
            )
          })}
        </div>
        <div className="flex-grow min-h-6" />
      </div>

      <button type="button" className="alma-btn" disabled={!selecionada} onClick={avancar} style={{ height: 56, opacity: selecionada ? 1 : 0.55 }}>
        <span>{indice < total - 1 ? 'Próxima' : 'Ver minha leitura'}</span>
        <SetaCta />
      </button>
    </div>
  )
}
