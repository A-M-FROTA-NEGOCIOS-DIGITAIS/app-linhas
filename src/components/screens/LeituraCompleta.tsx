import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { marcarAberta } from '@/lib/progresso'
import { useProgressoCapitulo } from '@/hooks/useProgressoCapitulo'
import { useAppStore } from '@/store/app'
import type { Capitulo } from '@/types'
import { SetaCta } from '@/components/ui'
import { AuroraRetrato } from '@/components/ui/Aurora'
import { useFundo } from '@/components/ui/AuroraFundo'
import { TelaGerando } from '@/components/ui/TelaGerando'

function BotaoVoltar({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="absolute left-3 z-20 w-11 h-11 flex items-center justify-center rounded-full"
      style={{ top: 'calc(10px + env(safe-area-inset-top, 0px))', background: 'rgba(12,16,49,.55)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,.1)' }}
      aria-label="Voltar"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9C3DD" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M19 12H5M11 6l-6 6 6 6" />
      </svg>
    </button>
  )
}

interface LeituraData {
  reading_id: string
  marca_adormecida: string
  capitulos: Capitulo[]
  audio_url?: string
  ultimo_capitulo_lido?: number
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI']

const MSGS_CARREGANDO = [
  'Madame Aurora está analisando suas marcas...',
  'Integrando sua palma com suas respostas...',
  'Identificando sua Marca Adormecida...',
  'Preparando sua leitura completa...',
]

function LoadingLeitura() {
  return <TelaGerando mensagens={MSGS_CARREGANDO} rodape="Isso pode levar alguns momentos" />
}

function ErroLeitura({ mensagem, onRetry }: { mensagem: string; onRetry: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-8 gap-5 text-center">
      <AuroraRetrato tamanho={96} aneis={false} />
      <p className="alma-display text-[28px]">Algo deu errado</p>
      <p className="text-[14px] leading-[1.6] text-text-muted">{mensagem}</p>
      <button type="button" className="alma-btn-secondary px-7" onClick={onRetry}>Tentar novamente</button>
    </div>
  )
}

interface ExibicaoProps {
  leitura: LeituraData
  nome: string
  onIrParaEstante: () => void
  registrar: (indice: number) => (el: HTMLElement | null) => void
}

function ExibicaoLeitura({ leitura, nome, onIrParaEstante, registrar }: ExibicaoProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto scroll-area pb-24">
        {/* Cabeçalho */}
        <div className="flex flex-col items-center text-center px-6 pt-[calc(56px+env(safe-area-inset-top,0px))] pb-6">
          <div className="alma-r1"><AuroraRetrato tamanho={84} /></div>
          <p className="alma-r1 alma-eyebrow mt-1">Madame Aurora</p>
          <h1 className="alma-r2 alma-display mt-2 text-[36px]">
            Sua Leitura <span className="alma-grad-text">Completa</span>
          </h1>
        </div>

        {/* Card da Marca Adormecida, com borda aurora */}
        {leitura.marca_adormecida && (
          <div className="alma-r3 alma-aurora-border mx-5 mb-9" style={{ boxShadow: '0 20px 60px rgba(124,92,255,.3)' }}>
            <div className="alma-aurora-border__inner p-5">
              <p className="alma-label">Sua Marca Adormecida</p>
              <p className="mt-2 font-serif italic text-[28px] leading-[1.2] alma-grad-text">
                {leitura.marca_adormecida}
              </p>
              <p className="mt-2 text-[14px] text-text-secondary">
                {nome}, este é o padrão que rege seus relacionamentos.
              </p>
              {leitura.audio_url && (
                <div className="mt-4">
                  <p className="flex items-center gap-2 text-[11px] tracking-[2.5px] uppercase text-gold mb-2">
                    <span className="alma-eq alma-eq--parado" aria-hidden="true"><span /><span /><span /><span /></span>
                    Ouça de Madame Aurora
                  </p>
                  <audio controls src={leitura.audio_url} className="w-full" style={{ height: 40, colorScheme: 'dark' }} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Capítulos */}
        <div className="px-6 flex flex-col gap-12 pb-4">
          {leitura.capitulos.map((cap, i) => (
            <div key={cap.numero ?? i} ref={registrar(i)}>
              {/* Divisor com número romano num medalhão dourado */}
              <div className="flex items-center gap-3 mb-4" aria-hidden="true">
                <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(242,200,121,0), rgba(242,200,121,.45))' }} />
                <span className="flex items-center justify-center w-10 h-10 rounded-full font-serif text-[16px] text-gold-light" style={{ border: '1px solid rgba(242,200,121,.5)', background: 'rgba(242,200,121,.08)' }}>
                  {ROMAN[i] ?? i + 1}
                </span>
                <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(242,200,121,.45), rgba(242,200,121,0))' }} />
              </div>

              <h2 className="alma-display text-center italic text-[26px] mb-4">{cap.titulo}</h2>

              <div className="reading-text">
                {cap.conteudo.split('\n\n').map((para, j) => (
                  <p key={j} className="m-0">{para}</p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Fechamento — convite pra continuar explorando na Estante */}
        <div className="alma-card mx-5 mt-8 mb-10 !py-7 text-center">
          <p className="font-serif italic text-[22px] leading-[1.35] text-cream mb-5">
            Sua leitura termina aqui.<br />
            <span className="alma-grad-text">Sua jornada, não.</span>
          </p>
          <button type="button" className="alma-btn" onClick={onIrParaEstante}>
            <span>Ver minha Estante</span><SetaCta />
          </button>
        </div>
      </div>
    </div>
  )
}

interface Props {
  onBack: () => void
  onIrParaEstante: () => void
}

export function LeituraCompleta({ onBack, onIrParaEstante }: Props) {
  const profile = useAppStore((s) => s.profile)
  const userId = profile?.id ?? null
  const [leitura, setLeitura] = useState<LeituraData | null>(null)
  const [fase, setFase] = useState<'carregando' | 'leitura' | 'erro'>('carregando')
  const [erro, setErro] = useState('')
  const registrar = useProgressoCapitulo(leitura?.reading_id ?? null, leitura?.ultimo_capitulo_lido ?? 0)
  useFundo('revelacao')

  useEffect(() => {
    if (userId) carregar()
  }, [userId])

  useEffect(() => {
    if (leitura?.reading_id) void marcarAberta(leitura.reading_id)
  }, [leitura?.reading_id])

  const carregar = async () => {
    if (!userId) return
    setFase('carregando')
    setErro('')

    try {
      // 1. Verificar se já existe leitura aprovada no DB
      const { data: existing } = await supabase
        .from('readings')
        .select('id, capitulos, sessao_id, audio_url, ultimo_capitulo_lido')
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
          audio_url: existing.audio_url ?? undefined,
          ultimo_capitulo_lido: existing.ultimo_capitulo_lido ?? 0,
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
          ultimo_capitulo_lido: 0,
        })
        setFase('leitura')
        return
      }

      // Cached — buscar do DB
      if (result?.reading_id) {
        const [{ data: reading }, { data: sessaoData }] = await Promise.all([
          supabase.from('readings').select('id, capitulos, audio_url, ultimo_capitulo_lido').eq('id', result.reading_id).single(),
          supabase.from('sessoes').select('marca_adormecida').eq('id', sessao.id).single(),
        ])
        setLeitura({
          reading_id: reading!.id,
          marca_adormecida: sessaoData?.marca_adormecida ?? '',
          capitulos: reading!.capitulos as Capitulo[],
          audio_url: reading!.audio_url ?? undefined,
          ultimo_capitulo_lido: reading!.ultimo_capitulo_lido ?? 0,
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

  if (fase !== 'leitura' || !leitura) {
    return (
      <div className="h-full relative">
        <BotaoVoltar onBack={onBack} />
        {fase === 'carregando' && <LoadingLeitura />}
        {fase === 'erro' && <ErroLeitura mensagem={erro} onRetry={carregar} />}
      </div>
    )
  }

  return (
    <div className="h-full relative">
      <BotaoVoltar onBack={onBack} />
      <ExibicaoLeitura
        leitura={leitura}
        nome={profile?.name ?? ''}
        onIrParaEstante={onIrParaEstante}
        registrar={registrar}
      />
    </div>
  )
}
