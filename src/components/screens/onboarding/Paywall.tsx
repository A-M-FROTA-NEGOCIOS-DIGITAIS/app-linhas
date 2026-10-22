import { track, Events } from '@/lib/analytics'
import { AuroraAvatar } from '@/components/ui/Aurora'
import { useFundo } from '@/components/ui/AuroraFundo'

interface Props {
  preview: string
  name: string
  onSkip?: () => void
}

const FEATURES = [
  'Leitura completa com 6 capítulos personalizados',
  'Identificação da sua Marca Adormecida no amor',
  'Análise das 3 marcas: Coração, Mente e Vida',
  'O padrão que você repete — e como reconhecê-lo',
  'Acesso vitalício à sua leitura no app',
]

// A venda acontece no funil (quiz + checkout da Hotmart); a Bluen está desativada.
const CHECKOUT_URL = import.meta.env.VITE_COMPRA_URL ?? 'https://quiz.almaurora.com'

/** Primeira frase nítida, o resto borrado (a leitura real aparece, mas só o começo dá para ler). */
function partirPrevia(texto: string): [string, string] {
  const fim = texto.search(/[.…!?](\s|$)/)
  if (fim < 0 || fim > 220) {
    const corte = texto.lastIndexOf(' ', 160)
    return corte > 0 ? [texto.slice(0, corte) + '…', texto.slice(corte)] : [texto, '']
  }
  return [texto.slice(0, fim + 1), texto.slice(fim + 1).trim()]
}

// Referência: app/reference/L08-Paywall
export function Paywall({ preview, name, onSkip }: Props) {
  useFundo('paywall')
  const handleComprar = () => {
    track(Events.TRIAL_STARTED, { product: 'leitura_core', amount_cents: 4700 })
    window.location.href = CHECKOUT_URL
  }

  const texto = preview || `${name}, sua palma revela um padrão que você provavelmente já sentiu, mas nunca soube nomear...`
  const [nitido, borrado] = partirPrevia(texto)

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="flex flex-col px-[22px] pt-[calc(40px+env(safe-area-inset-top,0px))] pb-[30px]">
        <span className="alma-r1 flex items-center gap-2 text-[11px] tracking-[3px] uppercase text-teal-text">
          <span className="w-2 h-2 rounded-full" style={{ background: '#3FD6C2', boxShadow: '0 0 10px #3FD6C2', animation: 'alma-blink 2.6s ease-in-out infinite' }} />
          Sua leitura foi gerada
        </span>

        {/* Prévia: começo nítido, resto borrado, selo de bloqueado */}
        <div className="alma-r1 relative mt-4 rounded-[24px] overflow-hidden px-5 pt-5 pb-[22px]" style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(242,200,121,.3)' }}>
          <p className="m-0 font-serif text-[24px] leading-[1.3] text-cream">{nitido}</p>
          <p aria-hidden="true" className="m-0 mt-3 font-serif text-[20px] leading-[1.35] text-text-primary select-none max-h-[110px] overflow-hidden" style={{ filter: 'blur(5px)' }}>
            {borrado || texto}
          </p>
          <div className="absolute inset-x-0 bottom-0 h-[90px] flex items-end justify-center pb-3.5" style={{ background: 'linear-gradient(180deg, rgba(12,16,49,0), rgba(12,16,49,.92))' }}>
            <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-pill text-[13px] text-gold-light" style={{ background: 'rgba(242,200,121,.14)', border: '1px solid rgba(242,200,121,.5)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFE3A8" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
              Leitura completa bloqueada
            </span>
          </div>
        </div>

        <div className="alma-r2 flex items-center gap-3.5 mt-[30px]">
          <AuroraAvatar tamanho={56} />
          <div>
            <h1 className="alma-display text-[32px] leading-none">Leitura Completa</h1>
            <span className="font-serif italic text-[20px] alma-grad-text">por Madame Aurora</span>
          </div>
        </div>

        <div className="alma-r2 flex flex-col gap-3 mt-5">
          {FEATURES.map((f) => (
            <div key={f} className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(135deg, #FFE3A8, #E7B865)' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2A1A05" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
              </span>
              <span className="text-[15.5px] leading-[1.4] text-[#EDE6D6]">{f}</span>
            </div>
          ))}
        </div>

        {/* Caixa de preço com pulso */}
        <div
          className="alma-r3 mt-[26px] px-5 py-[18px] rounded-[24px] flex items-center justify-between"
          style={{ background: 'linear-gradient(180deg, rgba(28,33,86,.9), rgba(12,16,49,.95))', border: '1.5px solid rgba(242,200,121,.55)', boxShadow: '0 0 0 6px rgba(242,200,121,.06), 0 20px 60px rgba(124,92,255,.3)', animation: 'alma-rise .7s ease-out both .35s, alma-pulse 2.8s ease-in-out infinite 1.2s' }}
        >
          <div>
            <div className="text-[15px] text-cream font-medium">Pagamento único</div>
            <div className="text-[13px] text-text-muted mt-0.5">Acesso vitalício, sem assinatura</div>
          </div>
          <div className="flex items-start gap-[3px]">
            <span className="text-[16px] mt-2 text-gold">R$</span>
            <span className="font-serif text-[54px] leading-none font-semibold" style={{ background: 'linear-gradient(180deg, #FFF0CC, #E7B865 60%, #C98F35)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>47</span>
          </div>
        </div>

        <button type="button" className="alma-btn alma-r3 mt-[18px]" onClick={handleComprar}>
          <span>Revelar minha leitura completa</span>
        </button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[12px] text-[#8E89AE]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3FD6C2" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6z" /></svg>
          Pagamento seguro · Acesso imediato após confirmação
        </p>
        {onSkip && (
          <button type="button" className="flex items-center justify-center min-h-11 mt-1.5 text-[14px] text-text-muted" onClick={onSkip}>
            Talvez depois
          </button>
        )}
      </div>
    </div>
  )
}
