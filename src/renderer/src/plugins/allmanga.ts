// import { playerUrlProps } from "@renderer/utils/interface"

import { convertMsToMinutes, makeSmallText } from "@renderer/utils/functions"
import { AnimeData, cardData, episodeList, playerData, playerPluginFormat } from "@renderer/utils/GlobalInterface"
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

const source_names = ["Yt-mp4", 'Sak', 'S-mp4', 'Luf-mp4', "Kir", "Default", "Uv-mp4"]

const mapping: Record<string, string> = {
  "79": "A", "7a": "B", "7b": "C", "7c": "D", "7d": "E", "7e": "F", "7f": "G",
  "70": "H", "71": "I", "72": "J", "73": "K", "74": "L", "75": "M", "76": "N",
  "77": "O", "68": "P", "69": "Q", "6a": "R", "6b": "S", "6c": "T", "6d": "U",
  "6e": "V", "6f": "W", "60": "X", "61": "Y", "62": "Z", "59": "a", "5a": "b",
  "5b": "c", "5c": "d", "5d": "e", "5e": "f", "5f": "g", "50": "h", "51": "i",
  "52": "j", "53": "k", "54": "l", "55": "m", "56": "n", "57": "o", "48": "p",
  "49": "q", "4a": "r", "4b": "s", "4c": "t", "4d": "u", "4e": "v", "4f": "w",
  "40": "x", "41": "y", "42": "z", "08": "0", "09": "1", "0a": "2", "0b": "3",
  "0c": "4", "0d": "5", "0e": "6", "0f": "7", "00": "8", "01": "9", "15": "-",
  "16": ".", "67": "_", "46": "~", "02": ":", "17": "/", "07": "?", "1b": "#",
  "63": "[", "65": "]", "78": "@", "19": "!", "1c": "$", "1e": "&", "10": "(",
  "11": ")", "12": "*", "13": "+", "14": ",", "03": ";", "05": "=", "1d": "%"
};

function findUrl(url: string, sourceName: string): string | undefined {
  for (let index = 0; index < source_names.length; index++) {
    const element = source_names[index];
    if (element.toLowerCase() == sourceName.toLowerCase()) return decodeText(url)
  }
  return
}

function decodeText(textString: string): string {
  const field = textString.trim();

  const hexPairs: string[] = [];
  for (let i = 0; i < field.length; i += 2) {
    hexPairs.push(field.slice(i, i + 2));
  }
  return hexPairs.map(hp => mapping[hp] ?? "").join("")
}

async function sendToAPI(variables: string, hash: string, header: any): Promise<{ success: boolean; data: any; status: number; statusText: string; error?: unknown; }> {
  let url = `${API_WEB}/api?variables=${variables}&extensions={"persistedQuery":{"version":1,"sha256Hash": "${hash}"}}`
  let data = await window.api.request.get(url, header)
  if (!data.success) console.log("Allmanga request", data, url, header)
  return data
}

async function sendRequest(url: string, header: any): Promise<{ success: boolean; data: any; status: number; statusText: string; error?: unknown; }> {
  let data = await window.api.request.get(url, header)
  if (!data.success) console.log("Allmanga request", data, url, header)
  return data
}

export async function SearchAnime(name: string, page: number = 1): Promise<Record<string, any> | null> {
  let variables = `{"search":{"query":"${name}"},"limit":26,"page":${page},"translationType":"sub","countryOrigin":"ALL"}`

  const resp = await sendToAPI(variables, HASH_SEARCH, header)
  if (resp) return resp.data.data
  return null
}

async function converterData(data: any): Promise<cardData | undefined> {
  if (!data) return
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
      characters: characters,
      source: undefined,
      trailer: undefined
    }
  }
}

