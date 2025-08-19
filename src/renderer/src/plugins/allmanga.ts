// import { playerUrlProps } from "@renderer/utils/interface"

import { convertMsToMinutes, similarityText } from "@renderer/utils/functions"
import { AnimeData, cardData, episodeList, playerData, pluginFormat } from "@renderer/utils/GlobalInterface"
import { setHomeData, UpdateHomeData } from "@renderer/utils/pluginApi"

const HASH_SEARCH = '06327bc10dd682e1ee7e07b6db9c16e9ad2fd56c1b769e47513128cd5c9fc77a'
const HASH_INFO = '9d7439c90f203e534ca778c4901f9aa2d3ad42c06243ab2c5e6b79612af32028'
const HASH_PLAYER = '5f1a64b73793cc2234a389cf3a8f93ad82de7043017dd551f38f65b89daa65e0'
const HASH_DATA = "c8f3ac51f598e630a1d09d7f7fb6924cff23277f354a23e473b962a367880f7d"
const API_WEB = 'https://api.allanime.day'

const header = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
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
  console.log(data)
  if (data.success) return data.data
  return null
}

export async function SearchAnime(name: string, page: number = 1) {
  let variables = `{"search":{"query":"${name}"},"limit":26,"page":${page},"translationType":"sub","countryOrigin":"ALL"}`

  const resp = await sendToAPI(variables, HASH_SEARCH, header)
  if (resp) return resp.data
  return null
}

let episodeListCache: { id: string, temp: any } | undefined = undefined

async function convertEpisodes(anime_id: string, episodeList: string[]): Promise<{ ep: string, img?: string, title?: string }[]> {
  if (!episodeList) return episodeList
  try {
    if (episodeList.length > 51) return episodeList.map((element) => {return{ ep: element }})
    if (episodeList.length <= 0) return []

    let variables = `{"showId":"${anime_id}","episodeNumStart":${episodeList[episodeList.length-1]},"episodeNumEnd":${episodeList[0]}}`
    let response: any = undefined

    if (episodeListCache && episodeListCache.id == anime_id) response = episodeListCache.temp
    else response = await sendToAPI(variables, HASH_DATA, header)
    console.log(response)

    if (!response) return episodeList.map((element) => {return{ ep: element }})
    if (response.errors) return episodeList.map((element) => {return{ ep: element }})
    let infoData = response.data.episodeInfos
    if (infoData.length <= 0) return episodeList.map((element) => {return{ ep: element }})
    
    let episodeData: { ep: string, img?: string, title?: string }[] = []
    // I decide for loop because map be harder to add episode number
    for (let index = 0; index < infoData.length; index++) {
      const element = infoData[index];
      if (episodeList.length-1 < index) break
      if (element.thumbnails.length <= 0) episodeData.push({ ep: (index+1).toString() })
      else episodeData.push({ ep: (episodeList[index]).toString(), img: `https://wp.youtube-anime.com/aln.youtube-anime.com${element.thumbnails[0]}` })
    }

    episodeListCache = { id: anime_id, temp: response }
    console.log(episodeData)
    return episodeData
  } catch (error) {
    console.error(`Error in convertEpisodes: ${error}`)
    return episodeList.map((element) => {return{ ep: element }})
  }
}

async function converterData(data: any): Promise<cardData> {
  let characters: any = []
  try {
    if (data.characters) {
        for (let index = 0; index < data.characters.length; index++) {
          const element = data.characters[index];
          characters.push({ role: element.role, character: { id: element.aniListId, name: element.name.full, image: element.image.large } })
          if (index == 10) break
        }
    }
  } catch (error) {
    console.error(error)
  }


  return {
    AnimeData: {
      averageScore: data.averageScore,
      bannerImage: data.banner,
      coverImage: data.thumbnail,
      description: data.description,
      duration: data.episodeDuration ? convertMsToMinutes(parseInt(data.episodeDuration)) : undefined,
      endDate: data.airedEnd ? { year: data.airedEnd.year, day: data.airedEnd.date, month: data.airedEnd.month } : undefined,
      startDate: data.airedStart ? { year: data.airedStart.year, day: data.airedStart.date, month: data.airedStart.month } : undefined,
      episodes: data.episodeCount ? parseInt(data.episodeCount) : undefined,
      genres: data.genres,
      nextAiringEpisode: undefined,
      popularity: 0,
      season: data.season ? data.season.quarter : undefined,
      seasonYear: data.season ? data.season.year : undefined,
      status: data.status,
      studios: data.studios,
      title: { romaji: data.name, native: data.nativeName, english: data.englishName },
      type: data.type,
      id: "",
      format: data.type,
      player_ID: data._id,
      episodesList: data.availableEpisodesDetail ? [
        { episodes: (await convertEpisodes(data._id ,data.availableEpisodesDetail.sub)).reverse(), type: "sub", name: "Subtitles" },
        { episodes: (await convertEpisodes(data._id ,data.availableEpisodesDetail.dub)).reverse(), type: "dub", name: "Dubbing" },
        { episodes: (await convertEpisodes(data._id ,data.availableEpisodesDetail.raw)).reverse(), type: "raw" }
      ] : data.availableEpisodesDetail,
      characters: characters,
      source: undefined,
      trailer: undefined
    }
  }
}

