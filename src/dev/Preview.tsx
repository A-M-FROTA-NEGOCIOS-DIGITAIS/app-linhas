/**
 * Só em desenvolvimento (main.tsx, ?preview=<tela>): cada tela isolada, com dados de
 * exemplo, para comparar com as referências do design (app/reference) sem login.
 * Nada daqui entra no build de produção.
 */
import { Splash } from '@/components/screens/onboarding/Splash'
import { Intro } from '@/components/screens/onboarding/Intro'
import { EmailEntry } from '@/components/screens/onboarding/EmailEntry'
import { VerifyEmail } from '@/components/screens/onboarding/VerifyEmail'
import { BasicData } from '@/components/screens/onboarding/BasicData'
import { QuizScreen } from '@/components/screens/onboarding/Quiz'
import { PalmScan } from '@/components/screens/onboarding/PalmScan'
import { Scanning } from '@/components/screens/onboarding/Scanning'
import { Revelation } from '@/components/screens/onboarding/Revelation'
import { Paywall } from '@/components/screens/onboarding/Paywall'
import { Welcome } from '@/components/screens/onboarding/Welcome'
import type { PalmAnalysis, Profile, Reading, ItemBiblioteca } from '@/types'
import { TabBar, TabBarIcons, type TabDef } from '@/components/ui'
import { Today } from '@/components/screens/app/Today'
import { Readings } from '@/components/screens/app/Readings'
import { AuroraChat } from '@/components/screens/app/AuroraChat'
import { Estante } from '@/components/screens/app/Estante'
import { Profile as Voce } from '@/components/screens/app/Profile'
import { IntentionScreen } from '@/components/screens/onboarding/Intention'
import { TerceiroForm } from '@/components/screens/app/TerceiroForm'
import { SemAcesso } from '@/components/screens/SemAcesso'
import { TelaGerando } from '@/components/ui/TelaGerando'
import { AddonReadingView } from '@/components/screens/app/AddonReadingView'

const ANALISE = {
  hand_shape: 'earth',
  dominant_hand: true,
  image_quality: 'high',
  is_palm: true,
  main_lines: {
    life_line: { length: 'long', depth: 'deep', characteristic: 'clear', interpretation: '' },
    heart_line: { length: 'long', depth: 'deep', characteristic: 'branches', interpretation: '' },
    head_line: { length: 'long', depth: 'medium', characteristic: '', interpretation: '' },
    fate_line: { present: true, length: 'medium', characteristic: '', interpretation: '' },
  },
  mounts: {},
  special_marks: [],
  overall_character: '',
} as unknown as PalmAnalysis

const PREVIA = 'Marina, sua palma revela um padrão que você provavelmente já sentiu, mas nunca soube nomear… A linha do coração se curva em direção ao indicador e se divide perto do monte de Mercúrio, o que costuma aparecer em quem ama inteiro e sente as perdas mais fundo.'

const nada = () => {}

const PERFIL = {
  id: 'preview', name: 'Marina Teste', date_of_birth: '1992-03-14', city_of_birth: 'Belo Horizonte, MG',
  intention: 'love_patterns', marca_adormecida: 'A Chama Que Se Doa', created_at: '2026-10-02T12:00:00Z',
} as unknown as Profile

const CAPS = [
  { numero: 1, titulo: 'A Marca do Coração', conteudo: 'Marina, o seu coração não é impulsivo por descuido. Ele é generoso por convicção.\n\nDesde cedo, você aprendeu uma equação silenciosa: presença se conquista com entrega.' },
  { numero: 2, titulo: 'De onde vem a sua Marca Adormecida', conteudo: 'A Chama Que Se Doa não nasceu numa relação romântica.' },
  { numero: 3, titulo: 'A Marca da Vida', conteudo: '…' }, { numero: 4, titulo: 'A Marca Adormecida', conteudo: '…' },
  { numero: 5, titulo: 'Como ela rege o seu padrão', conteudo: '…' }, { numero: 6, titulo: 'O primeiro passo', conteudo: '…' },
]
const LEITURAS = [
  { id: 'r1', user_id: 'p', reading_type: 'master', produto: 'leitura_core', capitulos: CAPS, ultimo_capitulo_lido: 1, titulo: 'A sua Marca Adormecida', word_count: 2200, created_at: '2026-10-12T10:00:00Z' },
  { id: 'r2', user_id: 'p', reading_type: 'master', produto: 'mestra', capitulos: CAPS, ultimo_capitulo_lido: 2, titulo: 'De onde vem o seu padrão', word_count: 3400, created_at: '2026-10-14T10:00:00Z' },
  { id: 'r3', user_id: 'p', reading_type: 'themed', theme: 'amor', titulo: 'Por que você escolhe quem escolhe', aberta_em: '2026-10-15T10:00:00Z', word_count: 600, created_at: '2026-10-15T10:00:00Z' },
] as unknown as Reading[]
const CATALOGO: [string, string, number | null, string][] = [
  ['mestra', 'Leitura Mestra', 97, 'Vai fundo onde a Leitura Completa parou. Nenhuma frase se repete.'],
  ['quem_ama', 'Quem Você Ama', 67, 'A leitura de quem você ama, cruzada com a sua. Você informa o nome.'],
  ['12meses', 'O Seu Ano Interior', 37, 'Os seus próximos doze meses, um a um. Cada mês com o seu tema.'],
  ['compatibilidade', 'Compatibilidade', 27, 'O encaixe entre a sua mão e a de outra pessoa. Onde se sustentam.'],
  ['outra_mao', 'A Outra Mão', null, 'O que você trouxe vs. o que construiu. A mão que você não usa.'],
  ['audio', 'Áudio', 14, 'A sua leitura na voz da Madame Aurora. Para ouvir com os olhos fechados.'],
  ['ritual', 'O Ritual', null, 'Um protocolo prático a partir da sua Marca. O que fazer com o que descobriu.'],
  ['downsell', 'Capítulo da Marca', 39, 'Como a sua Marca nasceu e o que a mantém viva.'],
  ['sentenca', 'A Sentença', null, 'Uma frase da sua leitura, para guardar.'],
  ['despertar', 'O Despertar', null, 'A cada três meses, Aurora relê suas linhas. Exige a Leitura Mestra.'],
]
const ITENS = CATALOGO.map(([produto, nome, preco_brl, descricao]) => ({
  produto, nome, preco_brl: preco_brl ?? undefined, descricao, comprado: produto === 'audio', pronto: false, precisaAcao: false,
})) as unknown as ItemBiblioteca[]
const BIBLIOTECA = { itens: ITENS, readings: LEITURAS, compras: [], assinatura: null, loading: false, recarregar: async () => ITENS }

