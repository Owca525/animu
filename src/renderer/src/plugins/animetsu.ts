import { makeSmallText, request } from "@renderer/utils/functions";
import { t } from "@renderer/utils/i18n";
import { AnimeData, cardData, episodeList, genresSearchFormat, playerPluginFormat, playerData, playerSubtitlesFormat, resolutionFormat, playerChapterList, playerDataExtended } from "@renderer/utils/types";

const BACKEND = "https://b.animetsu.live/"
const WEBSITE = "https://animetsu.live/"

const HEADER = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
    'Origin': WEBSITE,
    'Referer': WEBSITE
}

function preaperURL(str: string) {
    if (!str) return str
    return str.replaceAll("//", "/").replace("https:/", "https://")
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
        console.error("Animetsu SheepFinderAnime2000 error", error)
        return animeList[0].player_ID
    }
}

async function extractResolutions(episode: string, type: string, playerData: playerData, server: string): Promise<playerData | undefined> {
    try {
        // oppai?server=${server}&id=${id}&num=${episode}&subType=${type}
        if (!server) return undefined
        let response = await request(preaperURL(`${BACKEND}/api/anime/oppai/${server}/${episode}?server=default&source_type=${type}`), { headers: HEADER });
        if (!response.success || !response.json) return undefined
        let subtitles: playerSubtitlesFormat[] = []
        if (response.json["subtitles"]) {
            subtitles = response.json["subtitles"].map((element) => {
                const parts = element["url"].split(".");
                const lastPart = parts.pop();
                return { url: element["url"], lang: "en", label: element["lang"], format: lastPart }
            })
        }

        let resolutions: resolutionFormat[] = response.json["sources"].map((element) => ({
            res: element["quality"],
            url: `https://ani.metsu.site/proxy${element["url"]}`,
            defaultSubtitles: subtitles.length > 0,
            hls: true,
            reqHeader: {
                ...HEADER,
            }
        }))

        let chapters: playerChapterList[] = response.json["skips"] ? [
            { start: response.json["skips"]["intro"]["start"], end: response.json["skips"]["intro"]["end"], type: "opening" },
            { start: response.json["skips"]["outro"]["start"], end: response.json["skips"]["outro"]["end"], type: "ending" }
        ] : []

        return {
            ...playerData,
            splitHLS: resolutions[0].res != "master",
            resolution: resolutions,
            subtitles: subtitles,
            listChapters: chapters.filter(chapter => !(chapter.start === 0 && chapter.end === 0))
        }
    } catch (error) {
        console.error("extractResolutions/Animetsu", error)
        return
    }
}

export default class Animetsu implements playerPluginFormat {
    metadata: playerPluginFormat["metadata"] = {
        version: "1.4",
        name: "Animetsu.Live",
        icon: "https://animetsu.live/apple-touch-icon.png",
        author: "Owca525",
        supportLang: ["en"],
        urlWebsite: WEBSITE,
    };
    config: { [key: string]: any; } = {
        Backend: BACKEND
    };

    // checkBackend = async () => {
    //     const response = await request(`${WEBSITE}assets/index.js?ex`)
    //     if (!response.success) return
    //     const tmp = response.text.match(/https:\/\/([^.]+)\.\$\{window\?\.\location\?\.\hostname\}/)
    //     if (!tmp) return
    //     const url = `${tmp[0].replaceAll("${window?.location?.hostname}", new URL(WEBSITE).hostname)}/`
    //     if (!url.startsWith("https://")) return
    //     if (url != this.config.Backend) {

    //     }
    // }

    // constructor() {
    //     this.checkBackend()
    // }
    
    extractPlayerData = async (_type: string, episode: string, id: string): Promise<playerData[]> => {
        try {
            let response = await request(preaperURL(`${BACKEND}/api/anime/servers/${id}/${episode}`), { headers: HEADER });
            if (!response.success || !response.json) {
                console.warn("extractPlayerData/Animetsu request failed", response)
                return []
            }
            let data: playerData[] = []
            for (let index = 0; index < response.json.length; index++) {
                const element = response.json[index];
                data.push({
                    hostname: element["id"],
                    defaultHost: element["default"],
                    resolution: [],
                    extractResolution: async (playerData: playerDataExtended) => await extractResolutions(playerData.episode.currentEpisode, "sub", playerData, id),
                    isDubbing: async (playerData: playerDataExtended) => (await extractResolutions(playerData.episode.currentEpisode, "dub", playerData, id))?.resolution
                })
            }

            return data
        } catch (error) {
            console.error("exctractPlayerData/Animetsu", error)
            return []
        }
    }
    extractEpisodeList = async (animeData?: AnimeData, anime_id?: string): Promise<episodeList | undefined> => {
        try {
            let animeID = anime_id
            if (animeData) {
                const results = await this.searchAnime(animeData.title.romaji, 0)
                animeID = SheepFinderAnime2000(results.map((v) => v.AnimeData), animeData)
            }
            if (!animeID) return

            let response = await request(preaperURL(`${BACKEND}/api/anime/eps/${animeID}`), { headers: HEADER });
            if (!response.success || !response.json) {
                console.warn("extractEpisodeList/Animetsu request failed", response)
                return
            }

            let episodes = response.json.map((element) => {
                return {
                    ep: element["ep_num"],
                    img: `${BACKEND}/proxy${element["img"]}`,
                    title: element["name"]
                }
            })

            console.log(episodes)

            return {
                player_id: animeID,
                episodesData: [{
                    episodes: episodes,
                    type: "sub",
                    name: `${t("information.types.sub")}/${t("information.types.dub")}`
                }],
            }
        } catch (error) {
            console.error("extractEpisodeList/Animetsu", error)
            return undefined
        }
    }
    extractOnlyEpisodesList = async (_type: string, anime_id: string): Promise<{ ep: string; img?: string; title?: string; }[]> => {
        let data = await this.extractEpisodeList(undefined, anime_id)
        if (!data) return []
        return data.episodesData[0].episodes
    }
    searchAnime = async (name: string, _page: number, _params?: genresSearchFormat): Promise<cardData[]> => {
        let response = await request(preaperURL(`${BACKEND}/api/anime/search/?query=${name}`), { headers: HEADER });
        if (!response.success || !response.json) return []
        let data: cardData[] = []
        for (let index = 0; index < response.json.results.length; index++) {
            const element = response.json.results[index];
            data.push({
                AnimeData: {
                    genres: undefined,
                    characters: [],
                    studios: [],
                    title: element["title"],
                    id: element["anilist_id"],
                    player_ID: element["id"],
                    coverImage: element["cover_image"]["extraLarge"] ? element["cover_image"]["extraLarge"] : element["cover_image"]["large"]
                }
            })
        }
        return data
    }

}