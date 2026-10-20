import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui'
import { useFundo } from '@/components/ui/AuroraFundo'
import { OrbitaAurora, EtapasEspera } from '@/components/ui/Orbita'

interface Props {
  onComplete: (analysis: unknown) => void
  imageDataUrl: string
  userId: string
  /** Volta para a captura da foto. Sem isso a tela de erro vira beco sem saída. */
  onBack?: () => void
  /**
   * Qual mão está sendo escaneada. Era cravado como 'dominant' aqui dentro, o
   * que fazia o fluxo da Outra Mão gravar a mão não-dominante rotulada como
   * dominante em palm_scans — e o fallback do gerar-leitura, que pega o scan
   * mais recente, passava a usar a mão errada.
   */
  handType?: 'dominant' | 'non_dominant'
}

const isDevBypass = () => localStorage.getItem('dev_bypass') === 'true'

const FAKE_SCAN_RESULT = {
  analysis: {
    hand_shape: 'fire',
    dominant_hand: true,
    image_quality: 'high',
    is_palm: true,
    main_lines: {
      life_line: { length: 'long', depth: 'deep', characteristic: 'clear and unbroken', interpretation: 'strong vitality' },
      heart_line: { length: 'long', depth: 'deep', characteristic: 'branches near Mercury', interpretation: 'idealistic in love' },
      head_line: { length: 'long', depth: 'medium', characteristic: 'slopes toward Luna', interpretation: 'creative thinker' },
      fate_line: { present: true, length: 'medium', characteristic: 'begins mid-palm', interpretation: 'self-made' },
    },
    mounts: { jupiter: 'prominent', saturn: 'average', apollo: 'prominent', mercury: 'average', venus: 'prominent', luna: 'average' },
    special_marks: [],
    overall_character: 'A person of deep feeling and creative fire.',
  },
  scan_id: 'dev-bypass-scan-id',
}

export function Scanning({ onComplete, imageDataUrl, userId, onBack, handType = 'dominant' }: Props) {
  const { t } = useTranslation()
  const [msgIndex, setMsgIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [tentativa, setTentativa] = useState(0)
  const tentativaAnalisadaRef = useRef(-1)
  const onCompleteRef = useRef(onComplete)
  useFundo('scan')
  onCompleteRef.current = onComplete

  const MESSAGES = [
    t('scanning.msg0'),
    t('scanning.msg1'),
    t('scanning.msg2'),
    t('scanning.msg3'),
    t('scanning.msg4'),
  ]

  useEffect(() => {
    if (tentativaAnalisadaRef.current === tentativa) return
    tentativaAnalisadaRef.current = tentativa

    const msgInterval = setInterval(() => {
      setMsgIndex((p) => Math.min(p + 1, MESSAGES.length - 1))
    }, 3500)

    const progInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 2, 95))
    }, 300)

    const analyze = async () => {
      if (isDevBypass()) {
        setTimeout(() => { setProgress(100); setTimeout(() => onCompleteRef.current(FAKE_SCAN_RESULT), 600) }, 3000)
        return
      }
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
        const res = await fetch(`${supabaseUrl}/functions/v1/analyze-palm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${supabaseKey}` },
          body: JSON.stringify({ user_id: userId, image_data: imageDataUrl, hand_type: handType }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || data.message || JSON.stringify(data))
        setProgress(100)
        setTimeout(() => onCompleteRef.current(data), 600)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        // O código técnico fica no console; a tela mostra texto humano.
        console.error('analyze-palm falhou:', msg)
        setError(msg)
      }
    }

    analyze()
    return () => { clearInterval(msgInterval); clearInterval(progInterval) }
  }, [tentativa])

  const tentarDeNovo = () => {
    setError(null)
    setProgress(0)
    setMsgIndex(0)
    setTentativa((n) => n + 1)
  }

  if (error) {
    const ERROS_DE_IMAGEM: Record<string, string> = {
      image_not_palm: 'scanning.errorNotPalm',
      image_quality_low: 'scanning.errorQuality',
      palm_not_visible: 'scanning.errorNotVisible',
    }
    const chaveImagem = ERROS_DE_IMAGEM[error]
    // Reanalisar a mesma foto só resolve falha técnica. Se o problema é a
    // própria imagem, a saída útil é tirar outra.
    const fotoPrecisaMudar = Boolean(chaveImagem) && Boolean(onBack)

    const primaria = fotoPrecisaMudar
      ? { label: t('scanning.newPhoto'), onClick: onBack! }
      : { label: t('scanning.retry'), onClick: tentarDeNovo }
    const secundaria = fotoPrecisaMudar
      ? { label: t('scanning.retry'), onClick: tentarDeNovo }
      : onBack ? { label: t('scanning.newPhoto'), onClick: onBack } : null

    return (
      <div className="h-full flex flex-col items-center justify-center px-8 gap-6">
        <div className="alma-card flex items-center justify-center w-[74px] h-[74px] !rounded-[22px]" style={{ borderColor: 'rgba(255,157,176,.45)' }}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#FF9DB0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
          </svg>
        </div>
        <div className="text-center">
          <p className="alma-display text-[28px] mb-2">
            {chaveImagem ? t(chaveImagem) : t('scanning.errorGeneric')}
          </p>
          {chaveImagem && <p className="text-[15px] text-text-secondary">{t('scanning.errorHint')}</p>}
        </div>
        <div className="w-full flex flex-col gap-2">
          <Button variant="primary" fullWidth onClick={primaria.onClick}>{primaria.label}</Button>
          {secundaria && (
            <Button variant="ghost" fullWidth onClick={secundaria.onClick}>{secundaria.label}</Button>
          )}
        </div>
      </div>
    )
  }

  // Padrão do Processando do quiz: órbitas com o retrato no núcleo, frase em itálico,
  // barra de progresso aurora e as etapas da leitura.
  const etapas = MESSAGES.slice(1)
  return (
    <div className="h-full flex flex-col items-center px-7 pt-[calc(60px+env(safe-area-inset-top,0px))] pb-10 overflow-y-auto no-scrollbar">
      <div className="font-serif text-[18px] tracking-[9px] pl-[9px] text-gold-text">ALMA</div>
      <div className="mt-8"><OrbitaAurora tamanho={280} /></div>
      <h1 key={msgIndex} className="alma-display mt-7 text-center text-[28px] italic" style={{ animation: 'alma-reveal .8s ease-out both' }}>
        {MESSAGES[0]}
      </h1>
      <div className="alma-progress w-full mt-[22px] overflow-hidden">
        <div className="alma-progress__fill transition-[width] duration-700" style={{ width: `${progress}%` }} />
      </div>
      <div className="w-full mt-[26px]">
        <EtapasEspera etapas={etapas} atual={Math.min(msgIndex, etapas.length - 1)} />
      </div>
    </div>
  )
}
