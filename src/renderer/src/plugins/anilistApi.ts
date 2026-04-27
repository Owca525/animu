import {
  Anilist_ListMutation,
  AnimeData,
  cardData,
  containerData,
  FilterPluginsParams,
  genres,
  informationPluginFormat,
} from '@renderer/utils/types';
import { dateToUnix, genYearsList, request, timeCovertToMs } from '@renderer/utils/functions';
import { getConfig } from '@renderer/utils/stores/config';
import { getGlobalCache } from '@renderer/utils/stores/global';
import { sha256 } from "js-sha256";

const defaultPageSize = 20

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
      bannerImage
      season
      seasonYear
      description
      type
      format
      status(version: 2)
      episodes
      duration
      genres
      source
      synonyms
      isAdult
      averageScore
      trailer {
        id
        site
      }
      nextAiringEpisode {
        airingAt
        timeUntilAiring
        episode
      }
      characters(perPage: 30) {
        edges {
          role
          node {
            id
            name {
              full
            }
            image {
              large
            }
          }
          voiceActors(language: JAPANESE) {
            id
            name {
              full
            }
            language
            image {
              large
            }
          }
        }
      }
      studios(isMain: true) {
        edges {
          isMain
          node {
            id
            name
          }
        }
      }
      relations {
        edges {
          relationType
          node {
            id
            format
            type
            status(version: 2)
            title {
              romaji
              english
              native
            }
            coverImage {
              extraLarge
              large
            }
          }
        }
      }
      recommendations(page: 1, perPage: 10) {
        nodes {
          mediaRecommendation {
            id
            type
            format
            title {
              romaji
              english
              native
            }
            coverImage {
              extraLarge
              large
            }
          }
        }
      }
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
  Page(page: $page, perPage: CHANGE_ME_PAGE_SIZE) {
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

const graphicAiringAnime = `
query AiringAnimes($page: Int, $perPage: Int, $sort: [AiringSort], $airingAtGreater: Int, $airingAtLesser: Int) {
    Page(page: $page, perPage: $perPage) {
        airingSchedules(sort: $sort, airingAt_greater: $airingAtGreater, airingAt_lesser: $airingAtLesser) {
        id
        airingAt
        timeUntilAiring
        episode

        media {
          ${animeData}
        }
      }
    }
}
`

const graphicAnimeListAll = `query (
  $userId: Int
  $userName: String
  $type: MediaType
) {
  MediaListCollection(
    userId: $userId
    userName: $userName
    type: $type
  ) {
    lists {
      name
      isCustomList
      isCompletedList: isSplitCompletedList

      entries {
        ...mediaListEntry
      }
    }
  }
}

fragment mediaListEntry on MediaList {
  id
  mediaId
  status
  score
  progress
  progressVolumes
  repeat
  priority
  private
  hiddenFromStatusLists
  customLists
  advancedScores
  notes
  updatedAt

  startedAt {
    year
    month
    day
  }

  completedAt {
    year
    month
    day
  }

  media {
    ${animeData}
  }
}`

const graphicAnimeListModified = `mutation (
  $id: Int
  $mediaId: Int
  $status: MediaListStatus
  $score: Float
  $progress: Int
  $progressVolumes: Int
  $repeat: Int
  $private: Boolean
  $notes: String
  $customLists: [String]
  $hiddenFromStatusLists: Boolean
  $advancedScores: [Float]
  $startedAt: FuzzyDateInput
  $completedAt: FuzzyDateInput
) {
  SaveMediaListEntry(
    id: $id
    mediaId: $mediaId
    status: $status
    score: $score
    progress: $progress
    progressVolumes: $progressVolumes
    repeat: $repeat
    private: $private
    notes: $notes
    customLists: $customLists
    hiddenFromStatusLists: $hiddenFromStatusLists
    advancedScores: $advancedScores
    startedAt: $startedAt
    completedAt: $completedAt
  ) {
    id
    mediaId
    status
    score
    advancedScores
    progress
    progressVolumes
    repeat
    priority
    private
    hiddenFromStatusLists
    customLists
    notes
    updatedAt

    startedAt {
      year
      month
      day
    }

    completedAt {
      year
      month
      day
    }

    user {
      id
      name
    }

    media {
     ${animeData}
    }
  }
}`

const graphicHomeApi = `
  query (
    $season: MediaSeason,
    $seasonYear: Int,
    $nextSeason: MediaSeason,
    $nextYear: Int
    $isAdult: Boolean
  ) {
    trending: Page(page: 1, perPage: CHANGE_ME_PAGE_SIZE) {
      media(sort: TRENDING_DESC, type: ANIME, isAdult: $isAdult) {
        ...media
      }
    }
    season: Page(page: 1, perPage: CHANGE_ME_PAGE_SIZE) {
      media(season: $season, seasonYear: $seasonYear, sort: POPULARITY_DESC, type: ANIME, isAdult: $isAdult) {
        ...media
      }
    }
    nextSeason: Page(page: 1, perPage: CHANGE_ME_PAGE_SIZE) {
      media(season: $nextSeason, seasonYear: $nextYear, sort: POPULARITY_DESC, type: ANIME, isAdult: $isAdult) {
        ...media
      }
    }
    popular: Page(page: 1, perPage: CHANGE_ME_PAGE_SIZE) {
      media(sort: POPULARITY_DESC, type: ANIME, isAdult: $isAdult) {
        ...media
      }
    }
  }

  fragment media on Media {
    ${animeData}
  }
`;

const graphicApIDAnime = `
query(
  $id: Int!
  $type: MediaType
) {
  Media(id: $id, type: $type) {
    ${animeData}
  }
}
`;

// const genres = `
// query {
//   GenreCollection
// }
// `

const header = {
  "Content-Type": "application/json",
  "Accept": "application/json",
}

const tendingAnime = {
  page: 1,
  sort: ["TRENDING_DESC", "POPULARITY_DESC"],
  type: "ANIME"
}

const allPopular = {
  page: 1,
  sort: "POPULARITY_DESC",
  type: "ANIME"
}

function Convert(convert: any): cardData {
  let characters: any = []
  let relations: AnimeData["relations"] = []
  let recommendations: AnimeData["recommendations"] = []

  try {
    for (let index = 0; index < convert.characters.edges.length; index++) {
      const element = convert.characters.edges[index];
      if (element.voiceActors.length === 0) characters.push({ role: element.role, character: { id: element.node.id, image: element.node.image.large, name: element.node.name.full } })
      else characters.push({ role: element.role, character: { id: element.node.id, image: element.node.image.large, name: element.node.name.full }, voiceActor: { id: element.voiceActors[0].id, image: element.voiceActors[0].image.large, name: element.voiceActors[0].name.full } })
    }
  } catch (error) { console.error("AnilistApi/Convert", error) }

  try {
    if (convert.relations) {
      convert.relations.edges.forEach(element => {
        if (!element) return
        relations.push({
          id: element.node.id,
          title: element.node.title,
          coverImage: element.node.coverImage.extraLarge ? element.node.coverImage.extraLarge : element.node.coverImage.large,
          relationType: element.relationType,
          status: element["node"]["status"],
          format: element["node"]["format"],
          type: element["node"]["type"]
        })
      });
    }
  } catch (error) { console.error("AnilistApi/Convert", error) }

  try {
    if (convert.recommendations) {
      convert.recommendations.nodes.forEach(element => {
        if (!element || !element.mediaRecommendation) return
        recommendations.push({
          id: element.mediaRecommendation.id,
          title: element.mediaRecommendation.title,
          coverImage: element.mediaRecommendation.coverImage.extraLarge ? element.mediaRecommendation.coverImage.extraLarge : element.mediaRecommendation.coverImage.large,
          type: element["mediaRecommendation"]["type"],
          format: element["mediaRecommendation"]["format"]
        })
      });
    }
  } catch (error) { console.error("AnilistApi/Convert", error) }

  return {
    AnimeData: {
      ...convert,
      coverImage: convert.coverImage.extraLarge ? convert.coverImage.extraLarge : convert.coverImage.large,
      studios: convert.studios.edges.map((studio) => studio.node.name),
      characters: characters,
      recommendations,
      relations
    },
  }
}

function getHeader() {
  if (localStorage.getItem("Animu_Anilist_login_token_information")) {
    try {
      const token = JSON.parse(localStorage.getItem("Animu_Anilist_login_token_information") as any)
      return { ...header, 'Authorization': 'Bearer ' + token["access_token"], }
    } catch (error) {
      console.error("getHeader/anilistapi", error)
      return header
    }
  }
  return header
}

type anilistVariable = { [key: string]: string | number | boolean | string[] } | Anilist_ListMutation

let globalAnilistCache: {
  data: { text: string, json: { [key: string]: any } | undefined, buffer: Buffer, status: number, statusText: string, url: string, success: boolean, responseHeader: Map<string, string> },
  timer: NodeJS.Timeout
  hash: string
}[] = []


function addToAnilistCache(timer: number, object: { query: string, variables: anilistVariable }, response: any) {
  const hash = sha256(JSON.stringify(object))
  globalAnilistCache = [...globalAnilistCache, {
    data: response,
    timer: setTimeout(() => {
      globalAnilistCache = globalAnilistCache.filter((el) => el.hash != hash)
    }, timer),
    hash: hash
  }]
}

function findAnilistCache(object: { query: string, variables: anilistVariable }) {
  const hash = sha256(JSON.stringify(object))
  const finded = globalAnilistCache.find((el) => el["hash"] == hash)
  if (finded) return finded.data
  return undefined
}

// WHY THE FUCK THIS DOESN'T WORK IF I CALL window.api.request.post IN CreateHomePage
// Jeśli api anilist jest offline to daje "Forbidden" w statusText i error 403 request 
async function sendPost(variable: anilistVariable, query: string, timer = 0) {
  const cache = findAnilistCache({ query: query, variables: variable })
  if (cache) return cache
  
  const response = await request(
    "https://graphql.anilist.co",
    { method: "POST", headers: getHeader(), body: JSON.stringify({ query: query, variables: variable }) },
    window.api ? false : true
  )
  if (response.json && response.success && timer > 0) {
    addToAnilistCache(timer, { query: query, variables: variable }, response)
  }

  return response
}

async function sendToApi(variable: anilistVariable, query: string, timer = 0): Promise<cardData[]> {

  const cache = findAnilistCache({ query: query, variables: variable })
  if (cache) return cache.json!.data.Page.media.map((data) => Convert(data))

  let data = await request(
    "https://graphql.anilist.co",
    { method: "POST", headers: getHeader(), body: JSON.stringify({ query: query, variables: variable }) },
    window.api ? false : true
  )
  if (!data.success || !data.json) {
    console.warn("Failed Anilist/sendToApi Request", data)
    return []
  }

  if (timer > 0) addToAnilistCache(timer, { query: query, variables: variable }, data)

  return data.json.data.Page.media.map((data) => Convert(data))
}

function getSeasonFromDate() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const list = ["WINTER", "SPRING", "SUMMER", "FALL"]

  let season: string;
  let nextSeason: string = list[0];

  if (month >= 1 && month <= 3) {
    season = "WINTER";
  } else if (month >= 4 && month <= 6) {
    season = "SPRING";
  } else if (month >= 7 && month <= 9) {
    season = "SUMMER";
  } else {
    season = "FALL";
  }

  const finded = list.findIndex((v) => season == v)
  if (list.length - 1 > list.findIndex((v) => season == v)) nextSeason = list[finded + 1]

  return { season, nextSeason, seasonYear: year, nextYear: finded == 3 ? year + 1 : year };
}

