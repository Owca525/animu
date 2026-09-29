// DISSABLE
import { getAnimeSeasonFromDate, request, SheepFinderAnime2000 } from "@renderer/utils/functions";
import { AnimeData, cardData, episodeList, episodeMetadata, FilterPluginsParams, playerChapterList, playerData, playerPluginFormat, playerSubtitlesFormat, serverStatusData } from "@renderer/utils/types";

const WEBSITE = "https://hianime.at"
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
    'Referer': WEBSITE,
    "Origin": WEBSITE
}

const SUPPORTED_PLAYERS = {
    zokoanime: "https://zokoanime.video/",
    // megaplay: "https://megaplay.buzz/"
}

class ExtractorPlayer {
    hostname: string = ""

    constructor(hostname) {
        this.hostname = hostname
    }

    extract = async (url: string): Promise<playerData | undefined> => {
        const finded = Object.values(SUPPORTED_PLAYERS).find((v) => url.startsWith(v))
        switch (finded) {
            case SUPPORTED_PLAYERS.zokoanime:
                return await this.zokoanime(url)
        }

        return
    }

    zokoanime = async (url: string): Promise<playerData | undefined>  => {
        const req = await request(url, { headers: PluginHeader })
        if (!req["success"]) return 

        const regex = String(req["text"]).match(/window\.(?<name>__[A-Za-z0-9_$]+)\s*=\s*"(?<value>[^"]+)"/)
        if (!regex || !regex["groups"]) return
        const str = atob(regex["groups"]["value"])

        const OBF_KEY = 'otaku-embed-v1';
        let out = '';
        for (let i = 0; i < str.length; i++) {
            out += String.fromCharCode(str.charCodeAt(i) ^ OBF_KEY.charCodeAt(i % OBF_KEY.length));
        }

        const content = JSON.parse(decodeURIComponent(escape(out)))

        let subs: playerSubtitlesFormat[] = []
        let chapters: playerChapterList[] = []

        if (content["subtitles"]) {
            subs = content["subtitles"].map((v) => ({
                url: v["src"],
                lang: v["lang"],
                label: v["label"],
                default: v["default"],
                format: `${v["src"]}`.split(".").at(-1)
            }))
        }

        if (content["skip"]) {
            if (content["skip"]["intro"]) {
                chapters.push({
                    start: content["skip"]["intro"]["start"],
                    end: content["skip"]["intro"]["end"],
                    type: "opening"
                })
            }

            if (content["skip"]["outro"]) {
                chapters.push({
                    start: content["skip"]["outro"]["start"],
                    end: content["skip"]["outro"]["end"],
                    type: "ending"
                })
            }
        }

        const tmp_url = new URL(url)

        return {
            hostname: this.hostname,
            resolution: [{
                res: "1080",
                url: content["src"],
                defaultSubtitles: subs.length > 0,
                reqHeader: {
                    ...PluginHeader,
                    "Referer": tmp_url["origin"],
                    "Origin": tmp_url["origin"]
                }
            }],
            subtitles:subs,
            listChapters: chapters
        }
    }

    megaplay = async (_url: string): Promise<playerData | undefined>  => {
        return
    }
}

export default class HIanime implements playerPluginFormat {
    metadata: playerPluginFormat["metadata"] = {
        version: "1.0",
        name: "HIanime",
        author: "Owca525",
        supportLang: ["en"],
        urlWebsite: WEBSITE,
        type: "player"
    };

