// DISSABLE
import { request } from "@renderer/utils/functions";
import { AnimeData, cardData, episodeList, episodeMetadata, FilterPluginsParams, playerData, playerPluginFormat } from "@renderer/utils/types";

const WEBSITE = "https://www.aowu.tv/"
const SearchPath = "/search/-------------.html?wd="

export function decryptAES(ciphertext: string, key: string): string | undefined {
    try {
        // const raw = CryptoJS.enc.Base64.parse(ciphertext);
        // const iv = CryptoJS.lib.WordArray.create(raw.words.slice(0, 4), 16);
        // const encrypted = CryptoJS.lib.WordArray.create(
        //     raw.words.slice(4),
        //     raw.sigBytes - 16
        // );
        // const decrypted = CryptoJS.AES.decrypt(
        //     { ciphertext: encrypted } as any,
        //     CryptoJS.enc.Utf8.parse(key),
        //     {
        //         iv,
        //         mode: CryptoJS.mode.CBC,
        //         padding: CryptoJS.pad.Pkcs7
        //     }
        // );
        // const text = decrypted.toString(CryptoJS.enc.Utf8);
        // return text || undefined;
    } catch (error) {
        console.error("Error in decryptAES", error)
        return undefined;
    }
}

export default class Aowu implements playerPluginFormat {
    metadata: playerPluginFormat["metadata"] = {
        version: "1.0",
        name: "Aowu",
        author: "Owca525",
        supportLang: ["cn"],
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
        try {
            const response = await request(`${WEBSITE}${SearchPath}${encodeURIComponent(name)}`)
            if (!response.success) return []

            return []
        } catch (error) {
            console.error("Error in searchAnime/aowu", error)
            return []
        }
    }
    
}