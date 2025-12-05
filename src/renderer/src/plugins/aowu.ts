import { request } from "@renderer/utils/functions";
import { AnimeData, cardData, episodeList, genresSearchFormat, playerData, playerPluginFormat } from "@renderer/utils/types";
import * as cheerio from 'cheerio';

const WEBSITE = "https://www.aowu.tv/"
const SearchPath = "/search/-------------.html?wd="

const cardRegexSearch = /<div[^>]*class=["'][^"']*(?:vod-detail)(?=[^"']*)(?:style-detail)(?=[^"']*)(?:cor4)(?=[^"']*)(?:search-list)[^"']*["'][^>]*>/g;

export default class Aowu implements playerPluginFormat {
    metadata: playerPluginFormat["metadata"] = {
        version: "1.0",
        name: "Aowu",
        author: "Owca525",
        supportLang: ["cn"],
        urlWebsite: WEBSITE
    };
    extractPlayerData = async(type: string, episode: string, id: string): Promise<playerData[]> => {
        return []
    }
    extractEpisodeList = async (animeData?: AnimeData, anime_id?: string): Promise<episodeList | undefined> => {
        return
    }
    extractOnlyEpisodesList = async (type: string, anime_id: string): Promise<{ ep: string; img?: string; title?: string; }[]> => {
        return []
    }
    searchAnime = async (name: string, _page: number, _params?: genresSearchFormat): Promise<cardData[]> => {
        try {
            const response = await request(`${WEBSITE}${SearchPath}${encodeURIComponent(name)}`)
            if (!response.success) return []
            const $ = cheerio.load(response.text);
            console.log(response)
            const cards = $('div.vod-detail.style-detail.cor4.search-list')
            const anime = cards.map((_i, card) => {
                const playButtons = $(card).find('a.button[target="_blank"]')[0].attribs["href"]
                console.log(playButtons)
            })

            return []
        } catch (error) {
            console.log("Error in searchAnime/aowu", error)
            return []
        }
    }
    
}