import { makeSmallText, request } from "@renderer/utils/functions";
import { AnimeData, cardData, episodeList, FilterPluginsParams, playerPluginFormat, playerChapterList, playerData, playerSubtitlesFormat, resolutionFormat, episodeMetadata } from "@renderer/utils/types";
const WEB = "https://www.lycoris.cafe"
const HEADER = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
}

function timeToSeconds(time: string): number {
    const [hms] = time.split(".");
    const parts = hms.split(":").map(Number);
    const [hours, minutes, seconds] = parts;

    return hours * 3600 + minutes * 60 + seconds;
}

function SheepFinderAnime2000(animeList: AnimeData[], anime: AnimeData): string | undefined {
    try {
        if (anime.id != "") {
            console.log("ID Check")
            const findedID = animeList.find((item) => item.id == anime.id)
            if (findedID) return findedID.player_ID
        }

        console.log("First Check", animeList)
        // FIRST CHECK
        if (animeList.length <= 0) return undefined
        if (animeList.length == 1) return animeList[0].player_ID

        // Second Check
        let seasonYearFilter = animeList.filter((element) => element.seasonYear == anime.seasonYear)
        console.log("Second Check", seasonYearFilter)
        if (seasonYearFilter.length <= 0) return undefined
        if (seasonYearFilter.length == 1) return seasonYearFilter[0].player_ID

        // Third Check
        let seasonFilter = seasonYearFilter.filter((element) => makeSmallText(element.season) == makeSmallText(anime.season))
        console.log("Third Check", seasonYearFilter)
        if (seasonFilter.length <= 0) return undefined
        if (seasonFilter.length == 1) return seasonFilter[0].player_ID

        // Four Check
        let episodesFilter: AnimeData[] | undefined = undefined
        if (anime.episodes) {
            episodesFilter = seasonFilter.filter((element) => element.episodes == anime.episodes)
            console.log("Four Check", episodesFilter)
            if (episodesFilter.length <= 0) return undefined
            if (episodesFilter.length == 1) return episodesFilter[0].player_ID
        }

        // Five Check
        let durationFilter: AnimeData[] = []
        if (episodesFilter) durationFilter = episodesFilter.filter((element) => element.duration == anime.duration)
        else durationFilter = seasonFilter.filter((element) => element.duration == anime.duration)
        console.log("Five Check", durationFilter)
        if (durationFilter.length <= 0) return undefined
        if (durationFilter.length == 1) return durationFilter[0].player_ID

        // Six Check
        let formatFilter = durationFilter.filter((element) => makeSmallText(element.format) == makeSmallText(anime.format))
        console.log("Six Check", formatFilter)
        if (formatFilter.length <= 0) return undefined
        if (formatFilter.length == 1) return formatFilter[0].player_ID

        return formatFilter[0].player_ID
    } catch (error) {
        console.error("LycorisCafe SheepFinderAnime2000 error", error)
        return animeList[0].player_ID
    }
}

function detectResoltion(text: string): string {
    switch (text) {
        case "SD":
            return "480"
        case "HD":
            return "720"
        case "FHD":
            return "1080"
        // case "SourceMKV":
        //     return "Source"
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
            player_ID: data["id"],
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

export function dateToUnix(dateStr: string | undefined): number | undefined {
    if (!dateStr) return undefined
    const date = new Date(dateStr);
    return Math.floor(date.getTime() / 1000);
}

async function requestToApi(anime_id: string): Promise<{ data: any } | undefined> {
    let url = `${WEB}/api/anime/${anime_id}`
    let req = await request(url, { headers: HEADER });
    /* IFDEF DEBUG */
    console.warn("requestToApi/lycorisCafe", req)
    /* ENDIF */
    if (!req.success) {
        console.error("Failed Request requestToApi/lycorisCafe", anime_id, req)
        return undefined
    }
    return { data: req.json }
}

export default class LycorisCafe implements playerPluginFormat {
    metadata: playerPluginFormat["metadata"] = {
        version: "1.6",
        name: "Lycoris.cafe",
        author: "Owca525",
        icon: "https://www.lycoris.cafe/favicon.ico",
        urlWebsite: WEB,
        supportLang: ["pl"]
    };

    extractPlayerData = async (_type: string, episode: episodeMetadata, id: string): Promise<playerData[]> => {
        let mainEpisode: string = typeof episode == "object" ? episode.ep : episode

        let req = await requestToApi(id)
        if (!req) return []
        let episodes = req.data.anime["episodes"]
        let currentEpisode: resolutionFormat[] = []
        let subtitles: playerSubtitlesFormat[] = []
        let chapters: playerChapterList[] = []

        let tmp = episodes.find((element) => parseInt(element.number) == parseInt(mainEpisode))
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
            animeID = SheepFinderAnime2000(animeList.map(v => v.AnimeData), animeData)
        }
        if (!animeID) return

        let req = await requestToApi(animeID)
        if (!req) return
        let tmpEpisodes = req.data.anime["episodes"]
        let episodes: episodeMetadata[] = tmpEpisodes.map((ep) => {
            return {
                ep: ep["number"],
                img: ep["thumbnail"],
                title: ep["title"],
                uploadedUnix: dateToUnix(ep["airDate"])
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
        let episodes: episodeMetadata[] = tmpEpisodes.map((ep) => {
            return {
                ep: ep["number"],
                img: ep["thumbnail"],
                title: ep["title"],
                uploadedUnix: dateToUnix(ep["airDate"])
            }
        })

        return episodes
    }
    searchAnime = async (name: string, page: number, _params?: FilterPluginsParams): Promise<cardData[]> => {
        let url = `${WEB}/api/search?page=${page}&pageSize=12&search=${name}&genres=&status=&format=&year=&season=&source=&sortField=popularity&sortDirection=desc&preferRomaji=true`
        const req = await request(url, { headers: HEADER });
        if (!req.success || !req.json) {
            console.warn("Failed Request searchAnime/LycorisCafe", req)
            return []
        }

        let data: cardData[] = req.json.data.map((element) => { return { AnimeData: convertToAnimeData(element) } })
        if (!data) return []
        return data
    }

}