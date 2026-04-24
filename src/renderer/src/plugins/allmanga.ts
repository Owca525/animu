import { convertMsToMinutes, makeSmallText, request } from "@renderer/utils/functions"
import { AnimeData, episodeList, FilterPluginsParams, playerPluginFormat, playerData, episodeMetadata } from "@renderer/utils/types"

const HASH_SEARCH = 'a24c500a1b765c68ae1d8dd85174931f661c71369c89b92b88b75a725afc471c'
const HASH_INFO = '043448386c7a686bc2aabfbb6b80f6074e795d350df48015023b079527b0848a'
const HASH_PLAYER = 'd405d0edd690624b66baba3068e0edc3ac90f1597d898a1ec8db4e5c43c00fec'
const HASH_DATA = "c8f3ac51f598e630a1d09d7f7fb6924cff23277f354a23e473b962a367880f7d"
const API_WEB = 'https://api.allanime.day'

const header = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Referer': 'https://allmanga.to/',
    "Origin": "https://allmanga.to/"
}

const source_names = ['Sak', 'S-mp4', 'Luf-mp4', "Kir", "Default", "Uv-mp4", "Mp4", "Yt-mp4"]
// "Yt-mp4"
// const normalUrls: string[] = []

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

function findUrl(url: string, sourceName: string): { url: string, decode: boolean, source: string } | undefined {
    for (let index = 0; index < source_names.length; index++) {
        const element = source_names[index];
        // if (element.toLowerCase() == sourceName.toLowerCase() && normalUrls.includes(element)) return { url, decode: false, source: sourceName }
        if (element.toLowerCase() == sourceName.toLowerCase()) {
            let tmpUrl = decodeText(url)
            return { url: tmpUrl, decode: !tmpUrl.startsWith("https://"), source: sourceName }
        }
    }
    return
}

function decodeText(textString: string): string {
    const field = textString.trim();

    const hexPairs: string[] = [];
    for (let i = 0; i < field.length; i += 2) {
        hexPairs.push(field.slice(i, i + 2));
    }
    return hexPairs.map(hp => mapping[hp] ?? "").join("")
}

