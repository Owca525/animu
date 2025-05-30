// import { playerUrlProps } from "@renderer/utils/interface"

import { similarityText } from "@renderer/utils/functions"
import { AnimeData, cardData, playerData, pluginFormat } from "@renderer/utils/GlobalInterface"

const HASH_SEARCH = '06327bc10dd682e1ee7e07b6db9c16e9ad2fd56c1b769e47513128cd5c9fc77a'
const HASH_INFO = '9d7439c90f203e534ca778c4901f9aa2d3ad42c06243ab2c5e6b79612af32028'
const HASH_PLAYER = '5f1a64b73793cc2234a389cf3a8f93ad82de7043017dd551f38f65b89daa65e0'
const API_WEB = 'https://api.allanime.day'

const header = {
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:123.0) Gecko/20100101 Firefox/123.0',
  'Referer': 'https://allmanga.to/'
}

const source_names = ['Sak', 'S-mp4', 'Luf-mp4', "Kir", "Default"]

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

async function sendToAPI(variables: string, hash: string, header: any): Promise<any | null> {
  let url = `${API_WEB}/api?variables=${variables}&extensions={"persistedQuery":{"version":1,"sha256Hash": "${hash}"}}`
  let data = await window.api.request.get(url, header)
  if (data.success) return data.data
  return null
}

async function sendRequest(url: string, header: any): Promise<any | null> {
  let data = await window.api.request.get(url, header)
  if (data.success) return data.data
  return null
}

export async function SearchAnime(name: string, page: number = 1) {
  let variables = `{"search":{"query":"${name}"},"limit":26,"page":${page},"translationType":"sub","countryOrigin":"ALL"}`

  const resp = await sendToAPI(variables, HASH_SEARCH, header)
  if (resp) return resp.data
  return null
}

function converterData(data: any): cardData {
  return {
    AnimeData: {
      averageScore: data.averageScore,
      bannerImage: data.banner,
      coverImage: data.thumbnail,
      description: data.description,
      duration: data.episodeDuration,
      endDate: data.airedEnd,
      startDate: data.airedStart,
      episodes: data.episodeCaunt,
      genres: data.genres,
      isAdult: data.isAdult,
      nextAiringEpisode: null,
      popularity: 0,
      season: data.season.quarter,
      seasonYear: data.season.year,
      status: data.status,
      studios: data.studios,
      title: data.name,
      type: data.type,
      id: "",
      format: null,
      player_ID: data._id,
      episodesList: data.availableEpisodesDetail ? [
        { episodes: data.availableEpisodesDetail.sub.reverse(), type: "sub", name: "Subtitles" },
        { episodes: data.availableEpisodesDetail.dub.reverse(), type: "dub", name: "Dubbing" },
        { episodes: data.availableEpisodesDetail.raw.reverse(), type: "raw" }
      ] : data.availableEpisodesDetail
    }
  }
}

// export async function getRecentAnime() {
//   let variables = `{"search":{"sortBy":"Recent"},"limit":26,"page":1,"translationType":"sub","countryOrigin":"JP"}`
//   let extensions = `{"persistedQuery":{"version":1,"sha256Hash": "${HASH_SEARCH}"}}`
//   let url = API_WEB + `/api?variables=${variables}&extensions=${extensions}`

//   const resp = await sendToAPI(url, header)
//   console.log(resp)
//   if (resp) return resp.data
//   return null
// }

export async function getInformation(name: string): Promise<{ player_id: string, episodesData: { episodes: string[], type: string, name?: string }[] }> {
  let data = await SearchAnime(name)
  if (data == 0) return { player_id: "", episodesData: [] }
  data = data.shows.edges.map((data) => converterData(data))
  let precentage: { name: string, prec: number }[] = []

  for (let i = 0; i < data.length; i++) {
    const element: cardData = data[i];
    precentage.push({ name: element.AnimeData.title, prec: similarityText(name, element.AnimeData.title) })
  }
  if (precentage.length <= 0) return { player_id: "", episodesData: [] }
  let anime_name = precentage.filter(item => item.prec === Math.max(...precentage.map(item => item.prec)))[0]
  let anime_id = data.filter((item: cardData) => item.AnimeData.title == anime_name.name)[0]

  let variables = `{"_id":"${anime_id.AnimeData.player_ID}"}`
  const resp = await sendToAPI(variables, HASH_INFO, header)
  let anime_data = converterData(resp.data.show).AnimeData.episodesList
  if (!anime_data) return { player_id: "", episodesData: [] }
  return { player_id: anime_id.AnimeData.player_ID, episodesData: anime_data }
}

