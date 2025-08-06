import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

async function getAllLangFiles() {
  let langFiles = await window.api.getListLang()
  let res = {}
  for (let index = 0; index < langFiles.length; index++) {
    const element = langFiles[index];
    res[element.lang] = { translation: JSON.parse(element.data) }
  }
  console.log(res)
  return res
}

i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  debug: true,
  resources: await getAllLangFiles(),
  interpolation: {
    escapeValue: false
  }
})

export default i18n
