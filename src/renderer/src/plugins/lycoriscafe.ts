import { timeToSeconds } from "@renderer/utils/functions";
import { AnimeData, cardData, episodeList, playerChapterList, playerData, playerSubtitlesFormat, pluginFormat } from "@renderer/utils/GlobalInterface";
import { getPlayerPluginCache, setPluginPlayerCache } from "@renderer/utils/pluginApi";

const WEB = "https://www.lycoris.cafe"

const HEADER = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
}

function convertText(text: string) {
    let uri = encodeURI(text.replaceAll("[", "").replaceAll("]", ""))
    return uri.replaceAll("+", "%2B")
        .replaceAll("%20", "+")
}

function detectResoltion(text: string): string | undefined {
    switch (text) {
        case "SD":
            return "480"
        case "HD":
            return "720"
        case "FHD":
            return "1080"
        case "SourceMKV":
            return "Source"
    }
    return undefined
}

async function requestToApi(anime_id: string): Promise<{ data: any } | undefined> {
    let cache = await getPlayerPluginCache()
    if (cache && cache.anime_id == anime_id) {
        return cache
    } else {
        let url = `${WEB}/api/anime/${anime_id}`
        let req = await window.api.request.get(url, HEADER);
        if (!req.success) return undefined
        await setPluginPlayerCache({ anime_id: anime_id, data: req.data })
        return { data: req.data }
    }
}

async function extractEpisodeData(_type: string, episode: string, id: string): Promise<playerData[]> {
    let req = await requestToApi(id)
    if (!req) return []
    let episodes = req.data.anime["episodes"]
    let currentEpisode: { res: string, url: string; defaultSubtitles?: boolean; }[] = []
    let subtitles: playerSubtitlesFormat[] = []
    let chapters: playerChapterList = []
    episodes.forEach(element => {
        if (element["number"] == parseInt(episode)) {
            for (const key in element["secondarySource"]) {
                if (element != "") {
                    let resolution = detectResoltion(key);
                    if (resolution) currentEpisode.push({ res: resolution, url: element["secondarySource"][key], defaultSubtitles: resolution == "Source" })
                }
            }

            if (element["subtitles"]["EN"]) subtitles.push({
                url: element["subtitles"]["EN"],
                lang: "en",
                label: "English",
                format: "ass"
            })
            if (element["subtitles"]["PL"]) subtitles.push({
                url: element["subtitles"]["PL"],
                lang: "pl",
                label: "Polish",
                format: "ass"
            })
            let extractedChapters = JSON.parse(element["markerPeriods"])
            if (extractedChapters[0] && timeToSeconds(extractedChapters[0]["endTime"]) >= 0) chapters.push({ start: timeToSeconds(extractedChapters[0]["startTime"]), end: timeToSeconds(extractedChapters[0]["endTime"]), type: "opening", name: "Opening" })
            if (extractedChapters[1] && timeToSeconds(extractedChapters[1]["endTime"]) >= 0) chapters.push({ start: timeToSeconds(extractedChapters[1]["startTime"]), end: timeToSeconds(extractedChapters[1]["endTime"]), type: "ending", name: "Ending" })
        }
    });

    return [{
        hostname: "lycoris.cafe",
        hls: false,
        resolution: currentEpisode.sort((a, b) => Number(a.res) - Number(b.res)).reverse(),
        listChapters: chapters,
        subtitles: subtitles
    }]
}

function convertAnime(data: any): cardData | undefined {
    try {
        return {
            AnimeData: {
                characters: [],
                title: {
                    english: data["englishTitle"],
                    native: "",
                    romaji: data["title"]
                },
                id: "",
                player_ID: data["id"],
                genres: data["genres"],
                averageScore: data["rating"] * 10,
                season: data["season"],
                source: data["source"],
                status: data["status"],
                studios: [data["studio"]],
                description: data["synopsis"],
                format: data["format"],
                coverImage: data["poster"],
                bannerImage: data["background"],
                seasonYear: data["seasonYear"],
                popularity: data["popularity"],
                episodes: data["totalEpisodes"]
            }
        }
    } catch (error) {
        console.error(error)
        return
    }
}

async function extractAnimeList(data: AnimeData): Promise<cardData[]> {
    let url = `https://www.lycoris.cafe/api/search?page=1&pageSize=12&search=${convertText(data.title.romaji)}&genres=&status=&format=&year=&season=&source=&sortField=popularity&sortDirection=desc&preferRomaji=true`
    const req = await window.api.request.get(url, HEADER);
    if (!req.success) return []
    let endData: cardData[] = []
    req.data.data.forEach(element => {
        let tmp = convertAnime(element)
        if (tmp) endData.push(tmp)
    });

    return endData
}

async function extractEpisodeDataList(animeData?: AnimeData, anime_id?: string): Promise<episodeList | undefined> {
    console.log(animeData, anime_id)
    let animeID = anime_id;
    if (!animeID && animeData) {
        let animeList = await extractAnimeList(animeData)
        console.log(animeList)
        if (animeList.length <= 0) return
        animeID = animeList[0].AnimeData.player_ID
    }
    if (!animeID) return

    let req = await requestToApi(animeID)
    if (!req) return
    console.log(req)
    let tmpEpisodes = req.data.anime["episodes"]
    let episodes: { ep: string, img?: string, title?: string }[] = tmpEpisodes.map((ep) => {
        return {
            ep: ep["number"],
            img: ep["thumbnail"],
            title: ep["title"]
        }
    })

    return {
        player_id: animeID,
        episodesData: [{ episodes: episodes, type: "sub", name: "Subtitles" }]
    }
}

async function extractOnlyEpisodes(_type: string, anime_id: string): Promise<{ ep: string; img?: string; title?: string; }[]> {
    let req = await requestToApi(anime_id)
    if (!req) return []
    let tmpEpisodes = req.data.anime["episodes"]
    let episodes: { ep: string, img?: string, title?: string }[] = tmpEpisodes.map((ep) => {
        return {
            ep: ep["number"],
            img: ep["thumbnail"],
            title: ep["title"]
        }
    })

    return episodes
}

async function searchAnime(name: string, page: number, params?: { genres?: string[]; years?: string; seasons?: string; format?: string[]; airing?: string; }): Promise<cardData[]> {
    let url = `https://www.lycoris.cafe/api/search?page=${page}&pageSize=12&search=${name}&genres=&status=&format=&year=&season=&source=&sortField=popularity&sortDirection=desc&preferRomaji=true`
    const req = await window.api.request.get(url, HEADER);
    if (!req.success) return []

    console.log(req)
    
    return []
}

export const lycorisCafe: pluginFormat = {
    version: "1.0",
    name: "Lycoris.cafe",
    author: "Owca525",
    icon: "https://www.lycoris.cafe/favicon.ico",
    player: {
        getUrls: extractEpisodeData,
        animeDataList: extractEpisodeDataList,
        episodeList: extractOnlyEpisodes,
        animeList: extractAnimeList,
        search: searchAnime
    },
    preferedLang: ["pl", "en"]
}