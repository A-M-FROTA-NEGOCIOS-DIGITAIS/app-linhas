import { useState } from 'react'
import { Button } from '@/components/ui'
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

export function TerceiroForm({ userId, produto, onDone, onBack }: Props) {
  const [nome, setNome] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [relacao, setRelacao] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const titulo = produto === 'compatibilidade' ? 'Compatibilidade' : 'Quem Te Ama'

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
      if (error) throw new Error(error.message)
      if (data?.erro) throw new Error('Não foi possível gerar a leitura agora. Tente novamente.')
      onDone()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col px-6 pt-12 pb-8">
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
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome da pessoa"
          style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: 8, padding: '14px 16px', fontSize: 15, color: 'var(--text-primary)',
            fontFamily: 'var(--font-sans)', outline: 'none', width: '100%',
          }}
        />
        <input
          type="date"
          value={dataNascimento}
          onChange={(e) => setDataNascimento(e.target.value)}
          style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: 8, padding: '14px 16px', fontSize: 15, color: 'var(--text-primary)',
            fontFamily: 'var(--font-sans)', outline: 'none', width: '100%',
          }}
        />
        <input
          type="text"
          value={relacao}
          onChange={(e) => setRelacao(e.target.value)}
          placeholder="Qual a relação? (ex: namorado, ex, paquera)"
          style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: 8, padding: '14px 16px', fontSize: 15, color: 'var(--text-primary)',
            fontFamily: 'var(--font-sans)', outline: 'none', width: '100%',
          }}
        />
        {erro && <p style={{ fontSize: 13, color: '#8B4040' }}>{erro}</p>}
      </div>

      <Button variant="primary" fullWidth loading={loading} disabled={!nome.trim()} onClick={handleSubmit}>
        Gerar minha leitura
      </Button>
    </div>
  )
}
