import { convertChaptersVTT } from "@renderer/utils/functions";
import { AnimeData, cardData, episodeList, playerChapterList, playerData, playerPluginFormat } from "@renderer/utils/GlobalInterface";

const WEB = "https://anizone.to"
const CARDS_REGEX = /<div[^>]*class=["']grid grid-cols-1 2xl:grid-cols-2 gap-4["'][^>]*>(.*?)<\/div>/gs
const HEADER = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
}

function convertText(text: string) {
    let uri = encodeURI(text.replaceAll("[", "").replaceAll("]", ""))
    return uri.replaceAll("+", "%2B")
        .replaceAll("%20", "+")
}

async function getURLFromPlayer(_type: string, episode: string, id: string): Promise<playerData[]> {
    let url = `${WEB}/anime/${id}/${episode}`

    const req = await window.api.request.get(url, HEADER, "text");
    if (!req.success) return []

    let data = req.data as string
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

    let chapterList: playerChapterList = []
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
            chapterList.push(element)
        }
    }

    return [{
        hostname: "Anizone.to",
        hls: true,
        subtitles: subList,
        listChapters: chapterList,
        chaptersUrl: chapters.length > 0 ? chapters[0][0] : undefined,
        storyboardVTT: storyboard.length > 0 ? storyboard[0][0] : undefined,
        resolution: [{ res: "", url: urls[0][0], defaultSubtitles: true }]
    }]
}

async function getAnimeID(text: string): Promise<string | undefined> {
    try {
        let url = `${WEB}/anime?search=${convertText(text)}`
        const req = await window.api.request.get(url, HEADER, "text");
        if (!req.success) return
        let tmp = [...req.data.matchAll(CARDS_REGEX)]
        if (tmp.length <= 0) return
        let data: string = tmp[0][0]

        let animeID = [...data.matchAll(/wire:key=["']([^"']+)["']/g)]
        // let animeIMG = [...data.matchAll(/src=["'](https:\/\/anizone\.to\/images\/anime\/[^"']+)["']/g)]
        // let animeTITLE = [...data.matchAll(/alt=["']([^"']+)["']/g)]
        return animeID[0][1].slice(2)
    } catch (error) {
        console.log(error)
        return undefined
    }
}

async function getEpisodeList(animeData?: AnimeData, anime_id?: string): Promise<episodeList | undefined> {
    console.log(animeData, anime_id)
    let idAnime = anime_id
    if (!idAnime && animeData) {
        idAnime = await getAnimeID(animeData.title.english ? animeData.title.english : animeData.title.romaji)
    }
    if (!idAnime) return

    let url = `${WEB}/anime/${idAnime}`
    const req = await window.api.request.get(url, HEADER, "text");
    if (!req.success) return undefined
    let data = req.data as string
    let tmpData = [...data.matchAll(/<ul.*?>(.*?)<\/ul>/gs)]
    let urls = [...tmpData[0][0].matchAll(/href=["'](https:\/\/anizone\.to\/anime\/[^\s"']+)["']/g)]
    let dataList = [...data.matchAll(/<div[^>]*class="(?=[^"]*text-slate-100)(?=[^"]*text-xs)(?=[^"]*lg:text-base)(?=[^"]*flex)(?=[^"]*flex-wrap)(?=[^"]*justify-center)(?=[^"]*gap-2)(?=[^"]*sm:gap-6)[^"]*"[^>]*>[\s\S]*?<\/div>/g)]
    let informationList = [...dataList[0][0].matchAll(/<[^>]*class="[^"]*\binline-block\b[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/g)]
    let ep: number | undefined = undefined
    for (let index = 0; index < informationList.length; index++) {
        const element = informationList[index];
        if (element[1].includes("Episodes")) ep = parseInt(element[1].split(" ")[0])
    }

    let lengthEpisodes = urls.filter((value) => !value[0].substring(value[0].lastIndexOf("/")).includes("s") ).length
    
    if (!ep) return undefined

    let episodeList: { ep: string }[] = []
    let tmp = ep
    if (lengthEpisodes < ep && lengthEpisodes != 36) tmp = lengthEpisodes
    for (let index = 1; index < (tmp+1); index++) {
        episodeList.push({ ep: index.toString() })
    }

    return { player_id: idAnime, episodesData: [{ episodes: episodeList, type: "sub", name: "Subtitles" }] }
}

async function getAnimeCards(data: AnimeData): Promise<cardData[]> {
    try {
        let url = `${WEB}/anime?search=${convertText(data.title.english ? data.title.english : data.title.romaji)}`
        const req = await window.api.request.get(url, HEADER, "text");
        if (!req.success) return []
        let tmp = [...req.data.matchAll(CARDS_REGEX)]
        if (tmp.length <= 0) return []
        let finnallData: cardData[] = []
        for (let index = 0; index < tmp.length; index++) {
            const element = tmp[index];
            let animeID = [...element[0].matchAll(/wire:key=["']([^"']+)["']/g)]
            let animeIMG = [...element[0].matchAll(/src=["'](https:\/\/anizone\.to\/images\/anime\/[^"']+)["']/g)]
            let animeTITLE = [...element[0].matchAll(/alt=["']([^"']+)["']/g)]
            console.log(animeID, animeIMG, animeTITLE)
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

async function extractEpisodeList(_type: string, anime_id: string): Promise<{ ep: string; img?: string; title?: string; }[]> {
    let data = await getEpisodeList(undefined, anime_id)
    console.log(data)
    if (!data) return []
    return data.episodesData[0].episodes
}

async function searchAnime(name: string, _page: number, _params?: { genres?: string[]; years?: string; seasons?: string; format?: string[]; airing?: string; }): Promise<cardData[]> {
    return await getAnimeCards({
        characters: [],
        studios: [],
        title: {
            english: undefined,
            native: name,
            romaji: name
        },
        id: "",
        genres: undefined
    })
}

export const AniZone: playerPluginFormat = {
    version: "1.0",
    name: "AniZone",
    author: "Owca525",
    player: {
        getUrls: getURLFromPlayer,
        animeDataList: getEpisodeList,
        episodeList: extractEpisodeList,
        animeList: getAnimeCards,
        search: searchAnime
    },
    preferedLang: ["en"]
}