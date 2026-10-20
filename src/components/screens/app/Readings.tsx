import { useMemo, useState } from 'react'
import type { useBiblioteca } from '@/hooks/useBiblioteca'
import { calcularStreak, tempoDeLeitura } from '@/lib/leitura'
import type { ItemBiblioteca, Reading } from '@/types'
import { TabBarIcons } from '@/components/ui'
import { useFundo } from '@/components/ui/AuroraFundo'

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

/** Capa colorida por tipo (referência L11): Completa dourado, Mestra rosa→violeta, Temática rosa, Diária verde-água→violeta. */
function capa(reading: Reading): { c1: string; c2: string; tag: string; glifo: string } {
  if (reading.produto === 'leitura_core') return { c1: '#F2C879', c2: '#C98F35', tag: '#F2C879', glifo: 'I' }
  if (reading.produto === 'mestra') return { c1: '#E26AA0', c2: '#7C5CFF', tag: '#F7C9DD', glifo: 'II' }
  if (reading.reading_type === 'themed') return { c1: '#F49AC1', c2: '#E26AA0', tag: '#F7C9DD', glifo: '♡' }
  if (reading.reading_type === 'daily') return { c1: '#3FD6C2', c2: '#7C5CFF', tag: '#9FF0E2', glifo: '☾' }
  return { c1: '#9C86FF', c2: '#3B2E8C', tag: '#CFC4FF', glifo: '✦' }
}

/** Quanto da leitura já foi lido: capítulos lidos, ou aberta/não aberta para as de um bloco só. */
function progresso(reading: Reading): number {
  const caps = reading.capitulos?.length ?? 0
  if (caps > 0) return Math.min(100, Math.round(((reading.ultimo_capitulo_lido ?? 0) / caps) * 100))
  return reading.aberta_em ? 100 : 0
}

function dataCurta(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(iso))
}

export function Readings({ biblioteca, temaFiltro, onLimparTema, onAbrirLeituraCore, onAbrirLeitura }: Props) {
  const [filtro, setFiltro] = useState<Filtro>(temaFiltro ? 'tematicas' : 'todas')
  useFundo('leituras')

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
    <div className="h-full scroll-area px-5 pt-[calc(30px+env(safe-area-inset-top,0px))] alma-com-tabbar">
      <span className="alma-r1 block text-[12px] tracking-[2.5px] uppercase text-text-muted">Leituras · {biblioteca.readings.length}</span>
      <h1 className="alma-r1 alma-display mt-2.5 text-[40px] leading-none">
        Suas <span className="alma-grad-text">leituras.</span>
      </h1>
      <p className="alma-r1 mt-2 text-[14px] text-text-muted">
        {capitulos} capítulos{streak > 0 ? ` · ${streak} dias seguidos` : ''}
      </p>

      <div role="tablist" className="alma-r2 flex gap-2 mt-[18px] overflow-x-auto no-scrollbar -mx-5 px-5">
        {FILTROS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={filtro === key}
            aria-pressed={filtro === key}
            onClick={() => setFiltro(key)}
            className="alma-chip flex-shrink-0"
          >
            {label}
          </button>
        ))}
        {temaFiltro && (
          <button type="button" onClick={onLimparTema} className="alma-chip alma-chip--rose flex-shrink-0">
            {temaFiltro} ×
          </button>
        )}
      </div>

      {lista.length === 0 ? (
        <div className="alma-r3 alma-card flex flex-col items-center text-center gap-3 mt-6 !py-8">
          <span className="flex items-center justify-center w-14 h-14 rounded-[18px]" style={{ background: 'linear-gradient(135deg, rgba(242,200,121,.22), rgba(124,92,255,.22))', border: '1px solid rgba(242,200,121,.4)' }}>
            {TabBarIcons.readings({ size: 26 })}
          </span>
          <p className="text-[15px] leading-[1.5] text-text-secondary max-w-[260px]">
            Nada por aqui ainda. O que você comprar na Estante aparece nesta lista.
          </p>
        </div>
      ) : (
        <div className="alma-r3 flex flex-col gap-3 mt-[18px]">
          {lista.map((reading) => {
            const c = capa(reading)
            const pct = progresso(reading)
            return (
              <button
                key={reading.id}
                type="button"
                onClick={() => (reading.produto === 'leitura_core' ? onAbrirLeituraCore() : onAbrirLeitura(reading))}
                className="alma-card alma-card--link flex gap-3.5 !p-3.5"
              >
                <span
                  className="flex items-center justify-center flex-shrink-0 rounded-2xl"
                  style={{ width: 64, height: 84, background: `linear-gradient(160deg, ${c.c1}, ${c.c2})`, boxShadow: `0 8px 24px ${c.c2}55` }}
                >
                  <span className="font-serif text-[26px] font-semibold text-cream">{c.glifo}</span>
                </span>
                <span className="flex-grow flex flex-col min-w-0">
                  <span className="text-[10.5px] tracking-[2px] uppercase" style={{ color: c.tag }}>{nomeDoTipo(reading, biblioteca.itens)}</span>
                  <span className="mt-1 font-serif text-[21px] leading-[1.15] text-cream">
                    {reading.titulo ?? nomeDoTipo(reading, biblioteca.itens)}
                  </span>
                  <span className="mt-1 text-[12.5px] text-[#8E89AE]">
                    {[reading.traco_origem, `${tempoDeLeitura(reading.word_count)} min`, dataCurta(reading.created_at)].filter(Boolean).join(' · ')}
                  </span>
                  <span className="alma-bar mt-2.5" style={{ height: 4 }}>
                    <span style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${c.c1}, ${c.c2})` }} />
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
