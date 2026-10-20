import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BotaoVoltar, SetaCta } from '@/components/ui'
import { useFundo } from '@/components/ui/AuroraFundo'

import type { Gender } from '@/types'

interface Props {
  onContinue: (data: { name: string; birthDate: string; birthTime?: string; birthCity?: string; gender?: Gender }) => void
  onBack: () => void
}

const ROTULO = 'text-[11px] tracking-[2.5px] uppercase text-gold'
const CAMPO: React.CSSProperties = { height: 52, borderRadius: 16, width: '100%', minWidth: 0 }

/** Campo de data/hora nativo por baixo (abre o seletor do celular) e o valor formatado por cima. */
function CampoNativo({ tipo, valor, onChange, vazio, exibir, rotulo }: {
  tipo: 'date' | 'time'; valor: string; onChange: (v: string) => void; vazio: string; exibir: string; rotulo: string
}) {
  return (
    <div className="relative mt-2">
      <input
        type={tipo}
        aria-label={rotulo}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="peer absolute inset-0 w-full h-full opacity-0 z-[1] cursor-pointer"
        style={{ colorScheme: 'dark' }}
      />
      <div
        className="alma-input flex items-center peer-focus:border-gold peer-focus:shadow-[0_0_0_4px_rgba(242,200,121,.15),0_0_24px_rgba(226,106,160,.25)]"
        style={{ ...CAMPO, color: valor ? 'var(--cream)' : 'var(--text-4)', pointerEvents: 'none' }}
      >
        {valor ? exibir : vazio}
      </div>
    </div>
  )
}

// Referência: app/reference/L04-Perfil
export function BasicData({ onContinue, onBack }: Props) {
  const { t, i18n } = useTranslation()
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [birthTime, setBirthTime] = useState('')
  const [birthCity, setBirthCity] = useState('')
  const [gender, setGender] = useState<Gender | undefined>(undefined)
  useFundo('perfil')

  const valid = name.trim().length > 0 && birthDate.length > 0
  const dataExibida = birthDate
    ? new Date(birthDate + 'T00:00:00').toLocaleDateString(i18n.language, { day: '2-digit', month: '2-digit', year: 'numeric' })
    : ''

  return (
    <div className="h-full flex flex-col px-6 pt-[calc(22px+env(safe-area-inset-top,0px))] pb-[26px]">
      <div className="flex items-center justify-between h-11">
        <BotaoVoltar onClick={onBack} />
        <span className="text-[12px] tracking-[2px] uppercase text-gold">{t('basicData.counter')}</span>
      </div>
      <div className="alma-progress"><div className="alma-progress__fill" style={{ width: '33%' }} /></div>

      <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar -mx-1 px-1">
        <h1 className="alma-display mt-[22px] text-[32px]">
          {t('basicData.title')} {t('basicData.titleSub')}{' '}
          <span className="alma-grad-text">{t('basicData.titleItalic')}</span>
        </h1>
        <p className="mt-2 text-[14px] text-text-muted">{t('basicData.subtitle')}</p>

        <span className={`mt-5 ${ROTULO}`}>{t('basicData.gender')}</span>
        <div role="group" aria-label={t('basicData.gender')} className="grid grid-cols-3 gap-2 mt-2">
          {(['male', 'female', 'neutral'] as const).map((g) => {
            const on = gender === g
            return (
              <button
                key={g}
                type="button"
                aria-pressed={on}
                onClick={() => setGender(on ? undefined : g)}
                className="text-[14px] transition-all duration-200"
                style={{
                  height: 46, borderRadius: 14,
                  ...(on
                    ? { background: 'linear-gradient(135deg, rgba(242,200,121,.24), rgba(226,106,160,.14))', border: '1.5px solid #F2C879', color: '#FFE3A8', boxShadow: '0 0 18px rgba(226,106,160,.25)' }
                    : { background: 'rgba(255,255,255,.055)', border: '1.5px solid rgba(255,255,255,.12)', color: '#C9C3DD' }),
                }}
              >
                {t(`basicData.gender${g.charAt(0).toUpperCase()}${g.slice(1)}`)}
              </button>
            )
          })}
        </div>

        <label htmlFor="bd-nome" className={`mt-4 ${ROTULO}`}>{t('basicData.name')}</label>
        <input
          id="bd-nome"
          type="text"
          value={name}
          placeholder={t('basicData.namePlaceholder')}
          onChange={(e) => setName(e.target.value)}
          className="alma-input mt-2"
          style={CAMPO}
        />

        <div className="grid gap-2.5 mt-4" style={{ gridTemplateColumns: '3fr 2fr' }}>
          <div className="flex flex-col min-w-0">
            <span className={ROTULO}>{t('basicData.dateOfBirth')}</span>
            <CampoNativo tipo="date" valor={birthDate} onChange={setBirthDate} vazio={t('basicData.datePlaceholder', { defaultValue: 'DD/MM/AAAA' })} exibir={dataExibida} rotulo={t('basicData.dateOfBirth')} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className={ROTULO}>{t('basicData.time')}</span>
            <CampoNativo tipo="time" valor={birthTime} onChange={setBirthTime} vazio="--:--" exibir={birthTime} rotulo={t('basicData.time')} />
          </div>
        </div>

        <label htmlFor="bd-cidade" className={`mt-4 ${ROTULO}`}>{t('basicData.cityOfBirth')}</label>
        <input
          id="bd-cidade"
          type="text"
          value={birthCity}
          placeholder={t('basicData.cityPlaceholder')}
          onChange={(e) => setBirthCity(e.target.value)}
          className="alma-input mt-2"
          style={CAMPO}
        />

        {/* Dica da hora em cartão violeta translúcido */}
        <div className="flex gap-2.5 mt-3.5 px-3.5 py-3 rounded-[14px]" style={{ background: 'rgba(124,92,255,.12)', border: '1px solid rgba(156,134,255,.3)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CFC4FF" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" className="flex-shrink-0 mt-px">
            <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
          </svg>
          <span className="text-[13px] leading-[1.45] text-[#DCD6F2]">
            <em className="font-serif text-[15px] text-cream">{t('basicData.exactTime')}</em> {t('basicData.timeTip')}
          </span>
        </div>
        <div className="flex-grow min-h-6" />
      </div>

      <button
        type="button"
        className="alma-btn mt-3"
        disabled={!valid}
        style={{ height: 56, opacity: valid ? 1 : 0.55 }}
        onClick={() => onContinue({ name, birthDate, birthTime: birthTime || undefined, birthCity: birthCity || undefined, gender })}
      >
        <span>{t('common.continue')}</span>
        <SetaCta />
      </button>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-[#8E89AE]">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3FD6C2" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
        {t('common.privacy')}
      </p>
    </div>
  )
}
