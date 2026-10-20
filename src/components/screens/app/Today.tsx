import { useEffect, useState } from 'react'
import type { useBiblioteca } from '@/hooks/useBiblioteca'
import { faseDaLua } from '@/lib/leitura'
import { supabase } from '@/lib/supabase'
import { AuroraAvatar } from '@/components/ui/Aurora'
import { useFundo } from '@/components/ui/AuroraFundo'
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

/**
 * Se a pessoa já tem algum scan da palma. O cartão "Complete o scan" dependia de existir
 * a leitura completa, e aparecia para quem fez o scan e pulou o paywall (bug 1 do
 * handoff). null = ainda carregando (não mostra nada).
 */
function useTemScan(userId: string): boolean | null {
  const [tem, setTem] = useState<boolean | null>(null)
  useEffect(() => {
    let vivo = true
    supabase
      .from('palm_scans')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .then(({ count, error }) => {
        if (!vivo) return
        if (error) { console.error('Today: palm_scans', error.message); setTem(true); return }
        setTem((count ?? 0) > 0)
      })
    return () => { vivo = false }
  }, [userId])
  return tem
}

/** Ícone da fase da lua: metade iluminada (crescente à direita, minguante à esquerda). */
function IconeLua({ fase }: { fase: string }) {
  const cheia = /cheia/i.test(fase)
  const nova = /nova/i.test(fase)
  const minguante = /minguante/i.test(fase)
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill={cheia ? '#FFE3A8' : '#2A2E5E'} />
      {!cheia && !nova && <path d={minguante ? 'M12 3a9 9 0 0 0 0 18z' : 'M12 3a9 9 0 0 1 0 18z'} fill="#FFE3A8" />}
    </svg>
  )
}

const Seta = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F2C879" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="flex-shrink-0">
    <path d="M9 6l6 6-6 6" />
  </svg>
)

// Referência: app/reference/L10-Hoje
export function Today({
  profile, biblioteca, onAbrirLeituraCore, onAbrirLeitura,
  onIrParaTema, onAbrirAurora, onReScan,
}: Props) {
  useFundo('hoje')
  const temScan = useTemScan(profile.id)
  const primeiroNome = profile.name.trim().split(' ')[0]
  const agora = new Date()
  const dataLabel = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })
    .format(agora).toUpperCase()
  const fase = faseDaLua(agora)

  const mestra = biblioteca.itens.find((i) => i.produto === 'mestra' && i.pronto)?.reading
  const core = biblioteca.readings.find((r) => r.produto === 'leitura_core')
  const principal = mestra ?? core
  const pendencias = biblioteca.itens.filter((i) => i.precisaAcao)

  // Continue lendo: próximo capítulo e progresso real (readings.ultimo_capitulo_lido)
  const lidos = principal?.ultimo_capitulo_lido ?? 0
  const totalCaps = principal?.capitulos?.length ?? 6
  const proximo = principal?.capitulos?.[Math.min(lidos, totalCaps - 1)]

  return (
    <div className="h-full scroll-area px-5 pt-[calc(30px+env(safe-area-inset-top,0px))] alma-com-tabbar">
      <div className="alma-r1 flex items-center justify-between">
        <span className="text-[12px] tracking-[2.5px] text-text-muted">{dataLabel}</span>
        <span className="alma-pill"><IconeLua fase={fase} />{fase}</span>
      </div>
      <h1 className="alma-r1 alma-display mt-3.5 text-[38px] leading-[1.05]">
        {saudacao(agora)}, <span className="alma-grad-text">{primeiroNome}.</span>
      </h1>

      {profile.marca_adormecida && (
        <p className="alma-r2 mt-3 font-serif italic text-[24px] leading-[1.25] text-gold-text">{profile.marca_adormecida}</p>
      )}

      <div className="alma-r3 flex gap-2 mt-[18px] flex-wrap">
        {TEMAS.map(({ key, label }, i) => (
          <button key={key} type="button" onClick={() => onIrParaTema(key)} className={`alma-chip ${i === 0 ? 'alma-chip--rose' : ''}`}>
            {i === 0 ? `♡ ${label}` : label}
          </button>
        ))}
      </div>

      {principal && (
        <button
          type="button"
          onClick={() => (principal === core ? onAbrirLeituraCore() : onAbrirLeitura(principal))}
          className="alma-r4 alma-card alma-card--gold alma-card--link flex flex-col mt-[18px] !px-[18px] !py-4"
        >
          <span className="flex items-center justify-between w-full">
            <span className="text-[11px] tracking-[2.5px] uppercase text-gold">{mestra ? 'Sua Leitura Mestra' : 'Sua Leitura Completa'}</span>
            <span className="text-[12px] text-[#8E89AE]">
              Capítulo {String(lidos + 1).padStart(2, '0')} de {String(totalCaps).padStart(2, '0')}
            </span>
          </span>
          <span className="mt-2 font-serif text-[22px] leading-[1.25] text-cream">
            {proximo?.titulo ?? <em className="text-gold-text">continue de onde parou.</em>}
          </span>
          <span className="alma-bar w-full mt-3" style={{ height: 4 }}>
            <span style={{ width: `${Math.round((lidos / Math.max(1, totalCaps)) * 100)}%`, background: 'linear-gradient(90deg, #FFD98E, #F49AC1)' }} />
          </span>
        </button>
      )}

      {pendencias.length > 0 && (
        <div className="alma-r4 alma-card mt-3.5">
          <span className="alma-label">Precisa de você</span>
          {pendencias.map((item) => (
            <p key={item.produto} className="mt-2 text-[14px] text-text-secondary">
              {item.nome} — abra a Estante para concluir
            </p>
          ))}
        </div>
      )}

      <button type="button" onClick={onAbrirAurora} className="alma-r4 alma-card alma-card--aurora alma-card--link flex items-center gap-3.5 mt-3.5 !p-4">
        <AuroraAvatar tamanho={50} />
        <span className="flex-grow">
          <span className="block text-[11px] tracking-[2.5px] uppercase text-violet-text">Pergunte à Aurora</span>
          <span className="block mt-1 font-serif italic text-[19px] leading-[1.25] text-cream">"Por que esse padrão volta sempre?"</span>
        </span>
        <Seta />
      </button>

      {temScan === false && (
        <button type="button" onClick={onReScan} className="alma-r4 alma-card alma-card--gold alma-card--link flex items-center gap-3.5 mt-3.5">
          <span className="flex-grow">
            <span className="block text-[15px] text-cream">Complete o scan da sua palma</span>
            <span className="block mt-1 text-[13px] text-text-muted">Sem ele a Madame Aurora não consegue ler suas linhas.</span>
          </span>
          <Seta />
        </button>
      )}
    </div>
  )
}
