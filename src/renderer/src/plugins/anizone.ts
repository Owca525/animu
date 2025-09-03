import { AnimeData, cardData, episodeList, playerData, pluginFormat } from "@renderer/utils/GlobalInterface";

const WEB = "https://anizone.to"
const PLAYER_REGEX = /(?<!href=["'])(https:\/\/seiryuu\.vid-cdn\.xyz[^\s"'>]+)/g;
const CARDS_REGEX = /<div[^>]*class=["']grid grid-cols-1 2xl:grid-cols-2 gap-4["'][^>]*>(.*?)<\/div>/gs
const HEADER = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:123.0) Gecko/20100101 Firefox/123.0'
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
    let urls = [...data.matchAll(PLAYER_REGEX)]
    if (urls.length <= 0) return []
    console.log(urls)
    let subList: { url: string, lang: string }[] = []
    for (let index = 0; index < urls.length; index++) {
        const element = urls[index];
        if (element[0].includes("subtitles") && !element[0].includes("es-419")) {
            let file = element[0].substring(element[0].lastIndexOf("/") + 1)
            let tmp = [file.lastIndexOf("_")+1, file.lastIndexOf(".")]
            subList.push({
                url: element[0],
                lang: file.slice(tmp[0], tmp[1])
            })
        }
    }
    
    let extraction: playerData[] = []
    for (let index = 0; index < urls.length; index++) {
        const element = urls[index];
        if (element[0].includes("master.m3u8")) {
            extraction.push({
                hostname: "anizone.to",
                hls: true,
                subtitles: subList,
                resolution: [{ res: "", url: element[0] }]
            })
            break
        }
    }

    return extraction
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
    } else return undefined
    if (!idAnime) return

    let url = `${WEB}/anime/${idAnime}`
    const req = await window.api.request.get(url, HEADER, "text");
    if (!req.success) return undefined
    let data = req.data as string
    // let tmpData = [...data.matchAll(/<ul.*?>(.*?)<\/ul>/gs)]
    // let urls = [...tmpData[0][0].matchAll(/href=["'](https:\/\/anizone\.to\/anime\/[^\s"']+)["']/g)]
    let dataList = [...data.matchAll(/<div[^>]*class="(?=[^"]*text-slate-100)(?=[^"]*text-xs)(?=[^"]*lg:text-base)(?=[^"]*flex)(?=[^"]*flex-wrap)(?=[^"]*justify-center)(?=[^"]*gap-2)(?=[^"]*sm:gap-6)[^"]*"[^>]*>[\s\S]*?<\/div>/g)]
    let informationList = [...dataList[0][0].matchAll(/<[^>]*class="[^"]*\binline-block\b[^"]*"[^>]*>([\s\S]*?)<\/[^>]+>/g)]
    let ep: number | undefined = undefined
    for (let index = 0; index < informationList.length; index++) {
        const element = informationList[index];
        if (element[1].includes("Episodes")) ep = parseInt(element[1].split(" ")[0])
    }
    
    if (!ep) return undefined

    let episodeList: { ep: string }[] = []
    for (let index = 1; index < (ep+1); index++) {
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
                id: animeID[0][1].slice(2)
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
    if (!data) return []
    return data.episodesData[0].episodes
}

export const AniZone: pluginFormat = {
    version: "1.0",
    name: "AniZone",
    author: "Owca525",
    icon: "",
    player: {
        getUrls: getURLFromPlayer,
        animeDataList: getEpisodeList,
        episodeList: extractEpisodeList,
        animeList: getAnimeCards
    }
}