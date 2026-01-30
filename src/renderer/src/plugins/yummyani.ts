import { makeSmallText, request } from "@renderer/utils/functions";
import { AnimeData, cardData, episodeList, genresSearchFormat, playerData, playerPluginFormat, resolutionFormat } from "@renderer/utils/types";

const WEBSITE = "https://site.yummyani.me/"
const API = "https://site.yummyani.me/api"

const seasons: string[] = ["WINTER", "SPRING", "SUMMER", "FALL"]
const types: string[] = [
    "TV",
    "MOVIE",
    "MOVIE",
    "OVA",
    "SPECIAL",
    "TV_SHORT",
    "ONA"
]

function converterToAnimeData(data: { [key: string]: any }): AnimeData | undefined {
    console.log(data)
    try {
        return {
            id: "",
            player_ID: data["anime_id"],
            coverImage: `https:${data["poster"]["fullsize"]}`,
            title: {
                english: data["title"],
                romaji: data["title"],
                native: data["title"]
            },
            averageScore: data["rating"]["average"],
            seasonYear: data["year"],
            season: data["season"] != 0 ? seasons[data["season"] - 1] : undefined,
            status: data["anime_status"]["value"],
            description: data["description"],
            type: types[data["type"]["name"] - 1]
        }
    } catch (error) {
        console.error("Error in yummyani/converterToAnimeData", error)
        return
    }
}

function checkAnime(animeList: AnimeData[], anime: AnimeData): string | undefined {
    try {
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
        let typeFilter = seasonYearFilter.filter((element) => makeSmallText(element.type) == makeSmallText(anime.type))
        console.log("Four Check", seasonYearFilter)
        if (typeFilter.length <= 0) return undefined
        if (typeFilter.length == 1) return typeFilter[0].player_ID

        return
    } catch (error) {
        console.error("yummyani checkAnime error", error)
        return animeList[0].player_ID
    }
}

function detectPlayer(data: { [key: string]: any }): resolutionFormat[] {
    switch (data["data"]["player_id"]) {
        case 1:
            return [{ res: data["iframe_url"].split('/').at(-1), url: `https:${data["iframe_url"]}` }]
    }
    return []
}

export default class yummyani implements playerPluginFormat {
    metadata: playerPluginFormat["metadata"] = {
        version: "1.0",
        name: "Yummyani.me",
        author: "Owca525",
        icon: "https://site.yummyani.me/img/icon/yummy-192.png",
        supportLang: ["ru"],
        urlWebsite: WEBSITE
    };

    episodesCache: { [key: number]: any } = {}

    extractPlayerData = async (_type: string, episode: string, id: string): Promise<playerData[]> => {
        try {
            // TODO: End this
            await this.extractEpisodeList(undefined, id)
            const episodes: any[] = this.episodesCache[id].filter((v) => v["number"] == episode)
            return episodes.map((v) => ({
                hostname: v["data"]["dubbing"],
                resolution: detectPlayer(v)
            }))
        } catch (error) {
            console.error("error in extractPlayerData/yummyami", error)
            return []
        }
    }
    extractEpisodeList = async (animeData?: AnimeData, anime_id?: string): Promise<episodeList | undefined> => {
        let id = anime_id
        if (animeData && !anime_id) {
            const resp = await this.searchAnime(animeData.title.romaji, 0)
            if (resp.length <= 0) return

            id = checkAnime(resp.map(v => v.AnimeData), animeData)
        }

        if (!id) return
        let resp: any[] = []
        if (id in this.episodesCache) resp = this.episodesCache[id]
        else {
            const response = await request(`${API}/anime/${id}/videos`)
            if (!response.success || !response.json) return
            resp = response.json["response"]
            this.episodesCache = { ...this.episodesCache, [id]: resp }
        }

        if (resp.length <= 0) return

        let episodes: string[] = [...new Set(resp.map(v => v.number))]

        return {
            player_id: id,
            episodesData: [
                {
                    type: "dub",
                    episodes: episodes.map((v) => ({ ep: v }))
                }
            ]
        }
    }
    extractOnlyEpisodesList = async (_type: string, anime_id: string): Promise<{ ep: string; img?: string; title?: string; }[]> => {
        const response = await this.extractEpisodeList(undefined, anime_id)
        if (!response) return []
        return response.episodesData[0].episodes
    }
    searchAnime = async (name: string, _page: number, _params?: genresSearchFormat): Promise<cardData[]> => {
        const response = await request(`${API}/search?q=${encodeURIComponent(name)}&limit=20&offset=0`)
        if (!response.success || !response.json) return []
        let cards: AnimeData[] | undefined[] = response.json["response"].map((v) => converterToAnimeData(v))
        cards = cards.filter(item => item !== undefined) as AnimeData[]
        console.log(cards)
        return cards.map((v) => ({ AnimeData: v }))
    }

}