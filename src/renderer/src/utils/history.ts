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

    const config = await readConfig()
    const appConfigDirPath = await window.electron.ipcRenderer.invoke('appConfigDir')
    const file = await window.electron.ipcRenderer.invoke(
      'ReadFile',
      appConfigDirPath + '/history.json'
    )
    const data = JSON.parse(file) as { history: CardProps[] }
    const index = data.history.findIndex((item) => item.id === save.id)
    if (
      config &&
      (await ReadHistory()).length >= parseInt(config.History.history.maxSave.toString())
    ) {
      console.log(parseInt(config.History.history.maxSave.toString()))
      data.history.pop()
    }
    if (index != -1) {
      data.history.splice(index, 1)
    }
    data.history.push(save)
    await window.electron.ipcRenderer.invoke(
      'WriteFile',
      appConfigDirPath + '/history.json',
      JSON.stringify(data)
    )
  } catch (Error) {}
}

export async function DeleteFromHistory(data: CardProps) {
  try {
    const appConfigDirPath = await window.electron.ipcRenderer.invoke('appConfigDir')
    const file = await window.electron.ipcRenderer.invoke(
      'ReadFile',
      appConfigDirPath + '/history.json'
    )
    const list = JSON.parse(file) as { history: CardProps[] }
    const index = list.history.findIndex((item) => item.id === data.id)
    if (index != -1) {
      list.history.splice(index, 1)
    }
    await window.electron.ipcRenderer.invoke(
      'WriteFile',
      appConfigDirPath + '/history.json',
      JSON.stringify(list)
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
    const data = JSON.parse(file) as { history: CardProps[] }
    return data.history.reverse()
  } catch (Error) {
    return []
  }
}
