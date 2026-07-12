import { useState } from 'react'
import { Button } from '@/components/ui'

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
  const total = PERGUNTAS.length
  const progresso = ((indice) / total) * 100

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

  return (
    <div className="h-full flex flex-col px-6 pt-6 pb-8">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={voltar} className="text-text-secondary active:text-text-primary transition-colors flex-shrink-0">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M11 5l-7 7 7 7" />
          </svg>
        </button>

        {/* Barra de progresso */}
        <div className="flex-1 flex items-center gap-1.5">
          {PERGUNTAS.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-0.5 rounded-full transition-all duration-400"
              style={{ background: i <= indice ? 'var(--accent-gold)' : 'var(--border-subtle)' }}
            />
          ))}
        </div>

        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', flexShrink: 0 }}>
          {indice + 1}/{total}
        </span>
      </div>

      {/* Pergunta */}
      <div
        className="mb-8 transition-opacity duration-200"
        style={{ opacity: saindo ? 0 : 1 }}
      >
        <p style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-gold)', fontFamily: 'var(--font-sans)', marginBottom: 10 }}>
          Madame Aurora pergunta
        </p>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 300, lineHeight: 1.25, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
          {pergunta.texto}
        </h2>
      </div>

      {/* Opções */}
      <div
        className="flex-1 flex flex-col gap-2.5 transition-opacity duration-200"
        style={{ opacity: saindo ? 0 : 1 }}
      >
        {pergunta.opcoes.map((opcao) => {
          const ativa = selecionada === opcao.id
          return (
            <button
              key={opcao.id}
              onClick={() => setSelecionada(opcao.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                textAlign: 'left', padding: '14px 16px', borderRadius: 8,
                border: `1px solid ${ativa ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
                background: ativa ? 'rgba(201,169,97,0.07)' : 'var(--bg-surface)',
                transition: 'all 0.2s ease', width: '100%', cursor: 'pointer',
              }}
            >
              <span
                style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                  border: `1.5px solid ${ativa ? 'var(--accent-gold)' : 'var(--border-medium)'}`,
                  background: ativa ? 'var(--accent-gold)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
              >
                {ativa && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--bg-primary)' }} />}
              </span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: ativa ? 'var(--accent-gold)' : 'var(--text-primary)', lineHeight: 1.4, transition: 'color 0.2s' }}>
                {opcao.texto}
              </span>
            </button>
          )
        })}
      </div>

      <div className="pt-6">
        <Button variant="primary" fullWidth disabled={!selecionada} onClick={avancar}>
          {indice < total - 1 ? 'Próxima' : 'Ver minha leitura'}
        </Button>
      </div>
    </div>
  )
}
