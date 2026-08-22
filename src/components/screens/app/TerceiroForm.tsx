import { useState } from 'react'
import { Button } from '@/components/ui'
import { TelaGerando } from '@/components/ui/TelaGerando'
import { supabase } from '@/lib/supabase'

interface Props {
  userId: string
  produto: 'compatibilidade' | 'quem_ama'
  onDone: () => void
  onBack: () => void
}

const BackIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M11 5l-7 7 7 7" />
  </svg>
)

const MENSAGENS = [
  'Madame Aurora está lendo o encontro das duas histórias…',
  'Cruzando a sua Marca com essa relação…',
  'Procurando onde o padrão aparece…',
  'Escrevendo a sua leitura…',
]

// Campo com rotulo. Sem rotulo, o input de data vazio no iOS vira uma caixa
// cinza sem nenhuma indicacao do que e — foi o "campo estranho" relatado.
const campoStyle: React.CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 8,
  padding: '14px 16px',
  fontSize: 16,
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-sans)',
  outline: 'none',
  width: '100%',
  // O iOS desenha o proprio controle em input[type=date] e ignora parte do
  // estilo. Sem isto ele fica visivelmente diferente dos outros dois campos.
  WebkitAppearance: 'none',
  appearance: 'none',
  minHeight: 52,
}

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
        {rotulo}
      </span>
      {children}
    </label>
  )
}

export function TerceiroForm({ userId, produto, onDone, onBack }: Props) {
  const [nome, setNome] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [relacao, setRelacao] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const titulo = produto === 'compatibilidade' ? 'Compatibilidade' : 'Quem Você Ama'

  const handleSubmit = async () => {
    if (!nome.trim()) return
    setLoading(true)
    setErro(null)
    try {
      const { data, error } = await supabase.functions.invoke('gerar-produto', {
        body: {
          user_id: userId,
          produto,
          contexto_terceiro: { nome, data_nascimento: dataNascimento || null, relacao: relacao || null },
        },
      })
      // A funcao responde 502 quando a geracao falha, e o invoke transforma
      // isso em `error`. O detalhe tecnico fica no console; a tela mostra texto
      // humano. `data.error` cobre o caso de a resposta vir 200 por engano.
      if (error || data?.error) {
        console.error('gerar-produto falhou:', error?.message ?? data?.error)
        throw new Error('falha')
      }
      onDone()
    } catch (err) {
      console.error('TerceiroForm:', err)
      setErro('Não consegui gerar sua leitura agora. Seus dados continuam aqui — é só tentar de novo.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <TelaGerando mensagens={MENSAGENS} rodape="Isso leva cerca de meio minuto." />
  }

  return (
    <div className="h-full flex flex-col px-6 pt-12 pb-8 scroll-area">
      <button onClick={onBack} className="text-text-secondary active:text-text-primary transition-colors mb-6 self-start">
        <BackIcon />
      </button>

      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 300, color: 'var(--text-primary)', marginBottom: 8 }}>
        {titulo}
      </h1>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
        Conte pra Madame Aurora sobre essa pessoa — a leitura é sobre como você vive seu padrão nessa relação.
      </p>

      <div className="flex flex-col gap-4 flex-1">
        <Campo rotulo="Nome da pessoa">
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Como você a chama"
            style={campoStyle}
          />
        </Campo>

        <Campo rotulo="Data de nascimento (opcional)">
          <input
            type="date"
            value={dataNascimento}
            onChange={(e) => setDataNascimento(e.target.value)}
            style={campoStyle}
          />
        </Campo>

        <Campo rotulo="Qual a relação (opcional)">
          <input
            type="text"
            value={relacao}
            onChange={(e) => setRelacao(e.target.value)}
            placeholder="namorado, ex, paquera…"
            style={campoStyle}
          />
        </Campo>

        {erro && (
          <p style={{ fontSize: 13, color: '#8B4040', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>
            {erro}
          </p>
        )}
      </div>

      <Button variant="primary" fullWidth disabled={!nome.trim()} onClick={handleSubmit}>
        Gerar minha leitura
      </Button>
    </div>
  )
}