// async function getGenres(): Promise<string[]> {
//   let data = await window.api.request.post("https://graphql.anilist.co", header, { query: genres, variables: "" })
//   if (data.success) return data.data.data.GenreCollection
//   return []
// }

async function fetchCategory(params: any, title: string): Promise<containerData> {
  const config = getConfig()
  const globalParams = params
  let container: containerData = {
    title: title,
    data: await sendToApi(params, replacePageInGraphicApi(graphicApi, config.anilist.maxpagesize.toString()), timeCovertToMs({ min: 5 })),
    onScrollDownFunction: async (_search, page, _params) => {
      let resp = await sendToApi({ ...globalParams, page: page }, replacePageInGraphicApi(graphicApi, config.anilist.maxpagesize.toString()), timeCovertToMs({ min: 5 }));
      return {
        maxPage: config.anilist.maxpagesize,
        data: resp
      }
    }
  }
  return container
}

export async function searchInAnilist(name: string, page: number, params?: FilterPluginsParams, isAdult: boolean = false, MaxPage: number = 20): Promise<{ data: cardData[]; maxPage: number; }> {
  try {
    let variables: any = {
      page: page,
      sort: "SEARCH_MATCH",
      type: "ANIME",
      isAdult: isAdult
    }
    if (name.replaceAll(" ", "") != "") variables = { ...variables, search: name }

    if (params) {
      if (params.genres) variables = { ...variables, genres: params.genres }
      if (params.years) variables = { ...variables, seasonYear: parseInt(params.years) }
      if (params.season) variables = { ...variables, season: params.season }
      if (params.format) variables = { ...variables, format: params.format }
      if (params.airing) variables = { ...variables, status: params.airing }
    }

    const resp = await sendToApi(variables, replacePageInGraphicApi(graphicApi, MaxPage.toString()), timeCovertToMs({ min: 5 }))
    return {
      data: resp,
      maxPage: MaxPage
    }
  } catch (error) {
    console.error("Error in searchInAnilist/anilist", error)
    return {
      data: [],
      maxPage: MaxPage
    }
  }
}

