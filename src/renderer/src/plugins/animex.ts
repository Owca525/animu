import { request, SheepFinderAnime2000 } from "@renderer/utils/functions";
import { AnimeData, cardData, episodeList, episodeMetadata, FilterPluginsParams, playerChapterList, playerData, playerDataExtended, playerPluginFormat, resolutionFormat, serverStatusData } from "@renderer/utils/types";

const WEBSITE = "https://animex.one"
const GRAPHIQL_API = "https://graphql.animex.one/graphql"
const REST_API = "https://pp.animex.one"

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
    'Referer': WEBSITE,
    "Origin": WEBSITE
}

const SEARCH_QUERY = "\nquery FastSearch($query: String, $limit: Int, $includeAdult: Boolean) {\n catalogAnime(filter: { query: $query, includeAdult: $includeAdult }, limit: $limit) {\n items {\n id\n anilistId\n malId\n titleRomaji\n titleEnglish\n coverImage\n format\n status\n episodeCount\n seasonYear\n season\n color\n genres\n bannerImage\n }\n }\n}\n"

function ConverterToAnimeData(data: any): AnimeData | undefined {
    try {
        return {
            title: {
                english: data["titleEnglish"],
                native: data["titleRomaji"],
                romaji: data["titleRomaji"]
            },
            format: data["format"],
            status: data["status"],
            season: data["season"],
            seasonYear: data["seasonYear"],
            genres: data["genres"],
            bannerImage: data["bannerImage"],
            coverImage: data["coverImage"] && data["coverImage"]["extraLarge"] ? data["coverImage"]["extraLarge"] : data["coverImage"]["large"],
            id: data["anilistId"],
            player_ID: data["id"]
        }
    } catch (error) {
        console.error("Animex/ConverterToAnimeData", error)
        return
    }
}

const lg = {
    // shiro: s => `${ng(s, "ALGO_2", sg)}&origin=https://kem.clvd.xyz/`,
    sora: s => `${yi(s, "https://krussdomi.com")}`,
    vee: s => s,
    yuki: s => `${yi(s, "https://megaplay.buzz")}`,
    uwu: s => `${yi(s, "https://kwik.cx/")}`,
    kiwi: s => `${yi(s, "https://anidb.app/")}`,
    miku: s => `${yi(s, "https://allanime.uns.bio")}`,
    neko: s => s,
    mochi: s => s.replace("https://tools.fast4speed.rsvp", "https://mp4.24stream.xyz/storage"),
    beep: s => s.startsWith("https://bd.24stream.xyz/media") || s.startsWith("https://bd.aniwatchtv.site/media") ? s : s.startsWith("/") ? `https://bd.aniwatchtv.site/media${s.replace("/r2", "")}` : `https://bd.aniwatchtv.site/media${s.replace(/https?:\/\/[^/]+/, "").replace("/r2", "")}`
}
// last code: Q3JP2SPg.js

const sites = ["https://cx.aniwatchtv.site", "https://nsx.aniwatchtv.site","https://pro.aniwatchtv.site","https://rl2.aniwatchtv.site", "https://rrl.aniwatchtv.site"]

function ag(data: Uint8Array, key: string): void {
    if (key.length !== 0) {
        for (let i = 0; i < data.length; i++) {
            data[i] ^= key.charCodeAt(i % key.length);
        }
    }
}

function yi(s: string, t: string): string {
    const e = Converting(s, t);
    const i = sites[0 % sites.length];

    return `${i}/uwu/${e}`;
};

function ExtractChapter(data: any): playerChapterList[] | undefined {
    if (!Array.isArray(data)) return

    try {
        return data.map((v) => {
            const title = v["title"].toLowerCase()
            
            return {
                start: v["start"],
                end: v["end"],
                type: title == "intro" ? "opening" : title == "outro" ? "ending" : "other",
                name: v["title"]
            }
        })
    } catch (error) {
        console.error("Animex/ExtractChapter Failed Extract Chapters", error)
        return []
    }
}

