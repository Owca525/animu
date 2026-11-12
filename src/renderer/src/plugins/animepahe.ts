import { request, SheepFinderAnime2000 } from "@renderer/utils/functions";
import { AnimeData, cardData, episodeList, episodeMetadata, FilterPluginsParams, playerChapterList, playerData, playerPluginFormat, playerSubtitlesFormat, serverStatusData } from "@renderer/utils/types";
const WEBSITE = "https://animepahetv.to/"

let PluginHeader = {
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Alt-Used": "animepahe.pw",
    'User-Agent': navigator.userAgent,
    'Referer': WEBSITE,
    "Sec-GPC": "1",
    Connection: "keep-alive",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
}

const SUPPORTED_PLAYERS = {
    zokoanime: "https://zokoanime.video/",
    megaplay: "https://megaplay.buzz/"
}

class ExtractorPlayer {
    hostname: string = ""

    constructor(hostname) {
        this.hostname = hostname
    }

    extract = async (url: string): Promise<playerData | undefined> => {
        try {
            const finded = Object.values(SUPPORTED_PLAYERS).find((v) => url.startsWith(v))
            switch (finded) {
                case SUPPORTED_PLAYERS.zokoanime:
                    return await this.zokoanime(url)
                case SUPPORTED_PLAYERS.megaplay:
                    return await this.megaplay(url)
            }

            console.error("ExtractorPlayer/anikoto unsuported player", url)

            return
        } catch (error) {
            console.error("ExtractorPlayer/anikoto Failed Extract", error)
            return
        }
    }

