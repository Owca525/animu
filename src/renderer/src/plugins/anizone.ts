import { convertChaptersVTT, convertText, request } from "@renderer/utils/functions";
import { AnimeData, cardData, episodeList, genresSearchFormat, playerPluginFormat, playerChapterList } from "@renderer/utils/types";

const WEB = "https://anizone.to"
const CARDS_REGEX = /<div[^>]*class=["']grid grid-cols-1 2xl:grid-cols-2 gap-4["'][^>]*>(.*?)<\/div>/gs
const HEADER = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
}

async function searchAnime(name: string): Promise<cardData[]> {
    try {
        let url = `${WEB}/anime?search=${convertText(name)}`
        const req = await request(url, { headers: HEADER });
        if (!req.success) return []
        let tmp = [...req.text.matchAll(CARDS_REGEX)]
        if (tmp.length <= 0) return []
        let finnallData: cardData[] = []
        for (let index = 0; index < tmp.length; index++) {
            const element = tmp[index];
            let animeID = [...element[0].matchAll(/wire:key=["']([^"']+)["']/g)]
            let animeIMG = [...element[0].matchAll(/src=["'](https:\/\/anizone\.to\/images\/anime\/[^"']+)["']/g)]
            let animeTITLE = [...element[0].matchAll(/alt=["']([^"']+)["']/g)]
            finnallData.push({ AnimeData: {
                characters: [],
                studios: [],
                coverImage: animeIMG[0][1],
                title: {
                    english: undefined,
                    native: decodeURI(animeTITLE[0][1]),
                    romaji: decodeURI(animeTITLE[0][1]),
                },
                id: "",
                player_ID: animeID[0][1].slice(2),
                genres: undefined
            } })
        }

        return finnallData
    } catch (error) {
        console.error(error)
        return []
    }
}

export default class Anizone implements playerPluginFormat {
    metadata: playerPluginFormat["metadata"] = {
        version: "1.1",
        name: "AniZone",
        author: "Owca525",
        supportLang: ["en", "pl", "de"],
        urlWebsite: WEB
    };
    extractPlayerData = async (_type: string, episode: string, id: string) => {
        let url = `${WEB}/anime/${id}/${episode}`

        const req = await request(url, { headers: HEADER });
        if (!req.success) return []

        let data = req.text as string
        let storyboard = [...data.matchAll(/https:\/\/seiryuu\.vid-cdn\.xyz\/[a-z0-9-]+\/storyboard\.vtt/gi)]
        let chapters = [...data.matchAll(/https:\/\/seiryuu\.vid-cdn\.xyz\/[a-z0-9-]+\/chapters\.vtt/gi)]
        let urls = [...data.matchAll(/https:\/\/seiryuu\.vid-cdn\.xyz\/[a-z0-9-]+\/master\.m3u8/gi)]
        if (urls.length <= 0) return []

        let otherFiles = [...data.matchAll(/<track[^>]*\s+src=["']?(?<src>[^"'\s>]+)["']?[^>]*\s+data-type=["']?(?<dataType>[^"'\s>]+)["']?[^>]*\s+kind=["']?(?<kind>[^"'\s>]+)["']?[^>]*\s+label=["']?(?<label>[^"']+)["']?[^>]*\s+srclang=["']?(?<srclang>[^"'\s>]+)["']?[^>]*>/gi)]
        if (otherFiles.length <= 0) return []

        let subList: { url: string, lang: string, label: string, format: string }[] = []
        for (let index = 0; index < otherFiles.length; index++) {
            const element = otherFiles[index];
            if (element[3] == "subtitles") {
                subList.push({
                    url: element[1],
                    lang: element[5],
                    label: element[4],
                    format: element[2]
                })
            }
        }

        let chapterList: playerChapterList[] = []
        if (chapters.length > 0) {
            let data = await convertChaptersVTT(chapters[0][0])
            for (let index = 0; index < data.length; index++) {
                const element = data[index];
                if (element.name == "Intro") {
                    chapterList.push({ ...element, type: "opening" })
                    continue
                }
                if (element.name == "Credits") {
                    chapterList.push({ ...element, type: "ending" })
                    continue
                }
                if (element.name == "Ending") {
                    chapterList.push({ ...element, type: "ending" })
                    continue
                }
                if (element.name == "Opening") {
                    chapterList.push({ ...element, type: "opening" })
                    continue
                }
                chapterList.push(element)
            }
        }

        return [{
            hostname: "Anizone.to",
            subtitles: subList,
            listChapters: chapterList,
            external: chapters.length > 0 ? { chaptersUrl: chapters[0][0] } : undefined,
            storyboardVTT: storyboard.length > 0 ? storyboard[0][0] : undefined,
            resolution: [{ res: "", url: urls[0][0], defaultSubtitles: true, hls: true }]
        }]
    }
    extractEpisodeList = async (animeData?: AnimeData, anime_id?: string): Promise<episodeList | undefined> => {
        try {
            let idAnime = anime_id
            if (!idAnime && animeData) {
                let data = await searchAnime(animeData.title.romaji)
                if (data.length <= 0) return
                idAnime = data[0].AnimeData.player_ID
            }
            if (!idAnime) return

            let url = `${WEB}/anime/${idAnime}`
            const req = await request(url, { headers: HEADER });
            if (!req.success) return undefined
            let data = req.text as string
            let tmpData = [...data.matchAll(/<ul.*?>(.*?)<\/ul>/gs)]
            let urls = [...tmpData[0][0].matchAll(/href=["'](https:\/\/anizone\.to\/anime\/[^\s"']+)["']/g)]
            let dataList = [...data.matchAll(/<div[^>]*class="(?=[^"]*text-slate-100)(?=[^"]*text-xs)(?=[^"]*lg:text-base)(?=[^"]*flex)(?=[^"]*flex-wrap)(?=[^"]*justify-center)(?=[^"]*gap-2)(?=[^"]*sm:gap-6)[^"]*"[^>]*>[\s\S]*?<\/div>/g)]
            let informationList = [...dataList[0][0].matchAll(/<[^>]*class="[^"]*\binline-block\b[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/g)]
            let ep: number | undefined = undefined
            for (let index = 0; index < informationList.length; index++) {
                const element = informationList[index];
                if (element[1].includes("Episodes")) ep = parseInt(element[1].split(" ")[0])
            }

            let lengthEpisodes = urls.filter((value) => !value[0].substring(value[0].lastIndexOf("/")).includes("s")).length

            if (!ep) return undefined

            let episodeList: { ep: string }[] = []
            let tmp = ep
            if (lengthEpisodes < ep && lengthEpisodes != 36) tmp = lengthEpisodes
            for (let index = 1; index < (tmp + 1); index++) {
                episodeList.push({ ep: index.toString() })
            }

            return { player_id: idAnime, episodesData: [{ episodes: episodeList, type: "sub", name: "Subtitles" }] }
        } catch (error) {
            console.error("Error in extractEpisodeList/Anizone", error)
            return
        }
    }
    extractOnlyEpisodesList = async (_type: string, anime_id: string): Promise<{ ep: string; img?: string; title?: string; }[]> => {
        let data = await this.extractEpisodeList(undefined, anime_id)
        if (!data) return []
        return data.episodesData[0].episodes
    }
    searchAnime = async (name: string, _page: number, _params?: genresSearchFormat): Promise<cardData[]> => {
        return await searchAnime(name)
    }
}