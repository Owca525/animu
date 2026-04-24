// DISSABLE
import { makeSmallText, request } from "@renderer/utils/functions";
import { AnimeData, cardData, episodeList, episodeMetadata, FilterPluginsParams, playerData, playerDataExtended, playerPluginFormat } from "@renderer/utils/types";

const WEBSITE = "https://anidap.se"

const animeData = `
      id
      title {
        english
        romaji
        native
      }
      coverImage {
        extraLarge
        large
      }
      startDate {
        year
        month
        day
      }
      endDate {
        year
        month
        day
      }
      season
      seasonYear
      type
      format
      status(version: 2)
      episodes
      duration
`
const graphicApi = `
query(
  $page: Int = 1,
  $id: Int,
  $type: MediaType,
  $isAdult: Boolean,
  $search: String,
  $format: [MediaFormat],
  $status: MediaStatus,
  $countryOfOrigin: CountryCode,
  $source: MediaSource,
  $season: MediaSeason,
  $seasonYear: Int,
  $year: String,
  $onList: Boolean,
  $yearLesser: FuzzyDateInt,
  $yearGreater: FuzzyDateInt,
  $episodeLesser: Int,
  $episodeGreater: Int,
  $durationLesser: Int,
  $durationGreater: Int,
  $chapterLesser: Int,
  $chapterGreater: Int,
  $volumeLesser: Int,
  $volumeGreater: Int,
  $licensedBy: [Int],
  $isLicensed: Boolean,
  $genres: [String],
  $excludedGenres: [String],
  $tags: [String],
  $excludedTags: [String],
  $minimumTagRank: Int,
  $sort: [MediaSort] = [POPULARITY_DESC, SCORE_DESC]
) {
  Page(page: $page, perPage: 20) {
    pageInfo {
      total
      perPage
      currentPage
      lastPage
      hasNextPage
    }
    media(
      id: $id,
      type: $type,
      season: $season,
      format_in: $format,
      status: $status,
      countryOfOrigin: $countryOfOrigin,
      source: $source,
      search: $search,
      onList: $onList,
      seasonYear: $seasonYear,
      startDate_like: $year,
      startDate_lesser: $yearLesser,
      startDate_greater: $yearGreater,
      episodes_lesser: $episodeLesser,
      episodes_greater: $episodeGreater,
      duration_lesser: $durationLesser,
      duration_greater: $durationGreater,
      chapters_lesser: $chapterLesser,
      chapters_greater: $chapterGreater,
      volumes_lesser: $volumeLesser,
      volumes_greater: $volumeGreater,
      licensedById_in: $licensedBy,
      isLicensed: $isLicensed,
      genre_in: $genres,
      genre_not_in: $excludedGenres,
      tag_in: $tags,
      tag_not_in: $excludedTags,
      minimumTagRank: $minimumTagRank,
      sort: $sort,
      isAdult: $isAdult
    ) {
      ${animeData}
    }
  }
}
`;

function Convert(convert: any): cardData {
    return {
        AnimeData: {
            player_ID: convert["id"].toString(),
            ...convert,
            coverImage: convert.coverImage.extraLarge ? convert.coverImage.extraLarge : convert.coverImage.large,
        },
    }
}
const anilistHeader = {
    "Content-Type": "application/json",
    "Accept": "application/json",
}

const NormalHeader = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
}

const pluginHeader = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    "Referer": WEBSITE
}

const pluginRequest = { headers: pluginHeader, method: "GET" }

const UintRandomValL = Uint8Array.from(Object.values({
    "0": 153,
    "1": 204,
    "2": 58,
    "3": 179,
    "4": 132,
    "5": 32,
    "6": 132,
    "7": 74,
    "8": 237,
    "9": 132,
    "10": 66,
    "11": 232,
    "12": 165,
    "13": 109,
    "14": 4,
    "15": 228
}));

const UintRandomValM = Uint8Array.from(Object.values({
    "0": 125,
    "1": 242,
    "2": 111,
    "3": 214,
    "4": 41,
    "5": 233,
    "6": 157,
    "7": 185,
    "8": 129,
    "9": 127,
    "10": 193,
    "11": 136,
    "12": 240,
    "13": 86,
    "14": 178,
    "15": 99,
    "16": 233,
    "17": 244,
    "18": 192,
    "19": 171,
    "20": 215,
    "21": 10,
    "22": 97,
    "23": 198,
    "24": 230,
    "25": 161,
    "26": 74,
    "27": 167,
    "28": 8,
    "29": 95,
    "30": 230,
    "31": 49
}));

const UintRandomVall = Uint8Array.from(Object.values({
    "0": 254,
    "1": 1,
    "2": 21,
    "3": 56,
    "4": 237,
    "5": 239,
    "6": 4,
    "7": 1,
    "8": 115,
    "9": 55,
    "10": 110,
    "11": 242,
    "12": 235,
    "13": 106,
    "14": 242,
    "15": 147,
    "16": 85,
    "17": 221,
    "18": 167,
    "19": 44,
    "20": 72,
    "21": 18,
    "22": 102,
    "23": 242,
    "24": 195,
    "25": 45,
    "26": 48,
    "27": 201,
    "28": 206,
    "29": 73,
    "30": 175,
    "31": 65
}));

