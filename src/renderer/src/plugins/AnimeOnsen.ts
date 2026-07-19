import { request } from "@renderer/utils/functions";
import { AnimeData, cardData, episodeList, episodeMetadata, FilterPluginsParams, playerData, playerPluginFormat, serverStatusData } from "@renderer/utils/types";

const WEBSITE = "https://www.animeonsen.xyz"
const SEARCH_API = "https://search.animeonsen.xyz"
const API = "https://api.animeonsen.xyz"

const POST_TOKEN = "0e36d0275d16b40d7cf153634df78bc229320d073f565db2aaf6d027e0c30b13"
const GET_TOKEN = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImRlZmF1bHQifQ.eyJpc3MiOiJodHRwczovL2F1dGguYW5pbWVvbnNlbi54eXovIiwiYXVkIjoiaHR0cHM6Ly9hcGkuYW5pbWVvbnNlbi54eXoiLCJpYXQiOjE3ODQ0ODk1NDAsImV4cCI6MTc4NTA5NDM0MCwic3ViIjoiMDZkMjJiOTYtNjNlNy00NmE5LTgwZmMtZGM0NDFkNDFjMDM4LmNsaWVudCIsImF6cCI6IjA2ZDIyYjk2LTYzZTctNDZhOS04MGZjLWRjNDQxZDQxYzAzOCIsImd0eSI6ImNsaWVudF9jcmVkZW50aWFscyJ9.kLJdr-FK1YIXSYtWe71Ktwa-Cr043aaXaHkQymSc0_vmgOlYC1R_S7k1H1LIWBIMtQkdTlKsy9k-Ehq65E9x7KKFiawnCse8CSCSu-tXln3w-PZFYMWcxRF5vn9qGo8cz68_SroJhS8Jiu1AHBKZ669Hq8wLWi2vfOsG8SD5lKSB-qy6mxpbhRUsiYZZvRDb7Vh_zUzbCPp9mRkhdzDp5XqJGcC8Vc7MOPd-aT3jFMrxdMK2S6ZBH6GdmrOjpRdWsg3trc0YpdwYXCsQK60qdknZ-IuVHC9mDBwib-iEdcieNNqFl8JszWDz12lQ_3Y4HucIwUJLpAw4q9zxTYHfHQ"

const header = {
    "User-Agent": navigator.userAgent,
    Accept: "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Sec-GPC": "1",
    Connection: "keep-alive",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "cross-site",
    'Referer': `${WEBSITE}/`,
    "Origin": WEBSITE
}

function SearchAnime(anime: AnimeData, target: cardData[]) {
    const list = Object.values(anime["title"])

    for (let index = 0; index < target.length; index++) {
        const element = target[index];

        const finded = Object.values(element["AnimeData"]["title"]).find((v) => list.includes(v))
        if (finded) return element["AnimeData"]["player_ID"]
    }

    return
}

export default class AnimeOnsen implements playerPluginFormat {
    metadata: playerPluginFormat["metadata"] = {
        version: "1.0",
        name: "AnimeOnsen",
        author: "Owca525",
        supportLang: ["en"],
        urlWebsite: WEBSITE,
        type: "player",
        icon: `${WEBSITE}/favicon/192x192.png`
    };

    extractPlayerData = async(_type: string, episode: episodeMetadata, id: string): Promise<playerData[]> => {
        const tmpEpisode = typeof episode == "object" ? episode["ep"] : episode

        const response = await request(`${API}/v4/content/${id}/video/${tmpEpisode}`, {
            headers: {
                ...header,
                "Authorization": `Bearer ${GET_TOKEN}`
            }
        })

        /* IFDEF DEBUG */
        console.warn("AnimeOnsen/extractPlayerData", response)
        /* ENDIF */

        if (!response["success"] || !response["json"] || !response["json"]["uri"]) return []

        return [{
            hostname: "AnimeOnsen",
            subtitles: response["json"]["uri"]["subtitles"] ? Object.entries(response["json"]["uri"]["subtitles"]).map((v) => ({
                url: v["1"],
                format: "ass",
                label: v["0"],
                lang: v[0].split("-")[0]
            })) as any : [],
            resolution: [{
                res: "1080",
                url: response["json"]["uri"]["stream"],
                hls: response["json"]["uri"]["stream"].includes(".m3u8"),
                reqHeader: header,
                defaultSubtitles: true
            }],
        }]
    }
    extractEpisodeList = async (animeData?: AnimeData, anime_id?: string): Promise<episodeList | undefined> => {
        let animeID = anime_id
        if (animeData && !animeID) {{
            const searched = await this.searchAnime(animeData["title"]["romaji"], 1)
            if (searched.length <= 0) return

            animeID = SearchAnime(animeData, searched)
        }}

        if (!animeID) return

        const response = await request(`${API}/v4/content/${animeID}/episodes`, {
            headers: {
                ...header,
                "Authorization": `Bearer ${GET_TOKEN}`
            }
        })

        /* IFDEF DEBUG */
        console.warn("AnimeOnsen/extractEpisodeList", response)
        /* ENDIF */

        if (!response["success"] || !response["json"]) return

        return {
            player_id: animeID,
            langugeAvaible: ["en", "jpn"],
            episodesData: [{
                episodes: Object.entries(response["json"]).map((v) => ({
                    ep: v["0"],
                    title: v["1"]
                })),
                type: "sub"
            }]
        }
    }
    extractOnlyEpisodesList = async (_type: string, anime_id: string): Promise<{ ep: string; img?: string; title?: string; }[]> => {
        const response = await this.extractEpisodeList(undefined, anime_id)
        if (!response) return []

        return response[0]["episodesData"]
    }

    searchAnime = async (name: string, _page: number, _params?: FilterPluginsParams): Promise<cardData[]> => {
        const response = await request(`${SEARCH_API}/indexes/content/search`, {
            method: "POST",
            headers: {
                ...header,
                "Content-Type": "application/json",
                "Authorization": `Bearer ${POST_TOKEN}`,
                "X-Meilisearch-Client": "Meilisearch instant-meilisearch (v0.8.2) ; Meilisearch JavaScript (v0.27.0)"
            },
            body: JSON.stringify({
                "q": name,
                "attributesToHighlight": ["*"],
                "highlightPreTag": "__ais-highlight__", 
                "highlightPostTag": "__/ais-highlight__",
                "limit":5
            })
        })

        /* IFDEF DEBUG */
        console.warn("AnimeOnsen/searchAnime", response)
        /* ENDIF */

        if (!response["success"] || !response["json"]) return []

        // TODO: Fix img
        try {
            return response["json"]["hits"].map((v) => ({
                AnimeData: {
                    title: {
                        english: v["content_title_en"],
                        native: v["content_title_jp"],
                        romaji: v["content_title"]
                    },
                    bannerImage: `${API}/v4/image/210x300/${v["content_id"]}`,
                    player_ID: v["content_id"],
                    id: ""
                }
            } as cardData))
        } catch (error) {
            console.error("AnimeOnsen/searchAnime", error)
            return []
        }
    }
    
    raportStatus = async (): Promise<{ search: serverStatusData; player: serverStatusData; episodes: serverStatusData; }> => {
        return undefined as any
    }
}