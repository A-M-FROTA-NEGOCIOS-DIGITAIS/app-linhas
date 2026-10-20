import { BotaoVoltar } from '@/components/ui'
import { useFundo } from '@/components/ui/AuroraFundo'
import type { Reading } from '@/types'

interface Props {
  reading: Reading
  onBack: () => void
}

export function SentencaView({ reading, onBack }: Props) {
  useFundo('revelacao')
  const handleDownload = () => {
    if (!reading.imagem_url) return
    const a = document.createElement('a')
    a.href = reading.imagem_url
    a.download = 'minha-sentenca-alma.svg'
    a.click()
  }

  return (
    <div className="h-full flex flex-col px-6 pt-[calc(22px+env(safe-area-inset-top,0px))] pb-8">
      <BotaoVoltar onClick={onBack} />

      <p className="alma-r1 alma-eyebrow mt-5">A Sentença</p>
      <h1 className="alma-r1 alma-display mt-2 text-[32px]">
        Sua leitura em <span className="alma-grad-text">uma frase.</span>
      </h1>

      <div className="alma-r2 flex-1 flex items-center justify-center py-6">
        {reading.imagem_url ? (
          <div className="alma-aurora-border" style={{ boxShadow: '0 20px 60px rgba(124,92,255,.3)' }}>
            <img src={reading.imagem_url} alt="Sua Sentença" className="block max-w-full rounded-[25px]" style={{ maxHeight: '58vh' }} />
          </div>
        ) : (
          <p className="font-serif italic text-[28px] leading-[1.3] text-center alma-grad-text">
            {reading.full_content}
          </p>
        )}
      </div>

      {reading.imagem_url && (
        <button type="button" className="alma-btn" onClick={handleDownload}>
          <span>Baixar para compartilhar</span>
        </button>
      )}
    </div>
  )
}
