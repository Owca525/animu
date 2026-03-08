import { request } from "./functions"
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
      }
      animethemeentries {
        videos {
          nodes {
            filename
            resolution
            link
          }
        }
      }
    }
  }
}
`

export async function requestAnimeMedia(anilistID: number): Promise<animeOpeningsFormat[]> {
    try {
        const response = await request(QUERY_API, { method: "POST", headers: header, body: JSON.stringify({ query: videosQuery, variables: { id: [anilistID] } }) })
        console.log(response)
        if (!response.success || !response.json) return []
        const themes = response.json["data"]["findAnimeByExternalSite"][0]["animethemes"]
        let list: animeOpeningsFormat[] = []
        for (let index = 0; index < themes.length; index++) {
            const element = themes[index];
            const videos = element["animethemeentries"]
            videos.forEach((item) => {
              const match = item["videos"]["nodes"][0]["filename"].match(/v\d+$/)
              const variant = match ? match[0] : undefined
              list.push({
                type: element["type"],
                variant: variant,
                musicTitle: element["song"]["title"],
                videos: item["videos"]["nodes"].map((vid) => {
                  return { filename: vid["filename"], url: vid["link"], resolution: vid["resolution"] }
                })
              })
            })
        }
        console.log(list)
        return list
    } catch (error) {
        console.error("animeThemes/requestAnimeMedia", error)
        return []
    }
}