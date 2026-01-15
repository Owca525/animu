import { request, timeToSeconds } from "@renderer/utils/functions";
import { AnimeData, cardData, episodeList, genresSearchFormat, playerPluginFormat, playerChapterList, playerData, playerSubtitlesFormat, resolutionFormat } from "@renderer/utils/types";
const WEB = "https://www.lycoris.cafe"
const HEADER = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
}

function detectResoltion(text: string): string {
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
    return "Unknown"
}

function convertToAnimeData(data: any): AnimeData | undefined {
    try {
        return {
            characters: [],
            studios: [data["studio"]],
            genres: data["genres"],
            title: {
                english: data["englishTitle"],
                native: "",
                romaji: data["title"]
            },
            id: data["id"],
            format: data["format"],
            season: data["season"],
            seasonYear: data["seasonYear"],
            source: data["source"],
            status: data["status"],
            averageScore: data["rating"] ? data["rating"] * 10 : undefined,
            coverImage: data["poster"],
            nextAiringEpisode: data["nextAiringEpisode"],
            bannerImage: data["background"]
        }
    } catch (error) {
        return undefined
    }
}

async function requestToApi(anime_id: string): Promise<{ data: any } | undefined> {
    let url = `${WEB}/api/anime/${anime_id}`
    let req = await request(url, { headers: HEADER });
    if (!req.success) return undefined
    return { data: req.json }
}

export default class LycorisCafe implements playerPluginFormat {
    metadata: playerPluginFormat["metadata"] = {
        version: "1.1",
        name: "Lycoris.cafe",
        author: "Owca525",
        icon: "https://www.lycoris.cafe/favicon.ico",
        urlWebsite: WEB,
        supportLang: ["pl"]
    };
    config?: { [key: string]: any; } | undefined;

    extractPlayerData = async (_type: string, episode: string, id: string): Promise<playerData[]> => {
        let req = await requestToApi(id)
        if (!req) return []
        let episodes = req.data.anime["episodes"]
        let currentEpisode: resolutionFormat[] = []
        let subtitles: playerSubtitlesFormat[] = []
        let chapters: playerChapterList[] = []

        let tmp = episodes.find((element) => parseInt(element.number) == parseInt(episode))
        if (!tmp) return []

        let reqID = await request(`${WEB}/api/watch/getVideoLink?id=${tmp.id}`, { headers: HEADER });
        if (!reqID.success) return []
        // if (!reqID.data.endWith("LC")) return []

        let decodeData = reqID.text.slice(0, -2)
        decodeData = decodeData.split("").reverse().map(el => String.fromCharCode(el.charCodeAt(0) - 7)).join("")

        try {
            let animeEpisodes = JSON.parse(atob(decodeData))
            for (const key in animeEpisodes) {
                let res = detectResoltion(key)
                if (animeEpisodes[key].length <= 0) continue 
                if (res == "Unknown") continue
                currentEpisode.push({
                    res: res,
                    url: animeEpisodes[key],
                    defaultSubtitles: res == "Source",
                })
            }
        } catch (error) {
            console.error(error, atob(decodeData), decodeData, reqID)
        }

        if (tmp["subtitles"]["EN"]) subtitles.push({
            url: tmp["subtitles"]["EN"],
            lang: "en",
            label: "English",
            format: "ass"
        })
        if (tmp["subtitles"]["PL"]) subtitles.push({
            url: tmp["subtitles"]["PL"],
            lang: "pl",
            label: "Polish",
            format: "ass"
        })
        let extractedChapters = JSON.parse(tmp["markerPeriods"])
        if (extractedChapters[0] && timeToSeconds(extractedChapters[0]["endTime"]) >= 0) chapters.push({ start: timeToSeconds(extractedChapters[0]["startTime"]), end: timeToSeconds(extractedChapters[0]["endTime"]), type: "opening", name: "Opening" })
        if (extractedChapters[1] && timeToSeconds(extractedChapters[1]["endTime"]) >= 0) chapters.push({ start: timeToSeconds(extractedChapters[1]["startTime"]), end: timeToSeconds(extractedChapters[1]["endTime"]), type: "ending", name: "Ending" })

        return [{
            hostname: "lycoris.cafe",
            resolution: currentEpisode.sort((a, b) => Number(a.res) - Number(b.res)).reverse(),
            listChapters: chapters,
            subtitles: subtitles
        }]
    }
    extractEpisodeList = async (animeData?: AnimeData, anime_id?: string): Promise<episodeList | undefined> => {
        let animeID = anime_id;
        
        if (!animeID && animeData) {
            let animeList = await this.searchAnime(animeData.title.romaji, 1)
            if (animeList.length <= 0) return
            animeID = animeList[0].AnimeData.id
        }
        if (!animeID) return

        let req = await requestToApi(animeID)
        if (!req) return
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
    extractOnlyEpisodesList = async (_type: string, anime_id: string): Promise<{ ep: string; img?: string; title?: string; }[]> => {
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
    searchAnime = async (name: string, page: number, _params?: genresSearchFormat): Promise<cardData[]> => {
        let url = `https://www.lycoris.cafe/api/search?page=${page}&pageSize=12&search=${name}&genres=&status=&format=&year=&season=&source=&sortField=popularity&sortDirection=desc&preferRomaji=true`
        const req = await request(url, { headers: HEADER });
        if (!req.success || !req.json) return []

        let data: cardData[] = req.json.data.map((element) => { return { AnimeData: convertToAnimeData(element) } })
        if (!data) return []
        return data
    }

}