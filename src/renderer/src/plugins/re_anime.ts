// DISSABLE
// TODO: END THIS
import { request, SheepFinderAnime2000 } from "@renderer/utils/functions";
import { AnimeData, cardData, episodeList, episodeMetadata, FilterPluginsParams, playerData, playerDataExtended, playerPluginFormat, serverStatusData } from "@renderer/utils/types";

const WEBSITE = "https://reanime.to"
const PluginHeader = {
    "User-Agent": navigator.userAgent,
    Accept: "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Sec-GPC": "1",
    Connection: "keep-alive",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "cross-site",
    'Referer': WEBSITE
}

async function ExtractFlixcloud(url: string): Promise<playerData | undefined> {
    return
}

async function ExtractVideo(playerData: playerDataExtended, url: string): Promise<playerData | undefined> {
    if (url.includes("flixcloud.cc")) return ExtractFlixcloud(url)

    console.error("ReAnime/ExtractVideo UNSUPORTED URL", playerData, url)

    return
}

export default class ReAnime implements playerPluginFormat {
    metadata: playerPluginFormat["metadata"] = {
        version: "1.0",
        name: "ReAnime",
        author: "Owca525",
        supportLang: ["en"],
        urlWebsite: WEBSITE,
        type: "player"
    };

    extractPlayerData = async(_type: string, episode: episodeMetadata, id: string): Promise<playerData[]> => {
        const list_id = JSON.parse(id)

        const response = await request(`${WEBSITE}/api/flix/${list_id[0]}/${episode["ep"]}`, { headers: PluginHeader })
        /* IFDEF DEBUG */
        console.warn("ReAnime/extractPlayerData", response)
        /* ENDIF */

        if (!response["success"] || !response["json"] || !response["json"]["servers"]) return []

        return response["json"]["servers"].map((v) => ({
            hostname: `${v["serverName"]} ${v["dataType"]}`,
            resolution: [],
            extractResolution: async (playerData) => await ExtractVideo(playerData, v["dataLink"])
        }))
    }

    extractEpisodeList = async (animeData?: AnimeData, anime_id?: string): Promise<episodeList | undefined> => {
        if (animeData && !anime_id) {
            const search = await this.searchAnime(animeData["title"]["romaji"])
            if (search.length <= 0) return

            anime_id = SheepFinderAnime2000(search.map((v) => v["AnimeData"]), animeData)
        }

        if (!anime_id) return

        const response = await request(`${WEBSITE}/api/v1/anime/${anime_id}/episodes?limit=2000`, { headers: PluginHeader })
        /* IFDEF DEBUG */
        console.warn("ReAnime/extractEpisodeList", response)
        /* ENDIF */
        if (!response["success"] || !response["json"] || !response["json"]["data"]) return

        return {
            player_id: anime_id,
            episodesData: [{
                episodes: response["json"]["data"].map((v) => ({
                    ep: v["episode_number"],
                    img: v["thumbnail"],
                    title: v["title"],
                    durration: v["duration"],
                    episodeID: v["episodeId"],
                })),
                type: "both"
            }]
        }
    }

    extractOnlyEpisodesList = async (_type: string, anime_id: string): Promise<{ ep: string; img?: string; title?: string; }[]> => {
        const episodes = await this.extractEpisodeList(undefined, anime_id);
        if (!episodes) return []
        return episodes["episodesData"][0]["episodes"]
    }

    searchAnime = async (name: string, _page: number = 1, _params?: FilterPluginsParams): Promise<cardData[]> => {
        const response = await request(`${WEBSITE}/api/v1/search?limit=5&q=${encodeURI(name)}`, { headers: PluginHeader })
        /* IFDEF DEBUG */
        console.warn("ReAnime/searchAnime", response)
        /* ENDIF */
        if (!response["success"] || !response["json"] || !response["json"]["results"]) return []

        return response["json"]["results"].map((v) => ({
            AnimeData: {
                id: v["anilist_id"],
                player_ID: JSON.stringify([v["anilist_id"],v["anime_id"]]),
                title: v["title"],
                format: v["format"],
                status: v["status"],
                genres: v["genres"],
                season: v["season"],
                seasonYear: v["season_year"],
                episodes: v["episodes"],
                averageScore: v["average_score"],
                coverImage: v["cover_image"]["extra_large"] ? v["cover_image"]["extra_large"] : v["cover_image"]["large"]
            } as AnimeData
        }))
    }
    
    raportStatus = async (): Promise<{ search: serverStatusData; player: serverStatusData; episodes: serverStatusData; }> => {
        return undefined as any
    }
}