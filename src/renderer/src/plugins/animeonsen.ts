// DISSABLE
// MEDIA ISN't SUPPORTED: PipelineStatus::DEMUXER_ERROR_COULD_NOT_OPEN: FFmpegDemuxer: open context failed
import { request } from "@renderer/utils/functions";
import { AnimeData, cardData, episodeList, episodeMetadata, FilterPluginsParams, playerChapterList, playerData, playerPluginFormat } from "@renderer/utils/types";

const WEBSITE = "https://www.animeonsen.xyz"
const PLAYERTOKEN = "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImRlZmF1bHQifQ.eyJpc3MiOiJodHRwczovL2F1dGguYW5pbWVvbnNlbi54eXovIiwiYXVkIjoiaHR0cHM6Ly9hcGkuYW5pbWVvbnNlbi54eXoiLCJpYXQiOjE3NzcxMzU2NzMsImV4cCI6MTc3Nzc0MDQ3Mywic3ViIjoiMDZkMjJiOTYtNjNlNy00NmE5LTgwZmMtZGM0NDFkNDFjMDM4LmNsaWVudCIsImF6cCI6IjA2ZDIyYjk2LTYzZTctNDZhOS04MGZjLWRjNDQxZDQxYzAzOCIsImd0eSI6ImNsaWVudF9jcmVkZW50aWFscyJ9.f6sWuqa67lfZoBijbPyxSMEdm_J-W-lMFqGd-Ty5RQ9FbWQXt6N4cE6Y4EEbkBg6Sj0X0rNSoFUeAJLNINhV7FGMSuIV08vy87sHnSx8C9BNwFspRJXkQ5Frq8cXPDdEmxL14oBZg129akz4uatqdxo_MzXpCb_aWxUwZ9PTbIIO6JfUvYeERLzOo3EoBZWEXHP3ukYMMWInaFbIwSg6hprQQGjq8tsU97i4VXVr0SXW2Hj6Ngnjy1QqnoKabzK4QTI69oo0A0OReg6ZRjEmoLYZHJUUyDm2DKbzaujQrUeQp3kDnwNZDVCjNgRTZQgk63wUWEKNNm0rpMnCKH24IA"
const SEARCHTOKEN = "Bearer 0e36d0275d16b40d7cf153634df78bc229320d073f565db2aaf6d027e0c30b13"

const HEADER = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
    "accept-encoding": "gzip, deflate, br, zstd",
    "accept-language": "en-US,en;q=0.9",
    "cache-control": "no-cache",
    "pragma": "no-cache",
    "priority": "u=1, i",
    "referer": WEBSITE,
    "sec-ch-ua": `"Chromium";v="147", "Not.A/Brand";v="8"`,
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": `"Linux"`,
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
}


function converter(data: any): cardData {
    return {
        AnimeData: {
            title: {
                english: data["content_title_en"],
                native: data["content_title_jp"],
                romaji: data["content_title"]
            },
            coverImage: "",
            id: "",
            player_ID: data["content_id"]
        }
    }
}

export function detectTitle(titles: AnimeData["title"]): string {
    try {
        if (titles["english"]) return titles["english"]
        if (titles["romaji"]) return titles["romaji"]
        return Object.values(titles)[0]
    } catch (error) {
        console.error("detectTitleConfig Error", error)
        return Object.values(titles)[0]
    }
}

function isStringANumber(value: string) {
  if (typeof value === "string") return value.trim() !== ""
  return !Number.isNaN(Number(value));
}

export default class Aowu implements playerPluginFormat {
    metadata: playerPluginFormat["metadata"] = {
        version: "1.0",
        name: "AnimeOnsen",
        author: "Owca525",
        supportLang: ["en"],
        urlWebsite: WEBSITE
    };
    extractPlayerData = async (_type: string, episode: episodeMetadata, id: string): Promise<playerData[]> => {
        const response = await request(`${WEBSITE.replace("www.", "api.")}/v4/content/${id}/video/${episode}`, { headers: {
            ...HEADER,
            "Authorization": PLAYERTOKEN,
            "content-type": "application/json"
        } })
        if (!response["success"] || !response["json"]) {
            console.warn("Failed Request extractPlayerData/animeonsen", response)
            return []
        }

        let tmp = response["json"]["metadata"]["episode"][1]
        let opening: playerChapterList[] = []
        if (tmp && isStringANumber(tmp["skipIntro_s"]) && isStringANumber(tmp["skipIntro_e"])) {
            opening.push({
                start: parseInt(tmp["skipIntro_s"]),
                end: parseInt(tmp["skipIntro_e"]),
                type: "opening"
            })
        }

        return [{
            hostname: "AnimeOnsen",
            resolution: [{
                res: "1080",
                url: response["json"]["uri"]["stream"]
            }],
            listChapters: opening
        }]
    }
    extractEpisodeList = async (animeData?: AnimeData, anime_id?: string): Promise<episodeList | undefined> => {
        if (animeData && !anime_id) {
            const resp = await this.searchAnime(animeData["title"]["romaji"])
            if (resp.length <= 0) return

            const finded = resp.find((v) => detectTitle(animeData["title"]) == v["AnimeData"]["title"]["romaji"])
            if (!finded) anime_id = resp[0]["AnimeData"]["player_ID"]
            else anime_id = finded["AnimeData"]["player_ID"]
        }
        if (!anime_id) return

        const response = await request(`${WEBSITE.replace("www.", "api.")}/v4/content/${anime_id}/episodes`, { headers: {
            ...HEADER,
            "Authorization": PLAYERTOKEN,
            "content-type": "application/json"
        } })
        if (!response["success"] || !response["json"]) {
            console.warn("Failed Request extractEpisodeList/animeonsen", response)
            return
        }

        return {
            player_id: anime_id,
            episodesData: [
                {
                    episodes: Object.entries(response["json"]).map(([ep, content]) => ({
                        ep: ep,
                        title: content["contentTitle_episode_en"]
                    } as episodeMetadata)),
                    type: "sub"
                }
            ]
        }
    }
    extractOnlyEpisodesList = async (_type: string, anime_id: string): Promise<{ ep: string; img?: string; title?: string; }[]> => {
        const reponse = await this.extractEpisodeList(undefined, anime_id);
        if (!reponse) return []
        return reponse["episodesData"][0]["episodes"]
    }
    searchAnime = async (name: string, _page?: number, _params?: FilterPluginsParams): Promise<cardData[]> => {
        try {
            const response = await request(`${WEBSITE.replace("www.", "search.")}/indexes/content/search`, {
                method: "POST",
                headers: {
                    ...HEADER,
                    "Authorization": SEARCHTOKEN,
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    attributesToHighlight: ["*"],
                    highlightPostTag: "__/ais-highlight__",
                    highlightPreTag: "__ais-highlight__",
                    limit: 10,
                    q: name,
                })
            })
            console.log(response)
            if (!response["success"] || !response["json"]) return []

            return response["json"]["hits"].map((v) => converter(v))
        } catch (error) {
            console.log("Error in searchAnime/aowu", error)
            return []
        }
    }

}