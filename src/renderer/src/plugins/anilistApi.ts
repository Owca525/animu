import { genYearsList, request, unixToDateTime } from "@renderer/utils/functions";
import { t } from "@renderer/utils/i18n";
import { getConfig } from "@renderer/utils/stores/config";
import { AnimeData, cardData, containerData, genres, genresSearchFormat, informationPluginFormat } from "@renderer/utils/types";

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
      return {...header, 'Authorization': 'Bearer ' + token["access_token"],}
    } catch (error) {
      console.error("getHeader/anilistapi", error)
      return header
    }
  }
  return header
}

// WHY THE FUCK THIS DOESN'T WORK IF I CALL window.api.request.post IN CreateHomePage
// Jeśli api anilist jest offline to daje "Forbidden" w statusText i error 403 request 
async function sendPost(variable: any, query: any) {
  return await request(
    "https://graphql.anilist.co", 
    { method: "POST", headers: getHeader(), body: JSON.stringify({ query: query, variables: variable }) } as any,
    window.api ? false : true
  )
}

async function sendToApi(variable: any, query: any): Promise<cardData[]> {
  let data = await request(
    "https://graphql.anilist.co", 
    { method: "POST", headers: getHeader(), body: JSON.stringify({ query: query, variables: variable }) } as any,
    window.api ? false : true
  )
  if (data.success && data.json) {
    return data.json.data.Page.media.map((data) => Convert(data))
  }
  return []
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
  if (list.length-1 > list.findIndex((v) => season == v)) nextSeason = list[finded+1]

  return { season, nextSeason, seasonYear: year, nextYear: finded == 3 ? year+1 : year };
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
    data: await sendToApi(params, graphicApi.replaceAll("CHANGE_ME_PAGE_SIZE", config.anilist.maxpagesize.toString())),
    onScrollDownFunction: async (_search, page, _params) => {
      let resp = await sendToApi({ ...globalParams, page: page }, graphicApi.replaceAll("CHANGE_ME_PAGE_SIZE", config.anilist.maxpagesize.toString()));
      return {
        maxPage: config.anilist.maxpagesize,
        data: resp
      }
    }
  }
  return container
}

export async function searchInAnilist(name: string, page: number, params?: genresSearchFormat, isAdult: boolean = false, MaxPage: number = 20): Promise<{ data: cardData[]; maxPage: number; }> {
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
      if (params.seasons) variables = { ...variables, season: params.seasons.toUpperCase() }
      if (params.format) variables = { ...variables, format: params.format.toUpperCase().replaceAll(" ", "_") }
      if (params.airing) variables = { ...variables, status: params.airing.toUpperCase().replaceAll(" ", "_") }
    }

    const resp = await sendToApi(variables, graphicApi.replaceAll("CHANGE_ME_PAGE_SIZE", MaxPage.toString()))
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

async function searchWrapper(name: string, page: number, params?: genresSearchFormat, isAdult: boolean = false, MaxPage: number = 20): Promise<{ data: cardData[]; maxPage: number; }> {
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

export default class AnilistApi implements informationPluginFormat {
  metadata: informationPluginFormat["metadata"] = {
    version: "2.0",
    name: "AnilistApi",
    pageSize: defaultPageSize,
    searchOption: [],
    author: "Owca525",
    urlWebsite: "https://anilist.co",
    icon: "https://anilist.co/img/icons/icon.svg"
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
        options: options.genres.map(v => v.toLowerCase().replaceAll(" ", "_"))
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
        options: options.seasons.map(v => v.toLowerCase().replaceAll(" ", "_"))
      },
      {
        type: "format",
        placeholder: "filter.placeholderFormat",
        title: "filter.format",
        langPath: "anime_formats.",
        options: options.format.map(v => v.toLowerCase().replaceAll(" ", "_"))
      },
      {
        type: "airing",
        placeholder: "filter.placeholderAiring",
        title: "filter.airing",
        langPath: "anime_statuses.",
        options: options.statuses.map(v => v.toLowerCase().replaceAll(" ", "_"))
      },
    ]

    this.metadata = {
      ...this.metadata,
      searchOption: newOptions
    }
  }

  async schedule(airingStart: number, airingEnd: number): Promise<containerData> {
    // let week = getWeek()
    // console.log(week)

    const days = [t("week.sunday"), t("week.monday"), t("week.tuesday"), t("week.wednesday"), t("week.thursday"), t("week.friday"), t("week.saturday")];
    console.log(airingStart, airingEnd)
    let variables = {
      page: 1,
      perPage: 50,
      sort: ["TIME"],
      airingAtGreater: airingStart,
      airingAtLesser: airingEnd
    }

    const date = new Date(unixToDateTime(airingStart))

    let response = await sendPost(variables, graphicAiringAnime)
    console.log(response)
    if (!response.success || !response.json) return {
      title: days[date.getDay()],
      data: []
    }

    let data = response.json["data"]["Page"]["airingSchedules"].map((v) => {
      const converted = Convert(v["media"])
      return {
        ...converted,
        animeData: {
          ...converted.AnimeData,
          nextAiringEpisode: {
            airingAt: v["airingAt"],
            episode: v["episode"],
            timeUntilAiring: v["timeUntilAiring"]
          }
        }
      }
    })

    return {
      title: days[date.getDay()],
      data: data
    }
  }

  search = async (name: string, page: number, params?: genresSearchFormat) => {
    try {
      const config = getConfig()
      let title: string | undefined = undefined
      if (!(name.replaceAll(" ", "") == "")) title = `home.searching/${name}`

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
      }, graphicHomeApi.replaceAll("CHANGE_ME_PAGE_SIZE", config.anilist.maxpagesize.toString()))

      if (!data.success || !data.json) {
        console.warn("home/anilistapi Failed Request", data)
        return
      }
      console.log(data)

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
      let req = await sendPost({ id: context.id, type: "ANIME" }, graphicApIDAnime)
      if (!req.success || !req.json) return
      return Convert(req.json.data.Media).AnimeData
    } catch (error) {
      console.error("Uknown error in anime/anilistapi", error)
      return
    }
  }

  getManga = async (id: string) => {
    try {
      let req = await sendPost({ id: id, type: "MANGA" }, graphicApIDAnime)
      if (!req.success || !req.json) return
      return Convert(req.json.data.Media).AnimeData
    } catch (error) {
      console.error("Uknown error in getManga/anilistapi", error)
      return
    }
  }
}