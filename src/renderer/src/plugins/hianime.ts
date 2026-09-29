import { getAnimeSeasonFromDate, request, SheepFinderAnime2000, sleep } from "@renderer/utils/functions";
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

            console.error("ExtractorPlayer/hianime unsuported player", url)

            return
        } catch (error) {
            console.error("ExtractorPlayer/hianime Failed Extract", error)
            return
        }
    }

    zokoanime = async (url: string): Promise<playerData | undefined> => {
        const req = await request(url, { headers: PluginHeader })
        /* IFDEF DEBUG */
        console.warn("zokoanime/hianime", req)
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
        console.warn("megaplay/hianime", website_response)
        /* ENDIF */
        if (!website_response["success"]) return

        const match = website_response["text"].match(/data-id="(\d+)"/);
        if (!match) return

        const website_api_response = await request(`${url_object.origin}/stream/getSources?id=${match[1]}`, {
            headers: {
                ...PluginHeader,
                'Referer': url_object.origin,
                "Origin": url_object.origin
            }
        })

        /* IFDEF DEBUG */
        console.warn("megaplay/hianime website_api_response", website_api_response, match)
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
            if (!window.crypto || !window.crypto.subtle)
                return Promise.reject(new Error("Web Crypto not available"));
            const t = sourceEncPadKeyBytes("i?LMTAx0Q6,:}50U", 32)
                , a = sourceEncPadKeyBytes("W0;27ToaUpl_P%'c", 16);
            return window.crypto.subtle.importKey("raw", t, {
                name: "AES-CBC"
            }, !1, ["decrypt"]).then(t => window.crypto.subtle.decrypt({
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
            return window.crypto.subtle.importKey("raw", r.encode("MpCdnT0k3n!9f2K#xQ7vL5mR8wN1pY4s"), {
                name: "HMAC",
                hash: "SHA-256"
            }, !1, ["sign"]).then(e => window.crypto.subtle.sign("HMAC", e, r.encode(a))).then(e => sourceEncB64UrlEncode(r.encode(a)) + "." + sourceEncB64UrlEncode(e))
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
                type: "opening"
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

export default class HIanime implements playerPluginFormat {
    metadata: playerPluginFormat["metadata"] = {
        version: "1.0",
        name: "HIanime",
        author: "Owca525",
        supportLang: ["en"],
        urlWebsite: WEBSITE,
        type: "player",
        icon: `${WEBSITE}/theme/images/logo.png`
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
            async () => this.searchAnime("My Star", 1),
            async () => this.extractPlayerData("sub", { ep: "1" }, "oshi-no-ko-675"),
            async () => this.extractOnlyEpisodesList("sub", "oshi-no-ko-675"),
        ]

        for (let index = 0; index < functions.length; index++) {
            const element = functions[index];
            const tmp = await wrapper(element)
            await sleep(Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000)
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
