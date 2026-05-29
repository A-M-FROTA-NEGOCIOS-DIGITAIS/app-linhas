import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '@/locales/en'
import es from '@/locales/es'
import ptBR from '@/locales/pt-BR'

const SUPPORTED = ['en', 'es', 'pt-BR'] as const
type SupportedLang = typeof SUPPORTED[number]

function detectLanguage(): SupportedLang {
  const saved = localStorage.getItem('linhas_language')
  if (saved && SUPPORTED.includes(saved as SupportedLang)) return saved as SupportedLang

  // Auto-detect from browser/device
  const browserLangs = navigator.languages?.length ? navigator.languages : [navigator.language]
  for (const lang of browserLangs) {
    if (lang === 'pt-BR' || lang.startsWith('pt')) return 'pt-BR'
    if (lang.startsWith('es')) return 'es'
    if (lang.startsWith('en')) return 'en'
  }
  return 'en'
}

const savedLang = detectLanguage()

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
    'pt-BR': { translation: ptBR },
  },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export const setLanguage = (lang: 'en' | 'es' | 'pt-BR') => {
  i18n.changeLanguage(lang)
  localStorage.setItem('linhas_language', lang)
}

export const currentLanguage = () => i18n.language as 'en' | 'es' | 'pt-BR'

export default i18n
