import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Assinatura, Releitura } from '@/types'
import { BotaoVoltar } from '@/components/ui'
import { useFundo } from '@/components/ui/AuroraFundo'

interface Props {
  userId: string
  /** Link de compra do catálogo (produtos_catalogo.checkout_url do despertar). */
  checkoutUrl?: string | null
  onBack: () => void
}


function formatarData(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export function DespertarView({ userId, checkoutUrl, onBack }: Props) {
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null)
  const [releituras, setReleituras] = useState<Releitura[]>([])
  const [temMestra, setTemMestra] = useState(false)
  const [carregado, setCarregado] = useState(false)
  useFundo('estante')

  useEffect(() => {
    Promise.all([
      supabase.from('assinaturas').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('releituras').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('compras').select('id').eq('user_id', userId).eq('produto', 'mestra').eq('status', 'aprovado').limit(1).maybeSingle(),
    ]).then(([{ data: a }, { data: r }, { data: mestra }]) => {
      setAssinatura(a as Assinatura | null)
      setReleituras((r as Releitura[]) ?? [])
      setTemMestra(!!mestra)
      setCarregado(true)
    })
  }, [userId])

  if (!carregado) return null

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto scroll-area px-6 pt-[calc(22px+env(safe-area-inset-top,0px))] pb-8">
        <BotaoVoltar onClick={onBack} />

        {/* Ícone do Despertar: re-leitura a cada três meses (faixa verde-água da Estante) */}
        <span className="alma-r1 flex items-center justify-center w-[60px] h-[60px] rounded-[18px] mt-5" style={{ background: 'linear-gradient(160deg, #3FD6C2, #7C5CFF)', boxShadow: '0 10px 30px rgba(63,214,194,.35)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5" /></svg>
        </span>

        <p className="alma-r1 mt-4 text-[11px] tracking-[3px] uppercase text-teal-text">O Despertar</p>
        <h1 className="alma-r1 alma-display mt-2 mb-6 text-[32px]">
          Sua marca muda com o tempo.<br />
          <span className="alma-grad-text">Acompanhe a evolução dela.</span>
        </h1>

        {assinatura?.status === 'ativa' ? (
          <>
            <div
              className="px-5 py-4 mb-8 rounded-[22px]"
              style={{ background: 'linear-gradient(135deg, rgba(63,214,194,.14), rgba(124,92,255,.14))', border: '1px solid rgba(63,214,194,.35)' }}
            >
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>
                Assinatura ativa · próxima re-leitura em {formatarData(assinatura.proxima_releitura)}
              </p>
            </div>

            {releituras.length === 0 ? (
              <p style={{ fontSize: 14, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
                Sua primeira re-leitura chega automaticamente na data acima.
              </p>
            ) : (
              <div className="flex flex-col gap-6">
                {releituras.map((r) => (
                  <div key={r.id}>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{formatarData(r.created_at)}</p>
                    {(r.capitulos ?? []).map((c, i) => (
                      <div key={i} className="mb-4">
                        <h3 className="alma-display italic text-[22px] mb-2">
                          {c.titulo}
                        </h3>
                        <p className="reading-text m-0">{c.conteudo}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : temMestra ? (
          <>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
              O Despertar é a assinatura trimestral de Madame Aurora — a cada 90 dias, uma nova leitura mostrando como sua marca evoluiu.
            </p>
            {checkoutUrl ? (
              <a href={checkoutUrl} className="alma-btn">
                <span>Assinar o Despertar</span>
              </a>
            ) : (
              <button type="button" className="alma-btn" disabled style={{ opacity: 0.55 }}>
                <span>Em breve</span>
              </button>
            )}
          </>
        ) : (
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            O Despertar é exclusivo para quem já tem a Leitura Mestra — é ela que dá a profundidade
            necessária para acompanhar como sua marca evolui a cada re-leitura.
          </p>
        )}
      </div>
    </div>
  )
}