function converterData(data: any): AnimeData | undefined {
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

async function requestToApi(variables: string, hash: string, header: any) {
    let url = `${API_WEB}/api?variables=${variables}&extensions={"persistedQuery":{"version":1,"sha256Hash":"${hash}"}}`
    let data = await request(url, { headers: header })

    /* IFDEF DEBUG */
    console.warn("requestToApi/allmanga", data)
    /* ENDIF */

    if (!data.success || data.json && data.json["error"]) console.error("Allmanga request", data, url, header)
    return data
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
    let bufferEncrypted = FuckBufferDosentWorkInElectron(encryptedMotherFucker)
    let version = bufferEncrypted[0];

    if (version !== 1) {
        console.error("ALLMANGA CHANGED THEY FUCKING VERSION OF ENCRYPTION IMEDITLY SEND AS BUG REPORT NOW HAVE VERSION: ", version)
        return
    }

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

export function dateToUnix(dateStr: string | undefined): number | undefined {
    if (!dateStr) return undefined
    const date = new Date(dateStr);
    return Math.floor(date.getTime() / 1000);
}

async function SearchAnimeInAllmanga(name: string, page: number): Promise<AnimeData[]> {
    try {
        let variables = `{"search":{"query":"${name.replaceAll('"', "").replaceAll('&', "")}"},"limit":26,"page":${page},"translationType":"sub","countryOrigin":"ALL"}`
        const resp = await requestToApi(variables, HASH_SEARCH, header)
        if (!resp.success || !resp.json) return []
        if ("errors" in resp.json) {
            console.warn("Allmanga Request show error", resp.json["errors"], variables)
            return []
        }
        return resp.json.data.shows.edges.map((card) => converterData(card))
    } catch (error) {
        console.error("SearchAnimeInAllmanga/Allmanga Plugin", error)
        return []
    }
}

function SheepFinderAnime2000(animeList: AnimeData[], anime: AnimeData): string | undefined {
    try {
        console.log("First Check", animeList)
        // FIRST CHECK
        if (animeList.length <= 0) return undefined
        if (animeList.length == 1) return animeList[0].player_ID

        // Second Check
        let seasonYearFilter = animeList.filter((element) => element.seasonYear == anime.seasonYear)
        console.log("Second Check", seasonYearFilter)
        if (seasonYearFilter.length <= 0) return undefined
        if (seasonYearFilter.length == 1) return seasonYearFilter[0].player_ID

        // Third Check
        let seasonFilter = seasonYearFilter.filter((element) => makeSmallText(element.season) == makeSmallText(anime.season))
        console.log("Third Check", seasonYearFilter)
        if (seasonFilter.length <= 0) return undefined
        if (seasonFilter.length == 1) return seasonFilter[0].player_ID

        // Four Check
        let episodesFilter: AnimeData[] | undefined = undefined
        if (anime.episodes) {
            episodesFilter = seasonFilter.filter((element) => element.episodes == anime.episodes)
            console.log("Four Check", episodesFilter)
            if (episodesFilter.length <= 0) return undefined
            if (episodesFilter.length == 1) return episodesFilter[0].player_ID
        }

        // Five Check
        let durationFilter: AnimeData[] = []
        if (episodesFilter) durationFilter = episodesFilter.filter((element) => element.duration == anime.duration)
        else durationFilter = seasonFilter.filter((element) => element.duration == anime.duration)
        console.log("Five Check", durationFilter)
        if (durationFilter.length <= 0) return undefined
        if (durationFilter.length == 1) return durationFilter[0].player_ID

        // Six Check
        let formatFilter = durationFilter.filter((element) => makeSmallText(element.format) == makeSmallText(anime.format))
        console.log("Six Check", formatFilter)
        if (formatFilter.length <= 0) return undefined
        if (formatFilter.length == 1) return formatFilter[0].player_ID

        return formatFilter[0].player_ID
    } catch (error) {
        console.error("Allmanga SheepFinderAnime2000 error", error)
        return animeList[0].player_ID
    }
}

async function formatEpisodeData(data: any): Promise<episodeMetadata[]> {
    try {
        if (!data) return []
        let finnallData: episodeMetadata[] = []
        for (let index = 0; index < data.length; index++) {
            const element = data[index];
            const thumbnail = element.thumbnails.filter(url => url.startsWith("https"))
            finnallData.push({
                ep: element.episodeIdNum,
                img: thumbnail.length > 0 ? thumbnail[0] : `https://wp.youtube-anime.com/aln.youtube-anime.com${element["thumbnails"][0]}?w=480`,
                title: element.notes ? element.notes.replace("<note-split>", " ") : undefined,
                uploadedUnix: dateToUnix(element["uploadDates"]["sub"]),
                durration: element["vidInforssub"] ? element["vidInforssub"]["vidDuration"] : undefined
            })
        }
        return finnallData
    } catch (error) {
        console.error("formatEpisodeData", error, data);
        return []
    }
}

export async function extractEpisodes(anime_id: string, episode: { start: number, end: number }): Promise<episodeMetadata[]> {
    try {
        let variables = `{"showId":"${anime_id}","episodeNumStart":${parseInt(episode.start.toString())},"episodeNumEnd":${parseInt(episode.end.toString())}}`
        const resp = await requestToApi(variables, HASH_DATA, header)
        if (!resp.success || !resp.json) return []
        if ("errors" in resp.json) return []
        if (!resp.json.data.episodeInfos) return []
        return await formatEpisodeData(resp.json.data.episodeInfos)
    } catch (Error) {
        console.error(Error)
        return []
    }
}

export async function extractInformation(id: string): Promise<{ episodes: { ep: string; img?: string; title?: string }[]; type: string; name?: string }[]> {
    let variables = `{"_id":"${id}"}`;
    const resp = await requestToApi(variables, HASH_INFO, header);
    if (!resp.success || !resp.json || resp.json["errors"]) {
        console.warn(resp)
        return []
    }
    let anime_data = resp.json["data"]["show"]
    let episodes = await extractEpisodes(id, { start: parseInt(anime_data.availableEpisodesDetail.sub.at(-1)), end: parseInt(anime_data.availableEpisodesDetail.sub[0]) })
    if (episodes.length <= 0) episodes = anime_data["availableEpisodesDetail"]["sub"].map((v: string) => ({ ep: v }))

    episodes = episodes.sort((a, b) => Number(a.ep) - Number(b.ep))

    return [
        {
            episodes: episodes.length !== anime_data.availableEpisodes.sub
                ? episodes.slice(0, anime_data.availableEpisodes.sub != 0 ? anime_data.availableEpisodes.sub - 1 : 0)
                : episodes,
            type: "sub"
        },
        {
            episodes: episodes.length !== anime_data.availableEpisodes.dub
                ? episodes.slice(0, anime_data.availableEpisodes.dub != 0 ? anime_data.availableEpisodes.dub - 1 : 0)
                : episodes,
            type: "dub"
        },
        {
            episodes: episodes.length !== anime_data.availableEpisodes.raw
                ? episodes.slice(0, anime_data.availableEpisodes.raw != 0 ? anime_data.availableEpisodes.raw - 1 : 0)
                : episodes,
            type: "raw"
        }
    ]
}

async function requestForUrl(url: string): Promise<playerData | undefined> {
    if (url.startsWith("https")) return undefined
    const links = await request(`http://allanime.day${url.replace("clock", "clock.json")}`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
        }
    })

    if (!links.success || !links.json) return undefined

    let listUrls: playerData | undefined

    links.json.links.forEach(element => {
        if (!element.src) return
        const urlObject = new URL(element.src);
        if (element.mp4) {
            listUrls = { resolution: [{ url: element.src, res: "1080", hls: false }], hostname: urlObject.hostname }
        } else {
            listUrls = { resolution: [{ url: element.src, res: "", hls: true }], hostname: urlObject.hostname }
        }
    });
    return listUrls
}