function Converting(s: string, t: string): string {
    const encoder = new TextEncoder();

    const sBytes = encoder.encode(s);
    const tBytes = encoder.encode(t);

    const data = new Uint8Array(sBytes.length + 1 + tBytes.length);

    data.set(sBytes, 0);
    data[sBytes.length] = 0;
    data.set(tBytes, sBytes.length + 1);

    ag(data, "10b06cdc1ca48c9fb0b94af97cc040cf");

    let binary = "";
    for (let i = 0; i < data.length; i++) {
        binary += String.fromCharCode(data[i]);
    }

    return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

async function ExtractResolution(data: playerDataExtended): Promise<playerData | undefined> {
    const id = data["episode"]["animeID"]
    const episode = data["episode"]["currentEpisode"]

    const response = await request(`${REST_API}/rest/api/sources?id=${id}&epNum=${episode}&type=sub&providerId=${data["hostname"]}`, {
        headers: {
            ...header,
            "Content-Type": "application/json"
        }
    })

    /* IFDEF DEBUG */
    console.warn("Animex/ExtractResolution", response)
    /* ENDIF */

    if (!response["success"] || !response["json"] || !response["json"]["sources"]) return

    const func = lg[data["hostname"]]

    const sources = response["json"]["sources"]

    const chapters = ExtractChapter(response["json"]["chapters"])

    return {
        ...data,
        resolution: sources.map((v) => ({
            res: v["quality"],
            mimeType: v["type"],
            url: func ? func(v["url"]) : v["url"],
            hls: v["url"].includes(".m3u8"),
            reqHeader: header
        }) as resolutionFormat),
        listChapters: chapters,
        splitHLS: sources[0]["quality"] != "auto"
    }
}

export default class Animex implements playerPluginFormat {
    metadata: playerPluginFormat["metadata"] = {
        version: "1.0",
        name: "Animex",
        author: "Owca525",
        supportLang: ["en"],
        urlWebsite: WEBSITE,
        type: "player",
        icon: `${WEBSITE}/icons/android/android-launchericon-144-144.png`
    };
    extractPlayerData = async (_type: string, episode: episodeMetadata, id: string): Promise<playerData[]> => {
        const tmpEpisode = typeof episode == "object" ? episode["ep"] : episode

        const response = await request(`${REST_API}/rest/api/servers?id=${id}&epNum=${tmpEpisode}`, {
            headers: {
                ...header,
                "Content-Type": "application/json"
            }
        })

        /* IFDEF DEBUG */
        console.warn("Animex/extractPlayerData", response)
        /* ENDIF */

        if (!response["success"] || !response["json"] || !response["json"]["subProviders"]) return []

        return response["json"]["subProviders"].map((v) => ({
            hostname: v["id"],
            defaultHost: v["default"],
            resolution: [],
            extractResolution: ExtractResolution
        } as playerData))
    }

    extractEpisodeList = async (animeData?: AnimeData, anime_id?: string): Promise<episodeList | undefined> => {
        let animeID = anime_id

        if (animeData && !animeID) {
            const searchResponse = await this.searchAnime(animeData["title"]["romaji"])

            animeID = SheepFinderAnime2000(searchResponse.map((v) => v["AnimeData"]), animeData)
        }

        if (animeID == undefined) return

        const response = await request(`${REST_API}/rest/api/episodes?id=${animeID}`, {
            headers: {
                ...header,
                "Content-Type": "application/json"
            }
        })

        /* IFDEF DEBUG */
        console.warn("Animex/extractEpisodeList", response)
        /* ENDIF */

        if (!response["success"] || !response["json"]) return

        return {
            player_id: animeID,
            episodesData: [{
                episodes: response["json"].map((v) => ({
                    ep: v["number"],
                    title: v["titles"]["en"],
                    img: v["img"]
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

    searchAnime = async (name: string, _page: number = 1, _params?: FilterPluginsParams): Promise<cardData[]> => {
        const response = await request(GRAPHIQL_API, {
            method: "POST",
            headers: {
                ...header,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                variables: {
                    includeAdult: false,
                    limit: 10,
                    query: name
                },
                query: SEARCH_QUERY
            })
        })

        /* IFDEF DEBUG */
        console.warn("Animex/searchAnime", response)
        /* ENDIF */

        if (!response["success"] || !response["json"]) return []

        const finished = response["json"]["data"]["catalogAnime"]["items"].map((v) => ({ AnimeData: ConverterToAnimeData(v) })).filter((v) => v != undefined)

        /* IFDEF DEBUG */
        console.warn("Animex/searchAnim finished", finished)
        /* ENDIF */

        return finished
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
            async () => this.searchAnime("Oshi No Ko"),
            async () => this.extractPlayerData("sub", { ep: "1" }, "oshi-no-ko-bg39r"),
            async () => this.extractOnlyEpisodesList("sub", "oshi-no-ko-bg39r"),
        ]

        for (let index = 0; index < functions.length; index++) {
            const element = functions[index];
            const tmp = await wrapper(element)
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