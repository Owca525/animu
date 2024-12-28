import * as semver from 'semver'

export async function checkUpdateAnimu() {
  try {
    const response = await fetch('https://api.github.com/repos/Owca525/animu/releases')
    if (response.ok) {
      const data = await response.json()
      const update = semver.gt(
        data[0].tag_name.replace('v', ''),
        await window.electron.ipcRenderer.invoke('getVersion')
      )
      return { update: update, version: data[0].tag_name, url: data[0].html_url }
    }
    return { update: false, version: '', url: '' }
  } catch (Error) {
    return { update: false, version: '', url: '' }
  }
}