async function getURLS(url: string): Promise<playerData | undefined> {
  url = decodeText(url.replace('--', ''))
  const links = await sendRequest(`http://allanime.day${url}`, {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:123.0) Gecko/20100101 Firefox/123.0'
  })
  if (!links) return undefined

  let listUrls: playerData | undefined 

  links.links.forEach(element => {
    if (!element.link) return

    const urlObject = new URL(element.link);

    if (element.hls && urlObject.hostname != "ayvic.fast4speed.rsvp") {
      listUrls = { resolution: [{ url: element.link, res: "" }], hostname: urlObject.hostname, hls: true }
    }
    if (element.mp4) {
      listUrls = { resolution: [{ url: element.link, res: "1080" }], hostname: urlObject.hostname, hls: false }
    }
  });
  return listUrls
}

export async function extractURLS(type: string, episode: string, id: string): Promise<playerData[]> {
  let variables = `{"showId":"${id}","translationType":"${type}","episodeString":"${episode}"}`
  const resp = await sendToAPI(variables, HASH_PLAYER, header)
  console.log(resp)
  const sources = resp.data.episode.sourceUrls
  const urls = sources
    .map((tmp: { sourceUrl: string; sourceName: string }) =>
      findUrl(tmp.sourceUrl, tmp.sourceName, source_names)
    )
    .filter((item: string) => item !== '')

  let data: playerData[] = []
  for (let i = 0; i < urls.length; i++) {
    const element = urls[i];
    let tmp = await getURLS(element)
    if (tmp) data.push(tmp)
  }
  return data
}

// export async function getPlayerUrls(id: string, episode: string, type: string) {
//   let variables = `{"showId":"${id}","translationType":"${type}","episodeString":"${episode}"}`
//   let extensions = `{"persistedQuery":{"version":1,"sha256Hash": "${HASH_PLAYER}"}}`
//   let url = API_WEB + `/api?variables=${variables}&extensions=${extensions}`

//   let listUrls = []

//   const resp = await sendToAPI(url, header)
//   console.log(resp)
//   if (!resp) return null
//   if (resp.data.episode === null) return null

//   const sources = resp.data.episode.sourceUrls
// const urls = sources
//   .map((tmp: { sourceUrl: string; sourceName: string }) =>
//     findUrl(tmp.sourceUrl, tmp.sourceName, source_names)
//   )
//   .filter((item: string) => item !== '')

//   for (let i = 0; i < urls.length; i++) {
//     const element = urls[i]
//     let url = decodeText(element.replace('--', ''))
// const links = await sendToAPI(`http://allanime.day${url}`, {
//   'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:123.0) Gecko/20100101 Firefox/123.0'
// })
//     if (links) {
//       links.links.forEach(element => {
//         if (!element.link) return

//         const urlObject = new URL(element.link);

// if (element.hls && urlObject.hostname != "ayvic.fast4speed.rsvp") {
//   listUrls.push({ url: element.link, res: [], hostname: urlObject.hostname, hls: true })
// }
// if (element.mp4) {
//   listUrls.push({ url: element.link, res: [{ url: element.link, resolution: "1080" }], hostname: urlObject.hostname, hls: false })
// }
//       });
//     }
//   }

//   return listUrls
// }


export const infoPluginPlayer: pluginFormat = {
  version: "0.1",
  name: "Allmanga",
  author: "Owca525",
  player: {
    listEpisodes: getInformation,
    getUrls: extractURLS
  }
}