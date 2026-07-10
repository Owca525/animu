import { convertMsToMinutes, request, SheepFinderAnime2000 } from "@renderer/utils/functions";
import { AnimeData, episodeMetadata, FilterPluginsParams, playerData, playerPluginFormat, serverStatusData, episodeList, cardData, resolutionFormat } from "@renderer/utils/types";

interface AllmangaURLformat {
    url: string,
    clockAPI: boolean,
    priority: number,
    sourceName: string
}

const HASH_SEARCH = 'a24c500a1b765c68ae1d8dd85174931f661c71369c89b92b88b75a725afc471c'
const HASH_INFO = '043448386c7a686bc2aabfbb6b80f6074e795d350df48015023b079527b0848a'
const HASH_PLAYER = 'd405d0edd690624b66baba3068e0edc3ac90f1597d898a1ec8db4e5c43c00fec'
const API_WEB = 'https://api.allanime.day'
const WEBSITE = 'https://allmanga.to/'

const SHITLOADER = "AYOVp7Mtrv66784RPBhH3dcXXFQRM3zzYlFxs9Rqk/yq7ouR/kKLsLD71rWMGIRhab1qx0Nu7FQJvONAdrOvU13C+cKulrbCmVuWySHILFoPFvX5P33KhJsqqv2vTo4NS52jHQePBDYyyk1PsObSVOITHHRDtaPnup/2fS/SVtckQV8jaBO275icFXKXeOVi6p9CoxiTVHNTQg=="

const header = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:149.0) Gecko/20100101 Firefox/149.0",
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

const source_names = ['Sak', 'S-mp4', "Luf-Mp4", "Kir", "Default", "Uv-mp4", "Uni", "Yt-mp4", "Ak"]

const mapping: Record<string, string> = {
    "79": "A", "7a": "B", "7b": "C", "7c": "D", "7d": "E", "7e": "F", "7f": "G",
    "70": "H", "71": "I", "72": "J", "73": "K", "74": "L", "75": "M", "76": "N",
    "77": "O", "68": "P", "69": "Q", "6a": "R", "6b": "S", "6c": "T", "6d": "U",
    "6e": "V", "6f": "W", "60": "X", "61": "Y", "62": "Z", "59": "a", "5a": "b",
    "5b": "c", "5c": "d", "5d": "e", "5e": "f", "5f": "g", "50": "h", "51": "i",
    "52": "j", "53": "k", "54": "l", "55": "m", "56": "n", "57": "o", "48": "p",
    "49": "q", "4a": "r", "4b": "s", "4c": "t", "4d": "u", "4e": "v", "4f": "w",
    "40": "x", "41": "y", "42": "z", "08": "0", "09": "1", "0a": "2", "0b": "3",
    "0c": "4", "0d": "5", "0e": "6", "0f": "7", "00": "8", "01": "9", "15": "-",
    "16": ".", "67": "_", "46": "~", "02": ":", "17": "/", "07": "?", "1b": "#",
    "63": "[", "65": "]", "78": "@", "19": "!", "1c": "$", "1e": "&", "10": "(",
    "11": ")", "12": "*", "13": "+", "14": ",", "03": ";", "05": "=", "1d": "%"
};

function encodeStringToClockAPI(textString: string): string {
    const field = textString.trim();

    const hexPairs: string[] = [];
    for (let i = 0; i < field.length; i += 2) {
        hexPairs.push(field.slice(i, i + 2));
    }
    return hexPairs.map(hp => mapping[hp] ?? "").join("")
}

function sortURLS(urls: { [key: string]: any }[]): AllmangaURLformat[] {
    let sorted: AllmangaURLformat[] = []

    urls.forEach((value) => {
        try {
            if (!source_names.includes(value["sourceName"])) return
            const decodedUrl = encodeStringToClockAPI(value["sourceUrl"])

            const needDecode = value["sourceUrl"].startsWith("--") && !decodedUrl.startsWith("http")

            sorted.push({
                url: needDecode ? decodedUrl : value["sourceUrl"],
                clockAPI: needDecode,
                priority: value["priority"],
                sourceName: value["sourceName"]
            })
        } catch (error) { console.error("Allmanga/sortURLS", error) }
    })

    return sorted
}