async function searchWrapper(name: string, page: number, params?: FilterPluginsParams, isAdult: boolean = false, MaxPage: number = 20): Promise<{ data: cardData[]; maxPage: number; }> {
  const config = getConfig()
  try {
    return await searchInAnilist(name, page, params, isAdult, MaxPage)
  } catch (error) {
    console.error("Error in searchWrapper/anilist", error)
    return {
      data: [],
      maxPage: config.anilist.maxpagesize
    }
  }
}

function replacePageInGraphicApi(graphicTMP: string, variable: string) {
  return graphicTMP.replaceAll("CHANGE_ME_PAGE_SIZE", variable)
}

export default class AnilistApi implements informationPluginFormat {
  metadata: informationPluginFormat["metadata"] = {
    version: "2.0",
    name: "AnilistApi",
    pageSize: defaultPageSize,
    searchOption: [],
    author: "Owca525",
    urlWebsite: "https://anilist.co",
    icon: "https://anilist.co/img/icons/icon.svg",
    type: 'information'
  };

  constructor() {
    const options = {
      genres: [
        "Action",
        "Adventure",
        "Comedy",
        "Drama",
        "Ecchi",
        "Fantasy",
        "Hentai",
        "Horror",
        "Mahou Shoujo",
        "Mecha",
        "Music",
        "Mystery",
        "Psychological",
        "Romance",
        "Sci-Fi",
        "Slice of Life",
        "Sports",
        "Supernatural",
        "Thriller"
      ],
      seasons: ["Winter", "Spring", "Summer", "Fall"],
      years: genYearsList(1940),
      format: ["TV", "Movie", "TV Short", "special", "OVA", "ONA"],
      statuses: ["Releasing", "Finished", "Not Yet Released", "Cancelled"]
    }

    let newOptions: genres[] = [
      {
        type: "genres",
        placeholder: "filter.placeholderGenres",
        title: "filter.genres",
        langPath: "anime_genres.",
        options: options.genres
      },
      {
        type: "years",
        title: "filter.year",
        placeholder: "filter.placeholderYears",
        langPath: "",
        options: options.years
      },
      {
        type: "season",
        placeholder: "filter.placeholderSeason",
        title: "filter.season",
        langPath: "anime_seasons.",
        options: options.seasons
      },
      {
        type: "format",
        placeholder: "filter.placeholderFormat",
        title: "filter.format",
        langPath: "anime_formats.",
        options: options.format
      },
      {
        type: "airing",
        placeholder: "filter.placeholderAiring",
        title: "filter.airing",
        langPath: "anime_statuses.",
        options: options.statuses
      },
    ]

    this.metadata = {
      ...this.metadata,
      searchOption: newOptions
    }
  }

