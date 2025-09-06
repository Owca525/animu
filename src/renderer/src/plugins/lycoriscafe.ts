import { AnimeData, cardData, episodeList, playerData, pluginFormat } from "@renderer/utils/GlobalInterface";

const WEB = "https://www.lycoris.cafe"

const HEADER = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
}

function convertText(text: string) {
    let uri = encodeURI(text.replaceAll("[", "").replaceAll("]", ""))
    return uri.replaceAll("+", "%2B")
        .replaceAll("%20", "+")
}

function detectResoltion(text: string): string {
    switch (text) {
        case "SD":
            return "480"
        case "HD":
            return "720"
        case "FHD":
            return "1080"
    }
    return text
}

async function extractEpisodeData(_type: string, episode: string, id: string): Promise<playerData[]> {
    let url = `${WEB}/api/anime/${id}`
    const req = await window.api.request.get(url, HEADER);
    if (!req.success) return []
    let episodes = req.data.anime["episodes"]
    let currentEpisode: { res: string, url: string }[] = []
    let subtitles: { url: string, lang: string, label: string, format: string }[] = []
    for (let index = 0; index < episodes.length; index++) {
        const element = episodes[index];
        if (element["number"] == parseInt(episode)) {
            for (const key in element["secondarySource"]) {
                if (element != "")
                currentEpisode.push({ res: detectResoltion(key), url: element["secondarySource"][key] })
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
        }
    }
    return [{
        hostname: "lycoris.cafe",
        hls: false,
        defaultSubttiles: false,
        resolution: currentEpisode,
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
    for (let index = 0; index < req.data.data.length; index++) {
        const element = req.data.data[index];
        let tmp = convertAnime(element)
        if (tmp) endData.push(tmp)
    }

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

    let url = `${WEB}/api/anime/${animeID}`
    const req = await window.api.request.get(url, HEADER);
    if (!req.success) return 
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
    let url = `${WEB}/api/anime/${anime_id}`
    const req = await window.api.request.get(url, HEADER);
    if (!req.success) return []
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

export const lycorisCafe: pluginFormat = {
    version: "1.0",
    name: "Lycoris.cafe",
    author: "Owca525",
    icon: "https://www.lycoris.cafe/favicon.ico",
    player: {
        getUrls: extractEpisodeData,
        animeDataList: extractEpisodeDataList,
        episodeList: extractOnlyEpisodes,
        animeList: extractAnimeList
    },
    preferedLang: ["pl"]
}