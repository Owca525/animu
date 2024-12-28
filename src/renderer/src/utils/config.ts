import ini from 'ini'
import { SettingsConfig } from './interface'

export const defaultConfig: SettingsConfig = {
  General: {
    HoverSidebar: true,
    language: 'en',
    color: 'purpleAnimu',
    cardSize: 'medium',
    Window: {
      AutoMaximize: false,
      AutoFullscreen: false,
      Zoom: 0
    }
  },
  Player: {
    general: {
      Autoplay: true,
      AutoFullscreen: false,
      Volume: 25,
      LongTimeSkipForward: 80,
      LongTimeSkipBack: 80,
      TimeSkipLeft: 5,
      TimeSkipRight: 5
    },
    keybinds: {
      Pause: ' ',
      LongTimeSkipForward: 'ArrowUp',
      LongTimeSkipBack: 'ArrowDown',
      TimeSkipLeft: 'ArrowLeft',
      TimeSkipRight: 'ArrowRight',
      Fullscreen: 'F',
      ExitPlayer: 'Escape',
      FrameSkipBack: ',',
      FrameSkipForward: '.',
      VolumeDown: '9',
      VolumeUp: '0'
    }
  },
  History: {
    history: {
      maxSave: 20
    },
    continue: {
      MinimalTimeSave: 20,
      MaximizeTimeSave: 120
    }
  }
}

function deepMerge(target: any, source: any): any {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object') {
      if (!target[key]) {
        target[key] = {}
      }
      deepMerge(target[key], source[key])
    } else {
      target[key] = source[key]
    }
  }
  return target
}

export async function readConfig(): Promise<SettingsConfig | undefined> {
  const appConfigDirPath = await window.electron.ipcRenderer.invoke('appConfigDir')
  try {
    const content = await window.electron.ipcRenderer.invoke(
      'ReadFile',
      appConfigDirPath + '/config.ini'
    )
    const loadedConfig = ini.parse(content) as SettingsConfig
    return deepMerge(defaultConfig, loadedConfig)
  } catch (Error) {
    return defaultConfig
  }
}

export async function saveConfig(content: any) {
  const appConfigDirPath = await window.electron.ipcRenderer.invoke('appConfigDir')
  const data = ini.stringify(content)
  try {
    await await window.electron.ipcRenderer.invoke(
      'WriteFile',
      appConfigDirPath + '/config.ini',
      data
    )
  } catch (Error) {}
}

async function createConfig() {
  const appConfigDirPath = await window.electron.ipcRenderer.invoke('appConfigDir')
  const content = ini.stringify(defaultConfig)
  try {
    await await window.electron.ipcRenderer.invoke(
      'WriteFile',
      appConfigDirPath + '/config.ini',
      content
    )
  } catch (Error) {}
}

export async function checkConfig() {
  try {
    const appConfigDirPath = await window.electron.ipcRenderer.invoke('appConfigDir')
    if ((await window.electron.ipcRenderer.invoke('DirectoryExist', appConfigDirPath)) == false) {
      await window.electron.ipcRenderer.invoke('mkdir', appConfigDirPath)
      await createConfig()
    }
    if (
      (await window.electron.ipcRenderer.invoke(
        'DirectoryExist',
        appConfigDirPath + '/config.ini'
      )) == false
    ) {
      await createConfig()
    }
  } catch (Error) {}
}
