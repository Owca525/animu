import { checkTimeDriffrentUnix, dateToUnix, request } from "./functions"
import { animeOpeningsFormat } from "./types"

const QUERY_API = "https://graphql.animethemes.moe/"

const header = {
  "Content-Type": "application/json",
  "Accept": "application/json",
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
}

const videosQuery = `
query ($id: [Int!]) {
  findAnimeByExternalSite(site: ANILIST, id: $id) {
    animethemes {
      type
      song {
        title {
          romaji
          native
        }
      }
      animethemeentries {
        videos {
          nodes {
            filename
            resolution
            size
            link
            audio {
              filename
              link
              size
            }
          }
        }
        animetheme {
          song {
            performances {
              artist {
                name {
                  main
                }
              }
            }
          }
        }
      }
    }
  }
}
`

function AddCache(id: number, data: animeOpeningsFormat[]) {

  const cache = localStorage.getItem("animeThemesCacheObject")

  try {
    if (!cache) {
      localStorage.setItem("animeThemesCacheObject", JSON.stringify([...new Map<string, { data: animeOpeningsFormat[], time: number }>([`${id}`, { data: data, time: dateToUnix(new Date().toString()) }] as any)]))
      return
    }

    const newMap = new Map<string, { data: animeOpeningsFormat[], time: number }>(JSON.parse(cache!))

    newMap.set(`${id}`, { data: data, time: dateToUnix(new Date().toString()) })

    localStorage.setItem("animeThemesCacheObject", JSON.stringify([...newMap]))

  } catch (error) {
    console.error("AnimeThemes/AddCache", error, id, data)
  }

}

function GetCache(id: number) {
  try {
    const cache = localStorage.getItem("animeThemesCacheObject")

    if (!cache) return

    const newMap = new Map<string, { data: animeOpeningsFormat[], time: number }>(JSON.parse(cache))

    return newMap.get(`${id}`)
  } catch (error) {
    console.error("AnimeThemes/GetCache", error, id)
    return
  }
}

export async function requestAnimeMedia(anilistID: number): Promise<animeOpeningsFormat[]> {
  const cache = GetCache(anilistID)

  try {
    if (cache && checkTimeDriffrentUnix(undefined, cache["time"])["day"] < 31) return cache["data"]
  } catch (error) {
    console.error("AnimeThemes/requestAnimeMedia", error)
  }

  const response = await request(QUERY_API, { method: "POST", headers: header, body: JSON.stringify({ query: videosQuery, variables: { id: [anilistID] } }) })

  /* IFDEF DEBUG */
  console.warn("requestAnimeMedia", response, anilistID)
  /* ENDIF */

  try {
    if (!response.success || !response.json) return cache ? JSON.parse(`${cache["data"]}`) : []
    if (response.json["data"]["findAnimeByExternalSite"].length <= 0) return cache ? JSON.parse(`${cache["data"]}`) : []
  } catch (error) {
    return []
  }

  const themes = response.json["data"]["findAnimeByExternalSite"][0]["animethemes"]
  let list: animeOpeningsFormat[] = []
  for (let index = 0; index < themes.length; index++) {
    try {
      const element = themes[index];
      const videos = element["animethemeentries"]
      videos.forEach((item) => {
        const match = item["videos"]["nodes"][0]["filename"].match(/(?:OP|ED)(\d+)/)
        const variant = match ? match[1] : undefined
        const artist = item["animetheme"]["song"]["performances"].length > 0 ? item["animetheme"]["song"]["performances"][0]["artist"]["name"]["main"] : ""

        list.push({
          type: element["type"],
          variant: variant,
          artist: artist,
          title: element["song"]["title"],
          videos: item["videos"]["nodes"].map((vid) => {
            return { filename: vid["filename"], url: vid["link"], resolution: vid["resolution"], audio: vid["audio"] ? `https://a.animethemes.moe/${vid["audio"]["link"].split("/").pop()}` : undefined }
          })
        })
      })
    } catch (error) {
      console.error("animeThemes/requestAnimeMedia", error)
    }
  }

  AddCache(anilistID, list)

  return list
}