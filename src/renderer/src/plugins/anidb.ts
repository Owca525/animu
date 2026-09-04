// DISSABLE
import { request, SheepFinderAnime2000 } from "@renderer/utils/functions";
import { AnimeData, cardData, episodeList, episodeMetadata, FilterPluginsParams, playerData, playerDataExtended, playerPluginFormat, serverStatusData } from "@renderer/utils/types";

const WEBSITE = "https://anidb.app"

const SEARCH_REGEX = /<a\s+href="https:\/\/anidb\.app\/anime\/([^"]+)"[\s\S]*?<img\s+src="([^"]+)"\s+alt="([^"]+)"[\s\S]*?<p[^>]*>(TV\s*·\s*\d{4})<\/p>/g
const M3U8_REGEX = /https:\/\/hls\.anidb\.app\/stream\/[A-Za-z0-9_-]+\/master\.m3u8/g

async function extractPlayerMetadata(playerData: playerDataExtended, url: string): Promise<playerData> {
    const response = await request(url)
    /* IFDEF DEBUG */
    console.warn("AniDB/extractPlayerMetadata response", response)
    /* ENDIF */
    if (!response["success"]) return playerData

    const regex = response["text"].match(M3U8_REGEX)
    /* IFDEF DEBUG */
    console.warn("AniDB/extractPlayerMetadata regex", regex)
    /* ENDIF */

    if (!regex) return playerData

    return {
        ...playerData,
        resolution: [{
            res: "1080",
            url: regex[0],
            hls: true
        }]
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default class AniDB implements playerPluginFormat {
    metadata: playerPluginFormat["metadata"] = {
        version: "1.0",
        name: "AniDB",
        author: "Owca525",
        supportLang: ["en"],
        urlWebsite: WEBSITE,
        type: "player",
        icon: `${WEBSITE}/images/fav-512.png`
    };
    extractPlayerData = async (_type: string, episode: episodeMetadata, _): Promise<playerData[]> => {
        const response = await request(`${WEBSITE}/api/frontend/episode/${episode["episodeID"]}/languages`)
        /* IFDEF DEBUG */
        console.warn("AniDB/extractPlayerData response", response)
        /* ENDIF */
        if (!response["success"] || !response["json"]) return []

        return response["json"]["languages"].map((v) => ({
            hostname: `${this.metadata.name} ${v["name"]}`,
            resolution: [],
            extractResolution: async (p) => await extractPlayerMetadata(p, v["embed_url"])
        } as playerData)).reverse()
    }

    extractEpisodeList = async (animeData?: AnimeData, anime_id?: string): Promise<episodeList | undefined> => {
        let animeID = anime_id
        if (animeData && !animeID) {
            const searched = await this.searchAnime(animeData["title"]["romaji"], 1)
            if (searched.length <= 0) return

            animeID = SheepFinderAnime2000(searched.map((v) => v["AnimeData"]), animeData)
        }

        if (!animeID) return

        const slug = structuredClone(animeID)

        animeID = animeID.split("-").at(-1)

        /* IFDEF DEBUG */
        console.warn("AniDB/extractEpisodeList id", animeID)
        /* ENDIF */

        if (!animeID) return

        const response = await request(`${WEBSITE}/api/frontend/anime/${animeID}/episodes`)
        /* IFDEF DEBUG */
        console.warn("AniDB/extractEpisodeList response", response)
        /* ENDIF */
        if (!response["success"] || !response["json"]) return
        return {
            player_id: slug,
            episodesData: [{
                episodes: response["json"]["episodes"].map((v, i) => ({
                    ep: i + 1,
                    episodeID: `${v["id"]}`
                } as episodeMetadata)),
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
        const response = await request(`${WEBSITE}/search/suggestions?q=${decodeURIComponent(name)}`)

        /* IFDEF DEBUG */
        console.warn("AniDB/searchAnime", response)
        /* ENDIF */

        if (!response["success"]) return []

        const regex = [...response["text"].matchAll(SEARCH_REGEX)]

        /* IFDEF DEBUG */
        console.warn("AniDB/searchAnime REGEX", regex)
        /* ENDIF */

        const cards: cardData[] = regex.map((v) => {
            const split = `${v[4]}`.split(" ")
            return {
                AnimeData: {
                    title: {
                        english: v[3],
                        romaji: v[3],
                    },
                    player_ID: v[1],
                    format: split[0],
                    seasonYear: parseInt(split[2]),
                    coverImage: v[2],
                    id: ""
                } as AnimeData
            } as cardData
        })

        return cards
    }

    raportStatus = async (): Promise<{ search: serverStatusData; player: serverStatusData; episodes: serverStatusData; }> => {
        let results: serverStatusData[] = []

        async function wrapper(func: (...args) => any): Promise<serverStatusData | undefined> {
            try {
                const start = performance.now();
                const response = await func()
                const end = performance.now();

                return {
                    time: end - start,
                    work: response.length > 0
                }
            } catch (error) {
                return undefined
            }
        }

        const functions = [
            async () => this.searchAnime("Oshi No Ko", 1),
            async () => this.extractPlayerData("sub", { ep: "1", episodeID: "6277" }, "oshi-no-ko-21"),
            async () => this.extractOnlyEpisodesList("sub", "oshi-no-ko-21"),
        ]

        for (let index = 0; index < functions.length; index++) {
            const element = functions[index];
            const tmp = await wrapper(element)
            await sleep(5000)
            if (!tmp) {
                results.push({
                    time: 0,
                    work: false
                })
            } else {
                results.push(tmp)
            }
        }

        return {
            search: results[0],
            player: results[1],
            episodes: results[2]
        }
    }
}