async function requestApiAllmanga(variables: string, hash: string) {
    const url = `${API_WEB}/api?variables=${variables}&extensions={"persistedQuery":{"version":1,"sha256Hash":"${hash}"}}`
    const response = await request(
        `${API_WEB}/api?variables=${variables}&extensions={"persistedQuery":{"version":1,"sha256Hash":"${hash}"}}`,
        { headers: header }
    )

    /* IFDEF DEBUG */
    console.warn("requestApiAllmanga/allmanga", variables, hash, response)
    /* ENDIF */

    if (!response.success || response.json && response.json["error"]) console.error("Allmanga request", response, url, header)
    return response
}

function converterToAnimeData(data: { [key: string]: any }): AnimeData | undefined {
    if (!data) return
    let characters: any = []
    try {
        if (data.characters) {
            for (let index = 0; index < data.characters.length; index++) {
                const element = data.characters[index];
                characters.push({ role: element.role, character: { id: element.aniListId, name: element.name.full, image: element.image.large } })
                if (index == 10) break
            }
        }
    } catch (error) {
        console.error(error)
    }

    return {
        averageScore: data.averageScore,
        bannerImage: data.banner,
        coverImage: data.thumbnail,
        description: data.description,
        duration: data.episodeDuration ? convertMsToMinutes(parseInt(data.episodeDuration)) : undefined,
        endDate: data.airedEnd ? { year: data.airedEnd.year, day: data.airedEnd.date, month: data.airedEnd.month } : undefined,
        startDate: data.airedStart ? { year: data.airedStart.year, day: data.airedStart.date, month: data.airedStart.month } : undefined,
        episodes: data.episodeCount ? parseInt(data.episodeCount) : undefined,
        genres: data.genres,
        nextAiringEpisode: undefined,
        popularity: 0,
        season: data.season ? data.season.quarter : undefined,
        seasonYear: data.season ? data.season.year : undefined,
        status: data.status,
        studios: data.studios,
        title: { romaji: data.name, native: data.nativeName, english: data.englishName },
        type: data.type,
        id: "",
        format: data.type,
        player_ID: data._id,
        characters: characters,
        source: undefined,
        trailer: undefined
    }
}

function FuckBufferDosentWorkInElectron(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
}

async function fuckThisEncryptionMethod(encryptedMotherFucker: string) {
    console.log(encryptedMotherFucker)
    let bufferEncrypted = FuckBufferDosentWorkInElectron(encryptedMotherFucker)
    let version = bufferEncrypted[0];

    if (version !== 1) throw new Error(`ALLMANGA CHANGED THEY FUCKING VERSION OF ENCRYPTION IMEDITLY SEND AS BUG REPORT NOW HAVE VERSION: ${version}`)

    const encodedKey = (new TextEncoder).encode(`Xot36i3lK3:v${version}`)
    const digestetCUM = await crypto.subtle.digest("SHA-256", encodedKey);

    const cumKey = await crypto.subtle.importKey("raw", digestetCUM, {
        name: "AES-GCM"
    }, !1, ["decrypt"])

    const randomSlicedBufferCum = bufferEncrypted.slice(1, 13)
    let w = bufferEncrypted.slice(bufferEncrypted.length - 16)
    let v = bufferEncrypted.slice(13, (bufferEncrypted.length - 16))
    let O = new Uint8Array(v.length + w.length);
    O.set(v);
    O.set(w, v.length);

    const decryptedCum = await crypto.subtle.decrypt({
        name: "AES-GCM",
        iv: randomSlicedBufferCum
    }, cumKey, O);
    return JSON.parse((new TextDecoder).decode(decryptedCum))
}

