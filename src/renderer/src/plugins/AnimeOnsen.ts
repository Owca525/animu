import { request as SheepRequest } from "@renderer/utils/functions";
import { AnimeData, cardData, episodeList, episodeMetadata, FilterPluginsParams, playerData, playerPluginFormat, serverStatusData } from "@renderer/utils/types";

const WEBSITE = "https://www.animeonsen.xyz"
const SEARCH_API = "https://search.animeonsen.xyz"
const API = "https://api.animeonsen.xyz"

const POST_TOKEN = "0e36d0275d16b40d7cf153634df78bc229320d073f565db2aaf6d027e0c30b13"

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
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function generateToken(str: string | undefined) {
    try {
        if (!str) return
        str = str.split(";")[0].split("=")[1]
        str = decodeURIComponent(str)

        str = str.split("=")[0].trim().replace(/[^+/0-9A-Za-z-_]/g, "")

        if (str.length < 2) return

        while (str.length % 4 !== 0) {
            str += "="
        }

        const binary = atob(str);
        const bytes = new Uint8Array(binary.length);

        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }

        str = new TextDecoder("utf-8").decode(bytes.subarray(0, bytes.length))

        window["animeonsen_get_token"] = str.split("").reduce((e, t) => e + String.fromCharCode(t.charCodeAt(0) + 1), "")
    } catch (error) {
        console.error("AnimeOnsen/generateToken FAILED GENERATE TOKEN")
    }
}

async function request(url: string, options: RequestInit = {}) {
    if (window["animeonsen_get_token"] == undefined) {
        const resp = await SheepRequest(WEBSITE, { headers: header })
        /* IFDEF DEBUG */
        console.warn("AnimeOnsen/SheepRequest", resp)
        /* ENDIF */
        const finded = Object.entries(resp.responseHeader).find(([k, _]) => k == "set-cookie")
        if (finded) generateToken(finded["1"])
    }

    const get_token: string = window["animeonsen_get_token"] ?? ""

    return await SheepRequest(url, {
        ...options,
        headers: {
            ...options["headers"],
            ...header,
            "Authorization": `Bearer ${options["method"] == "POST" ? POST_TOKEN : get_token}`
        }
    })
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
        version: "1.1",
        name: "AnimeOnsen",
        author: "Owca525",
        supportLang: ["en"],
        urlWebsite: WEBSITE,
        type: "player",
        icon: `${WEBSITE}/favicon/192x192.png`
    };

    extractPlayerData = async (_type: string, episode: episodeMetadata, id: string): Promise<playerData[]> => {
        const tmpEpisode = typeof episode == "object" ? episode["ep"] : episode

        const response = await request(`${API}/v4/content/${id}/video/${tmpEpisode}`)

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
                reqHeader: { ...header, "Referer": `${WEBSITE}/` },
                defaultSubtitles: true
            }],
        }]
    }
    extractEpisodeList = async (animeData?: AnimeData, anime_id?: string): Promise<episodeList | undefined> => {
        let animeID = anime_id
        if (animeData && !animeID) {
            const searched = await this.searchAnime(animeData["title"]["romaji"], 1)
            if (searched.length <= 0) return

            animeID = SearchAnime(animeData, searched)
        }

        if (!animeID) return

        const response = await request(`${API}/v4/content/${animeID}/episodes`)

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
                    title: v["1"]!["contentTitle_episode_en"]
                })),
                type: "sub"
            }]
        }
    }
    extractOnlyEpisodesList = async (_type: string, anime_id: string): Promise<{ ep: string; img?: string; title?: string; }[]> => {
        const response = await this.extractEpisodeList(undefined, anime_id)
        if (!response) return []

        return response["episodesData"][0]["episodes"]
    }

    searchAnime = async (name: string, _page: number, _params?: FilterPluginsParams): Promise<cardData[]> => {
        const response = await request(`${SEARCH_API}/indexes/content/search`, {
            method: "POST",
            headers: {
                ...header,
                "Content-Type": "application/json",
                "X-Meilisearch-Client": "Meilisearch instant-meilisearch (v0.8.2) ; Meilisearch JavaScript (v0.27.0)"
            },
            body: JSON.stringify({
                "q": name,
                "attributesToHighlight": ["*"],
                "highlightPreTag": "__ais-highlight__",
                "highlightPostTag": "__/ais-highlight__",
                "limit": 5
            })
        })

        /* IFDEF DEBUG */
        console.warn("AnimeOnsen/searchAnime", response)
        /* ENDIF */

        if (!response["success"] || !response["json"]) return []

        try {
            return response["json"]["hits"].map((v) => ({
                AnimeData: {
                    title: {
                        english: v["content_title_en"],
                        native: v["content_title_jp"],
                        romaji: v["content_title"]
                    },
                    coverImage: `${API}/v4/image/210x300/${v["content_id"]}`,
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
            async () => this.extractPlayerData("sub", { ep: "1" }, "1uQJfaeOMCu8V7YR"),
            async () => this.extractOnlyEpisodesList("sub", "1uQJfaeOMCu8V7YR"),
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