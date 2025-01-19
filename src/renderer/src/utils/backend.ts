import { CardProps, InformationData } from './interface'
import { SearchAnime, getRecentAnime, getInformation, getPlayerUrls } from '../../plugins/allmanga'

export async function get_recent(): Promise<CardProps[]> {
  try {
    var anime: { id: string; title: string; img: string }[] = []
    const recent = await getRecentAnime()
    console.log('recent:', recent)
    var tmp = await recent['shows']['edges']
    tmp.forEach((element: any) => {
      let tmpimg: string = element['thumbnail']
      if (tmpimg != null && tmpimg.startsWith('https') != true) {
        tmpimg = 'https://wp.youtube-anime.com/aln.youtube-anime.com/' + tmpimg + '?w=250'
      }
      anime.push({ id: element['_id'], title: element['name'], img: tmpimg })
    })
    return anime
  } catch (Error) {
    return [{ id: '', title: 'error', img: '' }]
  }
}

export async function get_information(id: string): Promise<InformationData> {
  let episodeList: Array<{ type: string, avaibleEpisodes: number, listEpisodes: Array<number> }> = []
  const info = await getInformation(id)
  console.log('info anime: ', info)
  if (parseInt(info["show"]["availableEpisodes"]["sub"]) != 0) episodeList.push({ type: "sub", avaibleEpisodes: info["show"]["availableEpisodes"]["sub"], listEpisodes: info["show"]['availableEpisodesDetail']['sub'] })
  if (parseInt(info["show"]["availableEpisodes"]["dub"]) != 0) episodeList.push({ type: "dub", avaibleEpisodes: info["show"]["availableEpisodes"]["dub"], listEpisodes: info["show"]['availableEpisodesDetail']['dub'] })
  if (parseInt(info["show"]["availableEpisodes"]["raw"]) != 0) episodeList.push({ type: "raw", avaibleEpisodes: info["show"]["availableEpisodes"]["raw"], listEpisodes: info["show"]['availableEpisodesDetail']['raw'] })
  let tmpimg = info['show']['thumbnail']
  if (tmpimg != null && tmpimg.startsWith('https') != true) tmpimg = 'https://wp.youtube-anime.com/aln.youtube-anime.com/' + tmpimg
  return {
    id: info['show']['_id'],
    title: info['show']['name'],
    description: info['show']['description'],
    img: tmpimg,
    episodes: episodeList,
    banner: info['show']['banner']
  }
}

export async function get_search(
  name: string
): Promise<{ id: string; title: string; img: string }[]> {
  var anime: { id: string; title: string; img: string }[] = []
  const search = await SearchAnime(name)
  console.log('seach', search)
  var tmp = await search['shows']['edges']
  tmp.forEach((element: any) => {
    let tmpimg: string = element['thumbnail']
    if (tmpimg != null && tmpimg.startsWith('https') != true) {
      tmpimg = 'https://wp.youtube-anime.com/aln.youtube-anime.com/' + tmpimg
    }
    anime.push({ id: element['_id'], title: element['name'], img: tmpimg })
  })

  return anime
}

export async function get_player_anime(id: string, ep: string | number): Promise<{ url: string, res: string, hostname: string, hls: boolean }[]> {
  const players = await getPlayerUrls(id, ep.toString())
  if (players) {
    return players
  }
  return []
}
