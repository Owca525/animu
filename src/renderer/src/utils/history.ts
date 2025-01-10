import { CardProps } from './interface'
import { readConfig } from './config'

const DefaultHistory: { history: CardProps[] } = {
  history: []
}

export async function CheckHistory() {
  try {
    const appConfigDirPath = await window.electron.ipcRenderer.invoke('appConfigDir')
    if (
      (await window.electron.ipcRenderer.invoke(
        'DirectoryExist',
        appConfigDirPath + '/history.json'
      )) == false
    ) {
      await window.electron.ipcRenderer.invoke(
        'WriteFile',
        appConfigDirPath + '/history.json',
        JSON.stringify(DefaultHistory)
      )
    }
  } catch (Error) {}
}

export async function SaveHistory(save: CardProps) {
  try {
    await CheckHistory()
    const appConfigDirPath = await window.electron.ipcRenderer.invoke('appConfigDir')

    const config = await readConfig()
    let file = (await ReadHistory()).reverse()

    const index = file.findIndex((item) => item.id === save.id)

    if (config && file.length >= parseInt(config.History.history.maxSave.toString())) file.shift()
    if (index != -1) file.splice(index, 1)
    
    file.push(save)
    await window.electron.ipcRenderer.invoke(
      'WriteFile',
      appConfigDirPath + '/history.json',
      JSON.stringify(file)
    )
  } catch (Error) {}
}

export async function ReadHistory(): Promise<CardProps[]> {
  try {
    const appConfigDirPath = await window.electron.ipcRenderer.invoke('appConfigDir')
    const file = await window.electron.ipcRenderer.invoke(
      'ReadFile',
      appConfigDirPath + '/history.json'
    )
    const data = JSON.parse(file) 
    return data.reverse()
  } catch (Error) {
    return []
  }
}
