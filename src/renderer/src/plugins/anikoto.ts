import { request, SheepFinderAnime2000, sleep } from "@renderer/utils/functions";
import { AnimeData, cardData, episodeList, episodeMetadata, FilterPluginsParams, playerChapterList, playerData, playerPluginFormat, playerSubtitlesFormat, serverStatusData } from "@renderer/utils/types";

const WEBSITE = "https://anikototv.to"
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

const PuginAPIHeader = {
    "User-Agent": navigator.userAgent,
    Accept: "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Sec-GPC": "1",
    Connection: "keep-alive",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "cross-site",
    'Referer': WEBSITE,
    "x-requested-with": "XMLHttpRequest"
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

        const website_api_response = await request(`${url_object.origin}/stream/getSources?id=${match[1]}`, {
            headers: {
                ...PluginHeader,
                'Referer': url_object.origin,
                "Origin": url_object.origin
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

export default class Anikoto implements playerPluginFormat {
    metadata: playerPluginFormat["metadata"] = {
        version: "1.0",
        name: "Anikoto",
        author: "Owca525",
        supportLang: ["en"],
        urlWebsite: WEBSITE,
        type: "player",
        icon: `${WEBSITE}/AnikotoTheme/assets/images/logo.png`
    };

    extractPlayerData = async (_type: string, episode: episodeMetadata, _id: string): Promise<playerData[]> => {
        const playerResponse = await request(`${WEBSITE}/ajax/server/list?servers=${episode["episodeID"]}`, { headers: PuginAPIHeader })
        /* IFDEF DEBUG */
        console.warn("extractPlayerData/anikoto", playerResponse)
        /* ENDIF */

        if (!playerResponse["success"] || !playerResponse["json"]) return []

        const typeRegex = /<div\s+class="type"\s+data-type="([^"]+)"[^>]*>[\s\S]*?<ul>([\s\S]*?)<\/ul>\s*<\/div>/g;

        const streamRegex = /<li\b[^>]*data-sv-id="([^"]+)"[^>]*data-link-id="([^"]+)"[^>]*>([\s\S]*?)<\/li>/g;

        const converted = [...playerResponse["json"]["result"].matchAll(typeRegex)].map(typeMatch => {
            const type = typeMatch[1];
            const streamsHtml = typeMatch[2];

            const streams = [...streamsHtml.matchAll(streamRegex)].map(match => ({
                id: match[1],
                link: match[2],
                name: match[3]
                    .replace(/<[^>]+>/g, "")
                    .trim()
            }));

            return {
                type,
                streams
            };
        });

        let content: { name: string, id: string, type: string }[] = []

        for (let index = 0; index < converted.length; index++) {
            const element = converted[index];

            for (let index = 0; index < element["streams"].length; index++) {
                const value = element["streams"][index];
                content.push({
                    name: value["name"],
                    id: value["link"],
                    type: element["type"]
                })
            }
        }

        let urls: { name: string, url: string }[] = []

        for (let index = 0; index < content.length; index++) {
            const value = content[index];

            const website_resp = await request(`${WEBSITE}/ajax/server?get=${value["id"]}`, { headers: PuginAPIHeader })
            if (!website_resp["success"] || !website_resp["json"]) continue

            urls.push({
                name: `${value["name"].split(" ")[0]} ${value["type"]}`,
                url: website_resp["json"]["result"]["url"]
            })
        }

        /* IFDEF DEBUG */
        console.warn("extractPlayerData/anikoto urls", urls)
        /* ENDIF */

        if (urls.length <= 0) return []

        return urls.map((v) => ({
            hostname: v["name"],
            resolution: [],
            extractResolution: async () => await (new ExtractorPlayer(v["name"])).extract(v["url"])
        } as playerData))
    }

    extractEpisodeList = async (animeData?: AnimeData, anime_id?: string): Promise<episodeList | undefined> => {
        if (animeData && !anime_id) {
            const searchResponse = await this.searchAnime(animeData["title"]["english"] ?? animeData["title"]["romaji"], 1)
            if (searchResponse.length <= 0) return

            anime_id = SheepFinderAnime2000(searchResponse.map((v) => v.AnimeData), animeData)

            if (!anime_id) anime_id = searchResponse[0]["AnimeData"]["player_ID"]
        }

        /* IFDEF DEBUG */
        console.warn("extractEpisodeList/anikoto id", anime_id)
        /* ENDIF */

        if (!anime_id) return

        const website_request = await request(`${WEBSITE}/watch/${anime_id}`)
        if (!website_request["success"]) return

        const finded_ID = website_request["text"].match(/data-id="(\d+)"/)

        /* IFDEF DEBUG */
        console.warn("extractEpisodeList/anikoto website_request", website_request, finded_ID)
        /* ENDIF */

        if (!finded_ID) return

        const episodeResponse = await request(`${WEBSITE}/ajax/episode/list/${finded_ID[1]}`, { headers: PuginAPIHeader })

        /* IFDEF DEBUG */
        console.warn("extractEpisodeList/anikoto", episodeResponse)
        /* ENDIF */

        if (!episodeResponse["success"] || !episodeResponse["json"]) return

        const regex = /<a[^>]*data-id="([^"]+)"[^>]*data-num="([^"]+)"[^>]*data-ids="([^"]+)"[^>]*>[\s\S]*?<span\s+class="d-title"\s+data-jp="([^"]+)"/g;;

        return {
            player_id: anime_id,
            episodesData: [{
                episodes: [...String(episodeResponse["json"]["result"]).matchAll(regex)].map((element) => {
                    return {
                        ep: element[2],
                        episodeID: element[3],
                        title: element[4]
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
        name = new URLSearchParams({ keyword: name }).toString()

        const response = await request(`${WEBSITE}/ajax/anime/search?${name}`, { headers: PuginAPIHeader })
        /* IFDEF DEBUG */
        console.warn("searchAnime/anikoto", response)
        /* ENDIF */
        if (!response["success"] || !response["json"]) return []

        const regex = /<a\s+class="item"\s+href="([^"]+)"[\s\S]*?<img\s+src="([^"]+)"[\s\S]*?<div\s+class="name\s+d-title"\s+data-jp="([^"]*)"[^>]*>([\s\S]*?)<\/div>[\s\S]*?<span\s+class="dot">([^<]+)<\/span>\s*<span\s+class="dot">(\d{4})<\/span>/g;

        const match = [...String(response["json"]["result"]["html"]).matchAll(regex)];
        /* IFDEF DEBUG */
        console.warn("searchAnime/anikoto match", match)
        /* ENDIF */

        return match.map((element) => {
            const id = element[1].split("/").at(-1)

            return {
                AnimeData: {
                    title: {
                        english: element[4],
                        native: element[3],
                        romaji: element[3]
                    },
                    id: "",
                    seasonYear: Number(element[6]),
                    coverImage: element[2],
                    player_ID: id,
                    format: element[5]
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
            async () => this.extractPlayerData("sub", { ep: "1", episodeID: "cWJvaWszcTZiRVRqZTk4ZXVwa3pJRUxEYnYvOTkxd1VPU3F1cURlYXpRb09GN2pjcm5OdjB0UUcrTWVTR04zTHExazJtY3BxUG9Dc0ZXQVlueDlKR2NPQ20wUG1EcWJ6anJNMTNLT2xMaDRPWHZRRXlDZ3pmUzAybUhWTHBlVWRMYTNRTGlkTDQrajVJUVBVbWR3VEhBYUs0TC9uMGxjRndVcU9td042dERZPQ" }, "oshi-no-ko-675"),
            async () => this.extractOnlyEpisodesList("sub", "my-star-hg319"),
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
