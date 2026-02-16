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
            size
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
            const videos = element["animethemeentries"][0]
            console.log(element, videos)
            list.push({
                type: element["type"],
                title: element["song"]["title"],
                resolution: videos["videos"]["nodes"][0]["resolution"],
                size: videos["videos"]["nodes"][0]["size"],
                url: videos["videos"]["nodes"][0]["link"],
                filename: videos["videos"]["nodes"][0]["filename"]
            })
        }

        return list
    } catch (error) {
        console.error("animeThemes/requestAnimeMedia", error)
        return []
    }
}