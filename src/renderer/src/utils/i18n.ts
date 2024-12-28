import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import LangEnglish from './locales/english.json'
import LangPolish from './locales/polish.json'
import LangHungary from './locales/hungarian.json'

i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  debug: true,
  resources: {
    en: {
      translation: LangEnglish
    },
    pl: {
      translation: LangPolish
    },
    hu: {
      translation: LangHungary
    }
  }
})

export default i18n
