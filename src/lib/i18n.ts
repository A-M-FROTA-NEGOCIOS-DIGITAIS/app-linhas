import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '@/locales/en'
import es from '@/locales/es'
import ptBR from '@/locales/pt-BR'

const savedLang = localStorage.getItem('linhas_language') || 'en'

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