const ABAS: TabDef[] = [
  { id: 'today', label: 'Hoje', icon: TabBarIcons.today },
  { id: 'readings', label: 'Leituras', icon: TabBarIcons.readings },
  { id: 'aurora', label: 'Aurora', icon: TabBarIcons.aurora },
  { id: 'estante', label: 'Estante', icon: TabBarIcons.grid },
  { id: 'you', label: 'Você', icon: TabBarIcons.you },
]
const ComAbas = ({ aba, children }: { aba: string; children: JSX.Element }) => (
  <div className="h-full flex flex-col relative">
    <div className="flex-1 overflow-hidden">{children}</div>
    <TabBar tabs={ABAS} active={aba} onChange={nada} />
  </div>
)

const TELAS: Record<string, () => JSX.Element> = {
  splash: () => <Splash onContinue={nada} />,
  intro: () => <Intro onContinue={nada} onBack={nada} />,
  email: () => <EmailEntry onSuccess={nada} onBack={nada} />,
  codigo: () => <VerifyEmail email="marina@exemplo.com" onSuccess={nada} onBack={nada} />,
  perfil: () => <BasicData onContinue={nada} onBack={nada} />,
  pergunta: () => <QuizScreen onContinue={nada} onBack={nada} />,
  scan: () => <PalmScan onCapture={nada} onBack={nada} />,
  lendo: () => { localStorage.setItem('dev_bypass', 'true'); return <Scanning imageDataUrl="" userId="x" onComplete={nada} /> },
  revelacao: () => { localStorage.setItem('dev_bypass', 'true'); return <Revelation analysis={ANALISE} name="Marina" scanId="x" userId="x" onContinue={nada} /> },
  paywall: () => <Paywall preview={PREVIA} name="Marina" onSkip={nada} />,
  boasvindas: () => <Welcome name="Marina" gender="female" onReadNow={nada} onSetupPush={nada} />,
  hoje: () => <ComAbas aba="today"><Today profile={PERFIL} biblioteca={BIBLIOTECA} onAbrirLeituraCore={nada} onAbrirLeitura={nada} onIrParaTema={nada} onAbrirAurora={nada} onReScan={nada} /></ComAbas>,
  leituras: () => <ComAbas aba="readings"><Readings biblioteca={BIBLIOTECA} temaFiltro={null} onLimparTema={nada} onAbrirLeituraCore={nada} onAbrirLeitura={nada} /></ComAbas>,
  aurora: () => <ComAbas aba="aurora"><AuroraChat profile={PERFIL} /></ComAbas>,
  estante: () => <ComAbas aba="estante"><Estante itens={ITENS} assinatura={null} onOpenReading={nada} onOpenDespertar={nada} onPreencherTerceiro={nada} onEscanearOutraMao={nada} onAbrirLeituraCore={nada} onRecarregar={nada} /></ComAbas>,
  voce: () => <ComAbas aba="you"><Voce profile={PERFIL} biblioteca={BIBLIOTECA} onReScan={nada} onSignOut={nada} onChangeIntention={nada} onAbrirDespertar={nada} /></ComAbas>,
  intencao: () => <IntentionScreen onContinue={nada} onBack={nada} initialValue={'love_patterns' as never} />,
  terceiro: () => <TerceiroForm userId="p" produto="quem_ama" onDone={nada} onBack={nada} />,
  semacesso: () => <SemAcesso />,
  gerando: () => <TelaGerando mensagens={['Madame Aurora está lendo o encontro das duas histórias…']} rodape="Isso leva cerca de meio minuto." />,
  leitura: () => <AddonReadingView reading={LEITURAS[1]} titulo="Leitura Mestra" onBack={nada} />,
}

export function Preview({ tela }: { tela: string }) {
  const Tela = TELAS[tela]
  if (!Tela) return <p style={{ padding: 20 }}>Telas: {Object.keys(TELAS).join(', ')}</p>
  return <Tela />
}
