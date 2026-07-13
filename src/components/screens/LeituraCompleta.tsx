import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/app'
import type { Capitulo } from '@/types'

interface LeituraData {
  reading_id: string
  marca_adormecida: string
  capitulos: Capitulo[]
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI']

const MSGS_CARREGANDO = [
  'Madame Aurora está analisando suas marcas...',
  'Integrando sua palma com suas respostas...',
  'Identificando sua Marca Adormecida...',
  'Preparando sua leitura completa...',
]

function LoadingLeitura() {
  const [msgIdx, setMsgIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setMsgIdx((i) => (i + 1) % MSGS_CARREGANDO.length), 3500)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="h-full flex flex-col items-center justify-center px-8 gap-8">
      {/* Glyph animado */}
      <div style={{ position: 'relative', width: 72, height: 72 }}>
        <svg width="72" height="72" viewBox="0 0 72 72" fill="none" className="animate-pulse-gold">
          <circle cx="36" cy="36" r="34" stroke="#C9A961" strokeWidth="0.75" strokeDasharray="4 4" />
          <path d="M12 52c8-16 40-16 48 0" stroke="#C9A961" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M18 52c6-12 30-12 36 0" stroke="#C9A961" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M24 52c4-8 20-8 24 0" stroke="#C9A961" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="36" cy="36" r="3" fill="#C9A961" />
        </svg>
      </div>

      <div className="text-center flex flex-col gap-3">
        <p
          key={msgIdx}
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 20,
            fontWeight: 300,
            color: 'var(--text-primary)',
            lineHeight: 1.4,
            transition: 'opacity 0.5s',
          }}
        >
          {MSGS_CARREGANDO[msgIdx]}
        </p>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-muted)' }}>
          Isso pode levar alguns momentos
        </p>
      </div>

      {/* Barra de progresso indeterminada */}
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

      <style>{`
        @keyframes slideProgress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  )
}

function ErroLeitura({ mensagem, onRetry }: { mensagem: string; onRetry: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-8 gap-6 text-center">
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--text-primary)' }}>
        Algo deu errado
      </p>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        {mensagem}
      </p>
      <button
        onClick={onRetry}
        style={{
          padding: '12px 28px',
          borderRadius: 6,
          border: '1px solid var(--accent-gold)',
          color: 'var(--accent-gold)',
          fontFamily: 'var(--font-sans)',
          fontSize: 14,
          cursor: 'pointer',
          background: 'transparent',
        }}
      >
        Tentar novamente
      </button>
    </div>
  )
}

function ExibicaoLeitura({ leitura, nome }: { leitura: LeituraData; nome: string }) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto scroll-area">
        {/* Cabeçalho */}
        <div className="px-6 pt-12 pb-6">
          <p style={{
            fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
            color: 'var(--accent-gold)', fontFamily: 'var(--font-sans)', marginBottom: 8,
          }}>
            Madame Aurora
          </p>
          <h1 style={{
            fontFamily: 'var(--font-serif)', fontSize: 30, fontWeight: 300,
            color: 'var(--text-primary)', lineHeight: 1.2, letterSpacing: '-0.01em',
          }}>
            Sua Leitura<br />
            <em style={{ fontStyle: 'italic', color: 'var(--accent-gold)' }}>Completa</em>
          </h1>
        </div>

        {/* Card da Marca Adormecida */}
        {leitura.marca_adormecida && (
          <div className="mx-6 mb-8 px-5 py-5" style={{
            border: '1px solid var(--accent-gold)',
            borderRadius: 10,
            background: 'rgba(201,169,97,0.06)',
          }}>
            <p style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', marginBottom: 6 }}>
              Sua Marca Adormecida
            </p>
            <p style={{
              fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 300,
              color: 'var(--accent-gold)', lineHeight: 1.3, fontStyle: 'italic',
            }}>
              {leitura.marca_adormecida}
            </p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
              {nome}, este é o padrão que rege seus relacionamentos.
            </p>
          </div>
        )}

        {/* Capítulos */}
        <div className="px-6 flex flex-col gap-10 pb-4">
          {leitura.capitulos.map((cap, i) => (
            <div key={cap.numero ?? i}>
              {/* Divisor com número romano */}
              <div className="flex items-center gap-3 mb-4">
                <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
                <span style={{
                  fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--accent-gold)',
                  letterSpacing: '0.1em', opacity: 0.7,
                }}>
                  {ROMAN[i] ?? i + 1}
                </span>
                <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
              </div>

              {/* Título */}
              <h2 style={{
                fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 300,
                color: 'var(--text-primary)', marginBottom: 14, lineHeight: 1.3,
                fontStyle: 'italic',
              }}>
                {cap.titulo}
              </h2>

              {/* Conteúdo */}
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                {cap.conteudo.split('\n\n').map((para, j) => (
                  <p key={j} style={{ marginBottom: j < cap.conteudo.split('\n\n').length - 1 ? 14 : 0 }}>
                    {para}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Upsell pós-leitura */}
        <div className="mx-6 mt-10 mb-12 px-5 py-6 text-center" style={{
          border: '1px solid var(--border-subtle)',
          borderRadius: 10,
          background: 'var(--bg-surface)',
        }}>
          <p style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', marginBottom: 8 }}>
            O próximo passo
          </p>
          <p style={{
            fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 300,
            color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: 8,
          }}>
            Você reconheceu a marca.<br />
            <em style={{ color: 'var(--accent-gold)', fontStyle: 'italic' }}>Agora é hora de rompê-la.</em>
          </p>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 16 }}>
            Em breve: A Sentença — o próximo capítulo da sua jornada com Madame Aurora.
          </p>
          <div style={{
            display: 'inline-block', padding: '8px 20px', borderRadius: 6,
            border: '1px solid var(--border-subtle)',
            fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-muted)',
          }}>
            Em breve
          </div>
        </div>
      </div>
    </div>
  )
}

export function LeituraCompleta() {
  const profile = useAppStore((s) => s.profile)
  const userId = profile?.id ?? null
  const [leitura, setLeitura] = useState<LeituraData | null>(null)
  const [fase, setFase] = useState<'carregando' | 'leitura' | 'erro'>('carregando')
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (userId) carregar()
  }, [userId])

  const carregar = async () => {
    if (!userId) return
    setFase('carregando')
    setErro('')

    try {
      // 1. Verificar se já existe leitura aprovada no DB
      const { data: existing } = await supabase
        .from('readings')
        .select('id, capitulos, sessao_id')
        .eq('user_id', userId)
        .eq('reading_type', 'core')
        .eq('qualidade_aprovada', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existing?.capitulos) {
        // Buscar marca_adormecida da sessão
        let marca = profile?.marca_adormecida ?? ''
        if (!marca && existing.sessao_id) {
          const { data: sessao } = await supabase
            .from('sessoes')
            .select('marca_adormecida')
            .eq('id', existing.sessao_id)
            .maybeSingle()
          marca = sessao?.marca_adormecida ?? ''
        }
        setLeitura({
          reading_id: existing.id,
          marca_adormecida: marca,
          capitulos: existing.capitulos as Capitulo[],
        })
        setFase('leitura')
        return
      }

      // 2. Buscar sessão mais recente do usuário
      const { data: sessao, error: sessaoErr } = await supabase
        .from('sessoes')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (sessaoErr || !sessao) {
        setErro('Nenhuma sessão encontrada. Complete o quiz para gerar sua leitura.')
        setFase('erro')
        return
      }

      // 3. Chamar gerar-leitura (pode demorar 15-30s)
      const { data: result, error: fnErr } = await supabase.functions.invoke('gerar-leitura', {
        body: { user_id: userId, sessao_id: sessao.id },
      })

      if (fnErr) throw new Error(fnErr.message)
      if (result?.error) throw new Error(result.error)

      // Se retornou capitulos direto (geração nova)
      if (result?.capitulos) {
        setLeitura({
          reading_id: result.reading_id,
          marca_adormecida: result.marca_adormecida ?? '',
          capitulos: result.capitulos,
        })
        setFase('leitura')
        return
      }

      // Cached — buscar do DB
      if (result?.reading_id) {
        const [{ data: reading }, { data: sessaoData }] = await Promise.all([
          supabase.from('readings').select('id, capitulos').eq('id', result.reading_id).single(),
          supabase.from('sessoes').select('marca_adormecida').eq('id', sessao.id).single(),
        ])
        setLeitura({
          reading_id: reading!.id,
          marca_adormecida: sessaoData?.marca_adormecida ?? '',
          capitulos: reading!.capitulos as Capitulo[],
        })
        setFase('leitura')
        return
      }

      throw new Error('Resposta inesperada da função de geração.')
    } catch (err) {
      setErro(err instanceof Error ? err.message : String(err))
      setFase('erro')
    }
  }

  if (fase === 'carregando') return <LoadingLeitura />
  if (fase === 'erro') return <ErroLeitura mensagem={erro} onRetry={carregar} />
  if (!leitura) return null
  return <ExibicaoLeitura leitura={leitura} nome={profile?.name ?? ''} />
}