// async function fetchMP4(hostname: string, url: string): Promise<playerData | undefined> {
//     try {
//         let resoltutions: resolutionFormat[] = [] 
//         const extractedata = await runYT_DLP(url)
//         for (let index = 0; index < extractedata.formats.length; index++) {
//             const element = extractedata.formats[index];
//             if ("format_id" in element && element["format_id"].includes("dash-video")) resoltutions.push({
//                 res: `${element["height"]}`,
//                 url: element["url"],
//                 reqHeader: element["http_headers"],
//             })
//         }
//         return {
//             hostname: hostname,
//             resolution: resoltutions.reverse()
//         }
//     } catch (error) {
//         return undefined
//     }
// }

export default class Allmanga implements playerPluginFormat {
    metadata: playerPluginFormat["metadata"] = {
        version: "1.17",
        name: "Allmanga",
        author: "Owca525",
        icon: "https://allmanga.to/android-icon-192x192.png",
        supportLang: ["en"],
        urlWebsite: "https://allmanga.to",
    }
    config: { [key: string]: any; } = {
        "settings.extensions.website": API_WEB,
        "HASH_SEARCH": HASH_SEARCH,
        "HASH_INFO": HASH_INFO,
        "HASH_PLAYER": HASH_PLAYER,
        "HASH_DATA": HASH_DATA
    };

    async extractPlayerData(type: string, episode: episodeMetadata, id: string) {
        let tmpEpisode = typeof episode == "object" ? episode["ep"] : episode

        let variables = `{"showId":"${id}","translationType":"${type}","episodeString":"${tmpEpisode}"}`
        try {
            const resp = await requestToApi(variables, HASH_PLAYER, header)

            if (!resp.success || !resp.json) return []

            let jsonObject = await fuckThisEncryptionMethod(resp.json["data"]["tobeparsed"])

            const sources = jsonObject["episode"]["sourceUrls"]
            const urls: { url: string, decode: boolean, source: string }[] = sources
                .map((tmp: { sourceUrl: string; sourceName: string }) =>
                    findUrl(tmp.sourceUrl, tmp.sourceName)
                )
                .filter((item) => item !== undefined)

            const maxPriority = Math.max(...sources.map(i => i.priority));

            const updatedItems = sources.map(item => ({
                ...item,
                active: item.priority === maxPriority
            }));

            let data: playerData[] = []
            for (let i = 0; i < urls.length; i++) {
                const element = urls[i];
                if (element.decode) {
                    let tmp = await requestForUrl(element.url)
                    if (tmp) data.push({
                        ...tmp,
                        defaultHost: updatedItems.find((item) => item["sourceName"] == element.source ? item["active"] : false)
                    })
                }
                if (!element.decode) {
                    const urlObject = new URL(element.url);
                    data.push({
                        hostname: urlObject.hostname,
                        defaultHost: updatedItems.find((item) => item["sourceName"] == element.source ? item["active"] : false),
                        resolution: [{
                            res: "1080",
                            url: element.url,
                            reqHeader: header
                        }],
                        // extractResolution: async () => await fetchMP4(urlObject.hostname, element.url)
                    })
                }
            }
            if (jsonObject["episode"]["episodeInfo"][`vidInfors${type}`]) {
                const main = jsonObject["episode"]["episodeInfo"][`vidInfors${type}`]
                data.push({
                    hostname: "wp.youtube-anime.com", resolution: [{
                        res: main["vidResolution"].toString(),
                        url: `https://aln.youtube-anime.com${main["vidPath"]}`,
                        hls: false,
                        doNotUseBackend: true
                    }]
                })
            }

            return data
        } catch (error) {
            console.error(`Error in extractPlayerData`, error)
            return []
        }
    }
    async extractEpisodeList(animeData?: AnimeData, anime_id?: string) {
        try {
            let tmpAnimeID = anime_id

            if (animeData && !tmpAnimeID) {
                let data = await SearchAnimeInAllmanga(animeData.title.romaji, 1);
                tmpAnimeID = SheepFinderAnime2000(data, animeData)
            };

            if (!tmpAnimeID || tmpAnimeID == "") return

            let episodeList = await extractInformation(tmpAnimeID)
            return { player_id: tmpAnimeID, episodesData: episodeList as episodeList["episodesData"] }
        } catch (error) {
            console.error("Allmanga extractEpisodeList error", error)
            return
        }
    }
    async extractOnlyEpisodesList(type: string, anime_id: string): Promise<episodeMetadata[]> {
        let episodes = await extractInformation(anime_id)
        for (let index = 0; index < episodes.length; index++) {
            const element = episodes[index];
            if (element.type == type) return element.episodes
        }
        return []
    }
    async searchAnime(name: string, page: number, _params?: FilterPluginsParams) {
        let resp = await SearchAnimeInAllmanga(name.replaceAll('"', "").replaceAll('&', ""), page)
        return resp.map((card) => ({ AnimeData: card }))
    }
} 