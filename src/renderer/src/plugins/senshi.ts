import { request, SheepFinderAnime2000 } from "@renderer/utils/functions";
import { AnimeData, cardData, episodeList, episodeMetadata, FilterPluginsParams, playerChapterList, playerData, playerPluginFormat, playerSubtitlesFormat, serverStatusData } from "@renderer/utils/types";

const WEBSITE = "https://senshi.live"

const header = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Referer': WEBSITE,
    "Origin": WEBSITE,
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "Content-Type": "application/json",
    "Sec-GPC": "1",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "DNT": "1",
    "Priority": "u=4",
}

export function dateToUnix(dateStr: string | undefined): number | undefined {
    if (!dateStr) return undefined
    const date = new Date(dateStr);
    return Math.floor(date.getTime() / 1000);
}

function converterToCardData(data: { [key: string]: string | number }): cardData {
    return {
        AnimeData: {
            title: {
                english: data["title_english"] as string,
                native: data["title"] as string,
                romaji: data["title"] as string
            },
            id: "",
            player_ID: `${data["id"]}`,
            format: data["type"].toString().toUpperCase(),
            source: data["ani_source"].toString().toUpperCase(),
            episodes: parseInt(data["ani_episodes"].toString()),
            seasonYear: data["ani_year"] as number,
            season: data["ani_season"].toString().toUpperCase(),
            type: "ANIME",
            trailer: {
                id: data["trailer"].toString().replaceAll("https://www.youtube.com/watch?v=", ""),
                site: "youtube"
            },
            coverImage: `${WEBSITE}${data["anime_picture"]}`
        }
    }
}

export default class Senshi implements playerPluginFormat {
    metadata: playerPluginFormat["metadata"] = {
        version: "1.3",
        name: "Senshi",
        author: "Owca525",
        supportLang: ["en"],
        urlWebsite: WEBSITE,
        icon: "https://senshi.live/assets/Senshi_Logo_3-Dm8yKkWF.png",
        type: "player"
    };
    cache: { [key: string]: number | string }[] = []

    ExtractUrl = async (server: { url: string, sever2: string, serverFM: string, download: string, status: string, masked_base_url: string }): Promise<playerData | undefined> => {
        try {
            if (!server["url"].includes("ninstream")) {
                console.warn("Unsuported Url Default Thinking")
                return {
                    hostname: `Senshi ${server["status"] == "Dub" ? "(Dubbing)" : ""}`,
                    resolution: [{
                        res: "1080",
                        url: server["url"],
                        reqHeader: header,
                        hls: server["url"].includes(".m3u8")
                    }],
                }
            }

            const response = await request(server["url"].replace("playlist.m3u8", "sub_artplayer.json"), { headers: header })
            if (!response["success"] || !response["json"]) return {
                hostname: `Senshi ${server["status"] == "Dub" ? "(Dubbing)" : ""}`,
                resolution: [{
                    res: "1080",
                    url: server["url"],
                    reqHeader: header,
                    hls: server["url"].includes(".m3u8")
                }]
            }


            return {
                hostname: `Senshi ${server["status"] == "Dub" ? "(Dubbing)" : ""}`,
                resolution: [{
                    res: "1080",
                    url: server["url"],
                    reqHeader: header,
                    hls: server["url"].includes(".m3u8"),
                    defaultSubtitles: true,
                }],
                subtitles: response["json"].map((sub) => ({ url: server["url"].replace("playlist.m3u8", sub["url"]), lang: sub["url"].match(/^sub_(\d+)_([a-z]{2,3})\.ass$/)[2], label: sub["html"], format: "ass" })) as playerSubtitlesFormat[]
            }

        } catch (error) {
            console.error("Senshi/ExtractURL", error)
            return
        }
    }

    extractPlayerData = async (_type: string, episode: episodeMetadata, id: string): Promise<playerData[]> => {
        let mainEpisode: string = typeof episode == "object" ? episode.ep : episode

        const urlsResp = await request(`${WEBSITE}/episode-embeds/${id}/${mainEpisode}`, { headers: header })
        if (!urlsResp["success"] || !urlsResp["json"]) return []

        const cached = this.cache[id]
        let tmp: playerChapterList[] = []
        if (cached) {
            const asd = cached.find((v) => v["ep_id"].toString() == mainEpisode)
            if (asd) tmp = [
                {
                    start: asd["intro_start"] ? asd["intro_start"] : 0,
                    end: asd["intro_end"] ? asd["intro_end"] : 0,
                    type: "opening"
                },
                {
                    start: asd["outro_start"] ? asd["outro_start"] : 0,
                    end: asd["outro_end"] ? asd["outro_end"] : 0,
                    type: "ending"
                }
            ]
        }

        let player: playerData[] = []

        for (let index = 0; index < urlsResp["json"].length; index++) {
            const element = urlsResp["json"][index];
            const resp = await this.ExtractUrl(element)
            if (!resp) continue
            player.push({
                ...resp,
                listChapters: tmp
            })
        }

        return player.sort((a, b) => {
            const aHasDubbing = a["hostname"].includes("Dubbing");
            const bHasDubbing = b["hostname"].includes("Dubbing");

            if (aHasDubbing && !bHasDubbing) return 1;
            if (!aHasDubbing && bHasDubbing) return -1;

            return 0;
        })
    }
    extractEpisodeList = async (animeData?: AnimeData, anime_id?: string): Promise<episodeList | undefined> => {
        if (animeData && !anime_id) {
            const search = await this.searchAnime(animeData["title"]["romaji"])
            if (search.length <= 0) return

            anime_id = SheepFinderAnime2000(search.map(v => v["AnimeData"]), animeData)
        }
        if (!anime_id) return
        const episodeResp = await request(`${WEBSITE}/episodes/${anime_id}`, { headers: header })
        /* IFDEF DEBUG */
        console.warn("extractEpisodeList/Senshi", episodeResp)
        /* ENDIF */
        if (!episodeResp["success"] || !episodeResp["json"]) return
        this.cache = [
            ...this.cache,
            { [anime_id]: episodeResp["json"] as any }
        ]

        return {
            player_id: anime_id,
            episodesData: [{
                episodes: episodeResp["json"].map((v) => ({
                    ep: v["ep_id"],
                    title: v["ep_title"],
                    uploadedUnix: dateToUnix(v["created_at"])
                })),
                type: window["animuAppInfo"] ? "both" : "sub"
            }]
        }
    }
    extractOnlyEpisodesList = async (_type: string, anime_id: string): Promise<{ ep: string; img?: string; title?: string; }[]> => {
        const tmp = await this.extractEpisodeList(undefined, anime_id)
        if (!tmp) return []
        return tmp["episodesData"][0]["episodes"]
    }
    searchAnime = async (name: string, _page?: number, _params?: FilterPluginsParams): Promise<cardData[]> => {
        try {
            const searchResponse = await request(`${WEBSITE}/anime/filter`, {
                method: "POST",
                headers: header,
                body: JSON.stringify({
                    limit: 10,
                    page: 1,
                    searchTerm: name,
                })
            })
            /* IFDEF DEBUG */
            console.warn("searchAnime/Senshi", searchResponse)
            /* ENDIF */
            if (!searchResponse["success"] || !searchResponse["json"]) return []

            return searchResponse["json"]["data"].map((v) => converterToCardData(v))
        } catch (error) {
            console.error("Error in searchAnime/aowu", error)
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
            async () => this.extractPlayerData("sub", "1" as any, "61316"),
            async () => this.extractOnlyEpisodesList("sub", "52034"),
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