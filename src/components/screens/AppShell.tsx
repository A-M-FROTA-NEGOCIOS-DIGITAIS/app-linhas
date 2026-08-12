import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TabBar, TabBarIcons, type TabDef } from '@/components/ui'
import { useAppStore } from '@/store/app'
import { supabase } from '@/lib/supabase'
import { useBiblioteca } from '@/hooks/useBiblioteca'
import { Today } from './app/Today'
import { Readings } from './app/Readings'
import { AuroraChat } from './app/AuroraChat'
import { Profile } from './app/Profile'
import { Estante } from './app/Estante'
import { AddonReadingView } from './app/AddonReadingView'
import { SentencaView } from './app/SentencaView'
import { DespertarView } from './app/DespertarView'
import { TerceiroForm } from './app/TerceiroForm'
import { OutraMaoFlow } from './app/OutraMaoFlow'
import { LeituraCompleta } from './LeituraCompleta'
import { PalmScan } from './onboarding/PalmScan'
import { Scanning } from './onboarding/Scanning'
import { IntentionScreen } from './onboarding/Intention'
import type { Reading, Intention } from '@/types'

type Aba = 'today' | 'readings' | 'aurora' | 'estante' | 'you'

const ABAS: TabDef[] = [
  { id: 'today', label: 'Hoje', icon: TabBarIcons.today },
  { id: 'readings', label: 'Leituras', icon: TabBarIcons.readings },
  { id: 'aurora', label: 'Aurora', icon: TabBarIcons.aurora },
  { id: 'estante', label: 'Estante', icon: TabBarIcons.grid },
  { id: 'you', label: 'Você', icon: TabBarIcons.you },
]

/**
 * Nomes que o catalogo do banco nao cobre. O catalogo (produtos_catalogo) e a
 * fonte de verdade dos 9 add-ons; estes tres nao sao produtos vendidos e por
 * isso vivem aqui. Nao acrescentar nomes de add-on nesta lista.
 */
const TITULOS_FORA_DO_CATALOGO: Record<string, string> = {
  leitura_core: 'Leitura Completa',
  daily: 'Carta do Dia',
  themed: 'Leitura Temática',
}

type Overlay =
  | { type: 'leitura'; reading: Reading }
  | { type: 'leitura-core' }
  | { type: 'sentenca'; reading: Reading }
  | { type: 'despertar' }
  | { type: 'terceiro'; produto: 'compatibilidade' | 'quem_ama' }
  | { type: 'outra-mao' }
  | { type: 'rescan' }
  | { type: 'scanning'; imageDataUrl: string }
  | { type: 'intencao' }
  | null

interface Props {
  onSignOut: () => void
}

