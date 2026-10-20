import { useState } from 'react'
import { BotaoVoltar, SetaCta } from '@/components/ui'
import { useFundo } from '@/components/ui/AuroraFundo'
import { TelaGerando } from '@/components/ui/TelaGerando'
import { supabase } from '@/lib/supabase'

interface Props {
  userId: string
  produto: 'compatibilidade' | 'quem_ama'
  onDone: () => void
  onBack: () => void
}


const MENSAGENS = [
  'Madame Aurora está lendo o encontro das duas histórias…',
  'Cruzando a sua Marca com essa relação…',
  'Procurando onde o padrão aparece…',
  'Escrevendo a sua leitura…',
]

// Campo com rotulo. Sem rotulo, o input de data vazio no iOS vira uma caixa
// cinza sem nenhuma indicacao do que e — foi o "campo estranho" relatado.
const campoStyle: React.CSSProperties = {
  width: '100%',
  colorScheme: 'dark',
  // O iOS desenha o proprio controle em input[type=date] e ignora parte do
  // estilo. Sem isto ele fica visivelmente diferente dos outros dois campos.
  WebkitAppearance: 'none',
  appearance: 'none',
  minHeight: 52,
}

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] tracking-[2.5px] uppercase text-gold">
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
  useFundo('perfil')

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
    <div className="h-full flex flex-col px-6 pt-[calc(22px+env(safe-area-inset-top,0px))] pb-8 scroll-area">
      <BotaoVoltar onClick={onBack} />

      <h1 className="alma-r1 alma-display mt-5 mb-2 text-[34px]">
        <span className="alma-grad-text">{titulo}</span>
      </h1>
      <p className="alma-r1 mb-6 text-[15px] leading-[1.6] text-text-secondary">
        Conte pra Madame Aurora sobre essa pessoa — a leitura é sobre como você vive seu padrão nessa relação.
      </p>

      <div className="flex flex-col gap-4 flex-1">
        <Campo rotulo="Nome da pessoa">
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Como você a chama"
            className="alma-input"
            style={campoStyle}
          />
        </Campo>

        <Campo rotulo="Data de nascimento (opcional)">
          <input
            type="date"
            value={dataNascimento}
            onChange={(e) => setDataNascimento(e.target.value)}
            className="alma-input"
            style={campoStyle}
          />
        </Campo>

        <Campo rotulo="Qual a relação (opcional)">
          <input
            type="text"
            value={relacao}
            onChange={(e) => setRelacao(e.target.value)}
            placeholder="namorado, ex, paquera…"
            className="alma-input"
            style={campoStyle}
          />
        </Campo>

        {erro && (
          <p role="alert" className="text-[13px] leading-[1.5] text-status-error">
            {erro}
          </p>
        )}
      </div>

      <button type="button" className="alma-btn mt-6" disabled={!nome.trim()} onClick={handleSubmit} style={{ opacity: nome.trim() ? 1 : 0.55 }}>
        <span>Gerar minha leitura</span><SetaCta />
      </button>
    </div>
  )
}
