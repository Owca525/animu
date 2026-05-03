import { makeSmallText, request } from "@renderer/utils/functions";
import { AnimeData, cardData, episodeList, episodeMetadata, FilterPluginsParams, playerChapterList, playerData, playerPluginFormat, resolutionFormat } from "@renderer/utils/types";

const WEBSITE = "https://senshi.live"

const header = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Referer': WEBSITE,
    "Origin": WEBSITE,
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "Content-Type": "application/json",
    "Sec-GPC": "1",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "DNT": "1",
    "Priority": "u=4",
}

function SheepFinderAnime2000(animeList: AnimeData[], anime: AnimeData): string | undefined {
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
        console.error("Senshi SheepFinderAnime2000 error", error)
        return animeList[0].player_ID
    }
}

export function dateToUnix(dateStr: string | undefined): number | undefined {
    if (!dateStr) return undefined
    const date = new Date(dateStr);
    return Math.floor(date.getTime() / 1000);
}

function converterToCardData(data: { [key: string]: string | number }): cardData {
    return {
        AnimeData: {
            title: {
                english: data["title_english"] as string,
                native: data["title"] as string,
                romaji: data["title"] as string
            },
            id: "",
            player_ID: `${data["id"]}`,
            format: data["type"].toString().toUpperCase(),
            source: data["ani_source"].toString().toUpperCase(),
            episodes: parseInt(data["ani_episodes"].toString()),
            seasonYear: data["ani_year"] as number,
            season: data["ani_season"].toString().toUpperCase(),
            type: "ANIME",
            trailer: {
                id: data["trailer"].toString().replaceAll("https://www.youtube.com/watch?v=", ""),
                site: "youtube"
            },
            coverImage: `${WEBSITE}${data["anime_picture"]}`
        }
    }
}

export default class Senshi implements playerPluginFormat {
    metadata: playerPluginFormat["metadata"] = {
        version: "1.1",
        name: "Senshi",
        author: "Owca525",
        supportLang: ["en"],
        urlWebsite: WEBSITE,
        icon: "https://senshi.live/assets/Senshi_Logo_3-Dm8yKkWF.png",
        type: "player"
    };
    cache: { [key: string]: number | string }[] = []

    extractPlayerData = async (_type: string, episode: episodeMetadata, id: string): Promise<playerData[]> => {
        let mainEpisode: string = typeof episode == "object" ? episode.ep : episode

        const urlsResp = await request(`${WEBSITE}/episode-embeds/${id}/${mainEpisode}`, { headers: header })
        if (!urlsResp["success"] || !urlsResp["json"]) return []
        const sub = urlsResp["json"].find((v) => v["status"] == "HardSub")
        const dub = urlsResp["json"].find((v) => v["status"] == "Dub")

        const cached = this.cache[id]
        let tmp: playerChapterList[] = []
        if (cached) {
            const asd = cached.find((v) => v["ep_id"].toString() == mainEpisode)
            if (asd) tmp = [
                {
                    start: asd["intro_start"] ? asd["intro_start"] : 0,
                    end: asd["intro_end"] ? asd["intro_end"] : 0,
                    type: "opening"
                },
                {
                    start: asd["outro_start"] ? asd["outro_start"] : 0,
                    end: asd["outro_end"] ? asd["outro_end"] : 0,
                    type: "ending"
                }
            ]
        }

        let player: playerData = {
            hostname: "Senshi",
            resolution: [{
                res: "",
                url: sub["url"],
                reqHeader: header,
                hls: sub["url"].includes(".m3u8")
            }],
            listChapters: tmp,
        }
        if (dub) player = {
            ...player, isDubbing: async () => {
                return [{ res: "", url: dub["url"], reqHeader: header, hls: dub["url"].includes(".m3u8") }] as resolutionFormat[]
            }
        }

        return [player]
    }
    extractEpisodeList = async (animeData?: AnimeData, anime_id?: string): Promise<episodeList | undefined> => {
        if (animeData && !anime_id) {
            const search = await this.searchAnime(animeData["title"]["romaji"])
            if (search.length <= 0) return

            anime_id = SheepFinderAnime2000(search.map(v => v["AnimeData"]), animeData)
        }
        if (!anime_id) return
        const episodeResp = await request(`${WEBSITE}/episodes/${anime_id}`, { headers: header })
        /* IFDEF DEBUG */
        console.warn("extractEpisodeList/Senshi", episodeResp)
        /* ENDIF */
        if (!episodeResp["success"] || !episodeResp["json"]) return
        this.cache = [
            ...this.cache,
            { [anime_id]: episodeResp["json"] as any }
        ]

        return {
            player_id: anime_id,
            episodesData: [{
                episodes: episodeResp["json"].map((v) => ({
                    ep: v["ep_id"],
                    title: v["ep_title"],
                    uploadedUnix: dateToUnix(v["created_at"])
                })),
                type: window["animuAppInfo"] ? "both" : "sub"
            }]
        }
    }
    extractOnlyEpisodesList = async (_type: string, anime_id: string): Promise<{ ep: string; img?: string; title?: string; }[]> => {
        const tmp = await this.extractEpisodeList(undefined, anime_id)
        if (!tmp) return []
        return tmp["episodesData"][0]["episodes"]
    }
    searchAnime = async (name: string, _page?: number, _params?: FilterPluginsParams): Promise<cardData[]> => {
        try {
            const searchResponse = await request(`${WEBSITE}/anime/filter`, {
                method: "POST",
                headers: header,
                body: JSON.stringify({
                    limit: 10,
                    page: 1,
                    searchTerm: name,
                })
            })
            /* IFDEF DEBUG */
            console.warn("searchAnime/Senshi", searchResponse)
            /* ENDIF */
            if (!searchResponse["success"] || !searchResponse["json"]) return []

            return searchResponse["json"]["data"].map((v) => converterToCardData(v))
        } catch (error) {
            console.error("Error in searchAnime/aowu", error)
            return []
        }
    }

}