export async function recentAnime(page: number = 1) {
  let variables = `{"search":{"sortBy":"Recent"},"limit":26,"page":${page},"translationType":"sub","countryOrigin":"JP"}`
  let anime = await sendToAPI(variables, HASH_SEARCH, header)
  let animeData: cardData[] = []
  for (let index = 0; index < anime.data.shows.edges.length; index++) {
    const element = anime.data.shows.edges[index];
    animeData.push(await converterData(element))
  }
  if (page && page > 1) {
    await UpdateHomeData(async () => {
      return {
        data: {
          title: "Recent Anime",
          data: animeData,
          onScrollDownFunction: (page) => recentAnime(page)
        },
        maxPage: 26
      }
    })
    return
  }

  if (anime == null) {
    await setHomeData(async () => {
      return [
        {
          title: "Recent Anime",
          data: []
        }
      ]
    })
    return
  }

  await setHomeData(async () => {
    return [
      {
        title: "Recent Anime",
        data: animeData,
        onScrollDownFunction: (page) => recentAnime(page)
      }
    ]
  })
}

async function getAnimeList(name: string): Promise<cardData[]> {
  try {
    let data = await SearchAnime(name)
    if (data == 0) return []
    let returnData: cardData[] = []
    for (let index = 0; index < data.shows.edges.length; index++) {
      const element = data.shows.edges[index];
      returnData.push(await converterData(element))
    }
    return returnData
  } catch (error) {
    console.log(`Error in getAnimeList: ${error}`)
    return []
  }
}

async function extractInformation(id: string) {
  let variables = `{"_id":"${id}"}`;
  const resp = await sendToAPI(variables, HASH_INFO, header);
  return (await converterData(resp.data.show)).AnimeData
}

