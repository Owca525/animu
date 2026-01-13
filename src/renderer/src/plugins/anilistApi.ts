import { genYearsList, request } from "@renderer/utils/functions";
import { AnimeData, cardData, containerData, genresSearchFormat, informationPluginFormat } from "@renderer/utils/types";

const pageSize = 20

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
            title {
              romaji
              english
              native
            }
            coverImage {
              extraLarge
              large
            }
            bannerImage
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
  $isAdult: Boolean = false,
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
  Page(page: $page, perPage: ${pageSize}) {
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

// const graphicAiringAnime = `
// query AiringAnimes($page: Int, $perPage: Int, $sort: [AiringSort], $airingAtGreater: Int, $airingAtLesser: Int) {
//     Page(page: $page, perPage: $perPage) {
//         airingSchedules(sort: $sort, airingAt_greater: $airingAtGreater, airingAt_lesser: $airingAtLesser) {
//         id
//         airingAt
//         episode

//         media {
//           ${animeData}
//         }
//       }
//     }
// }
// `

const graphicHomeApi = `
  query (
    $season: MediaSeason,
    $seasonYear: Int,
  ) {
    trending: Page(page: 1, perPage: ${pageSize}) {
      media(sort: TRENDING_DESC, type: ANIME, isAdult: false) {
        ...media
      }
    }
    season: Page(page: 1, perPage: ${pageSize}) {
      media(season: $season, seasonYear: $seasonYear, sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
        ...media
      }
    }
    popular: Page(page: 1, perPage: ${pageSize}) {
      media(sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
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
) {
  Media(id: $id, type: ANIME) {
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
          relationType: element.relationType
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

// WHY THE FUCK THIS DOESN'T WORK IF I CALL window.api.request.post IN CreateHomePage
// Jeśli api anilist jest offline to daje "Forbidden" w statusText i error 403 request 
async function sendPost(variable: any, query: any) {
  return await request("https://graphql.anilist.co", { method: "POST", headers: header, body: JSON.stringify({ query: query, variables: variable }) } as any)
}

async function sendToApi(variable: any, query: any): Promise<cardData[]> {
  let data = await request("https://graphql.anilist.co", { method: "POST", headers: header, body: JSON.stringify({ query: query, variables: variable }) } as any)
  if (data.success && data.json) {
    return data.json.data.Page.media.map((data) => Convert(data))
  }
  return []
}

function getSeasonFromDate() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  let season: string;

  if (month >= 1 && month <= 3) {
    season = "WINTER";
  } else if (month >= 4 && month <= 6) {
    season = "SPRING";
  } else if (month >= 7 && month <= 9) {
    season = "SUMMER";
  } else {
    season = "FALL";
  }

  return { season, seasonYear: year };
}

// async function getGenres(): Promise<string[]> {
//   let data = await window.api.request.post("https://graphql.anilist.co", header, { query: genres, variables: "" })
//   if (data.success) return data.data.data.GenreCollection
//   return []
// }

async function fetchCategory(params: any, title: string): Promise<containerData> {
  const globalParams = params
  console.log(params, title)
  let container: containerData = {
    title: title,
    data: await sendToApi(params, graphicApi),
    onScrollDownFunction: async (_search, page, _params) => {
      let resp = await sendToApi({ ...globalParams, page: page }, graphicApi)
      console.log(globalParams, page, resp)
      return {
        maxPage: pageSize,
        data: resp
      }
    }
  }
  return container
}

async function searchOnAnilist(_name: string, page: number, params?: genresSearchFormat): Promise<{ data: cardData[]; maxPage: number; }> {
  try {
    let variables: any = {
      page: page,
      sort: "SEARCH_MATCH",
      type: "ANIME"
    }

    if (params) {
      if (params) variables = { ...variables, genres: params.genres }
      if (params.genres) variables = { ...variables, genres: params.genres }
      if (params.genres) variables = { ...variables, genres: params.genres }
      if (params.years) variables = { ...variables, seasonYear: parseInt(params.years) }
      if (params.seasons) variables = { ...variables, season: params.seasons.toUpperCase() }
      if (params.format) variables = { ...variables, format: params.format.map((tmp) => tmp.toUpperCase().replaceAll(" ", "_")) }
      if (params.airing) variables = { ...variables, status: params.airing.toUpperCase().replaceAll(" ", "_") }
    }

    const resp = await sendToApi(variables, graphicApi)
    return {
      data: resp,
      maxPage: pageSize
    }
  } catch (error) {
    console.error("Error in searchOnAnilist/anilist", error)
    return {
      data: [],
      maxPage: pageSize
    }
  }
}

export default class AnilistApi implements informationPluginFormat {
  metadata = {
    version: "2.0",
    name: "AnilistApi",
    pageSize: pageSize,
    searchOption: {
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
  };
  // async schedule(context: { airingStart: number; airingEnd: number; }, callbacks: { onSuccess: (data: containerData) => void; onError: (error: string) => void; }) {
  //   let week = getWeek()
  //   console.log(week)
  //   let variables = {
  //     page: 1,
  //     perPage: 50,
  //     sort: ["TIME"],
  //     airingAtGreater: week.startWeekUnix,
  //     airingAtLesser: week.endWeekUnix
  //   }

  //   console.log(await sendPost(variables, graphicAiringAnime))
  // }

  async search(context: { name: string; page: number; params?: genresSearchFormat; }, callbacks: { onSuccess: (data: containerData) => void; onError: (error: string) => void; }) {
    try {
      let variables: any = {
        page: context.page,
        sort: "SEARCH_MATCH",
        type: "ANIME"
      }
      let title: string | undefined = undefined

      if (!(context.name.replaceAll(" ", "") == "")) {
        variables = { ...variables, search: context.name }
        title = `Searching: ${context.name}`
      }
      if (context.params) {
        if (context.params) variables = { ...variables, genres: context.params.genres }
        if (context.params.genres) variables = { ...variables, genres: context.params.genres }
        if (context.params.genres) variables = { ...variables, genres: context.params.genres }
        if (context.params.years) variables = { ...variables, seasonYear: parseInt(context.params.years) }
        if (context.params.seasons) variables = { ...variables, season: context.params.seasons.toUpperCase() }
        if (context.params.format) variables = { ...variables, format: context.params.format.map((tmp) => tmp.toUpperCase().replaceAll(" ", "_")) }
        if (context.params.airing) variables = { ...variables, status: context.params.airing.toUpperCase().replaceAll(" ", "_") }
      }

      callbacks.onSuccess({
        title: title,
        data: await sendToApi(variables, graphicApi),
        onScrollDownFunction: async (search, page, params) => await searchOnAnilist(search ? search : "", page, params)
      })
    } catch (error) {
      console.error("Error in search/Anilistapi", error)
      callbacks.onError(`${error}`)
    }
  }
  async home(callbacks: { onSuccess: (data: { topCards?: containerData, sections: containerData[] }) => void; onError: (error: string) => void; }) {
    try {
      let season = getSeasonFromDate()
      let data = await sendPost({ season: season.season, seasonYear: season.seasonYear }, graphicHomeApi)
      if (!data.success || !data.json) {
        console.log(data)
        return callbacks.onError("Anilist isn't accessible")
      }
      let home: containerData[] = [
        {
          title: "home.trending_now",
          data: data.json.data.trending.media.map((anime) => Convert(anime)),
          horizontal: true,
          onTitleClick: async () => await fetchCategory(tendingAnime, "home.trending_now"),
        },
        {
          title: "home.popular_in_this_season",
          data: data.json.data.season.media.map((anime) => Convert(anime)),
          horizontal: true,
          onTitleClick: async () => await fetchCategory({
            page: 1,
            season: season.season,
            seasonYear: season.seasonYear,
            type: "ANIME"
          }, "home.popular_in_this_season"),
        },
        {
          title: "home.all_time_popular",
          data: data.json.data.popular.media.map((anime) => Convert(anime)),
          horizontal: true,
          onTitleClick: async () => await fetchCategory(allPopular, "home.all_time_popular"),
        }
      ]
      callbacks.onSuccess({ sections: home, topCards: home[0] })
    } catch (error) {
      console.error("Error in home/anilistapi", error)
      callbacks.onError("Anilist isn't accessible")
    }
  }
  async anime(context: { id: string; }) {
    try {
      let req = await sendPost({ id: context.id }, graphicApIDAnime)
      console.log(req)
      if (!req.success || !req.json) return
      return Convert(req.json.data.Media).AnimeData
    } catch (error) {
      console.error("Uknown error in anime/anilistapi", error)
      return
    }
  }
}