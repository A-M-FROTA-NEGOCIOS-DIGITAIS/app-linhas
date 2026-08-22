import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PalmScan } from '@/components/screens/onboarding/PalmScan'
import { Scanning } from '@/components/screens/onboarding/Scanning'
import { TelaGerando } from '@/components/ui/TelaGerando'
import type { PalmAnalysis } from '@/types'

interface Props {
  userId: string
  onDone: () => void
  onBack: () => void
}

function resumirAnalise(analysis: PalmAnalysis): string {
  const partes: string[] = []
  if (analysis.hand_shape) partes.push(`mão tipo ${analysis.hand_shape}`)
  const lines = analysis.main_lines ?? {}
  if (lines.heart_line) partes.push(`linha do coração ${lines.heart_line.length ?? ''} — ${lines.heart_line.interpretation ?? ''}`)
  if (lines.head_line) partes.push(`linha da cabeça ${lines.head_line.length ?? ''} — ${lines.head_line.interpretation ?? ''}`)
  if (lines.life_line) partes.push(`linha da vida ${lines.life_line.length ?? ''} — ${lines.life_line.interpretation ?? ''}`)
  if (analysis.overall_character) partes.push(analysis.overall_character)
  return partes.join('; ')
}

export function OutraMaoFlow({ userId, onDone, onBack }: Props) {
  const [fase, setFase] = useState<'scan' | 'analisando' | 'gerando' | 'erro'>('scan')
  const [imagem, setImagem] = useState<string | null>(null)
  const [erro, setErro] = useState('')

  const handleAnalysisComplete = async (data: unknown) => {
    const d = data as { analysis: PalmAnalysis }
    setFase('gerando')
    try {
      const { error } = await supabase.functions.invoke('gerar-produto', {
        body: { user_id: userId, produto: 'outra_mao', segunda_palma_analise: resumirAnalise(d.analysis) },
      })
      // 502 quando a geracao falha; o invoke transforma isso em `error`.
      if (error) {
        console.error('gerar-produto (outra_mao) falhou:', error.message)
        throw new Error('falha')
      }
      onDone()
    } catch (err) {
      console.error('OutraMaoFlow:', err)
      setErro('Não consegui combinar as duas mãos agora. Tente de novo.')
      setFase('erro')
    }
  }

  if (fase === 'scan') {
    return (
      <PalmScan
        onCapture={(dataUrl) => { setImagem(dataUrl); setFase('analisando') }}
        onBack={onBack}
      />
    )
  }

  if (fase === 'analisando' && imagem) {
    return (
      <Scanning
        imageDataUrl={imagem}
        userId={userId}
        handType="non_dominant"
        onComplete={handleAnalysisComplete}
        onBack={() => setFase('scan')}
      />
    )
  }

  if (fase === 'gerando') {
    return (
      <TelaGerando
        mensagens={[
          'Combinando as duas mãos…',
          'A mão que você usa mostra o que construiu…',
          'A outra guarda o que você trouxe…',
          'Medindo a distância entre elas…',
        ]}
        rodape="Isso leva cerca de meio minuto."
      />
    )
  }

  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 px-8 text-center">
      <p style={{ color: 'var(--text-primary)' }}>{erro}</p>
      <button onClick={() => setFase('scan')} style={{ color: 'var(--accent-gold)', fontSize: 14 }}>
        Tentar novamente
      </button>
    </div>
  )
}
