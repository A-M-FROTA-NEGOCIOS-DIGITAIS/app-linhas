import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PalmScan } from '@/components/screens/onboarding/PalmScan'
import { Scanning } from '@/components/screens/onboarding/Scanning'
import { Spinner } from '@/components/ui'
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
      if (error) throw new Error(error.message)
      onDone()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro inesperado')
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
    return <Scanning imageDataUrl={imagem} userId={userId} onComplete={handleAnalysisComplete} />
  }

  if (fase === 'gerando') {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <Spinner size={24} className="text-accent-gold" />
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--text-primary)' }}>
          Combinando as duas mãos…
        </p>
      </div>
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
