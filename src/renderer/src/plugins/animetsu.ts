// DISSABLE
import { dateToUnix, request, SheepFinderAnime2000 } from "@renderer/utils/functions";
import { t } from "@renderer/utils/i18n";
import { AnimeData, cardData, episodeList, FilterPluginsParams, playerPluginFormat, playerData, playerSubtitlesFormat, resolutionFormat, playerChapterList, playerDataExtended, episodeMetadata, serverStatusData } from "@renderer/utils/types";

const BACKEND = "https://animetsu.live/v2"
const WEBSITE = "https://animetsu.live/"

const HEADER = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:151.0) Gecko/20100101 Firefox/151.0',
    "accept": "application/json, text/plain, */*",
    "accept-encoding": "gzip, deflate, br, zstd",
    "accept-language": "en-US,en;q=0.9",
    "Alt-Used": "animetsu.live",
    "Connection": "keep-alive",
    "Sec-GPC": "1",
    "TE": "trailers",
    "DNT": "1",
    "referer": WEBSITE,
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
}

const playerHeader = {
  "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br, zstd",
  Origin: WEBSITE,
  Referer: WEBSITE,
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "cross-site",
  "cache-control": "no-cache",
  "pragma": "no-cache",
  "priority": "u=1, i",
  "sec-ch-ua": `"Not/A)Brand";v="99", "Chromium";v="148"`,
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": `"Linux"`
};

function convertStringToDateObject(date: string | undefined) {
    try {
        if (!date) return undefined
        const data = new Date(date)
        return { month: data.getMonth(), day: data.getDay(), year: data.getFullYear() }
    } catch (error) {
        console.error("convertStringToDateObject/animetsu", error)
        return undefined
    }
}

async function extractResolutions(episode: string, type: string, playerData: playerData, server: string): Promise<playerData | undefined> {
    try {
        // oppai?server=${server}&id=${id}&num=${episode}&subType=${type}
        if (!server) return undefined
        let response = await request(`${window["animetsuBackend"]["api"]}/api/anime/oppai/${server}/${episode}?server=${playerData["hostname"]}&source_type=${type}`, { headers: HEADER });
        if (!response.success || !response.json || response.text == "{}") return undefined
        let subtitles: playerSubtitlesFormat[] = []
        if (response.json["subs"]) {
            subtitles = response.json["subs"].map((element) => {
                const parts = element["url"].split(".");
                const lastPart = parts.pop();
                return { url: element["url"], lang: "en", label: element["lang"], format: lastPart }
            })
        }

        let resolutions: resolutionFormat[] = response.json["sources"].map((element) => ({
            res: element["quality"],
            url: element["need_proxy"] ? `${window["animetsuBackend"]["proxy"]}${element["url"]}` : element["url"],
            defaultSubtitles: subtitles.length > 0,
            hls: true,
            reqHeader: playerHeader
        }))

        let chapters: playerChapterList[] = response.json["skips"] ? [
            { start: response.json["skips"]["intro"]["start"], end: response.json["skips"]["intro"]["end"], type: "opening" },
            { start: response.json["skips"]["outro"]["start"], end: response.json["skips"]["outro"]["end"], type: "ending" }
        ] : []

        return {
            ...playerData,
            splitHLS: resolutions[0].res != "master",
            resolution: resolutions,
            subtitles: subtitles,
            listChapters: chapters.filter(chapter => !(chapter.start === 0 && chapter.end === 0))
        }
    } catch (error) {
        console.error("extractResolutions/Animetsu", error)
        return undefined
    }
}

const payload = `
var window = { location: { origin: "${WEBSITE}", hostname: "" } };
globalThis.window = window;
var localStorage = {
    removeItem: (str) => {}
}
`

export default class Animetsu implements playerPluginFormat {
    metadata: playerPluginFormat["metadata"] = {
        version: "2.4",
        name: "Animetsu.Live",
        icon: `${WEBSITE}/android-chrome-192x192.png`,
        author: "Owca525",
        supportLang: ["en"],
        urlWebsite: WEBSITE,
        type: "player"
    };
    // config: { [key: string]: any; } = {
    //     Backend: BACKEND
    // };

    checkBackend = async () => {
        const response = await request(WEBSITE, {
            headers: HEADER
        })

        if (!response["success"]) return

        const script = response["text"].match(/<script\b[^>]*>([\s\S]*?)<\/script>/i);
        if (!script) return

        const blob = new Blob([payload + script[1] + "self.postMessage({ proxy: window.p })"], { type: "text/javascript" });
        const url = URL.createObjectURL(blob);
        const worker = new Worker(url);
        worker.onmessage = (event) => {
            if (event["data"]["proxy"]) (window as any).animetsuBackend = {
                ...event["data"],
                api: BACKEND
            }
            worker.terminate()
        }
        worker.onerror = (event) => {
            console.error("Failed Fetch Backend", event, script)
            worker.terminate()
        }
    }

