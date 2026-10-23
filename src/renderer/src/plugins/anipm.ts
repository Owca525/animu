// DISSABLE
import { request, SheepFinderAnime2000 } from "@renderer/utils/functions";
import { AnimeData, cardData, episodeList, episodeMetadata, FilterPluginsParams, playerData, playerPluginFormat, playerSubtitlesFormat, serverStatusData } from "@renderer/utils/types";

const WEBSITE = "https://ani.pm"
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

const Extractorheader = {
    "User-Agent": navigator.userAgent,
    "Accept": "application/json",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Sec-GPC": "1",
    "Connection": "keep-alive",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "DNT": "1",
    "Priority": "u=4",
    "Pragma": "no-cache",
    "Cache-Control": "no-cache",
    "TE": "trailers"
}

function ConvertToAnimeData(data: any): AnimeData | undefined {
    try {
        return {
            title: {
                english: data["title"],
                native: data["native"],
                romaji: data["title"]
            },
            id: data["anilistId"],
            season: data["season"] ? `${data["season"]}`.toUpperCase() : undefined,
            seasonYear: data["year"],
            duration: data["duration"],
            player_ID: `${data["source"]}/${data["routeId"]}`,
            coverImage: data["poster"] ? `${WEBSITE}${data["poster"]}` : undefined,
            bannerImage: data["banner"] ? `${WEBSITE}${data["banner"]}` : undefined,
            status: data["status"] ? `${data["status"]}`.toUpperCase() : undefined,
        }
    } catch (error) {
        console.error("Anipm/ConvertToAnimeData Failed Convert", error)
        return
    }
}

async function Extractor(embed: string): Promise<playerData | undefined> {
    const url = new URL(embed)

    if (url["host"] == "embed.settlar.io") {
        const embed_response = await request(`${url["origin"]}/api/embed/session${url["search"]}`, {
            cache: 'no-store',
            headers: Extractorheader,
        })
        /* IFDEF DEBUG */
        console.warn("Anipm/Extractor", embed_response)
        /* ENDIF */

        if (!embed_response["json"] || !embed_response["success"]) return

        return {
            hostname: "Anipm",
            resolution: [{
                res: "1080",
                url: embed_response["json"]["source"],
                reqHeader: Extractorheader
            }],
            subtitles: embed_response["json"]["subtitles"].map((v) => ({
                url: v["url"],
                lang: v["srclang"],
                label: v["label"],
                format: "vtt",
                default: v["default"],
            } as playerSubtitlesFormat))
        }
    }

    console.error("Anipm/Extractor Unsuported URL", embed)

    return
}

export default class Anipm implements playerPluginFormat {
    metadata: playerPluginFormat["metadata"] = {
        version: "1.0",
        name: "Anipm",
        author: "Owca525",
        supportLang: ["en"],
        urlWebsite: WEBSITE,
        type: "player"
    };

    extractPlayerData = async (type: string, episode: episodeMetadata, id: string): Promise<playerData[]> => {
        const splitID = id.split("/")

        const session_response = await request(`${WEBSITE}/api/anime/playback-bootstrap/${splitID[0]}/${splitID[1]}?ep=${episode.ep}&lang=${type}&core=0`, { headers: PluginHeader })
        /* IFDEF DEBUG */
        console.warn("Anipm/extractPlayerData session_response", session_response)
        /* ENDIF */
        if (!session_response["json"] || !session_response["success"]) return []

        const preview_response = await request(`${WEBSITE}/api/anime/settlar/preview-session?selection=${session_response["json"]["settlarSelection"]}&provider=anipm&ep=${episode.ep}&channel=${type}&telemetry=0`, { headers: PluginHeader })
        /* IFDEF DEBUG */
        console.warn("Anipm/extractPlayerData preview_response", preview_response)
        /* ENDIF */
        if (!preview_response["json"] || !preview_response["success"]) return []

        const extractor = await Extractor(preview_response["json"]["embedUrl"])
        /* IFDEF DEBUG */
        console.warn("Anipm/extractPlayerData extractor", extractor)
        /* ENDIF */
        if (!extractor) return []

        return [extractor]
    }

    extractEpisodeList = async (animeData?: AnimeData, anime_id?: string): Promise<episodeList | undefined> => {
        if (animeData && !anime_id) {
            const search = await this.searchAnime(animeData["title"]["romaji"])

            anime_id = SheepFinderAnime2000(search.map((v) => v["AnimeData"]), animeData)
        }

        if (!anime_id) return

        const routeID = anime_id.split("/")[1]

        /* IFDEF DEBUG */
        console.warn("Anipm/extractEpisodeList routeID", anime_id, animeData)
        /* ENDIF */

        if (!routeID) return

        const episodes_response = await request(`${WEBSITE}/api/anime/series/${routeID}?routes=e4`, { headers: PluginHeader })

        /* IFDEF DEBUG */
        console.warn("Anipm/extractEpisodeList episodes_response", episodes_response)
        /* ENDIF */

        if (!episodes_response["json"] || !episodes_response["success"]) return

        let episode_list_sub: episodeMetadata[] = []
        let episode_list_dub: episodeMetadata[] = []

        for (let index = 0; index < episodes_response["json"]["episodes"].length; index++) {
            const element = episodes_response["json"]["episodes"][index];

            const episode: episodeMetadata = {
                ep: `${element["number"]}`,
                img: element["thumbnail"] ? `${WEBSITE}${element["thumbnail"]}` : undefined,
                title: element["title"]
            }

            if (element["sub"]) episode_list_sub.push(episode)
            if (element["dub"]) episode_list_dub.push(episode)
        }

        /* IFDEF DEBUG */
        console.warn("Anipm/extractEpisodeList episodes", episode_list_sub, episode_list_dub)
        /* ENDIF */

        return {
            player_id: anime_id,
            episodesData: [
                {
                    episodes: episode_list_sub,
                    type: "sub"
                },
                {
                    episodes: episode_list_dub,
                    type: "dub"
                }
            ]
        }
    }

    extractOnlyEpisodesList = async (type: string, anime_id: string): Promise<{ ep: string; img?: string; title?: string; }[]> => {
        const extractorResponse = await this.extractEpisodeList(undefined, anime_id)
        if (!extractorResponse) return []

        const finded = extractorResponse["episodesData"].find((v) => v["type"] == type)
        if (!finded) return []

        return finded["episodes"]
    }

    searchAnime = async (name: string, _page: number = 1, _params?: FilterPluginsParams): Promise<cardData[]> => {
        const search_response = await request(`${WEBSITE}/api/anime/search?q=${encodeURIComponent(name)}`, { headers: PluginHeader })
        /* IFDEF DEBUG */
        console.warn("Anipm/extractPlayerMetadata", search_response)
        /* ENDIF */

        if (!search_response["json"] || !search_response["json"]["items"] || !search_response["success"]) return []

        return search_response["json"]["items"].map((v) => ({ AnimeData: ConvertToAnimeData(v) })).filter((v) => v != undefined)
    }

    raportStatus = async (): Promise<{ search: serverStatusData; player: serverStatusData; episodes: serverStatusData; }> => {
        return undefined as any
    }
}