async function requestToClockApi(content: AllmangaURLformat): Promise<playerData | undefined> {
    if (content["url"].startsWith("https")) return undefined
    const links = await request(`https://allanime.day${content["url"].replace("clock", "clock.json")}`, {
        headers: header
    })

    /* IFDEF DEBUG */
    console.warn("allmanga/requestToClockApi", links)
    /* ENDIF */

    if (!links["success"] || !links["json"]) return undefined

    let listUrls: playerData | undefined

    links["json"]["links"].forEach(element => {

        const srcUrl = element.src ? element.src : element.link
        if (!srcUrl) return console.error("allmanga/requestToClockApi Unsuported Url", links)

        listUrls = { resolution: [{ url: srcUrl, res: "1080", hls: element["hls"] ? true : false }], hostname: content["sourceName"] }
    });
    return listUrls
}

async function allAnimeDecyrption(encrypted: string) {
    try {
        const encodedKey = (new TextEncoder).encode("kiemtienmua911ca")

        const cumKey = await crypto.subtle.importKey("raw", encodedKey, {
            name: "AES-CBC"
        }, !0, ["decrypt"])

        const decryptedCum = await crypto.subtle.decrypt({
            name: "AES-CBC",
            iv: (new TextEncoder).encode("1234567890oiuytr")
        }, cumKey, new Uint8Array(encrypted.match(/[\da-f]{2}/gi)!.map(P => parseInt(P, 16))));

        return JSON.parse((new TextDecoder).decode(decryptedCum))
    } catch (error) {
        console.error("Failed Decrypt Allanime Format Report This to Main Developer", error, encrypted)
        return
    }
}

async function fetchUrls(params: AllmangaURLformat): Promise<resolutionFormat[]> {
    const urlObject = new URL(params.url);

    if (params["sourceName"] == "Uni") {
        const response = await request(`${urlObject["origin"]}/api/v1/video?id=${urlObject["hash"].replace("#", "")}&w=1920&h=1080&r=`, {
            headers: {
                ...header,
                'Referer': urlObject["origin"],
                "Origin": urlObject["origin"],
            }
        })

        /* IFDEF DEBUG */
        console.warn("allmanga/fetchUrls Response", response)
        /* ENDIF */

        if (!response["success"]) return []

        const code = await allAnimeDecyrption(response["text"])
        /* IFDEF DEBUG */
        console.warn("allmanga/fetchUrls Code", code)
        /* ENDIF */
        if (!code) return []

        try {
            const url = code["hlsVideoTiktok"] ? `${urlObject["origin"]}${code["hlsVideoTiktok"]}` : code["cf"]
            return [{
                res: "1080",
                url: url,
                reqHeader: header,
                hls: true
            }]
        } catch (error) {
            console.error("Allmanga/fetchUrls", error, response)
            return []
        }
    }
    console.warn("NOT SUPPORTED WEBSITE", params)
    return []
}

async function detectURL(params: AllmangaURLformat): Promise<resolutionFormat[]> {
    if (params["sourceName"] == "Uni") return await fetchUrls(params)

    return [{
        res: "1080",
        url: params.url,
        reqHeader: header
    }]
}

export default class Allmanga implements playerPluginFormat {
    metadata: playerPluginFormat["metadata"] = {
        version: "2.4",
        name: "Allmanga",
        author: "Owca525",
        icon: `${WEBSITE}android-icon-192x192.png`,
        supportLang: ["en"],
        urlWebsite: WEBSITE,
        type: "player"
    }
    // config: { [key: string]: any; } = {
    //     "settings.extensions.website": API_WEB,s
    //     "HASH_SEARCH": HASH_SEARCH,
    //     "HASH_INFO": HASH_INFO,
    //     "HASH_PLAYER": HASH_PLAYER,
    // };

