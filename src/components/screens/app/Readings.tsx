import { useMemo, useState } from 'react'
import type { useBiblioteca } from '@/hooks/useBiblioteca'
import { calcularStreak, tempoDeLeitura } from '@/lib/leitura'
import type { ItemBiblioteca, Reading } from '@/types'

type Filtro = 'todas' | 'diarias' | 'tematicas' | 'produtos'

interface Props {
  biblioteca: ReturnType<typeof useBiblioteca>
  temaFiltro: string | null
  onLimparTema: () => void
  onAbrirLeituraCore: () => void
  onAbrirLeitura: (reading: Reading) => void
}

const FILTROS: { key: Filtro; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'diarias', label: 'Diárias' },
  { key: 'tematicas', label: 'Temáticas' },
  { key: 'produtos', label: 'Produtos' },
]

/**
 * Nomes que o catalogo do banco nao cobre. O catalogo (produtos_catalogo) e a
 * fonte de verdade dos 9 add-ons; estes tres nao sao produtos vendidos e por
 * isso vivem aqui. Nao acrescentar nomes de add-on nesta lista.
 */
const TITULOS_FORA_DO_CATALOGO: Record<string, string> = {
  leitura_core: 'Leitura Completa',
  daily: 'Diária',
  themed: 'Temática',
}

/** Nome de exibicao de uma leitura: catalogo do banco primeiro, sempre. */
function nomeDoTipo(reading: Reading, itens: ItemBiblioteca[]): string {
  const doCatalogo = itens.find((i) => i.produto === reading.produto)?.nome
  if (doCatalogo) return doCatalogo
  const foraDoCatalogo =
    (reading.produto ? TITULOS_FORA_DO_CATALOGO[reading.produto] : undefined) ??
    TITULOS_FORA_DO_CATALOGO[reading.reading_type]
  return foraDoCatalogo ?? reading.titulo ?? 'Leitura'
}

function pertence(reading: Reading, filtro: Filtro): boolean {
  if (filtro === 'todas') return true
  if (filtro === 'diarias') return reading.reading_type === 'daily'
  if (filtro === 'tematicas') return reading.reading_type === 'themed'
  return reading.reading_type !== 'daily' && reading.reading_type !== 'themed'
}

function dataCurta(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(iso))
}

export function Readings({ biblioteca, temaFiltro, onLimparTema, onAbrirLeituraCore, onAbrirLeitura }: Props) {
  const [filtro, setFiltro] = useState<Filtro>(temaFiltro ? 'tematicas' : 'todas')

  const lista = useMemo(() => {
    return [...biblioteca.readings]
      .filter((r) => pertence(r, filtro))
      .filter((r) => !temaFiltro || r.theme === temaFiltro)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  }, [biblioteca.readings, filtro, temaFiltro])

  const capitulos = biblioteca.readings.reduce((s, r) => s + (r.capitulos?.length ?? 0), 0)
  const streak = calcularStreak(
    biblioteca.readings.filter((r) => r.reading_type === 'daily' && r.aberta_em)
      .map((r) => (r.data_carta ?? r.created_at).slice(0, 10)),
  )

  return (
    <div className="h-full scroll-area px-6 pt-12 pb-28">
      <p style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
        Leituras · {biblioteca.readings.length}
      </p>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 34, fontWeight: 300, color: 'var(--text-primary)', marginTop: 6 }}>
        Suas <em style={{ color: 'var(--accent-gold)', fontStyle: 'italic' }}>leituras</em>.
      </h1>
      <p className="text-xs text-text-muted mt-1">
        {capitulos} capítulos{streak > 0 ? ` · ${streak} dias seguidos` : ''}
      </p>

      <div className="flex gap-2 mt-5 overflow-x-auto scroll-area">
        {FILTROS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFiltro(key)}
            style={{
              flexShrink: 0, padding: '6px 14px', borderRadius: 999, fontSize: 13,
              fontFamily: 'var(--font-sans)',
              border: `1px solid ${filtro === key ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
              background: filtro === key ? 'var(--accent-gold)' : 'transparent',
              color: filtro === key ? 'var(--bg-primary)' : 'var(--text-secondary)',
            }}
          >
            {label}
          </button>
        ))}
        {temaFiltro && (
          <button
            onClick={onLimparTema}
            style={{
              flexShrink: 0, padding: '6px 14px', borderRadius: 999, fontSize: 13,
              fontFamily: 'var(--font-sans)', border: '1px solid var(--accent-gold)',
              background: 'rgba(201,169,97,0.1)', color: 'var(--accent-gold)',
            }}
          >
            {temaFiltro} ×
          </button>
        )}
      </div>

      {lista.length === 0 ? (
        <p className="text-sm text-text-muted mt-10">
          Nada por aqui ainda. O que você comprar na Estante aparece nesta lista.
        </p>
      ) : (
        <div className="flex flex-col gap-2 mt-6">
          {lista.map((reading, i) => (
            <button
              key={reading.id}
              onClick={() => (reading.produto === 'leitura_core' ? onAbrirLeituraCore() : onAbrirLeitura(reading))}
              className="text-left"
              style={{ display: 'flex', gap: 14, padding: '14px 16px', borderRadius: 8, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
            >
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 300, color: 'var(--accent-gold)', lineHeight: 1.2, minWidth: 28 }}>
                {String(lista.length - i).padStart(2, '0')}
              </span>
              <span className="flex-1">
                <span className="flex items-center justify-between">
                  <span style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-gold)', fontFamily: 'var(--font-sans)' }}>
                    {nomeDoTipo(reading, biblioteca.itens)}
                  </span>
                  <span className="text-[10px] text-text-muted">{dataCurta(reading.created_at)}</span>
                </span>
                <span style={{ display: 'block', fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--text-primary)', marginTop: 4 }}>
                  {reading.titulo ?? nomeDoTipo(reading, biblioteca.itens)}
                </span>
                <span className="block text-[11px] text-text-muted mt-1">
                  {[reading.traco_origem, `${tempoDeLeitura(reading.word_count)} min`].filter(Boolean).join(' · ')}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
