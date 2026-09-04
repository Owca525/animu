// TODO: END THIS: Cloudflare have problem when is request to the fragment
import { request, SheepFinderAnime2000 } from "@renderer/utils/functions";
import { AnimeData, cardData, episodeList, episodeMetadata, FilterPluginsParams, playerChapterList, playerData, playerDataExtended, playerPluginFormat, playerSubtitlesFormat, serverStatusData } from "@renderer/utils/types";

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

const PlayerHEADER: Record<string, string> = {
    "accept": "*/*",
    "accept-encoding": "gzip, deflate, br, zstd",
    "accept-language": "en-US,en;q=0.9",
    "cache-control": "no-cache",
    "origin": "https://flixcloud.cc",
    "pragma": "no-cache",
    "priority": "u=1, i",
    "referer": "https://flixcloud.cc/",
    "sec-ch-ua": '"Chromium";v="151", "Not=A?Brand";v="99"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Linux"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site",
    "user-agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36",
};

const decryptor_content = `(response) => {
    if (response["text"].startsWith("#EXTM3U")) return response["text"]
    const secret = "REPLACE_ME_TO_SECRET_KEY"
    let str = [];

    for (let l = atob(secret), u = atob(response["text"].trim()), h = 0; h < u.length; h++) {
        str.push(u.charCodeAt(h) ^ l.charCodeAt(h % l.length));
    }
    return (new TextDecoder).decode(new Uint8Array(str))
}`

const hls_converter = `(response) => {
    let buffer = response["buffer"]

    if (response["url"].includes(".webp") || response["url"].includes(".png")) {
        let l = null;
        const u = new Uint8Array(buffer);
        let d = true;

        if (u.length >= 12 && u[0] === 82 && u[1] === 73 && u[2] === 70 && u[3] === 70 && u[8] === 87 && u[9] === 69 && u[10] === 66 && u[11] === 80) {
            l = buffer.slice(12);
            if (u.length >= 13 && u[12] === 71) {
                d = false;
            }
        }

        else if (u.length >= 8 && u[0] === 137 && u[1] === 80 && u[2] === 78 && u[3] === 71 && u[4] === 13 && u[5] === 10 && u[6] === 26 && u[7] === 10) {
            l = buffer.slice(8);

            if (u.length >= 9 && u[8] === 71) {
                d = false;
            }
        }

        if (l !== null) {
            if (d) {
                const h = [
                    157, 42, 241, 71,
                    179, 142, 92, 112,
                    166, 25, 228, 59,
                    216, 98, 15, 197,
                ];

                const f = new Uint8Array(l);

                for (let c = 0; c < f.length; c++) {
                    f[c] ^= h[15 & c];
                }

                buffer = f.buffer;
            } else {
                buffer = l;
            }
        }
    }
    return buffer
}`

// function DecyrptContent(encode_content: string, secret: string) {
//     let str: number[] = [];

//     for (let l = atob(secret), u = atob(encode_content.trim()), h = 0; h < u.length; h++) {
//         str.push(u.charCodeAt(h) ^ l.charCodeAt(h % l.length));
//     }
//     return (new TextDecoder).decode(new Uint8Array(str))
// }