    extractPlayerData = async (type: string, episode: episodeMetadata, id: string): Promise<playerData[]> => {
        const tmpEpisode = typeof episode == "object" ? episode["ep"] : episode
        const variables = `{"showId":"${id}","translationType":"${type}","episodeString":"${tmpEpisode}"}`

        const response = await request(
            `${API_WEB}/api?variables=${variables}&extensions={"persistedQuery":{"version":1,"sha256Hash":"${HASH_PLAYER}"},"aaReq":"${SHITLOADER}"}`,
            { headers: header }
        )

        if (!response["success"] || !response["json"]) return []

        try {
            console.log(response)
            const jsonObject = await fuckThisEncryptionMethod(response["json"]["data"]["tobeparsed"])
            /* IFDEF DEBUG */
            console.warn("allmanga/fetchUrls jsonObject", jsonObject)
            /* ENDIF */
            if (!jsonObject) return []

            const urlList = sortURLS(jsonObject["episode"]["sourceUrls"])
            const maxPriority = Math.max(...urlList.map(i => i.priority));

            const updatedItems = urlList.map(item => ({
                ...item,
                active: item.priority === maxPriority
            }));

            let playerContent: playerData[] = []

            for (let index = 0; index < updatedItems.length; index++) {
                const value = updatedItems[index];

                playerContent.push({
                    hostname: value["sourceName"],
                    resolution: value["clockAPI"] ? [] : await detectURL(value),
                    defaultHost: value["active"],
                    extractResolution: () => requestToClockApi(value)
                })
            }

            if (jsonObject["episode"]["episodeInfo"][`vidInfors${type}`]) {
                const main = jsonObject["episode"]["episodeInfo"][`vidInfors${type}`]
                playerContent.push({
                    hostname: "wp.youtube-anime.com",
                    resolution: [{
                        res: main["vidResolution"].toString(),
                        url: `https://aln.youtube-anime.com${main["vidPath"]}`,
                        hls: false,
                    }]
                })
            }

            return playerContent
        } catch (error) {
            console.error("Allmanga/extractPlayerData", error)
            return []
        }
    }

    extractEpisodeList = async (animeData?: AnimeData, anime_id?: string): Promise<episodeList | undefined> => {
        let animeID = anime_id
        if (animeData && !animeID) {
            const responseSearch = await this.searchAnime(animeData["title"]["romaji"])
            animeID = SheepFinderAnime2000(responseSearch.map((v) => v["AnimeData"]), animeData)
        }

        if (!animeID) return

        const variables = `{"_id":"${animeID}"}`;
        const response = await requestApiAllmanga(variables, HASH_INFO)

        if (!response["success"] || !response["json"] || response.json["error"]) return

        try {
            const entries = Object.entries(response["json"]["data"]["show"]["availableEpisodesDetail"])

            return {
                player_id: animeID,
                episodesData: entries.map(([key, val]: any) => {
                    val.reverse()

                    return {
                        episodes: val.map((v) => ({ ep: v })),
                        type: key as episodeList["episodesData"][0]["type"]
                    }
                })
            }
        } catch (error) {
            console.error("Allmanga/extractEpisodeList", error)
            return
        }
    }

    extractOnlyEpisodesList = async (type: string, anime_id: string): Promise<episodeMetadata[]> => {
        const extractorResponse = await this.extractEpisodeList(undefined, anime_id)
        if (!extractorResponse) return []

        const finded = extractorResponse.episodesData.find((v) => v["type"] == type)
        if (!finded) return []

        return finded["episodes"]
    }

    searchAnime = async (name: string, page: number = 1, _params?: FilterPluginsParams): Promise<cardData[]> => {
        const variables = `{"search":{"query":"${name.replaceAll('"', "").replaceAll('&', "")}"},"limit":26,"page":${page},"translationType":"sub","countryOrigin":"ALL"}`
        const response = await requestApiAllmanga(variables, HASH_SEARCH)

        if (!response.success || !response.json || response.json["error"]) return []

        try {
            return response.json["data"]["shows"]["edges"].map((card) => ({ AnimeData: converterToAnimeData(card) }))
        } catch (error) {
            console.error("Allmanga/searchAnime", error)
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
            async () => this.searchAnime("Oshi No Ko"),
            async () => this.extractPlayerData("sub", { ep: "1" }, "b3u5TprKSKHBPBcor"),
            async () => this.extractOnlyEpisodesList("sub", "b3u5TprKSKHBPBcor"),
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