    zokoanime = async (url: string): Promise<playerData | undefined> => {
        const req = await request(url, { headers: PluginHeader })
        /* IFDEF DEBUG */
        console.warn("zokoanime/anikoto", req)
        /* ENDIF */
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

        /* IFDEF DEBUG */
        console.warn("zokoanime/anikoto content", content)
        /* ENDIF */

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
                hls: true,
                reqHeader: {
                    ...PluginHeader,
                    "Referer": tmp_url["origin"],
                    "Origin": tmp_url["origin"]
                }
            }],
            subtitles: subs,
            listChapters: chapters
        }
    }

    megaplay = async (url: string): Promise<playerData | undefined> => {
        const url_object = new URL(url)
        const website_response = await request(url, { headers: PluginHeader })
        /* IFDEF DEBUG */
        console.warn("megaplay/anikoto", website_response)
        /* ENDIF */
        if (!website_response["success"]) return

        const match = website_response["text"].match(/data-id="(\d+)"/);
        if (!match) return

        const website_api_response = await request(`${url_object.origin}/stream/getSources?id=${match[1]}&platform=OTHER&s=tcdn`, {
            headers: {
                ...PluginHeader,
                "Accept": "application/json, text/javascript, */*; q=0.01",
                "X-Requested-With": "XMLHttpRequest",
                "Alt-Used": url_object.hostname,
                'Referer': url,
                "Origin": url
            }
        })

        /* IFDEF DEBUG */
        console.warn("megaplay/anikoto website_api_response", website_api_response, match)
        /* ENDIF */

        if (!website_api_response["success"] || !website_api_response["json"]) return

        const str_encrypted = website_api_response["json"]["enc"]

        function sourceEncPadKeyBytes(e, t) {
            const a = (new TextEncoder).encode(String(e))
                , r = new Uint8Array(t);
            return r.set(a.subarray(0, Math.min(t, a.length))),
                r
        }

        function sourceEncB64UrlDecode(e) {
            let t = String(e).replace(/-/g, "+").replace(/_/g, "/");
            const a = t.length % 4;
            a && (t += "====".slice(a));
            const r = atob(t)
                , n = new Uint8Array(r.length);
            for (let e = 0; e < r.length; e++)
                n[e] = r.charCodeAt(e);
            return n
        }

        function decryptSourcesEnc(e): Promise<string> {
            const t = sourceEncPadKeyBytes("i?LMTAx0Q6,:}50U", 32)
                , a = sourceEncPadKeyBytes("W0;27ToaUpl_P%'c", 16);
            return crypto.subtle.importKey("raw", t, {
                name: "AES-CBC"
            }, !1, ["decrypt"]).then(t => crypto.subtle.decrypt({
                name: "AES-CBC",
                iv: a
            }, t, sourceEncB64UrlDecode(e))).then(e => {
                const t = (new TextDecoder).decode(e)
                    , a = JSON.parse(t);
                if (!a || "string" != typeof a.file)
                    throw new Error("Invalid enc payload");
                return a["file"]
            }
            )
        }

        function sourceEncB64UrlEncode(e) {
            let t = "";
            const a = e instanceof ArrayBuffer ? new Uint8Array(e) : e;
            for (let e = 0; e < a.length; e++)
                t += String.fromCharCode(a[e]);
            return btoa(t).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
        }

        let master_url = await decryptSourcesEnc(str_encrypted)

        function createCdnToken(e) {
            const t = Math.floor(Date.now() / 1e3) + 90
                , a = String(t) + "|" + e
                , r = new TextEncoder;
            return crypto.subtle.importKey("raw", r.encode("MpCdnT0k3n!9f2K#xQ7vL5mR8wN1pY4s"), {
                name: "HMAC",
                hash: "SHA-256"
            }, !1, ["sign"]).then(e => crypto.subtle.sign("HMAC", e, r.encode(a))).then(e => sourceEncB64UrlEncode(r.encode(a)) + "." + sourceEncB64UrlEncode(e))
        }

        function extractCdnPathKey(e) {
            const t = String(e).match(/\/([a-f0-9]{32})\/([a-f0-9]{32})\//i);
            return t ? t[1].toLowerCase() + "/" + t[2].toLowerCase() : null
        }

        const a = await createCdnToken(extractCdnPathKey(master_url))

        const r = master_url.indexOf("?") >= 0 ? "&" : "?"
        const new_url = master_url + r + "token=" + encodeURIComponent(a);

        let subs: playerSubtitlesFormat[] = []
        let chapters: playerChapterList[] = []

        if (website_api_response["json"]["tracks"]) {
            website_api_response["json"]["tracks"].forEach(element => {
                subs.push({
                    url: element["file"],
                    lang: element["label"],
                    label: element["label"],
                    format: `${element["file"]}`.split(".").at(-1) ?? "vtt",
                    default: element["default"]
                })
            });
        }

        if (website_api_response["json"]["intro"]) {
            chapters.push({
                start: website_api_response["json"]["intro"]["start"],
                end: website_api_response["json"]["intro"]["end"],
                type: "opening"
            })
        }

        if (website_api_response["json"]["outro"]) {
            chapters.push({
                start: website_api_response["json"]["outro"]["start"],
                end: website_api_response["json"]["outro"]["end"],
                type: "ending"
            })
        }

        return {
            hostname: this.hostname,
            resolution: [{
                res: "1080",
                url: new_url,
                hls: true,
                reqHeader: {
                    "accept": "*/*",
                    "accept-encoding": "gzip, deflate, br, zstd",
                    "accept-language": "en-US,en;q=0.9",
                    "cache-control": "no-cache",
                    "origin": `${url_object.origin}`,
                    "pragma": "no-cache",
                    "priority": "u=1, i",
                    "referer": `${url_object.origin}/`,
                    // "sec-ch-ua": '"Chromium";v="153", "Not_A Brand";v="8"',
                    "sec-ch-ua-mobile": "?0",
                    // "sec-ch-ua-platform": '"Linux"',
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "cross-site",
                    "user-agent": navigator.userAgent,
                },
                defaultSubtitles: subs.length > 0
            }],
            subtitles: subs,
            listChapters: chapters
        }
    }
}

export function convertTimeStringToSeconds(time: string | undefined) {
    if (!time) return undefined
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
}

export function dateToUnix(dateStr: string | undefined): number | undefined {
    if (!dateStr) return undefined
    const date = new Date(dateStr);
    return Math.floor(date.getTime() / 1000);
}

function convertToAnimeData(data: { [key: string]: string | number }[]): cardData {
    return {
        AnimeData: {
            title: {
                native: data["title"],
                romaji: data["title"]
            },
            id: "",
            format: data["type"],
            episodes: data["episodes"],
            season: data["season"],
            seasonYear: data["year"],
            coverImage: data["poster"],
            player_ID: data["session"]
        }
    }
}

export default class AnimePahe implements playerPluginFormat {
    metadata: playerPluginFormat["metadata"] = {
        version: "1.4",
        name: "AnimePahe",
        author: "Owca525",
        supportLang: ["en"],
        urlWebsite: WEBSITE,
        type: "player",
        icon: `${WEBSITE}/favicon-96x96.png`
    };
    cache: { [key: string]: string | number[] }[] = []