// function runInWorker(response) {
//     const key = "REPLACE_ME_TO_SECRET_KEY"
//     return DecyrptContent(response["text"], key)
// }

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class FlixCloud {
    url: string = ""
    data: { [key: string]: any } = {}

    constructor(url) {
        this.url = url
    }

    Ct = (t: string): Uint8Array => {
        const e = atob(t);
        const s = new Uint8Array(e.length);

        for (let o = 0; o < e.length; o++) {
            s[o] = e.charCodeAt(o);
        }

        return s;
    }

    Qt = async (t: string): Promise<string> => {
        const e = new TextEncoder().encode(t);
        const s = await crypto.subtle.digest("SHA-256", e);

        return Array.from(new Uint8Array(s))
            .map((m) => m.toString(16).padStart(2, "0"))
            .join("");
    }

    hn = async (t: string) => {
        let e = t;

        for (let o = 0; o < 3; o++) {
            e = await this.Qt(e + o.toString());
        }

        let s = e;

        for (let o = 0; o < 3; o++) {
            s = await this.Qt(s + o.toString());
        }

        return {
            videoField: `vf_${e.substring(0, 8)}`,
            keyField: `kf_${e.substring(8, 16)}`,
            ivField: `ivf_${e.substring(16, 24)}`,
            containerName: `cd_${e.substring(24, 32)}`,
            arrayName: `ad_${e.substring(32, 40)}`,
            objectName: `od_${e.substring(40, 48)}`,
            tokenField: `${e.substring(48, 64)}_${e.substring(56, 64)}`,
            keyFrag2Field: `${s.substring(0, 16)}_${s.substring(16, 24)}`,
        };
    }

    gn = async (t: { [key: string]: string }, e: { [key: string]: string }) => {
        try {
            const container = t[e.containerName];

            if (typeof container !== "object" || container === null) {
                throw new Error("Container Not Found")
            }

            const array = (container as Record<string, unknown>)[e.arrayName];

            if (!Array.isArray(array) || array.length === 0) {
                throw new Error("Array Not Found")
            }

            const firstObject = array[0];

            if (typeof firstObject !== "object" || firstObject === null) {
                throw new Error("Object Not Found")
            }

            const object = firstObject[e.objectName] as Record<string, unknown>;
            const key = object[e.keyField];
            const iv = object[e.ivField];

            if (
                typeof key !== "string" ||
                typeof iv !== "string" ||
                !key ||
                !iv
            ) return

            return {
                frag1_b64: key,
                iv_b64: iv,
            };
        } catch (error) {
            console.error("FlixCloud/GN ERROR", error)
            return
        }
    }

    mn = async (t: Uint8Array, e: Uint8Array, s: Uint8Array, o: number): Promise<{ array: Uint8Array, key: string }> => {
        const m = this.data.w_payload;
        const g = this.Ct(m);

        let Zt = (await WebAssembly.instantiate(g, {}) as any).instance;
        const L = Zt.exports as { memory: WebAssembly.Memory; _c: () => number; _s: (value: number) => void; _r: (input1: number, input2: number, input3: number, output: number, length: number) => void; };
        const w = L.memory;
        if (w.buffer.byteLength === 0) { w.grow(1); }
        const S = new Uint8Array(w.buffer);
        const k = t.length;
        const I = 1000;
        const P = I + k;
        const U = P + k;
        const nt = U + k;
        S.set(t, I);
        S.set(e, P);
        S.set(s, U);
        L._s(o);
        L._r(I, P, U, nt, k);
        const V = new Uint8Array(k);
        V.set(S.subarray(nt, nt + k));

        const b = L._c()

        return { array: V, key: btoa(String.fromCharCode(...new Uint8Array(L.memory.buffer).slice(b, b + 32))) };
    }

    yn = async (): Promise<{ url: string, decryptor: string } | undefined> => {
        try {
            const t = this.data.obfuscated_crypto_data;
            const e = this.data.obfuscation_seed;

            if (!t || !e) {
                throw new Error("Missing obfuscated decryption data");
            }

            let o: { [key: string]: any } | undefined = await this.hn(e);

            /* IFDEF DEBUG */
            console.warn("FlixCloud/yn o", o)
            /* ENDIF */

            if (!o) {
                throw new Error("Field mapping resolution failed");
            }

            const m = await this.gn(t, o);

            /* IFDEF DEBUG */
            console.warn("FlixCloud/yn m", m)
            /* ENDIF */

            if (m == undefined) {
                throw new Error("Frag and IV Are undefined")
            }

            const keyComponent = this.data[o.keyFrag2Field];

            if (typeof keyComponent !== "string" || !keyComponent) {
                throw new Error("Missing key component");
            }

            const tokenField = o.tokenField;

            let token: string | null = null;

            for (const [key, value] of Object.entries(this.data)) {
                if (
                    key === tokenField &&
                    typeof value === "string" &&
                    value.length > 0
                ) {
                    token = value;
                    break;
                }
            }

            if (!token) {
                throw new Error("Missing token reference");
            }

            const url = new URL(this.url)

            let tokenResponse: any = await request(`${url.origin}/api/m3u8/${token}`, { headers: { ...PluginHeader, "Referer": url.origin } })

            /* IFDEF DEBUG */
            console.warn("FlixCloud/yn tokenResponse", tokenResponse)
            /* ENDIF */

            if (!tokenResponse["success"]) {
                throw new Error("Failed Token Request");
            }

            tokenResponse = tokenResponse["json"]

            const k = (await this.Qt(token + "vid")).substring(0, 10);
            const I = (await this.Qt(token + "key")).substring(0, 10);

            const P = tokenResponse[k];
            const U = tokenResponse[I];

            if (!P || !U) {
                throw new Error("Incomplete token response");
            }

            const V = this.Ct(m.frag1_b64);
            const l = this.Ct(keyComponent);
            const f = this.Ct(U);

            const b = parseInt(e.substring(0, 8), 16);

            const O = await this.mn(V, l, f, b);

            const N = await crypto.subtle.importKey(
                "raw",
                O.array as any,
                {
                    name: "PBKDF2",
                },
                false,
                ["deriveBits"]
            );

            const Y = await crypto.subtle.deriveBits(
                {
                    name: "PBKDF2",
                    salt: new TextEncoder().encode(e),
                    iterations: 1000,
                    hash: "SHA-256",
                },
                N,
                256
            );

            const keyMaterial = new Uint8Array(Y);

            for (let i = 0; i < 32; i++) {
                keyMaterial[i] ^=
                    e.charCodeAt(i % e.length);
            }

            const ot = await crypto.subtle.digest(
                "SHA-256",
                keyMaterial
            );

            const fe = new Uint8Array(ot);

            const Nt = this.Ct(m.iv_b64);
            const At = this.Ct(P);

            const r = await crypto.subtle.importKey(
                "raw",
                fe,
                {
                    name: "AES-CBC",
                },
                false,
                ["decrypt"]
            );

            const decrypted = await crypto.subtle.decrypt(
                {
                    name: "AES-CBC",
                    iv: Nt as any,
                },
                r,
                At as any
            );

            const M = new TextDecoder().decode(decrypted);

            if (!M || M.trim() === "") {
                throw new Error("Decryption resulted in empty URL");
            }

            return { url: M, decryptor: O.key };
        } catch (error) {
            console.error("FlixCloud Extractor Error", error)
            return
        }
    }

    Extractor = async (playerdata: playerData): Promise<playerData | undefined> => {
        try {
            const response = await request(this.url, { headers: PluginHeader })
            if (!response["success"]) return undefined

            const match = response.text.match(/data:\s*(\{[\s\S]*?\})\s*,\s*uses:/);

            /* IFDEF DEBUG */
            console.warn("FlixCloud/Extractor", match)
            /* ENDIF */

            if (!match || !match["1"]) return

            this.data = Function(`"use strict"; return (${match["1"]})`)()

            /* IFDEF DEBUG */
            console.warn("FlixCloud/Extractor Content", this.data)
            /* ENDIF */

            const resp = await this.yn()
            if (!resp) return

            const head = new URL(this.url)

            let subtitles: playerSubtitlesFormat[] = []
            let chapters: playerChapterList[] = []

            if (this.data["subtitles"]) {
                subtitles = this.data["subtitles"].map((v) => ({
                    url: v["url"],
                    lang: "en",
                    format: v["format"],
                    label: v["language"],
                    default: v["default"]
                }))
            }

            if (this.data["chapters"]) {
                for (let index = 0; index < this.data["chapters"].length; index++) {
                    const element = this.data["chapters"][index];
                    let type: playerChapterList["type"] = "other"

                    if (this.data["intro_chapter"] && this.data["intro_chapter"]["title"] == element["title"]) type = "opening"
                    if (this.data["outro_chapter"] && this.data["outro_chapter"]["title"] == element["title"]) type = "ending"

                    chapters.push({
                        start: element["start"],
                        end: element["end"],
                        type: type,
                        name: element["title"]
                    })

                }
            }

            return {
                ...playerdata,
                resolution: [{
                    res: "1080",
                    url: resp.url,
                    hls: true,
                    reqHeader: {
                        ...PlayerHEADER,
                        'Referer': head.origin,
                        "Origin": `${head.origin}/`,
                    },
                    defaultSubtitles: subtitles.find((v) => v["default"]) ? true : false
                }],
                subtitles: subtitles,
                listChapters: chapters,
                scripts: [{
                    type: "hls_manifest",
                    code: decryptor_content.replace("REPLACE_ME_TO_SECRET_KEY", resp["decryptor"])
                }, {
                    type: "hls_arraybuffer",
                    code: hls_converter
                }]
            }
        } catch (error) {
            console.error("FlixCloud/Extractor", error)
            return
        }
    }
}

async function ExtractVideo(playerData: playerDataExtended, url: string): Promise<playerData | undefined> {
    if (url.includes("flixcloud.cc")) return await new FlixCloud(url).Extractor(playerData)

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

    extractPlayerData = async (_type: string, episode: episodeMetadata, id: string): Promise<playerData[]> => {
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

        const list_id = JSON.parse(anime_id)

        if (list_id[0] == 0 && animeData) {
            anime_id = JSON.stringify([animeData["id"], list_id[1]])
        }

        const response = await request(`${WEBSITE}/api/v1/anime/${list_id[1]}/episodes?limit=2000`, { headers: PluginHeader })
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
                player_ID: JSON.stringify([v["anilist_id"], v["anime_id"]]),
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
            async () => this.extractPlayerData("sub", { ep: "1" }, "[150672,\"oshi-no-ko-knjx62\"]"),
            async () => this.extractOnlyEpisodesList("sub", "[150672,\"oshi-no-ko-knjx62\"]"),
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