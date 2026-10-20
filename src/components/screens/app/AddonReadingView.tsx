import { useEffect } from 'react'
import { marcarAberta } from '@/lib/progresso'
import { useProgressoCapitulo } from '@/hooks/useProgressoCapitulo'
import { BotaoVoltar } from '@/components/ui'
import { AuroraAvatar } from '@/components/ui/Aurora'
import { useFundo } from '@/components/ui/AuroraFundo'
import type { Reading } from '@/types'

interface Props {
  reading: Reading
  titulo: string
  onBack: () => void
}

export function AddonReadingView({ reading, titulo, onBack }: Props) {
  const capitulos = reading.capitulos ?? []
  const registrar = useProgressoCapitulo(reading.id, reading.ultimo_capitulo_lido ?? 0)
  useFundo('leituras')

  useEffect(() => {
    void marcarAberta(reading.id)
  }, [reading.id])

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto scroll-area">
        <div className="px-6 pt-[calc(22px+env(safe-area-inset-top,0px))] pb-6">
          <BotaoVoltar onClick={onBack} />
          <div className="alma-r1 flex items-center gap-3 mt-5">
            <AuroraAvatar tamanho={46} />
            <span className="alma-eyebrow">Madame Aurora</span>
          </div>
          <h1 className="alma-r1 alma-display mt-3 text-[34px]">{titulo}</h1>
        </div>

        <div className="alma-r2 px-6 flex flex-col gap-12 pb-12">
          {capitulos.map((cap, i) => (
            <div key={cap.numero ?? i} ref={registrar(i)}>
              {capitulos.length > 1 && (
                <div className="flex items-center gap-3 mb-4" aria-hidden="true">
                  <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(242,200,121,0), rgba(242,200,121,.45))' }} />
                  <span className="flex items-center justify-center w-9 h-9 rounded-full font-serif text-[15px] text-gold-light" style={{ border: '1px solid rgba(242,200,121,.5)', background: 'rgba(242,200,121,.08)' }}>
                    {i + 1}
                  </span>
                  <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(242,200,121,.45), rgba(242,200,121,0))' }} />
                </div>
              )}
              <h2 className="alma-display italic text-[24px] mb-4">{cap.titulo}</h2>
              <div className="reading-text">
                {cap.conteudo.split('\n\n').map((para, j) => (
                  <p key={j} className="m-0" style={{ whiteSpace: 'pre-line' }}>{para}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