    extractPlayerData = async (_type: string, episode: episodeMetadata, _id: string): Promise<playerData[]> => {
        const apirequest = await request(`${WEBSITE}/anime/get-servers/${episode["episodeID"]}`, { headers: PluginHeader })
        /* IFDEF DEBUG */
        console.warn("extractPlayerData/AnimePahe", apirequest)
        /* ENDIF */

        if (!apirequest["success"] || !apirequest["json"]) return []

        return apirequest["json"]["servers"].map((v) => ({
            hostname: v["name"],
            resolution: [],
            extractResolution: async () => await (new ExtractorPlayer(v["url"])).extract(v["url"])
        }))
    }
    extractEpisodeList = async (animeData?: AnimeData, anime_id?: string): Promise<episodeList | undefined> => {
        if (anime_id && this.cache[anime_id]) {
            return {
                player_id: anime_id,
                episodesData: [{
                    episodes: this.cache[anime_id].map((v, i) => ({
                        ep: i + 1,
                        img: v["snapshot"],
                        title: v["title"],
                        durration: convertTimeStringToSeconds(v["duration"]),
                        blueRayVer: v["disc"] == "BD",
                        episodeID: v["session"],
                        uploadedUnix: dateToUnix(v["created_at"])
                    })),
                    type: "sub"
                }]
            }
        }

        if (animeData && !anime_id) {
            const search = await this.searchAnime(animeData.title.romaji, 1)
            if (search.length <= 0) return

            anime_id = SheepFinderAnime2000(search.map((v) => v.AnimeData), animeData)
        }
        if (!anime_id) return
        const episodeResponse = await request(`${WEBSITE}/viewApi?m=release&id=${anime_id}&sort=episode_asc&page=1`, { headers: PluginHeader })
        /* IFDEF DEBUG */
        console.warn("extractEpisodeList/AnimePahe", episodeResponse)
        /* ENDIF */

        if (!episodeResponse["success"] || !episodeResponse["json"]) return
        this.cache = {
            ...this.cache,
            [anime_id]: episodeResponse["json"]["data"]
        };

        return {
            player_id: anime_id,
            episodesData: [{
                episodes: episodeResponse["json"]["data"].map((v, i) => ({
                    ep: i + 1,
                    img: v["snapshot"],
                    title: v["title"],
                    durration: convertTimeStringToSeconds(v["duration"]),
                    blueRayVer: v["disc"] == "BD",
                    episodeID: v["session"],
                    uploadedUnix: dateToUnix(v["created_at"])
                } as episodeMetadata)),
                type: "sub"
            }]
        }
    }
    extractOnlyEpisodesList = async (_type: string, anime_id: string): Promise<{ ep: string; img?: string; title?: string; }[]> => {
        const episodes = await this.extractEpisodeList(undefined, anime_id);
        if (!episodes) return []
        return episodes["episodesData"][0]["episodes"]
    }
    searchAnime = async (name: string, _page: number, _params?: FilterPluginsParams): Promise<cardData[]> => {
        try {
            const searchResponse = await request(`${WEBSITE}/search-api?m=search&q=${name}`, { headers: PluginHeader })
            /* IFDEF DEBUG */
            console.warn("searchAnime/AnimePahe", searchResponse)
            /* ENDIF */
            if (!searchResponse["success"] || !searchResponse["json"]) return []

            return searchResponse["json"]["data"].map((v) => convertToAnimeData(v))
        } catch (error) {
            console.error("Error in searchAnime/animepahe", error)
            return []
        }
    }

    raportStatus = async (): Promise<{ search: serverStatusData; player: serverStatusData; episodes: serverStatusData; }> => {
        const initialRequest = await request(WEBSITE, { headers: PluginHeader })
        if (initialRequest["status"] == 403) return undefined as any

        let results: serverStatusData[] = []

        async function wrapper(func: (...args) => any): Promise<{ content: any, server: serverStatusData } | undefined> {
            try {
                const start = performance.now();
                const response = await func()
                const end = performance.now();

                return {
                    content: response,
                    server: {
                        time: end - start,
                        work: response.length > 0
                    }
                }
            } catch (error) {
                return undefined
            }
        }

        const searchResponse = await wrapper(async () => this.searchAnime("Oshi No Ko", 1))
        let id: string = ""
        if (!searchResponse) results.push({ time: 0, work: false })
        else {
            results.push(searchResponse["server"])
            id = searchResponse["server"]["work"] ? searchResponse["content"][0]["AnimeData"]["player_ID"] : ""
        }

        const functions = [
            async () => {
                const data = await this.extractPlayerData("sub", { ep: "1" }, id)
                if (data.length <= 0) return data
                if (data[0]["resolution"].length <= 0) return []
                return data
            },
            async () => this.extractOnlyEpisodesList("sub", id),
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
                results.push(tmp["server"])
            }
        }

        return {
            search: results[0],
            player: results[1],
            episodes: results[2]
        }
    }
}