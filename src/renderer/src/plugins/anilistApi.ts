import { genYearsList } from "@renderer/utils/functions";
import { cardData, containerData, FilterParams, pluginFormat } from "@renderer/utils/GlobalInterface";
import { setHomeData, UpdateHomeData } from "@renderer/utils/pluginApi";

const pageSize = 20

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
      averageScore
      nextAiringEpisode {
        airingAt
        timeUntilAiring
        episode
      }
      characters(perPage: 10) {
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
    }
  }
}
`;

const genres = `
query {
  GenreCollection
}
`

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
  console.log(convert)
  let characters: any = []
  try {
      for (let index = 0; index < convert.characters.edges.length; index++) {
        const element = convert.characters.edges[index];
        if (element.voiceActors.length === 0) characters.push({role: element.role, character: { id: element.node.id, image: element.node.image.large, name: element.node.name.full }})
        else characters.push({role: element.role, character: { id: element.node.id, image: element.node.image.large, name: element.node.name.full }, voiceActor: { id: element.voiceActors[0].id, image: element.voiceActors[0].image.large, name: element.voiceActors[0].name.full }})
    }
  } catch (error) {
    console.log(error)
  }
  
  return {
    AnimeData: {
      ...convert,
      coverImage: convert.coverImage.extraLarge ? convert.coverImage.extraLarge : convert.coverImage.large,
      title: convert.title.romaji,
      studios: convert.studios.edges.map((studio) => studio.node.name),
      characters: characters
    },
  }
}

async function sendToApi(variable: any): Promise<cardData[]> {
  let data = await window.api.request.post("https://graphql.anilist.co", header, { query: graphicApi, variables: variable })
  if (data.success) {
    return data.data.data.Page.media.map((data) => Convert(data))
  }
  console.log(data)
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

async function SearchAnilistApi(text: string, page: number, params?: FilterParams): Promise<void> {
  let variables: any = {
      page: page,
      sort: "SEARCH_MATCH",
      type: "ANIME"
  }
  let title: string | undefined = undefined
  
  if (!(text.replaceAll(" ", "") == "")) {
    variables = { ...variables, search: text }
    title = `Searching: ${text}`
  }
  
  if (params && params.genres) {
    variables = { ...variables, genres: params.genres }
  }
  if (params && params.years) {
    variables = { ...variables, seasonYear: parseInt(params.years) }
  }
  if (params && params.seasons) {
    variables = { ...variables, season: params.seasons.toUpperCase() }
  }
  if (params && params.format) {
    variables = { ...variables, format: params.format.map((tmp) => tmp.toUpperCase().replaceAll(" ", "_")) }
  }
  if (params && params.airing) {
    variables = { ...variables, status: params.airing.toUpperCase().replaceAll(" ", "_") }
  }

  console.log(variables)
  let data = {
    title: title,
    data: await sendToApi(variables),
    onScrollDownFunction: (currentPage: number) => SearchAnilistApi(text, currentPage, params)
  }

  if (page > 1) UpdateHomeData(async () => { return { data: data, maxPage: pageSize } })
  else setHomeData(async () => [data])
}

async function getFullCategory(params, title: string) {
  let data = await sendToApi(params)
  setHomeData(async () => {
    return [
      {
        title: title,
        data: data,
        onScrollDownFunction: (page) => updateCategory(page, params, title)
      }
    ]
  })
}

async function updateCategory(page: number, variables: any, title: string) {
  let data = {
    title: title,
    data: await sendToApi({ ...variables, page: page }),
    onScrollDownFunction: (page) => updateCategory(page, variables, title)
  }
  console.log(data)
  UpdateHomeData(async () => { return { data: data, maxPage: pageSize } })
}

async function CreateHomePage(): Promise<containerData[]> {
  let season = getSeasonFromDate()
  return [
    {
      title: "Trending Now",
      data: await sendToApi(tendingAnime),
      horizontal: true,
      onTitleClick: () => getFullCategory(tendingAnime, "Trending Now"),
    },
    {
      title: "Popular in this Season",
      data: await sendToApi({
        page: 1,
        season: season.season,
        seasonYear: season.seasonYear,
        type: "ANIME"
      }),
      horizontal: true,
      onTitleClick: () => getFullCategory({
        page: 1,
        season: season.season,
        seasonYear: season.seasonYear,
        type: "ANIME"
      }, "Popular in this Season")
    },
    {
      title: "All Time Popular",
      data: await sendToApi(allPopular),
      horizontal: true,
      onTitleClick: () => getFullCategory(allPopular, "All Time Popular")
    }
  ]
}

async function getGenres(): Promise<string[]> {
  let data = await window.api.request.post("https://graphql.anilist.co", header, { query: genres, variables: "" })
  if (data.success) return data.data.data.GenreCollection
  return []
}

export const infoPlugin: pluginFormat = {
  version: "0.1",
  name: "AnilistApi",
  author: "Owca525",
  information: {
    pageSize: pageSize,
    home: () => setHomeData(CreateHomePage),
    search: SearchAnilistApi,
    searchOption: {
      genres: await getGenres(),
      seasons: ["Winter", "Spring", "Summer", "Fall"],
      years: genYearsList(1940),
      format: ["TV", "Movie", "TV Short", "special", " OVA", "ONA"],
      statuses: ["Releasing", "Finished", "Not Yet Aired", "Cancelled"]
    }
  }
}