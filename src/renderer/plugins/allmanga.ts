const HASH_SEARCH = '06327bc10dd682e1ee7e07b6db9c16e9ad2fd56c1b769e47513128cd5c9fc77a'
const HASH_INFO = '9d7439c90f203e534ca778c4901f9aa2d3ad42c06243ab2c5e6b79612af32028'
const HASH_PLAYER = '5f1a64b73793cc2234a389cf3a8f93ad82de7043017dd551f38f65b89daa65e0'
const API_WEB = 'https://api.allanime.day'

const header = {
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:123.0) Gecko/20100101 Firefox/123.0',
  Referer: 'https://allmanga.to/'
}

const source_names = ['Sak', 'S-mp4', 'Luf-mp4']

const replacements: { [key: string]: string } = {
  '01': '9',
  '08': '0',
  '05': '=',
  '0a': '2',
  '0b': '3',
  '0c': '4',
  '07': '?',
  '00': '8',
  '5c': 'd',
  '0f': '7',
  '5e': 'f',
  '17': '/',
  '54': 'l',
  '09': '1',
  '48': 'p',
  '4f': 'w',
  '0e': '6',
  '5b': 'c',
  '5d': 'e',
  '0d': '5',
  '53': 'k',
  '1e': '&',
  '5a': 'b',
  '59': 'a',
  '4a': 'r',
  '4c': 't',
  '4e': 'v',
  '57': 'o',
  '51': 'i'
}

function findUrl(url: string, sourceName: string, sourceNames: string[]): string {
  return sourceNames.includes(sourceName) ? url : ''
}

function decodeText(textString: string): string {
  textString = textString.replace(/../g, (match) => `${match}\n`)

  for (const [pattern, replacement] of Object.entries(replacements)) {
    const regex = new RegExp(pattern, 'gm')
    textString = textString.replace(regex, replacement)
  }
  return textString.replace(/\n/g, '').replace('/clock', '/clock.json')
}

async function sendRequest(url: any, header: any) {
  let data = await window.electron.ipcRenderer.invoke('fetch-data', { url, header })
  if (data.success) {
    return data.data
  }
  return null
}

export async function SearchAnime(name: string) {
  let variables = `{"search":{"query":"${name}"},"limit":26,"page":1,"translationType":"sub","countryOrigin":"ALL"}`
  let extensions = `{"persistedQuery":{"version":1,"sha256Hash": "${HASH_SEARCH}"}}`
  let url = API_WEB + `/api?variables=${variables}&extensions=${extensions}`

  const resp = await sendRequest(url, header)
  if (resp) {
    return resp.data
  }
  return null
}

export async function getRecentAnime() {
  let variables = `{"search":{"sortBy":"Recent"},"limit":26,"page":1,"translationType":"sub","countryOrigin":"ALL"}`
  let extensions = `{"persistedQuery":{"version":1,"sha256Hash": "${HASH_SEARCH}"}}`
  let url = API_WEB + `/api?variables=${variables}&extensions=${extensions}`

  const resp = await sendRequest(url, header)
  if (resp) {
    return resp.data
  }
  return null
}

export async function getInformation(id: string) {
  let variables = `{"_id":"${id}"}`
  let extensions = `{"persistedQuery":{"version":1,"sha256Hash": "${HASH_INFO}"}}`
  let url = API_WEB + `/api?variables=${variables}&extensions=${extensions}`

  const resp = await sendRequest(url, header)
  if (resp) {
    return resp.data
  }
  return null
}

export async function getPlayerUrls(id: string, episode: string): Promise<{ normal: any[], hls: any[] } | null> {
  let variables = `{"showId":"${id}","translationType":"sub","episodeString":"${episode}"}`
  let extensions = `{"persistedQuery":{"version":1,"sha256Hash": "${HASH_PLAYER}"}}`
  let url = API_WEB + `/api?variables=${variables}&extensions=${extensions}`
  
  let hlsUrls: any = []
  let nromalUrls: any = []

  const resp = await sendRequest(url, header)
  if (!resp) {
    return null
  }

  const sources = resp.data.episode.sourceUrls
  const urls = sources
    .map((tmp: { sourceUrl: string; sourceName: string }) =>
      findUrl(tmp.sourceUrl, tmp.sourceName, source_names)
    )
    .filter((item: string) => item !== '')

  for (let i = 0; i < urls.length; i++) {
    const element = urls[i]
    let url = decodeText(element.replace('--', ''))
    const links = await sendRequest(`http://allanime.day${url}`, {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:123.0) Gecko/20100101 Firefox/123.0'
    })
    if (links) {
      links.links.forEach(element => {
        if (element.hls) {
          hlsUrls.push(element.link)
        }
        if (element.mp4) {
          nromalUrls.push(element.link)
        }
      });
    }
  }

  return { normal: nromalUrls, hls: hlsUrls }
}