export async function getInformation(animeData?: AnimeData, anime_id?: string): Promise<episodeList> {
  // CHUJ MNIE TO ŻE ONE PIECIE NIE JEST WYKRYWANIE, JEŚLI ALLMANGA BY NIE MIAŁA 1P ZAMIAST ONE PIECIE JAKIE CWEL TO JEST
  console.log(animeData)
  if (animeData) {
    let data = await getAnimeList(animeData.title.native);
    let precentageNative: { name: string, prec: number, data: AnimeData }[] = [];
    let precentageRomaji: { name: string, prec: number, data: AnimeData }[] = [];
    let precentageEnglish: { name: string, prec: number, data: AnimeData }[] = [];

    let globalONEPIECE: string | undefined = undefined

    for (let i = 0; i < data.length; i++) {
      const element: cardData = data[i];
      // FOR KARTQ NOTE: JEBAĆ ONE PIECE I ROBIE TYLKO JEDNĄ RZECZ BO MNIE WKURWIA
      if (element.AnimeData.title.romaji === "1P") {
        globalONEPIECE = element.AnimeData.player_ID
        break
      }

      precentageNative.push({ name: element.AnimeData.title.native, prec: similarityText(animeData.title.native.toLowerCase(), element.AnimeData.title.native.toLowerCase()), data: element.AnimeData });
      precentageRomaji.push({ name: element.AnimeData.title.romaji, prec: similarityText(animeData.title.romaji.toLowerCase(), element.AnimeData.title.romaji.toLowerCase()), data: element.AnimeData });
      precentageEnglish.push({ name: element.AnimeData.title.english ? element.AnimeData.title.english.toLowerCase() : "", prec: similarityText(animeData.title.english?.toLowerCase(), element.AnimeData.title.english?.toLowerCase()), data: element.AnimeData });
    };
    console.log(precentageEnglish, precentageNative, precentageRomaji)

    let romaji = precentageRomaji.filter(item => item.prec === Math.max(...precentageRomaji.map(item => item.prec)));
    let english = precentageEnglish.filter(item => item.prec === Math.max(...precentageEnglish.map(item => item.prec)));
    let native = precentageNative.filter(item => item.prec === Math.max(...precentageNative.map(item => item.prec)));

    let list_of_number = [ ...romaji.map((element) => element.data.player_ID), ...english.map((element) => element.data.player_ID), ...native.map((element) => element.data.player_ID) ]
    const counter: { [key: string]: number } = {};

    for (const item of list_of_number) {
      if (item && !["unknown", "undefined", ""].includes(item)) {
        counter[item] = (counter[item] || 0) + 1;
      }
    }

    console.log(counter, romaji, english, native)

    let theMost = "";
    let max = 0;

    for (const [klucz, ilosc] of Object.entries(counter)) {
      if (ilosc > max) {
        theMost = klucz;
        max = ilosc;
      }
    }

    if (globalONEPIECE) anime_id = globalONEPIECE
    else anime_id = theMost

    // let card = data.filter((item: cardData) => item.AnimeData.title.native == anime_name.name)[0];

    // anime_id = card.AnimeData.player_ID ? card.AnimeData.player_ID : "";
  };

  if (anime_id == "") return { player_id: "", episodesData: [] };
  if (!anime_id) return { player_id: "", episodesData: [] }

  let anime_data = (await extractInformation(anime_id)).episodesList
  if (!anime_data) return { player_id: "", episodesData: [] };

  return { player_id: anime_id ? anime_id : "", episodesData: anime_data };
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
  let secondVariables = `{"showId":"${id}","episodeNumStart":${episode},"episodeNumEnd":${episode}}`
  const secondResp = await sendToAPI(secondVariables, HASH_DATA, header)
  if (!secondResp) data
  if (!secondResp.data.episodeInfos) return data

  if (type == "dub" && secondResp.data.episodeInfos[0].vidInforsdub) {
    data.push({ hostname: "wp.youtube-anime.com", hls: false, resolution: [{ res: secondResp.data.episodeInfos[0].vidInforsdub.vidResolution.toString(), url: `https://wp.youtube-anime.com/aln.youtube-anime.com${secondResp.data.episodeInfos[0].vidInforsdub.vidPath}` }] })
  }
  if (type == "raw" && secondResp.data.episodeInfos[0].vidInforsraw) {
    data.push({ hostname: "wp.youtube-anime.com", hls: false, resolution: [{ res: secondResp.data.episodeInfos[0].vidInforsraw.vidResolution.toString(), url: `https://wp.youtube-anime.com/aln.youtube-anime.com${secondResp.data.episodeInfos[0].vidInforsraw.vidPath}` }] })
  }
  if (type == "sub" && secondResp.data.episodeInfos[0].vidInforssub) {
    data.push({ hostname: "wp.youtube-anime.com", hls: false, resolution: [{ res: secondResp.data.episodeInfos[0].vidInforssub.vidResolution.toString(), url: `https://wp.youtube-anime.com/aln.youtube-anime.com${secondResp.data.episodeInfos[0].vidInforssub.vidPath}` }] })
  }
  console.log(data, secondResp)

  return data
}

export async function convertToNewData(id: string): Promise<cardData | null> {
  try {
    let variables = `{"_id":"${id}"}`
    const resp = await sendToAPI(variables, HASH_INFO, header)
    if (resp) return await converterData(resp.data.show)
    return null
  } catch (Error) {
    console.error(Error)
    return null
  }
}

export async function getEpisodeList(type: string, anime_id: string): Promise<{ ep: string, img?: string, title?: string }[] | null> {
  try {
    let variables = `{"_id":"${anime_id}"}`
    const resp = await sendToAPI(variables, HASH_INFO, header)
    if (resp) {
      let data = (await converterData(resp.data.show)).AnimeData.episodesList
      if (!data) return null
      return data.filter(item => item.type === type).flatMap(item => item.episodes)
    }
    return null
  } catch (Error) {
    console.error(Error)
    return null
  }
}

export const infoPluginPlayer: pluginFormat = {
  version: "0.1",
  name: "Allmanga",
  author: "Owca525",
  player: {
    animeDataList: getInformation,
    getUrls: extractURLS,
    episodeList: getEpisodeList,
    animeList: getAnimeList,
    getInformation: extractInformation
  },
  sidebarAddon: [{ icon: "today", text: "Recent Anime", onClick: async () => await recentAnime() }]
}