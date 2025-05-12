import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from "./lang/en.json"
import pl from "./lang/pl.json"

i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  debug: true,
  resources: {
    en: {
      translation: en
    },
    pl: {
      translation: pl
    }
  },
  interpolation: {
    escapeValue: false
  }
})

export default i18n
