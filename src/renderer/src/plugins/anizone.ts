import { convertChaptersVTT, request, SheepFinderAnime2000 } from "@renderer/utils/functions";
import { AnimeData, cardData, episodeList, episodeMetadata, FilterPluginsParams, playerChapterList, playerData, playerPluginFormat, serverStatusData } from "@renderer/utils/types";

const WEBSITE = "https://anizone.to"
const PluginHeader = {
    "User-Agent": navigator.userAgent
}

const PLAYER_REGEX = /vidstackPlayer\(JSON\.parse\('([\s\S]*?)'\)\)/
const SEARCH_REGEX = /items:\s*JSON\.parse\('((?:\\.|[^'\\])*)'\)/
const EPISODE_REGEX = /epsTitles:\s*JSON\.parse\('((?:\\.|[^'\\])*)'\)/g
const ANIMETITLE_REGEX = /anmTitles:\s*JSON\.parse\('((?:\\.|[^'\\])*)'\)/

const LANG_SUPPORT = {
    1: "en",
    2: "fr",
    3: "pl",
    4: "cs",
    5: "ja",
    6: "ru",
    7: "ko",
    8: "ja",
    9: "zh-CN",
    10: "de",
    11: "it",
    12: "sv",
    13: "es",
    14: "pt",
    15: "ca",
    16: "zh-TW",
    17: "hu",
    18: "vi",
    19: "tr",
    20: "sl",
    21: "pt-BR",
    22: "lv",
    23: "lt",
    24: "hr",
    25: "sk",
    26: "fi",
    27: "da",
    28: "ro",
    29: "et",
    30: "el",
    31: "mn",
    32: "sr",
    33: "uk",
    34: "bg",
    35: "he",
    36: "ar",
    37: "fa",
    38: "zh-TW",
    39: "zh",
    40: "th",
    41: "es-419",
    42: "gl",
    43: "nl",
    44: "tl",
    45: "ms",
    46: "id",
    47: "no",
    48: "bn",
    49: "zh",
    50: "unknown",
    51: "ko",
    52: "sq",
    53: "ur",
    54: "ta",
    55: "other",
    56: "is",
    57: "eo",
    58: "hi",
    59: "af",
    60: "te",
    61: "la",
    62: "th",
    63: "zh-CN",
    64: "zh-HK",
    65: "eu",
    66: "mk",
    67: "gu",
    68: "mr",
    69: "kn",
    70: "pa",
    71: "km",
    72: "ne",
} as const;

const types = {
    "TV Series": "TV"
}

interface ANIZONE_PLAYER_TYPES {
    chapter?: string,
    snapshot: string,
    src: string,
    storage: string,
    storyboard: string,
    subtitles: {
        default: boolean,
        file: string,
        forced: string,
        format: string,
        language: string,
        title: string
    }[]
}

interface ANIZONE_SEARCH_TYPE {
    cover: string,
    episode_count: number,
    is_ongoing: boolean,
    is_unsafe: boolean,
    main_title: string,
    slug: string,
    start_year: number,
    tags: {
        name: string,
        slug: string,
        url: string
    }[],
    title_list: { [key: number]: string },
    type: string,
    url: string
}

function decodeHTML(str: string): { [key: number | string]: any } {
    return JSON.parse(str.replace(/\\\\/g, "\\").replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16))
    ))
}

async function extractChapters(url: string): Promise<playerChapterList[]> {
    if (!url) return []
    let chapterList: playerData["listChapters"] = []

    let data = await convertChaptersVTT(url, { headers: PluginHeader })
    for (let index = 0; index < data.length; index++) {
        const element = data[index];
        if (element.name == "Intro") {
            chapterList.push({ ...element, type: "opening" })
            continue
        }
        if (element.name == "Credits") {
            chapterList.push({ ...element, type: "ending" })
            continue
        }
        if (element.name == "Ending") {
            chapterList.push({ ...element, type: "ending" })
            continue
        }
        if (element.name == "Opening") {
            chapterList.push({ ...element, type: "opening" })
            continue
        }
        chapterList.push(element)
    }

    return chapterList
}

export default class template implements playerPluginFormat {
    metadata: playerPluginFormat["metadata"] = {
        version: "2.0",
        name: "AniZone",
        author: "Owca525",
        supportLang: Object.values(LANG_SUPPORT),
        urlWebsite: WEBSITE,
        type: "player"
    };

