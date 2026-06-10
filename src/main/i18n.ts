import { globalTray, mainWindow } from ".";
import { updateTray } from "./utils";

export let currentLang = {}

export function t(key: string, replace?: { [key: string]: string | number | undefined }) {
    const dict = currentLang;
    let value = getValueByPath(dict, key)
    if (value != key) return replaceTemplate(value, replace)
    
    return key;
}

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

export function setCurrentLang(v: Record<string, string>) {
    currentLang = v

    if (globalTray && globalTray.getTitle() == "") {
        globalTray.setToolTip('Animu')

        globalTray.on('click', () => {
            if (!mainWindow) return
            mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
        })
    }

    updateTray()
}