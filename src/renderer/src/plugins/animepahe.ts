import { makeSmallText, request } from "@renderer/utils/functions";
import { AnimeData, cardData, episodeList, FilterPluginsParams, playerData, playerPluginFormat, resolutionFormat } from "@renderer/utils/types";

const WEBSITE = "https://animepahe.pw"

const header = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Referer': WEBSITE,
    'Cookie': "__ddgid_=rxaWYPF7aoOXKtn7; __ddg2_=IPvarMbSedUW2ZAe; __ddg1_=T4CBje2yYmFKRIzHOw7q; res=1080; aud=jpn; av1=0; ddg_last_challenge=1775827819966; latest=3; XSRF-TOKEN=eyJpdiI6IkJvT1g2VU0rdEk3ZmYxdkFZZ09qbUE9PSIsInZhbHVlIjoiRTk0eE9ZWnNCcEFIT1NDdXB1S3BPSWhGUHMvWHBSNmVFWjMrdTNQamJZeDBveEtUNTh0bmlRdWMzVUQ2aEJuelJuRkZ4WU13Q0daZ3lIbGkybk9WMkRvZUt6a2hBcnVYcGxTY2NWZWlzYzJ3VEFZNHkyVlBpcm42N3dGOFlIdmwiLCJtYWMiOiI4Y2EyYmIwOTk1MGI2ZmQ1MjA1NTkyMjM0YzY1NWRiZWFlOGNmOGU4MjZlNGMzYjQ1OTIxN2VlMjcyZjg3MjBkIiwidGFnIjoiIn0%3D; animepahe_session=eyJpdiI6InZOVkozRU9BS2dPeDBJbkdDM1gwU2c9PSIsInZhbHVlIjoiYWExOE5qTjZ5TXYrbW9sKzhQbnhOb20xYVNiTm9HQ0k0cmZ6cUg0amtBcVp3dVBtTzlNOVNEYytZL1BKcFE4d0dZaWpWMUxvU24zbmp0WUh6MjFhS1E4RFJ3QVEzY2NnQ1NjK3hHaEpIY0RTU2FSZlEyWmhRQ1AzK0ZBUE80WnAiLCJtYWMiOiI0ODEwZjY4N2Y4NjBlNTgxMjBjN2U4NWZhODE2NjJkNWI1ZmVjZmZiZWI5OTcxMTM0ZDQwZjAzZTE3YzJlNDI2IiwidGFnIjoiIn0%3D; __ddg8_=p2oEfIz1oBRPzKIq; __ddg10_=1776518926; __ddg9_=109.243.146.23"
}

const playerHeader = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Referer': "https://kwik.cx",
    "Origin": "https://kwik.cx"
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
        console.error("AniDap SheepFinderAnime2000 error", error)
        return animeList[0].player_ID
    }
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

const payload = `
globalThis.document = {
    querySelector: () => ""
}
class Plyr {
    constructor(element, options = {}) {}
}

class Hls {
    constructor(_config = {}) {}

    static isSupported() {
        return true
    }
    loadSource(url) {
        postMessage({ url: url })
    }
}
`

async function extractResolution(url: string) {
    const htmlResponse = await request(url, { headers: header })
    console.log(htmlResponse)
    if (!htmlResponse["success"]) return

    const scripts = Array.from(
        htmlResponse["text"].matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)
    )
        .map(m => m[1])
        .filter(code => code.includes("eval"));

    console.log(scripts)

    const blob = new Blob([payload + scripts], { type: "text/javascript" });
    const payloadURL = URL.createObjectURL(blob);

    return new Promise((resolve, reject) => {
        const worker = new Worker(payloadURL);
        worker.postMessage(htmlResponse.text)

        worker.onmessage = (event) => {
            if (event["data"]["url"]) {
                resolve({ url: event["data"]["url"], header: htmlResponse["responseHeader"] })
            } else {
                reject(undefined)
            }
            worker.terminate()
        }
    });
}

export default class AnimePahe implements playerPluginFormat {
    metadata: playerPluginFormat["metadata"] = {
        version: "1.0",
        name: "AnimePahe",
        author: "Owca525",
        supportLang: ["en"],
        urlWebsite: WEBSITE
    };
    cache: { [key: string]: string | number[] }[] = []

    extractPlayerData = async (_type: string, episode: string, id: string): Promise<playerData[]> => {
        if (this.cache[id] == undefined) await this.extractEpisodeList(undefined, id)
        if (this.cache[id] == undefined) return []

        const find = this.cache[id].find((v) => v["episode"].toString() == episode.toString())
        if (!find) return []
        const episodeID = find["session"]
        const htmlResponse = await request(`${WEBSITE}/play/${id}/${episodeID}`, { headers: header })
        if (!htmlResponse["success"]) return []

        console.log(htmlResponse)
        console.log(htmlResponse.text.match(/<[^>]*data-src=["'][^"']+["'][^>]*>/g))
        const tagRegex = /<[^>]*data-src=["'][^"']+["'][^>]*>/g;

        let match;
        let results: {
            src: string | null;
            fansub: string | null;
            resolution: string | null;
            audio: string | null;
        }[] = []

        while ((match = tagRegex.exec(htmlResponse.text)) !== null) {
            const tag = match[0];
            if (!tag.startsWith("<button")) continue

            const getAttr = (name: string): string | null => {
                const m = tag.match(new RegExp(`${name}=["']([^"']+)["']`));
                return m ? m[1] : null;
            };

            results.push({
                src: getAttr("data-src"),
                fansub: getAttr("data-fansub"),
                resolution: getAttr("data-resolution"),
                audio: getAttr("data-audio")
            });
        }

        results = results.filter((v) => v["audio"] == "jpn")
        let data: resolutionFormat[] = []
        for (let index = 0; index < results.length; index++) {
            const element = results[index];
            const urlResp = await extractResolution(element["src"]!)
            console.log(urlResp)
            if (!urlResp) continue
            data.push({
                res: element["resolution"]!,
                url: urlResp["url"] as string,
                reqHeader: {
                    ...urlResp["header"],
                    ...playerHeader
                }
            })
        }

        return [{
            hostname: "animepahe",
            resolution: data,
            splitHLS: true
        }]
    }
    extractEpisodeList = async (animeData?: AnimeData, anime_id?: string): Promise<episodeList | undefined> => {
        if (anime_id && this.cache[anime_id]) {
            return {
                player_id: anime_id,
                episodesData: [{
                    episodes: this.cache[anime_id].map((v) => ({
                        ep: v["episode"],
                        img: v["snapshot"],
                        title: v["title"]
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
        const episodeResponse = await request(`${WEBSITE}/api?m=release&id=${anime_id}&sort=episode_asc&page=1`, { headers: header })
        console.log(episodeResponse)

        if (!episodeResponse["success"] || !episodeResponse["json"]) return
        this.cache = {
            ...this.cache,
            [anime_id]: episodeResponse["json"]["data"]
        }

        return {
            player_id: anime_id,
            episodesData: [{
                episodes: episodeResponse["json"]["data"].map((v) => ({
                    ep: v["episode"],
                    img: v["snapshot"],
                    title: v["title"]
                })),
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
            const searchResponse = await request(`${WEBSITE}/api?m=search&q=${name}`, { headers: header })
            if (!searchResponse["success"] || !searchResponse["json"]) return []

            return searchResponse["json"]["data"].map((v) => convertToAnimeData(v))
        } catch (error) {
            console.log("Error in searchAnime/aowu", error)
            return []
        }
    }

}