    extractPlayerData = async (_type: string, episode: episodeMetadata, id: string): Promise<playerData[]> => {
        const response = await request(`${WEBSITE}/anime/${id}/${episode["ep"]}`, { headers: PluginHeader })

        /* IFDEF DEBUG */
        console.warn("anizone/extractPlayerData", response)
        /* ENDIF */

        const regex = response["text"].match(PLAYER_REGEX)
        /* IFDEF DEBUG */
        console.warn("anizone/extractPlayerData REGEX", regex)
        /* ENDIF */
        if (!regex) return []

        try {
            const player_information: ANIZONE_PLAYER_TYPES = decodeHTML(regex[1]) as any

            /* IFDEF DEBUG */
            console.warn("anizone/extractPlayerData DECODE", player_information)
            /* ENDIF */

            const isSubtitlesDefault = player_information["subtitles"].find((v) => v["default"])

            return [{
                hostname: "Anizone",
                resolution: [{
                    res: "1080",
                    url: player_information["src"],
                    reqHeader: PluginHeader,
                    hls: true,
                    defaultSubtitles: isSubtitlesDefault ? true : false
                }],
                subtitles: player_information["subtitles"].map((v) => ({
                    url: v["file"],
                    lang: v["language"],
                    label: v["title"],
                    format: v["format"]
                })),
                listChapters: await extractChapters(player_information["chapter"]!),
                storyboardVTT: player_information["storyboard"]
            }]
        } catch (error) {
            console.error("anizone/extractPlayerData", error)
            return []
        }
    }

    extractEpisodeList = async (animeData?: AnimeData, anime_id?: string): Promise<episodeList | undefined> => {
        if (animeData && !anime_id) {
            const search_resp = await this.searchAnime(animeData["title"]["romaji"])
            if (search_resp.length <= 0) return

            anime_id = SheepFinderAnime2000(search_resp.map((v) => v["AnimeData"]), animeData)
        }

        if (!anime_id) return

        const response = await request(`${WEBSITE}/anime/${anime_id}`, { headers: PluginHeader })

        /* IFDEF DEBUG */
        console.warn("anizone/extractEpisodeList", response)
        /* ENDIF */

        if (!response["success"]) return

        const episode_regex = [...response["text"].matchAll(EPISODE_REGEX)]
        const title_regex = response.text.match(ANIMETITLE_REGEX)
        /* IFDEF DEBUG */
        console.warn("anizone/extractEpisodeList REGEX", episode_regex, title_regex)
        /* ENDIF */

        if (!title_regex || !episode_regex) return

        const decode_title = decodeHTML(title_regex[1])

        return {
            player_id: anime_id,
            episodesData: [{
                episodes: episode_regex.map((_, i) => ({ ep: `${i + 1}` })),
                type: "sub"
            }],
            langugeAvaible: Object.keys(decode_title).map((v) => LANG_SUPPORT[v])
        }
    }

    extractOnlyEpisodesList = async (_type: string, anime_id: string): Promise<{ ep: string; img?: string; title?: string; }[]> => {
        const episodes = await this.extractEpisodeList(undefined, anime_id);
        if (!episodes) return []
        return episodes["episodesData"][0]["episodes"]
    }

    searchAnime = async (name: string, _page: number = 1, _params?: FilterPluginsParams): Promise<cardData[]> => {
        const response = await request(`${WEBSITE}/anime?search=${encodeURI(name)}`, { headers: PluginHeader })
        /* IFDEF DEBUG */
        console.warn("anizone/searchAnime", response)
        /* ENDIF */
        if (!response["success"]) return []

        const regex = response["text"].match(SEARCH_REGEX)
        /* IFDEF DEBUG */
        console.warn("anizone/searchAnime REGEX", regex)
        /* ENDIF */
        if (!regex) return []

        try {
            const decoded: ANIZONE_SEARCH_TYPE[] = decodeHTML(regex["1"]) as any

            /* IFDEF DEBUG */
            console.warn("anizone/searchAnime DECODE", decoded)
            /* ENDIF */

            return decoded.map((val) => ({
                AnimeData: {
                    title: {
                        english: val["title_list"]["1"],
                        romaji: val["title_list"]["5"],
                        native: val["title_list"]["8"]
                    },
                    id: "",
                    player_ID: val["slug"],
                    episodes: val["episode_count"],
                    coverImage: val["cover"],
                    seasonYear: val["start_year"],
                    type: types[val["types"]]
                }
            }))
        } catch (error) {
            console.error("anizone/searchAnime FAILED PARSE REGEX CONTENT", error)
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
            async () => this.extractPlayerData("sub", { ep: "1" }, "feb8ql49"),
            async () => this.extractOnlyEpisodesList("sub", "feb8ql49"),
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