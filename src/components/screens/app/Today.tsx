import type { useBiblioteca } from '@/hooks/useBiblioteca'
import { faseDaLua } from '@/lib/leitura'
import type { Profile, Reading } from '@/types'

interface Props {
  profile: Profile
  biblioteca: ReturnType<typeof useBiblioteca>
  onAbrirLeituraCore: () => void
  onAbrirLeitura: (reading: Reading) => void
  onIrParaTema: (tema: string) => void
  onAbrirAurora: () => void
  onReScan: () => void
}

const TEMAS = [
  { key: 'amor', label: 'Amor' },
  { key: 'carreira', label: 'Carreira' },
  { key: 'familia', label: 'Família' },
  { key: 'decisao', label: 'Decisão' },
]

function saudacao(agora = new Date()): string {
  const h = agora.getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function Today({
  profile, biblioteca, onAbrirLeituraCore, onAbrirLeitura,
  onIrParaTema, onAbrirAurora, onReScan,
}: Props) {
  const primeiroNome = profile.name.trim().split(' ')[0]
  const agora = new Date()
  const dataLabel = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })
    .format(agora).toUpperCase()

  const mestra = biblioteca.itens.find((i) => i.produto === 'mestra' && i.pronto)?.reading
  const core = biblioteca.readings.find((r) => r.produto === 'leitura_core')
  const principal = mestra ?? core
  const pendencias = biblioteca.itens.filter((i) => i.precisaAcao)

  return (
    <div className="h-full scroll-area px-6 pt-12 pb-28">
      <div className="flex items-center justify-between">
        <p style={{ fontSize: 11, letterSpacing: '0.1em', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
          {dataLabel}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
          {faseDaLua(agora)}
        </p>
      </div>

      <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontStyle: 'italic', color: 'var(--text-secondary)', marginTop: 18 }}>
        {saudacao(agora)}, {primeiroNome}.
      </p>

      {profile.marca_adormecida && (
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 300, lineHeight: 1.15, color: 'var(--text-primary)', marginTop: 6 }}>
          {profile.marca_adormecida}
        </h1>
      )}

      <div className="flex gap-2 mt-6 overflow-x-auto scroll-area">
        {TEMAS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onIrParaTema(key)}
            style={{
              flexShrink: 0, padding: '6px 14px', borderRadius: 999, fontSize: 13,
              fontFamily: 'var(--font-sans)', border: '1px solid var(--border-subtle)',
              background: 'transparent', color: 'var(--text-secondary)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {principal && (
        <button
          onClick={() => (principal === core ? onAbrirLeituraCore() : onAbrirLeitura(principal))}
          className="text-left w-full mt-6"
          style={{ padding: 18, borderRadius: 10, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
        >
          <p style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-gold)', fontFamily: 'var(--font-sans)' }}>
            {mestra ? 'Sua Leitura Mestra' : 'Sua Leitura Completa'}
          </p>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 300, color: 'var(--text-primary)', marginTop: 8, lineHeight: 1.3 }}>
            <em style={{ color: 'var(--accent-gold)', fontStyle: 'italic' }}>continue de onde parou.</em>
          </p>
          <p className="text-xs text-text-muted mt-2">
            Capítulo {String((principal.ultimo_capitulo_lido ?? 0) + 1).padStart(2, '0')} de{' '}
            {String(principal.capitulos?.length ?? 6).padStart(2, '0')}
          </p>
        </button>
      )}

      {pendencias.length > 0 && (
        <div className="mt-6">
          <p style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', marginBottom: 8 }}>
            Precisa de você
          </p>
          {pendencias.map((item) => (
            <p key={item.produto} className="text-sm text-text-secondary">
              {item.nome} — abra a Estante para concluir
            </p>
          ))}
        </div>
      )}

      <button
        onClick={onAbrirAurora}
        className="text-left w-full mt-6"
        style={{ padding: 18, borderRadius: 10, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
      >
        <p style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-gold)', fontFamily: 'var(--font-sans)' }}>
          Pergunte à Aurora
        </p>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontStyle: 'italic', color: 'var(--text-primary)', marginTop: 8 }}>
          "Por que esse padrão volta sempre?"
        </p>
      </button>

      {!core && (
        <button
          onClick={onReScan}
          className="text-left w-full mt-6"
          style={{ padding: 18, borderRadius: 10, background: 'var(--bg-surface)', border: '1px solid var(--accent-gold)' }}
        >
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-primary)' }}>
            Complete o scan da sua palma
          </p>
          <p className="text-xs text-text-muted mt-1">
            Sem ele a Madame Aurora não consegue ler suas linhas.
          </p>
        </button>
      )}
    </div>
  )
}