export function AppShell({ onSignOut }: Props) {
  const { t } = useTranslation()
  const profile = useAppStore((s) => s.profile)
  const setProfile = useAppStore((s) => s.setProfile)
  const [activeTab, setActiveTab] = useState<Aba>('today')
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [temaFiltro, setTemaFiltro] = useState<string | null>(null)
  const biblioteca = useBiblioteca(profile?.id ?? null)

  if (!profile) return null

  const fecharOverlay = () => setOverlay(null)

  /** Nome de exibicao de uma leitura: catalogo do banco primeiro, sempre. */
  const resolverTitulo = (reading: Reading): string => {
    const doCatalogo = biblioteca.itens.find((i) => i.produto === reading.produto)?.nome
    if (doCatalogo) return doCatalogo
    const foraDoCatalogo =
      (reading.produto ? TITULOS_FORA_DO_CATALOGO[reading.produto] : undefined) ??
      TITULOS_FORA_DO_CATALOGO[reading.reading_type]
    return foraDoCatalogo ?? reading.titulo ?? 'Leitura'
  }

  const abrirLeitura = (reading: Reading) => {
    setOverlay(
      reading.produto === 'sentenca'
        ? { type: 'sentenca', reading }
        : { type: 'leitura', reading },
    )
  }

  const abrirLeituraCore = () => setOverlay({ type: 'leitura-core' })

  const irParaTema = (tema: string) => {
    setTemaFiltro(tema)
    setActiveTab('readings')
  }

  const handleReScan = () => setOverlay({ type: 'rescan' })

  const handleScanCapture = (imageDataUrl: string) => {
    setOverlay({ type: 'scanning', imageDataUrl })
  }

  const handleScanComplete = async (_analise: unknown) => {
    await biblioteca.recarregar()
    setOverlay(null)
  }

  const handleFluxoConcluido = async () => {
    await biblioteca.recarregar()
    setOverlay(null)
  }

  const handleChangeIntention = async (intention: Intention) => {
    const { error } = await supabase.from('profiles').update({ intention }).eq('id', profile.id)
    if (error) {
      console.error('AppShell: falha ao salvar a intencao', error.message)
      return
    }
    setProfile({ ...profile, intention })
    setOverlay(null)
  }

  // Overlays ocupam a tela inteira e escondem a TabBar.
  if (overlay) {
    if (overlay.type === 'leitura') {
      return (
        <AddonReadingView
          reading={overlay.reading}
          titulo={resolverTitulo(overlay.reading)}
          onBack={fecharOverlay}
        />
      )
    }
    if (overlay.type === 'leitura-core') {
      return (
        <LeituraCompleta
          onBack={fecharOverlay}
          onIrParaEstante={() => { setOverlay(null); setActiveTab('estante') }}
        />
      )
    }
    if (overlay.type === 'sentenca') {
      return <SentencaView reading={overlay.reading} onBack={fecharOverlay} />
    }
    if (overlay.type === 'despertar') {
      return <DespertarView userId={profile.id} onBack={fecharOverlay} />
    }
    if (overlay.type === 'terceiro') {
      return (
        <TerceiroForm
          userId={profile.id}
          produto={overlay.produto}
          onDone={handleFluxoConcluido}
          onBack={fecharOverlay}
        />
      )
    }
    if (overlay.type === 'outra-mao') {
      return (
        <OutraMaoFlow
          userId={profile.id}
          onDone={handleFluxoConcluido}
          onBack={fecharOverlay}
        />
      )
    }
    if (overlay.type === 'rescan') {
      return <PalmScan onCapture={handleScanCapture} onBack={fecharOverlay} />
    }
    if (overlay.type === 'scanning') {
      return (
        <Scanning
          imageDataUrl={overlay.imageDataUrl}
          userId={profile.id}
          onComplete={handleScanComplete}
          onBack={() => setOverlay({ type: 'rescan' })}
        />
      )
    }
    if (overlay.type === 'intencao') {
      return (
        <IntentionScreen
          initialValue={profile.intention ?? undefined}
          eyebrow={t('profile.yourIntention')}
          onContinue={handleChangeIntention}
          onBack={fecharOverlay}
        />
      )
    }
  }

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex-1 overflow-hidden">
        {activeTab === 'today' && (
          <Today
            profile={profile}
            biblioteca={biblioteca}
            onAbrirLeituraCore={abrirLeituraCore}
            onAbrirLeitura={abrirLeitura}
            onIrParaTema={irParaTema}
            onAbrirAurora={() => setActiveTab('aurora')}
            onReScan={handleReScan}
          />
        )}
        {activeTab === 'readings' && (
          <Readings
            biblioteca={biblioteca}
            temaFiltro={temaFiltro}
            onLimparTema={() => setTemaFiltro(null)}
            onAbrirLeituraCore={abrirLeituraCore}
            onAbrirLeitura={abrirLeitura}
          />
        )}
        {activeTab === 'aurora' && <AuroraChat profile={profile} />}
        {activeTab === 'estante' && (
          <Estante
            itens={biblioteca.itens}
            assinatura={biblioteca.assinatura}
            onOpenReading={abrirLeitura}
            onOpenDespertar={() => setOverlay({ type: 'despertar' })}
            onPreencherTerceiro={(produto) => setOverlay({ type: 'terceiro', produto })}
            onEscanearOutraMao={() => setOverlay({ type: 'outra-mao' })}
            onRecarregar={() => void biblioteca.recarregar()}
          />
        )}
        {activeTab === 'you' && (
          <Profile
            profile={profile}
            biblioteca={biblioteca}
            onReScan={handleReScan}
            onSignOut={onSignOut}
            onChangeIntention={() => setOverlay({ type: 'intencao' })}
            onAbrirDespertar={() => setOverlay({ type: 'despertar' })}
          />
        )}
      </div>

      <TabBar
        tabs={ABAS}
        active={activeTab}
        onChange={(id) => setActiveTab(id as Aba)}
      />
    </div>
  )
}
