import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Assinatura, Releitura } from '@/types'

interface Props {
  userId: string
  onBack: () => void
}

const BackIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M11 5l-7 7 7 7" />
  </svg>
)

const CHECKOUT_URL = import.meta.env.VITE_BLUEN_CHECKOUT_URL ?? '#'

function formatarData(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export function DespertarView({ userId, onBack }: Props) {
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null)
  const [releituras, setReleituras] = useState<Releitura[]>([])
  const [carregado, setCarregado] = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('assinaturas').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('releituras').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    ]).then(([{ data: a }, { data: r }]) => {
      setAssinatura(a as Assinatura | null)
      setReleituras((r as Releitura[]) ?? [])
      setCarregado(true)
    })
  }, [userId])

  if (!carregado) return null

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto scroll-area px-6 pt-12 pb-8">
        <button onClick={onBack} className="text-text-secondary active:text-text-primary transition-colors mb-6">
          <BackIcon />
        </button>

        <p style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent-gold)', fontFamily: 'var(--font-sans)', marginBottom: 8 }}>
          O Despertar
        </p>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 300, color: 'var(--text-primary)', marginBottom: 24, lineHeight: 1.3 }}>
          Sua marca muda com o tempo.<br />
          <em style={{ color: 'var(--accent-gold)', fontStyle: 'italic' }}>Acompanhe a evolução dela.</em>
        </h1>

        {assinatura?.status === 'ativa' ? (
          <>
            <div
              className="px-5 py-4 mb-8"
              style={{ borderRadius: 8, border: '1px solid var(--accent-gold)', background: 'rgba(201,169,97,0.06)' }}
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
                        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 17, fontStyle: 'italic', color: 'var(--text-primary)', marginBottom: 6 }}>
                          {c.titulo}
                        </h3>
                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{c.conteudo}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
              O Despertar é a assinatura trimestral de Madame Aurora — a cada 90 dias, uma nova leitura mostrando como sua marca evoluiu.
            </p>
            <a
              href={CHECKOUT_URL}
              style={{
                display: 'inline-block', padding: '12px 24px', borderRadius: 6,
                background: 'var(--accent-gold)', color: 'var(--bg-primary)',
                fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, textDecoration: 'none',
              }}
            >
              Assinar o Despertar
            </a>
          </>
        )}
      </div>
    </div>
  )
}