  config?: { [key: string]: any; } | undefined;

  async getAnimeList(): Promise<cardData[]> {
    const tmpHeader = getHeader()
    const global = getGlobalCache()
    if (!tmpHeader["Authorization"]) return []
    if (!global.anilist_user_data) return []

    const response = await sendPost({ type: "ANIME", userId: global.anilist_user_data["id"] }, graphicAnimeListAll)
    if (!response.success || !response.json) return []

    let tmpList: any[] = []
    for (let index = 0; index < response.json["data"]["MediaListCollection"]["lists"].length; index++) {
      const element = response.json["data"]["MediaListCollection"]["lists"][index];

      tmpList = [...tmpList, ...element["entries"]]
    }

    const readyList = tmpList.map((item) => {
      try {
        const startWatch = item["startedAt"]["day"] != undefined && item["startedAt"]["month"] != undefined && item["startedAt"]["year"] != undefined ?
          dateToUnix(new Date(item["startedAt"]["year"], item["startedAt"]["month"] - 1, item["startedAt"]["day"]).toString()) : undefined

        const endWatch = item["completedAt"]["day"] != undefined && item["completedAt"]["month"] != undefined && item["completedAt"]["year"] != undefined ?
          dateToUnix(new Date(item["completedAt"]["year"], item["completedAt"]["month"] - 1, item["completedAt"]["day"]).toString()) : undefined

        return {
          ...Convert(item["media"]),
          animulist: {
            status: item["status"],
            score: item["score"],
            reapeat: item["repeat"],
            startWatch: startWatch,
            endWatch: endWatch,
            added: dateToUnix(new Date().toString()),
            lastUpdate: item["updatedAt"],
            favorite: false,
            progress: item["progress"]
          }
        } as cardData
      } catch (error) {
        console.error("Failed Convert map/anilistapi", error, item)
        return undefined
      }
    }).filter((v) => v != undefined)

    return readyList
  };

