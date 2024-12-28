import { CardProps } from './interface'

const DefaultContinue: { continue: CardProps[] } = {
  continue: []
}

export async function CheckContinue() {
  try {
    const appConfigDirPath = await window.electron.ipcRenderer.invoke('appConfigDir')
    if (
      (await window.electron.ipcRenderer.invoke(
        'DirectoryExist',
        appConfigDirPath + '/continueWatch.json'
      )) == false
    ) {
      await window.electron.ipcRenderer.invoke(
        'WriteFile',
        appConfigDirPath + '/continueWatch.json',
        JSON.stringify(DefaultContinue)
      )
    }
  } catch (Error) {}
}

export async function SaveContinue(save: CardProps) {
  try {
    const appConfigDirPath = await window.electron.ipcRenderer.invoke('appConfigDir')
    const file = await window.electron.ipcRenderer.invoke(
      'ReadFile',
      appConfigDirPath + '/continueWatch.json'
    )
    const data = JSON.parse(file) as { continue: CardProps[] }
    const index = data.continue.findIndex((item) => item.id === save.id)
    if (index != -1) {
      data.continue.splice(index, 1)
    }
    data.continue.push(save)
    await window.electron.ipcRenderer.invoke(
      'WriteFile',
      appConfigDirPath + '/continueWatch.json',
      JSON.stringify(data)
    )
  } catch (Error) {}
}

export async function DeleteFromcontinue(data: CardProps) {
  try {
    const appConfigDirPath = await window.electron.ipcRenderer.invoke('appConfigDir')
    const file = await window.electron.ipcRenderer.invoke(
      'ReadFile',
      appConfigDirPath + '/continueWatch.json'
    )
    const list = JSON.parse(file) as { continue: CardProps[] }
    const index = list.continue.findIndex((item) => item.player?.episode === data.player?.episode)
    if (index != -1) {
      list.continue.splice(index, 1)
    }
    await window.electron.ipcRenderer.invoke(
      'WriteFile',
      appConfigDirPath + '/continueWatch.json',
      JSON.stringify(list)
    )
  } catch (Error) {}
}

export async function ReadContinue(): Promise<CardProps[]> {
  try {
    const appConfigDirPath = await window.electron.ipcRenderer.invoke('appConfigDir')
    const file = await window.electron.ipcRenderer.invoke(
      'ReadFile',
      appConfigDirPath + '/continueWatch.json'
    )
    const data = JSON.parse(file) as { continue: CardProps[] }
    return data.continue.reverse()
  } catch (Error) {
    return []
  }
}