export async function recentAnime(page: number = 1) {
  let variables = `{"search":{"sortBy":"Recent"},"limit":26,"page":${page},"translationType":"sub","countryOrigin":"JP"}`
  let req = await sendToAPI(variables, HASH_SEARCH, header)
  if (!req.success) {
    await setHomeData(async () => {
      return {
        sections: [
          {
            title: "Recent Anime",
            data: []
          }
        ]
      }
    })
    return
  }

  let animeData: cardData[] = []
  for (let index = 0; index < req.data.data.shows.edges.length; index++) {
    const element = req.data.data.shows.edges[index];
    let data = await converterData(element)
    if (data) animeData.push(data)
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

  await setHomeData(async () => {
    return {
      sections: [
        {
          title: "Recent Anime",
          data: animeData,
          onScrollDownFunction: (page) => recentAnime(page)
        }
      ]
    }
  })
}

async function getAnimeList(anime: AnimeData): Promise<cardData[]> {
  try {
    let data = await SearchAnime(anime.title.romaji.replaceAll('"', "").replaceAll('&', ""))
    if (!data) return []
    if (data.length <= 0) return []
    let returnData: cardData[] = []
    for (let index = 0; index < data.shows.edges.length; index++) {
      const element = data.shows.edges[index];
      let tmp = await converterData(element)
      if (tmp) returnData.push(tmp)
    }
    return returnData
  } catch (error) {
    console.log(`Error in getAnimeList allmanga: ${error}`)
    return []
  }
}

export async function extractInformation(type: "all" | "episodes", id: string): Promise<{ episodes: { ep: string; img?: string; title?: string }[]; type: string; name?: string }[] | { ep: string; img?: string; title?: string }[]> {
  let variables = `{"_id":"${id}"}`;
  const resp = await sendToAPI(variables, HASH_INFO, header);
  if (!resp.success || !resp.data.data.show) return []
  let anime_data = resp.data.data.show
  let episodes = await getEpisodeList(id, { start: parseInt(anime_data.availableEpisodesDetail.sub.at(-1)), end: parseInt(anime_data.availableEpisodesDetail.sub[0]) })
  if (episodes.length <= 0) return []
  if (type == "episodes") return episodes

  episodes = episodes.sort((a, b) => Number(a.ep) - Number(b.ep))

  return [
    {
      episodes: episodes.length !== anime_data.availableEpisodes.sub
        ? episodes.slice(0, anime_data.availableEpisodes.sub != 0 ? anime_data.availableEpisodes.sub - 1 : 0)
        : episodes,
      type: "sub"
    },
    {
      episodes: episodes.length !== anime_data.availableEpisodes.dub
        ? episodes.slice(0, anime_data.availableEpisodes.dub != 0 ? anime_data.availableEpisodes.dub - 1 : 0)
        : episodes,
      type: "dub"
    },
    {
      episodes: episodes.length !== anime_data.availableEpisodes.raw
        ? episodes.slice(0, anime_data.availableEpisodes.raw != 0 ? anime_data.availableEpisodes.raw - 1 : 0)
        : episodes,
      type: "raw"
    }
  ]
}

function findAnime(animeList: cardData[], anime: AnimeData): string | undefined {
  try {
    console.log("First Check", animeList)
    // FIRST CHECK
    if (animeList.length <= 0) return undefined
    if (animeList.length == 1) return animeList[0].AnimeData.player_ID

    // Second Check
    let seasonYearFilter = animeList.filter((element) => element.AnimeData.seasonYear == anime.seasonYear)
    console.log("Second Check", seasonYearFilter)
    if (seasonYearFilter.length <= 0) return undefined
    if (seasonYearFilter.length == 1) return seasonYearFilter[0].AnimeData.player_ID

    // Third Check
    let seasonFilter = seasonYearFilter.filter((element) => makeSmallText(element.AnimeData.season) == makeSmallText(anime.season))
    console.log("Third Check", seasonYearFilter)
    if (seasonFilter.length <= 0) return undefined
    if (seasonFilter.length == 1) return seasonFilter[0].AnimeData.player_ID

    // Four Check
    let episodesFilter: cardData[] | undefined = undefined
    if (anime.episodes) {
      episodesFilter = seasonFilter.filter((element) => element.AnimeData.episodes == anime.episodes)
      console.log("Four Check", episodesFilter)
      if (episodesFilter.length <= 0) return undefined
      if (episodesFilter.length == 1) return episodesFilter[0].AnimeData.player_ID
    }

    // Five Check
    let durationFilter: cardData[] = []
    if (episodesFilter) durationFilter = episodesFilter.filter((element) => element.AnimeData.duration == anime.duration)
    else durationFilter = seasonFilter.filter((element) => element.AnimeData.duration == anime.duration)
    console.log("Five Check", durationFilter)
    if (durationFilter.length <= 0) return undefined
    if (durationFilter.length == 1) return durationFilter[0].AnimeData.player_ID

    // Six Check
    let formatFilter = durationFilter.filter((element) => makeSmallText(element.AnimeData.format) == makeSmallText(anime.format))
    console.log("Six Check", formatFilter)
    if (formatFilter.length <= 0) return undefined
    if (formatFilter.length == 1) return formatFilter[0].AnimeData.player_ID

    return formatFilter[0].AnimeData.player_ID
  } catch (error) {
    console.error("Allmanga findAnime error", error)
    return animeList[0].AnimeData.player_ID
  }
}

export async function getInformation(animeData?: AnimeData, anime_id?: string): Promise<episodeList> {
  try {
    console.log(animeData, anime_id)
    let tmpAnimeID = anime_id
    if (animeData && !tmpAnimeID) {
      let data = await getAnimeList(animeData);
      tmpAnimeID = findAnime(data, animeData)
    };
    console.log(tmpAnimeID)
    if (!tmpAnimeID || tmpAnimeID == "") return { player_id: "", episodesData: [] }

    let episodeList = await extractInformation("all", tmpAnimeID)
    console.log(episodeList)
    return { player_id: tmpAnimeID, episodesData: episodeList as { episodes: { ep: string; img?: string; title?: string }[]; type: string; name?: string }[] };
  } catch (error) {
    console.error("Allmanga getInformation error", error)
    return { player_id: "", episodesData: [] }
  }
}

// { resolution: [{ url: url, res: "1080" }], hostname: new URL(url).hostname, hls: false }
async function getURLS(url: string): Promise<playerData | undefined> {
  if (url.startsWith("https")) return undefined
  const links = await sendRequest(`http://allanime.day${url.replace("clock", "clock.json")}`, {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
  })
  console.log(url, links)
  if (!links.success) return undefined

  let listUrls: playerData | undefined

  links.data.links.forEach(element => {
    if (!element.src) return
    const urlObject = new URL(element.src);
    if (element.mp4) {
      listUrls = { resolution: [{ url: element.src, res: "1080", hls: false }], hostname: urlObject.hostname }
    } else {
      listUrls = { resolution: [{ url: element.src, res: "", hls: true }], hostname: urlObject.hostname }
    }
  });
  return listUrls
}

export async function extractURLS(type: string, episode: string, id: string): Promise<playerData[]> {
  let variables = `{"showId":"${id}","translationType":"${type}","episodeString":"${episode}"}`
  const resp = await sendToAPI(variables, HASH_PLAYER, header)
  if (!resp.success) return []
  const sources = resp.data.data.episode.sourceUrls
  const urls = sources
    .map((tmp: { sourceUrl: string; sourceName: string }) =>
      findUrl(tmp.sourceUrl, tmp.sourceName)
    )
    .filter((item: string) => item !== undefined)

  let data: playerData[] = []
  for (let i = 0; i < urls.length; i++) {
    const element = urls[i];
    let tmp = await getURLS(element)
    if (tmp) data.push(tmp)
  }

  console.log(resp.data.data.episode.episodeInfo.vidInforssub)
  if (type == "dub" && resp.data.data.episode.episodeInfo.vidInforsdub) {
    data.push({ hostname: "wp.youtube-anime.com", resolution: [{
      res: resp.data.data.episode.episodeInfo.vidInforsdub.vidResolution.toString(), url: `https://wp.youtube-anime.com/aln.youtube-anime.com${resp.data.data.episode.episodeInfo.vidInforsdub.vidPath}`,
      hls: false
    }] })
  }
  if (type == "raw" && resp.data.data.episode.episodeInfo.vidInforsraw) {
    data.push({ hostname: "wp.youtube-anime.com", resolution: [{
      res: resp.data.data.episode.episodeInfo.vidInforsraw.vidResolution.toString(), url: `https://wp.youtube-anime.com/aln.youtube-anime.com${resp.data.data.episode.episodeInfo.vidInforsraw.vidPath}`,
      hls: false
    }] })
  }
  if (type == "sub" && resp.data.data.episode.episodeInfo.vidInforssub) {
    data.push({ hostname: "wp.youtube-anime.com", resolution: [{
      res: resp.data.data.episode.episodeInfo.vidInforssub.vidResolution.toString(), url: `https://wp.youtube-anime.com/aln.youtube-anime.com${resp.data.data.episode.episodeInfo.vidInforssub.vidPath}`,
      hls: false
    }] })
  }

  return data
}

export async function convertToNewData(id: string): Promise<cardData | undefined> {
  try {
    let variables = `{"_id":"${id}"}`
    const resp = await sendToAPI(variables, HASH_INFO, header)
    if (!resp.success) return
    return await converterData(resp.data.data.show)
  } catch (Error) {
    console.error(Error)
    return
  }
}

async function formatEpisodeData(data: any): Promise<{ ep: string, img?: string, title?: string }[]> {
  try {
    if (!data) return []
    let finnallData: { ep: string, img?: string, title?: string }[] = []
    for (let index = 0; index < data.length; index++) {
      const element = data[index];
      const thumbnail = element.thumbnails.filter(url => url.startsWith("https"))
      finnallData.push({
        ep: element.episodeIdNum,
        img: thumbnail.length > 0 ? thumbnail[0] : undefined,
        title: element.notes ? element.notes.replace("<note-split>", " ") : undefined
      })
    }
    return finnallData
  } catch (error) {
    console.error("formatEpisodeData", error, data);
    return []
  }
}

export async function getEpisodeList(anime_id: string, episode: { start: number, end: number }): Promise<{ ep: string, img?: string, title?: string }[]> {
  try {
    let variables = `{"showId":"${anime_id}","episodeNumStart":${episode.start},"episodeNumEnd":${episode.end}}`
    const resp = await sendToAPI(variables, HASH_DATA, header)
    console.log(variables, resp)
    if (!resp.success) return []
    if ("errors" in resp.data.data) return []
    if (!resp.data.data.episodeInfos) return []
    return await formatEpisodeData(resp.data.data.episodeInfos)
  } catch (Error) {
    console.error(Error)
    return []
  }
}

async function searchAnime(name: string, page: number, _params?: { genres?: string[]; years?: string; seasons?: string; format?: string[]; airing?: string }): Promise<cardData[]> {
  let dataReq = await SearchAnime(name, page)
  if (!dataReq || dataReq.length <= 0) return []

  let returnData: cardData[] = []
  for (let index = 0; index < dataReq.shows.edges.length; index++) {
    const element = dataReq.shows.edges[index];
    let data = await converterData(element)
    if (data) returnData.push(data)
  }

  return returnData
}

export const infoPluginPlayer: playerPluginFormat = {
  version: "1.3",
  name: "Allmanga",
  author: "Owca525",
  icon: "https://allmanga.to/android-icon-192x192.png",
  player: {
    extractEpisodeList: getInformation,
    extractPlayerData: extractURLS,
    extractOnlyEpisodesList: async (_type, id) => { return await extractInformation("episodes", id) as { ep: string; img?: string; title?: string }[] },
    searchAnime: searchAnime
  },
  sidebarAddon: [{ icon: "today", text: "Recent Anime", onClick: async () => await recentAnime() }],
  preferedLang: ["en"]
}