  async setAnimeInList(variable: Anilist_ListMutation): Promise<boolean> {
    const tmpHeader = getHeader()
    if (!tmpHeader["Authorization"]) return false
    const response = await sendPost(variable, graphicAnimeListModified)
    if (!response.success) return false
    return true
  };

  async schedule(airingStart: number, airingEnd: number): Promise<cardData[]> {
    // let week = getWeek()
    // console.log(week)

    console.log(airingStart, airingEnd)
    let variables = {
      page: 1,
      perPage: 50,
      sort: ["TIME"],
      airingAtGreater: airingStart,
      airingAtLesser: airingEnd
    }

    let response = await sendPost(variables, graphicAiringAnime, timeCovertToMs({ hour: 1 }))
    if (!response.success || !response.json) return []

    let data = response.json["data"]["Page"]["airingSchedules"].map((v) => {
      const converted = Convert(v["media"])
      return {
        ...converted,
        AnimeData: {
          ...converted.AnimeData,
          nextAiringEpisode: {
            airingAt: v["airingAt"],
            episode: v["episode"],
            timeUntilAiring: v["timeUntilAiring"]
          }
        }
      }
    })

    return data
  }

  search = async (name: string, page: number, params?: FilterPluginsParams) => {
    try {
      const config = getConfig()
      let title: string | undefined = undefined
      if (!(name.replaceAll(" ", "") == "")) title = `home.searching/${name}`
      console.log(params)

      const resp = await searchInAnilist(name, page, params, config.anilist.adultdefault, config.anilist.maxpagesize)

      return {
        title: title,
        data: resp.data,
        onScrollDownFunction: async (search, page, params) => await searchWrapper(search ? search : "", page, params, config.anilist.adultdefault, config.anilist.maxpagesize)
      }
    } catch (error) {
      console.error("Error in search/Anilistapi", error)
      return
    }
  }
  home = async () => {
    try {
      const config = getConfig()
      let season = getSeasonFromDate()
      let data = await sendPost({
        season: season.season,
        seasonYear: season.seasonYear,
        isAdult: config.anilist.adultdefault,
        nextSeason: season.nextSeason,
        nextYear: season.nextYear,
      }, replacePageInGraphicApi(graphicHomeApi, config.anilist.maxpagesize.toString()), timeCovertToMs({ min: 10 }))

      if (!data.success || !data.json) {
        console.warn("home/anilistapi Failed Request", data)
        return data.json && data.json["errors"] ? { error: data.json["errors"][0]["message"] } : undefined
      }

      let home: containerData[] = [
        {
          title: "home.trending_now",
          data: data.json.data.trending.media.map((anime) => Convert(anime)),
          horizontal: true,
          onTitleClick: async () => await fetchCategory({ ...tendingAnime, isAdult: config.anilist.adultdefault }, "home.trending_now"),
        },
        {
          title: "home.popular_in_this_season",
          data: data.json.data.season.media.map((anime) => Convert(anime)),
          horizontal: true,
          onTitleClick: async () => await fetchCategory({
            page: 1,
            season: season.season,
            seasonYear: season.seasonYear,
            type: "ANIME",
            isAdult: config.anilist.adultdefault
          }, "home.popular_in_this_season"),
        },
        {
          title: "Upcoming Next Season",
          data: data.json.data.nextSeason.media.map((anime) => Convert(anime)),
          horizontal: true,
          onTitleClick: async () => await fetchCategory({
            page: 1,
            season: season.nextSeason,
            seasonYear: season.nextYear,
            type: "ANIME",
            isAdult: config.anilist.adultdefault
          }, "Upcoming Next Season"),
        },
        {
          title: "home.all_time_popular",
          data: data.json.data.popular.media.map((anime) => Convert(anime)),
          horizontal: true,
          onTitleClick: async () => await fetchCategory({ ...allPopular, isAdult: config.anilist.adultdefault }, "home.all_time_popular"),
        }
      ]
      return { sections: home, topCards: home[0] }
    } catch (error) {
      console.error("Error in home/anilistapi", error)
      return
    }
  }
  anime = async (context: { id: string; }) => {
    try {
      let req = await sendPost({ id: context.id, type: "ANIME" }, graphicApIDAnime, timeCovertToMs({ min: 5 }))
      if (!req.success || !req.json) return
      return Convert(req.json.data.Media).AnimeData
    } catch (error) {
      console.error("Uknown error in anime/anilistapi", error)
      return
    }
  }

  getManga = async (id: string) => {
    try {
      let req = await sendPost({ id: id, type: "MANGA" }, graphicApIDAnime, timeCovertToMs({ min: 5 }))
      console.log(req)
      if (!req.success || !req.json) return
      console.log(Convert(req.json.data.Media).AnimeData)
      return Convert(req.json.data.Media).AnimeData
    } catch (error) {
      console.error("Uknown error in getManga/anilistapi", error)
      return
    }
  }
}