const UintRandomValA = Uint8Array.from(Object.values({
    "0": 206,
    "1": 68,
    "2": 122,
    "3": 132,
    "4": 230,
    "5": 208,
    "6": 85,
    "7": 116,
    "8": 75,
    "9": 82,
    "10": 30,
    "11": 94,
    "12": 139,
    "13": 115,
    "14": 2,
    "15": 213
}));
function decodeRandomStr(input: string) {
    for (; input.length % 4;) {
        input += "=";
    }
    return atob(input.replace(/-/g, "+").replace(/_/g, "/"))
};
function converter(e: Uint8Array, t: Uint8Array): Uint8Array {
    return e.map((val, r) => {
        const a = r % t.length;
        const c = t[a];

        const rot = ((c << (r % 8)) | (c >>> (8 - (r % 8)))) & 255;
        const mix = (r * 7 + 13) & 255;

        return val ^ rot ^ mix ^ t[(a + 1) % t.length];
    });
}
async function decryptorPlayerData(str: string) {
    try {
        const key = await crypto.subtle.importKey("raw", UintRandomVall, {
            name: "AES-GCM"
        }, !1, ["encrypt", "decrypt"]);

        let cumDecoded = Uint8Array.from(decodeRandomStr(str), u => u.charCodeAt(0))
        let cum1Slice = cumDecoded.slice(0, 12)
        let cum2Slice = cumDecoded.slice(12)
        let decryptedCUM = await crypto.subtle.decrypt({
            name: "AES-GCM",
            iv: cum1Slice
        }, key, cum2Slice)
        let FINALLCUM = converter(new Uint8Array(decryptedCUM), UintRandomValA);

        return JSON.parse(new TextDecoder().decode(FINALLCUM))
    } catch (error) {
        try {
            const key = await crypto.subtle.importKey("raw", UintRandomValM, {
                name: "AES-GCM"
            }, !1, ["encrypt", "decrypt"]);

            const decodedUint = Uint8Array.from(decodeRandomStr(str), f => f.charCodeAt(0))
            let uintSlice = decodedUint.slice(0, 12)
            let uintSecondSlice = decodedUint.slice(12)
            let unRevealNumbers = await crypto.subtle.decrypt({
                name: "AES-GCM",
                iv: uintSlice
            }, key, uintSecondSlice)

            const result = converter(new Uint8Array(unRevealNumbers), UintRandomValL);

            return JSON.parse(new TextDecoder().decode(result));
        } catch (error) {
            console.error("AniDap Failed Decrypt Player Data", error, str)
            return undefined
        }
    }
};

function SheepFinderAnime2000(animeList: AnimeData[], anime: AnimeData): string | undefined {
    try {
        console.log("First Check", animeList)
        // FIRST CHECK
        if (animeList.length <= 0) return undefined
        if (animeList.length == 1) return animeList[0].player_ID

        // Second Check
        let seasonYearFilter = animeList.filter((element) => element.seasonYear == anime.seasonYear)
        console.log("Second Check", seasonYearFilter)
        if (seasonYearFilter.length <= 0) return undefined
        if (seasonYearFilter.length == 1) return seasonYearFilter[0].player_ID

        // Third Check
        let seasonFilter = seasonYearFilter.filter((element) => makeSmallText(element.season) == makeSmallText(anime.season))
        console.log("Third Check", seasonYearFilter)
        if (seasonFilter.length <= 0) return undefined
        if (seasonFilter.length == 1) return seasonFilter[0].player_ID

        // Four Check
        let episodesFilter: AnimeData[] | undefined = undefined
        if (anime.episodes) {
            episodesFilter = seasonFilter.filter((element) => element.episodes == anime.episodes)
            console.log("Four Check", episodesFilter)
            if (episodesFilter.length <= 0) return undefined
            if (episodesFilter.length == 1) return episodesFilter[0].player_ID
        }

        // Five Check
        let durationFilter: AnimeData[] = []
        if (episodesFilter) durationFilter = episodesFilter.filter((element) => element.duration == anime.duration)
        else durationFilter = seasonFilter.filter((element) => element.duration == anime.duration)
        console.log("Five Check", durationFilter)
        if (durationFilter.length <= 0) return undefined
        if (durationFilter.length == 1) return durationFilter[0].player_ID

        // Six Check
        let formatFilter = durationFilter.filter((element) => makeSmallText(element.format) == makeSmallText(anime.format))
        console.log("Six Check", formatFilter)
        if (formatFilter.length <= 0) return undefined
        if (formatFilter.length == 1) return formatFilter[0].player_ID

        return formatFilter[0].player_ID
    } catch (error) {
        console.error("AniDap SheepFinderAnime2000 error", error)
        return animeList[0].player_ID
    }
}

