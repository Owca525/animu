import { createContext, useContext, createSignal, onMount } from "solid-js";
import en from "./lang/en.json"
import { getConfig } from "./stores/config";
import { unwrap } from "solid-js/store";

async function getAllLangFiles() {
  /* IFDEF WEB */
  if (window["animuAppInfo"]["langs"]) return { en: en, ...window["animuAppInfo"]["langs"] }
  /* ENDIF */
  /* IFDEF DEBUG|PROD */
  let langFiles = await window.api.getUserLang()
  let res = {}
  for (let index = 0; index < langFiles.length; index++) {
    const element = langFiles[index];
    try {
      res[element.lang] = JSON.parse(element.content)
    } catch (error) {
      console.error(error, "getAllLangFiles")
    }
  }
  return {
    ...window["animuAppInfo"]["langs"],
    ...res
  }
  /* ENDIF */
}

type Messages = Record<string, string | object>;
type Dictionaries = Record<string, Messages>;
type i18nConfig = {
  defaultLang?: string,
  // dictionaries: Dictionaries,
  fallbackLang?: string,
}
type i18ncontext = {
  currentLang: () => string;
  t: (key: string, replace?: { [key: string]: string | number | undefined }) => string;
  changeLanguage: (l: string) => void;
  listLang: () => string[];
  pathExist: (key: string) => boolean
}

const I18nContext = createContext<i18ncontext>();

let i18nContext: i18ncontext | undefined

function replaceTemplate(template: string, values?: { [key: string]: string | number | undefined }) {
  if (!values) return template
  return template.replace(/\{\{(.*?)\}\}/g, (_, key) => {
    const trimmed = key.trim();
    const val = values[trimmed];
    return val !== undefined ? String(val) : `{{${trimmed}}}`;
  });
}

function getValueByPath<T>(obj: T, path: string): string {
  try {
    let value = path.split('.').reduce((acc: any, key) => acc?.[key], obj)
    return value == undefined ? path : value;
  } catch (error) {
    console.error("Error in getValueByPath/i18n", error)
    return path
  }
}

export function I18nProvider(props: { config: i18nConfig; children: any }) {
  const [currentLang, changeLanguage] = createSignal(props.config.defaultLang ? props.config.defaultLang :"en");
  const [dictionaries, setDictionaries] = createSignal<Dictionaries>({})

  onMount(async () => {
    setDictionaries(await getAllLangFiles())
  })

  function t(key: string, replace?: { [key: string]: string | number | undefined }) {
    const config = unwrap(getConfig())
    const dict = dictionaries()[currentLang()];
    let value = getValueByPath(dict, key)
    if (value != key) return replaceTemplate(value, replace)
    
    if (import.meta.env.DEV || (config["Developer"] != undefined && config.Developer.DeveloperMode)) console.error(`Missing key in ${currentLang()} lang: ${key}`)
    
    if (props.config.fallbackLang) {
      const fallback = dictionaries()[props.config.fallbackLang]
      value = replaceTemplate(getValueByPath(fallback, key), replace)
      if (value != key) return value
    }
    return key;
  };

  function listLang() {
    const dict = dictionaries();
    if (!dict) return []
    return Object.keys(dict).map((value) => value)
  }

  function pathExist(key: string) {
    const dict = dictionaries()[currentLang()];
    let value = getValueByPath(dict, key)
    return value != key ? true : false
  }

  return (
    <I18nContext.Provider value={{ currentLang, t, changeLanguage, listLang, pathExist }}>
      {(() => { i18nContext = { currentLang, t, changeLanguage, listLang, pathExist }; return undefined; })()}
      {props.children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext)!;
}

export function t(key: string, replace?: { [key: string]: string | number }) {
  if (!i18nContext) return key
  return i18nContext.t(key, replace)
}