import { unwrap } from "solid-js/store"
import { request } from "./functions"
import { addOpeningCache, animeOpeningsCache } from "./stores/global"
import { animeOpeningsFormat } from "./types"

const QUERY_API = "https://graphql.animethemes.moe/"

const header = {
  "Content-Type": "application/json",
  "Accept": "application/json",
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
}

const videosQuery = `
query ($id: [Int!]) {
  findAnimeByExternalSite(
    site: ANILIST
    id: $id
  ) {
    animethemes {
      type
      song {
        title
        performances {
          artist {
            ... on Artist {
              name
            }
          }
        }
      }
      animethemeentries {
        videos {
          nodes {
            filename
            resolution
            link
            audio {
              path
            }
          }
        }
      }
    }
  }
}
`

export async function requestAnimeMedia(anilistID: number): Promise<animeOpeningsFormat[]> {
  const cache = unwrap(animeOpeningsCache())
  if (cache[anilistID]) return cache[anilistID]

  const response = await request(QUERY_API, { method: "POST", headers: header, body: JSON.stringify({ query: videosQuery, variables: { id: [anilistID] } }) })
  if (!response.success || !response.json) return []
  const themes = response.json["data"]["findAnimeByExternalSite"][0]["animethemes"]
  let list: animeOpeningsFormat[] = []
  for (let index = 0; index < themes.length; index++) {
    try {
      const element = themes[index];
      const videos = element["animethemeentries"]
      videos.forEach((item) => {
        const match = item["videos"]["nodes"][0]["filename"].match(/v\d+$/)
        const variant = match ? match[0] : undefined
        const artist = element["song"]["performances"].length > 0 ? element["song"]["performances"][0]["artist"]["name"] : ""


        list.push({
          type: element["type"],
          variant: variant,
          artist: artist,
          musicTitle: element["song"]["title"],
          videos: item["videos"]["nodes"].map((vid) => {
            return { filename: vid["filename"], url: vid["link"], resolution: vid["resolution"], audio: vid["audio"] ? `https://a.animethemes.moe/${vid["audio"]["path"].split("/").pop()}` : undefined }
          })
        })
      })
    } catch (error) {
      console.error("animeThemes/requestAnimeMedia", error)
    }
  }

  addOpeningCache(anilistID, list)
  return list
}