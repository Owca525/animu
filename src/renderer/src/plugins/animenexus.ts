// NOT USE PLUGIN
// player make token and session id token to m3u8 file

import { convertChaptersVTT, request } from "@renderer/utils/functions";
import { AnimeData, cardData, DateObject, episodeList, genresSearchFormat, playerData, playerPluginFormat } from "@renderer/utils/types";

const WEBSITE = "https://anime.nexus/"
const API = "https://api.anime.nexus/api/"

const header = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Referer': 'https://anime.nexus',
    'Origin': "https://anime.nexus",
    "cookie": "application_viewable=eyJpdiI6IkRPSEJoMFRhaG9sV1lQa1pGei9tMXc9PSIsInZhbHVlIjoiL1JxbXpiRmpqM3lJMk05UWdUMldzdTFOVkRhNFNSNExmeldTR0Y3RG56Q3ducGZjVUlpaktYNWNFREdGdllkUTN1VnRJUHgreGFRRDNpRXdXdERvKzZsZHduNDZIVkdZS21INnlxWDk2TlZnRDhxNUM1VFcwckpyRVNwQlhGbTl1azZuS1VRNHZaeEc5NnlmNWs0c0FRQWlwN3ZmM3J0ZzZSQXluRk9YR2VrPSIsIm1hYyI6ImI3MjgwYzgxMjFjMjQ3MjMzMjRhMjExNjU1NmIwZTllN2RjMDc1MDUyZjk4MzVmN2I4MDBjM2RmNWIyZjI0ZGMiLCJ0YWciOiIifQ%3D%3D; anime_nexus_session=eyJpdiI6IllSTHRjZ292WUQ2ZjJNOGg2ZERTa0E9PSIsInZhbHVlIjoiZHU1NmlMaFhXbnFPSXdHVUFVaGZaVkJsMTd2KzdCMUwzQWJSdXNxL3RYc3FMSGc0UXl3c0dUeFg3SjJHbVBoY0FIUHBYaEthYlRmalpZTGMwelo5azZ0QTl6S2lwSE04SkJ0WVlxVGM0L2ZRQ3pGOW9zbzY0ZXhpRlppMVdYY3YiLCJtYWMiOiI3Y2NiZGFjOGQwYWJlOWYyMGUyODdiMjVjNmRlNzUzYzliYTliNGE0YzA0YjU3OGRkZWIzNGExNjc4YWViNzE2IiwidGFnIjoiIn0%3D",
    "x-client-fingerprint": "34bd3152-e081-4183-afb3-9b84c24141ad",
    "x-fingerprint": "34bd3152-e081-4183-afb3-9b84c24141ad"

    // "Host": "api.allanime.day"
}

function convertStringToDate(date: string): DateObject {
    const newdate = new Date(date);
    return {
        day: newdate.getDay(),
        month: newdate.getMonth(),
        year: newdate.getFullYear()
    }
}

function convertToCardData(data: { [key: string]: any }): cardData {
    return {
        AnimeData: {
            title: {
                native: data["name_alt"],
                romaji: data["name"]
            },
            id: "",
            player_ID: data["id"],
            endDate: convertStringToDate(data["end_date"]),
            startDate: convertStringToDate(data["release_date"]),
            episodes: data["episode_count"],
            description: data["description"],
            type: data["type"],
            format: "ANIME"
        }
    }
}

export default class animenexus implements playerPluginFormat {
    metadata: playerPluginFormat["metadata"] = {
        version: "1.0",
        name: "Anime.nexus",
        author: "Owca525",
        supportLang: ["en", "jpn", "rus"],
        urlWebsite: WEBSITE
    };

    cache: { [key: string]: any }[] = []

    extractPlayerData = async(_type: string, episode: string, id: string): Promise<playerData[]> => {
        if (!this.cache[id]) await this.extractEpisodeList(undefined, id)
        
        const episodeID = this.cache[id].find((v) => v["number"] == parseInt(episode))["id"]
        if (!episodeID) return []

        const response = await request(`${API}anime/details/episode/stream?id=${episodeID}&fillers=true&recaps=true`, {
            headers: header
        })
        if (!response.json || !response.success) {
            console.error("Failed Request extractPlayerData/animenexus", response)
            return []
        }

        return [{
            hostname: "AnimeNexus",
            resolution: [{
                res: "",
                url: response.json["data"]["hls"]
            }],
            subtitles: response.json["data"]["subtitles"].map((v) => ({
                url: v["src"],
                lang: v["srcLang"],
                label: v["label"],
                format: v["src"].split(".").at(-1)
            })),
            listChapters: await convertChaptersVTT(response.json["data"]["video_meta"]["chapters"], { headers: header }),
            storyboardVTT: response.json["data"]["thumbnails"]
        }]
    }
    extractEpisodeList = async (animeData?: AnimeData, anime_id?: string): Promise<episodeList | undefined> => {
        let mainANimeID = anime_id
        if (animeData && anime_id) {
            const finded = await this.searchAnime(animeData.title.romaji, 1);
            if (finded.length <= 0) return

            mainANimeID = finded[0].AnimeData.player_ID
        }
        if (!mainANimeID) return

        const response = await request(`${API}anime/details/episodes?id=${mainANimeID}&page=1&perPage=24&order=asc&fillers=true&recaps=true`, {
            headers: header
        })

        if (!response.json || !response.success) {
            console.error("Failed Request extractEpisodeList/animenexus", response)
            return 
        }

        this.cache = {
            ...this.cache,
            [mainANimeID]: response.json["data"]
        }

        return {
            player_id: mainANimeID,
            episodesData: [{
                episodes: response.json["data"].map((v) => ({
                    ep: v["number"],
                    title: v["title"]
                })),
                type: "sub"
            }]
        }
    }
    extractOnlyEpisodesList = async (_type: string, anime_id: string): Promise<{ ep: string; img?: string; title?: string; }[]> => {
        const response = await this.extractEpisodeList(undefined, anime_id)
        if (!response) return []
        
        return response["episodesData"][0]["episodes"]
    }
    searchAnime = async (name: string, _page: number, _params?: genresSearchFormat): Promise<cardData[]> => {
        const response = await request(`${API}anime/shows?search=${name}&sortBy=name asc&page=1&includes[]=poster&includes[]=genres&hasVideos=1`, {
            headers: header
        })

        if (!response.json || !response.success) {
            console.error("Failed Request searchAnime/animenexus", response)
            return []
        }

        return response.json["data"].map((v) => convertToCardData(v));
    }
    
}