// DISSABLE
import { request } from "@renderer/utils/functions";
import { AnimeData, cardData, episodeList, episodeMetadata, FilterPluginsParams, playerData, playerPluginFormat, serverStatusData } from "@renderer/utils/types";

const WEBSITE = ""
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

export default class template implements playerPluginFormat {
    metadata: playerPluginFormat["metadata"] = {
        version: "1.0",
        name: "template",
        author: "Owca525",
        supportLang: ["en"],
        urlWebsite: WEBSITE,
        type: "player"
    };
    extractPlayerData = async(type: string, episode: episodeMetadata, id: string): Promise<playerData[]> => {
        return []
    }
    extractEpisodeList = async (animeData?: AnimeData, anime_id?: string): Promise<episodeList | undefined> => {
        return
    }
    extractOnlyEpisodesList = async (type: string, anime_id: string): Promise<{ ep: string; img?: string; title?: string; }[]> => {
        return []
    }
    searchAnime = async (name: string, _page: number, _params?: FilterPluginsParams): Promise<cardData[]> => {
        return []
    }
    
    raportStatus = async (): Promise<{ search: serverStatusData; player: serverStatusData; episodes: serverStatusData; }> => {
        return undefined as any
    }
}