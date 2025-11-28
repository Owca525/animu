import { AnimeData, cardData, episodeList, genresSearchFormat, playerPluginFormat, playerData, playerSubtitlesFormat, resolutionFormat } from "@renderer/utils/types";
import { t } from "i18next";

const BACKEND = "https://backend.animetsu.bz"
const WEBSITE = "https://animetsu.bz/"

const HEADER = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
    'Origin': WEBSITE,
    'Referer': WEBSITE
}

async function extractResolutions(episode: string, type: string, playerData: playerData, server?: any, id?: string): Promise<playerData | undefined> {
    try {
        if (!server) return undefined
        let response = await window.api.request.get(`${BACKEND}/api/anime/tiddies?server=${server}&id=${id}&num=${episode}&subType=${type}`, HEADER);
        if (!response.success || !response.data) return undefined
        let subtitles: playerSubtitlesFormat[] = []
        if (response.data["subtitles"]) {
            subtitles = response.data["subtitles"].map((element) => {
                const parts = element["url"].split(".");
                const lastPart = parts.pop();
                return { url: element["url"], lang: "en", label: element["lang"], format: lastPart }
            })
        }
        let resolutions: resolutionFormat[] = response.data["sources"].map((element) => ({
            res: element["quality"],
            url: element["url"],
            defaultSubtitles: subtitles.length > 0,
            hls: true,
            reqHeader: {
                ...HEADER,
            }
        }))

        return {
            ...playerData,
            splitHLS: resolutions[0].res != "master",
            resolution: resolutions,
            subtitles: subtitles,
            listChapters: response.data["skips"] ? [
                { start: response.data["skips"]["op"]["startTime"], end: response.data["skips"]["op"]["endTime"], type: "opening" },
                { start: response.data["skips"]["ed"]["startTime"], end: response.data["skips"]["ed"]["endTime"], type: "ending" }
            ] : undefined
        }
    } catch (error) {
        console.error("extractResolutions/GojoLive", error)
        return
    }
}

export default class GojoLive implements playerPluginFormat {
    metadata: playerPluginFormat["metadata"] = {
        version: "1.1",
        name: "GojoLive",
        icon: "https://animetsu.bz/android-chrome-512x512.png",
        author: "Owca525",
        supportLang: ["en"],
        urlWebsite: WEBSITE,
    };
    extractPlayerData = async (_type: string, episode: string, id: string): Promise<playerData[]> => {
        try {
            let response = await window.api.request.get(`${BACKEND}/api/anime/servers?id=${id}&num=${episode}`, HEADER);
            if (!response.success || !response.data) return []
            let data: playerData[] = []
            for (let index = 0; index < response.data.length; index++) {
                const element = response.data[index];
                data.push({
                    hostname: element["id"],
                    defaultHost: element["default"],
                    resolution: [],
                    extractResolution: async (episode: string, _type: string, playerData, id?: string) => await extractResolutions(episode, "sub", playerData, element["id"], id)
                })
                if (element["hasDub"]) {
                    data.push({
                        hostname: `${element["id"]} (dub)`,
                        defaultHost: false,
                        resolution: [],
                        extractResolution: async (episode: string, _type: string, playerData, id?: string) => await extractResolutions(episode, "dub", playerData, element["id"], id)
                    })
                }
            }

            return data
        } catch (error) {
            console.error("exctractPlayerData/GojoLive", error)
            return []
        }
    }
    extractEpisodeList = async (animeData?: AnimeData, anime_id?: string): Promise<episodeList | undefined> => {
        try {
            let animeID = anime_id
            if (animeData) animeID = animeData.id
            if (!animeID) return

            let response = await window.api.request.get(`${BACKEND}/api/anime/eps/${animeID}`, HEADER);
            if (!response.success || !response.data) return
            let episodes = response.data.map((element) => {
                return {
                    ep: element["number"],
                    img: element["image"],
                    title: element["title"]
                }
            })

            return {
                player_id: animeID,
                episodesData: [{
                    episodes: episodes,
                    type: "sub",
                    name: `${t("information.types.sub")}/${t("information.types.dub")}`
                }],
            }
        } catch (error) {
            console.error("extractEpisodeList/GojoLive", error)
            return undefined
        }
    }
    extractOnlyEpisodesList = async (_type: string, anime_id: string): Promise<{ ep: string; img?: string; title?: string; }[]> => {
        let data = await this.extractEpisodeList(undefined, anime_id)
        if (!data) return []
        return data.episodesData[0].episodes
    }
    searchAnime = async (name: string, page: number, _params?: genresSearchFormat): Promise<cardData[]> => {
        let response = await window.api.request.get(`${BACKEND}/api/anime/search?query=${name}&page=${page}&perPage=35&year=any&sort=POPULARITY_DESC&season=any&format=any&status=any`, HEADER);
        if (!response.success || !response.data) return []
        let data: cardData[] = []
        for (let index = 0; index < response.data.results.length; index++) {
            const element = response.data.results[index];
            data.push({
                AnimeData: {
                    genres: undefined,
                    characters: [],
                    studios: [],
                    title: element["title"],
                    id: element["id"],
                    player_ID: element["id"],
                    coverImage: element["coverImage"]["extraLarge"] ? element["coverImage"]["extraLarge"] : element["coverImage"]["large"]
                }
            })
        }
        return data
    }

}