    constructor() {
        (window as any).animetsuBackend = {
            proxy: 'https://mega-cloud.top/proxy',
            api: BACKEND
        }
        this.checkBackend()
    }

    extractPlayerData = async (_type: string, episode: episodeMetadata, id: string): Promise<playerData[]> => {
        try {
            let tmpEpisode = typeof episode == "object" ? episode["ep"] : episode
            let response = await request(`${window["animetsuBackend"]["api"]}/api/anime/servers/${id}/${tmpEpisode}`, { headers: HEADER });

            /* IFDEF DEBUG */
            console.warn("animetsu/extractPlayerData", response)
            /* ENDIF */

            if (!response.success || !response.json) {
                console.warn("extractPlayerData/Animetsu request failed", response)
                return []
            }
            let data: playerData[] = []
            for (let index = 0; index < response.json.length; index++) {
                const element = response.json[index];
                data.push({
                    hostname: element["id"],
                    defaultHost: element["default"],
                    resolution: [],
                    extractResolution: async (playerData: playerDataExtended) => await extractResolutions(playerData.episode.currentEpisode, "sub", playerData, id),
                    isDubbing: async (playerData: playerDataExtended) => (await extractResolutions(playerData.episode.currentEpisode, "dub", playerData, id))?.resolution
                })
            }

            return data
        } catch (error) {
            console.error("exctractPlayerData/Animetsu", error)
            return []
        }
    }
    extractEpisodeList = async (animeData?: AnimeData, anime_id?: string): Promise<episodeList | undefined> => {
        try {
            let animeID = anime_id
            if (animeData && !anime_id) {
                const results = await this.searchAnime(animeData.title.romaji, 0)
                animeID = SheepFinderAnime2000(results.map((v) => v.AnimeData), animeData)
            }
            if (!animeID) return

            let response = await request(`${window["animetsuBackend"]["api"]}/api/anime/eps/${animeID}`, { headers: HEADER });

            /* IFDEF DEBUG */
            console.warn("animetsu/extractEpisodeList", response)
            /* ENDIF */

            if (!response.success || !response.json) {
                console.warn("extractEpisodeList/Animetsu request failed", response)
                return
            }

            let episodes = response.json.map((element) => ({
                ep: element["ep_num"],
                // img: `${window["animetsuBackend"]["proxy"]}${element["img"]}`,
                title: element["name"],
                uploadedUnix: dateToUnix(element["aired_at"])
            }))

            return {
                player_id: animeID,
                episodesData: [{
                    episodes: episodes,
                    type: "sub",
                    name: window["animuAppInfo"] ? "information.types.sub" : `${t("information.types.sub")}/${t("information.types.dub")}`
                }],
            }
        } catch (error) {
            console.error("extractEpisodeList/Animetsu", error)
            return undefined
        }
    }
    extractOnlyEpisodesList = async (_type: string, anime_id: string): Promise<{ ep: string; img?: string; title?: string; }[]> => {
        let data = await this.extractEpisodeList(undefined, anime_id)
        if (!data) return []
        return data.episodesData[0].episodes
    }
    searchAnime = async (name: string, _page: number, _params?: FilterPluginsParams): Promise<cardData[]> => {
        let response = await request(`${window["animetsuBackend"]["api"]}/api/anime/search/?query=${decodeURI(name)}`, { headers: HEADER });

        /* IFDEF DEBUG */
        console.warn("animetsu/searchAnime", response)
        /* ENDIF */

        if (!response.success || !response.json) return []

        let data: cardData[] = []
        for (let index = 0; index < response.json.results.length; index++) {
            const element = response.json.results[index];
            data.push({
                AnimeData: {
                    genres: element["genres"],
                    isAdult: element["is_adult"],
                    seasonYear: element["year"],
                    type: element["type"],
                    season: element["season"],
                    status: element["status"],
                    title: element["title"],
                    id: element["anilist_id"],
                    duration: element["duration"],
                    episodes: element["total_eps"],
                    player_ID: element["id"],
                    description: element["description"],
                    bannerImage: element["banner"],
                    averageScore: element["average_score"],
                    startDate: convertStringToDateObject(element["start_date"]),
                    endDate: convertStringToDateObject(element["end_date"]),
                    coverImage: element["cover_image"]["extraLarge"] ? element["cover_image"]["extraLarge"] : element["cover_image"]["large"]
                }
            })
        }
        return data
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
            async () => this.extractPlayerData("sub", { ep: "1" }, "6989bcf829cf95f4eb03eb2e"),
            async () => this.extractOnlyEpisodesList("sub", "6989bcf829cf95f4eb03eb2e"),
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