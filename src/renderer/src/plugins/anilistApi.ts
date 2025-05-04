import { cardData, containerData, pluginFormat } from "@renderer/utils/GlobalInterface";

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
      id
      title {
        english
        romaji
      }
      coverImage {
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
      isAdult
      averageScore
      popularity
      nextAiringEpisode {
        airingAt
        timeUntilAiring
        episode
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

const header = {
  "Content-Type": "application/json",
  "Accept": "application/json",
}

const trendingAnime = { page: 1, sort: [ "TRENDING_DESC", "POPULARITY_DESC" ], type: "ANIME" }

function Convert(convert: any): cardData {
  return {
    AnimeData: {
      ...convert,
      coverImage: convert.coverImage.large,
      title: convert.title.romaji
    },
  }
}

async function sendToApi(variable: any) {
  let data = await window.api.request.post("https://graphql.anilist.co", header, { query: graphicApi, variables: variable })
  if (data.success) {
    return data.data.data.Page.media.map((data) => Convert(data))
  }
  return []
}

function getSeasonFromDate(date: Date) {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  if (month >= 12 || month <= 2) {
      return ["WINTER", year];
  } else if (month >= 3 && month <= 5) {
      return ["SPRING", year];
  } else if (month >= 6 && month <= 8) {
      return ["SUMMER", year];
  } else if (month >= 9 && month <= 11) {
      return ["FALL", year];
  }
  return [];
}

export async function CreateHomePage(): Promise<containerData[]> {
  let season = getSeasonFromDate(new Date())
  return [
    // {
    //   title: "Trending Now",
    //   data: await sendToApi(trendingAnime),
    //   horizontal: true
    // },
    {
      title: "Popular in this Season",
      data: await sendToApi({
        page: 1, 
        season: season[0],
        seasonYear: season[1],
        type: "ANIME"
      }),
      horizontal: true
    },
    // {
    //   title: "All Time Popular",
    //   data: await sendToApi({
    //     page: 1, 
    //     sort: "POPULARITY_DESC", 
    //     type: "ANIME"
    //   }),
    //   horizontal: true
    // }
  ]
}

export const infoPlugin: pluginFormat = {
  version: "0.1",
  name: "AnilistApi",
  author: "Owca525",
  information: {
    home: CreateHomePage,
    search: (text: string) => {console.log(text)}
  }
}