async function extractSources(playerData: playerDataExtended): Promise<playerData | undefined> {
    const sourcesResponse = await request(`${WEBSITE}/api/anime/sources?id=${playerData["episode"]["animeID"]}&ep=${playerData["episode"]["currentEpisode"]}&host=${playerData["hostname"]}&type=sub`, pluginRequest as any)

    /* IFDEF DEBUG */
    console.warn("extractSources/AniDup", sourcesResponse)
    /* ENDIF */

    if (!sourcesResponse["success"] || !sourcesResponse["json"]) return undefined
    if (sourcesResponse["json"]["data"].startsWith("https:")) {
        console.warn("SOMMETHING WRONG extractSources/AniDap", sourcesResponse)
        return undefined
    }
    const player = await decryptorPlayerData(sourcesResponse["json"]["data"])
    /* IFDEF DEBUG */
    console.warn("extractSources/AniDup", player)
    /* ENDIF */
    if (!player) return

    let isSplitedHls = false
    return {
        hostname: playerData["hostname"],
        resolution: player["sources"].map((v) => {
            if (v["url"].includes(".m3u8")) isSplitedHls = true
            return {
                res: v["quality"],
                url: v["url"],
                hls: v["quality"] == "quality",
                reqHeader: pluginHeader
            }
        }),
        splitHLS: isSplitedHls,
        storyboardVTT: player["thumbnails"],
        listChapters: [{
            start: player["intro"]["start"],
            end: player["intro"]["end"],
            type: "opening"
        }, {
            start: player["outro"]["start"],
            end: player["outro"]["end"],
            type: "ending"
        }],
        subtitles: player["subtitles"].map((v) => ({
            url: v["url"],
            lang: v["lang"],
            label: v["label"],
            format: v["kind"] == "captions" ? "vtt" : "ass"
        })),
        external: {
            chaptersUrl: player["thumbnails"]
        },
    }
}

export default class AniDap implements playerPluginFormat {
    metadata: playerPluginFormat["metadata"] = {
        version: "1.0",
        name: "AniDap",
        author: "Owca525",
        supportLang: ["en"],
        urlWebsite: WEBSITE,
        icon: "https://anidap.se/logo.png"
    };
    extractPlayerData = async (_type: string, episode: episodeMetadata, id: string): Promise<playerData[]> => {
        let mainEpisode: string = typeof episode == "object" ? episode.ep : episode

        const serverResponse = await request(`${WEBSITE}/api/anime/servers?id=${id}&ep=${mainEpisode}`, pluginRequest as any)

        /* IFDEF DEBUG */
        console.warn("extractPlayerData/AniDup", serverResponse)
        /* ENDIF */

        if (!serverResponse["success"] || !serverResponse["json"]) return []

        return serverResponse["json"]["data"]["subProviders"].map((v: string) => ({
            hostname: v,
            resolution: [],
            extractResolution: extractSources
        }))
    }
    extractEpisodeList = async (animeData?: AnimeData, anime_id?: string): Promise<episodeList | undefined> => {
        let functionAnimeID = anime_id
        if (animeData && !anime_id) {
            const resp = await this.searchAnime(animeData.title.romaji, 1)
            if (resp.length <= 0) return

            functionAnimeID = SheepFinderAnime2000(resp.map((v) => v.AnimeData), animeData)
        }
        if (!functionAnimeID) return
        if (!Number.isNaN(parseInt(functionAnimeID))) {
            const idResponse = await request(`${WEBSITE}/info/${functionAnimeID}`, { headers: NormalHeader, method: "GET" })
            if (!idResponse["success"]) return
            let tmp = idResponse.text.match(/\\"id\\",\\"([^\\"]+)\\"/)
            if (!tmp) return
            functionAnimeID = tmp[1]
        }
        if (!functionAnimeID) return
        const episodesResponse = await request(`${WEBSITE}/api/anime/${functionAnimeID}/episodes?refresh=false`, pluginRequest as any)

        /* IFDEF DEBUG */
        console.warn("extractEpisodeList/AniDup", episodesResponse)
        /* ENDIF */

        if (!episodesResponse["success"] || !episodesResponse["json"]) return

        return {
            player_id: functionAnimeID,
            episodesData: [{
                episodes: episodesResponse["json"]["data"].map((v) => ({
                    ep: `${v["number"]}`,
                    img: v["img"],
                    title: v["titles"]["en"] == `Episode ${v["number"]}` ? undefined : v["titles"]["en"]
                })),
                type: "sub"
            }]
        }
    }
    extractOnlyEpisodesList = async (_type: string, anime_id: string): Promise<{ ep: string; img?: string; title?: string; }[]> => {
        const adsfjobnbjlnadfs = await this.extractEpisodeList(undefined, anime_id)
        if (!adsfjobnbjlnadfs) return []

        return adsfjobnbjlnadfs.episodesData[0].episodes
    }
    searchAnime = async (name: string, _page: number, _params?: FilterPluginsParams): Promise<cardData[]> => {
        try {
            const response = await request("https://graphql.anilist.co", {
                method: "POST",
                headers: anilistHeader,
                body: JSON.stringify({ query: graphicApi, variables: { search: name } })
            })
            if (!response["success"] || !response["json"]) return []

            return response["json"].data.Page.media.map((v) => Convert(v))
        } catch (error) {
            console.log("Error in searchAnime/aowu", error)
            return []
        }
    }

}