    extractPlayerData = async (_type: string, episode: episodeMetadata, _id: string): Promise<playerData[]> => {
        const playerResponse = await request(`${WEBSITE}/api/theme/episode/servers?episodeId=${episode["episodeID"]}`, { headers: PluginHeader })
        /* IFDEF DEBUG */
        console.warn("extractPlayerData/hianime", playerResponse)
        /* ENDIF */

        if (!playerResponse["success"] || !playerResponse["json"]) return []

        const regex = /<div\b[^>]*\bclass="[^"]*\bserver-item\b[^"]*"[^>]*\bdata-type="(?<type>[^"]+)"[^>]*\bdata-server-name="(?<serverName>[^"]+)"[^>]*\bdata-hash="(?<hash>[^"]+)"[^>]*>/g;

        const data = [...String(playerResponse["json"]["html"]).matchAll(regex)].map((value, i) => {
            console.log(value)
            if (!value["groups"]) return
            const url = String(atob(value["groups"]["hash"]));

            const finded = Object.values(SUPPORTED_PLAYERS).find((v) => url.startsWith(v))

            console.log(url, finded)

            if (!finded) return

            return {
                hostname: `${value["groups"]["serverName"]} ${value["groups"]["type"]}`,
                defaultHost: i == 0,
                url
            }
        }).filter((v) => v != undefined)
        /* IFDEF DEBUG */
        console.warn("extractPlayerData/hianime data", data)
        /* ENDIF */

        if (data.length <= 0) return []

        return data.map((v) => ({
            hostname: v["hostname"],
            defaultHost: v["defaultHost"],
            resolution: [],
            extractResolution: async () => await (new ExtractorPlayer(v["hostname"])).extract(v["url"])
        } as playerData))
    }

    extractEpisodeList = async (animeData?: AnimeData, anime_id?: string): Promise<episodeList | undefined> => {
        if (animeData && !anime_id) {
            const searchResponse = await this.searchAnime(animeData["title"]["english"] ?? animeData["title"]["romaji"], 1)
            if (searchResponse.length <= 0) return

            anime_id = SheepFinderAnime2000(searchResponse.map((v) => v.AnimeData), animeData)
        }

        /* IFDEF DEBUG */
        console.warn("extractEpisodeList/hianime id", anime_id)
        /* ENDIF */

        if (!anime_id) return

        const episodeResponse = await request(`${WEBSITE}/api/theme/episode/list/${anime_id.split("-").at(-1)}`, { headers: PluginHeader })

        /* IFDEF DEBUG */
        console.warn("extractEpisodeList/hianime", episodeResponse)
        /* ENDIF */

        if (!episodeResponse["success"] || !episodeResponse["json"]) return

        const regex = /<a\b[^>]*\btitle="(?<title>[^"]+)"[^>]*\bdata-number="(?<number>\d+)"[^>]*\bdata-id="(?<id>\d+)"[^>]*>/g;

        return {
            player_id: anime_id,
            episodesData: [{
                episodes: [...String(episodeResponse["json"]["html"]).matchAll(regex)].map((element) => {
                    if (!element["groups"]) return

                    return {
                        ep: element["groups"]["number"],
                        episodeID: element["groups"]["id"],
                        title: element["groups"]["title"]
                    } as episodeMetadata
                }).filter((v) => v != undefined),
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
        const response = await request(`${WEBSITE}/api/theme/search/suggestions?keyword=${encodeURIComponent(name)}`, { headers: PluginHeader })
        /* IFDEF DEBUG */
        console.warn("searchAnime/hianime", response)
        /* ENDIF */
        if (!response["success"] || !response["json"]) return []

        const regex = /<a\b[^>]*\bhref="(?<href>[^"]+)"[^>]*\btitle="(?<title>[^"]+)"[^>]*>[\s\S]*?<img\b[^>]*\bsrc="(?<imgSrc>[^"]+)"[^>]*>[\s\S]*?<div\b[^>]*\bclass="[^"]*\bfilm-infor\b[^"]*"[^>]*>[\s\S]*?<span\b[^>]*>\s*(?<date>[^<]+?)\s*<\/span>[\s\S]*?<i\b[^>]*>\s*<\/i>\s*(?<format>[^<]+?)\s*<i\b[^>]*>\s*<\/i>[\s\S]*?<span\b[^>]*>\s*(?<time>[^<]+?)\s*<\/span>/g;

        const match = [...String(response["json"]["html"]).matchAll(regex)];

        return match.map((element) => {
            if (!element["groups"]) return

            const id = element["groups"]["href"].split("/").at(-1)
            const date = getAnimeSeasonFromDate(element["groups"]["date"])

            return {
                AnimeData: {
                    title: {
                        english: element["groups"]["title"],
                        native: element["groups"]["title"],
                        romaji: element["groups"]["title"]
                    },
                    id: "",
                    season: date["season"],
                    seasonYear: date["seasonYear"],
                    coverImage: element["groups"]["imgSrc"],
                    player_ID: id,
                    format: element["groups"]["format"]
                }
            } as cardData
        }).filter((v) => v != undefined)
    }

    raportStatus = async (): Promise<{ search: serverStatusData; player: serverStatusData; episodes: serverStatusData; }> => {
        return undefined as any
    }
}