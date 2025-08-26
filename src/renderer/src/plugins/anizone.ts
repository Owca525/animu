import { AnimeData, cardData, episodeList, playerData, pluginFormat } from "@renderer/utils/GlobalInterface";

const WEB = "https://anizone.to"
const PLAYER_REGEX = /(?<!href=["'])(https:\/\/seiryuu\.vid-cdn\.xyz[^\s"'>]+)/g;
const HEADER = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:123.0) Gecko/20100101 Firefox/123.0'
}

async function getURLFromPlayer(_type: string, episode: string, id: string): Promise<playerData[]> {
    let url = `${WEB}/anime/${id}/${episode}`

    const req = await window.api.request.get(url, HEADER, "text");
    if (!req.success) return []

    let data = req.data as string
    let urls = data.matchAll(/<ul.*?>(.*?)<\/ul>/gs)
    console.log(urls)

    return []
}

async function getAnimeID(text: string): Promise<string | undefined> {
    try {
        let url = `${WEB}/anime?search=${encodeURI(text)}`
        const req = await window.api.request.get(url, HEADER, "text");
        console.log(req, url)
        if (!req.success) return
        let tmp = [...req.data.matchAll(/<div[^>]*class=["']grid grid-cols-1 2xl:grid-cols-2 gap-4["'][^>]*>(.*?)<\/div>/gs)]
        if (tmp.length <= 0) return
        let data: string = tmp[0][0]
        console.log(tmp)

        let animeID = [...data.matchAll(/wire:key=["']([^"']+)["']/g)]
        // let animeIMG = [...data.matchAll(/src=["'](https:\/\/anizone\.to\/images\/anime\/[^"']+)["']/g)]
        // let animeTITLE = [...data.matchAll(/alt=["']([^"']+)["']/g)]
        console.log(animeID[0][1], animeID[0][1].slice(2))
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

    let url = `${WEB}/anime/${idAnime}`
    console.log(url)
    const req = await window.api.request.get(url, HEADER, "text");
    console.log(req, url)
    if (!req.success) return undefined
    let data = req.data as string
    let tmpData = [...data.matchAll(/<ul.*?>(.*?)<\/ul>/gs)]
    let urls = [...tmpData[0][0].matchAll(/href=["'](https:\/\/anizone\.to\/anime\/[^\s"']+)["']/g)]
    // TODO: ADD RETURNING EPISODES
    console.log(urls)

    return undefined
}

// TODO: trzeba zrobić żeby wyszukiwało w wrong anime i działający extractor linków do plugina

export const AniZone: pluginFormat = {
    version: "1.0",
    name: "AniZone",
    author: "Owca525",
    icon: "",
    player: {
        getUrls: getURLFromPlayer,
        animeDataList: getEpisodeList,
        episodeList: function (type: string, anime_id: string): Promise<{ ep: string; img?: string; title?: string; }[] | null> {
            throw new Error("Function not implemented.");
        },
        animeList: function (name: string): Promise<cardData[]> {
            throw new Error("Function not implemented.");
        }
    }
}