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
  let episodesVersion: Array<string> = ["sub", "dub", "raw"]
  const info = await getInformation(id)
  console.log('info anime: ', info)
  episodesVersion.forEach((element) => {
    if (parseInt(info["show"]["availableEpisodes"][element]) != 0) {
      const list: Array<number> = info["show"]['availableEpisodesDetail'][element]
      episodeList.push({ type: element, avaibleEpisodes: info["show"]["availableEpisodes"][element], listEpisodes: list.reverse() })
    }
  })
  
  let tmpimg = info['show']['thumbnail']
  if (tmpimg != null && tmpimg.startsWith('https') != true) tmpimg = 'https://wp.youtube-anime.com/aln.youtube-anime.com/' + tmpimg
  return {
    id: info['show']['_id'],
    title: info['show']['name'],
    description: info['show']['description'],
    images: { banner: info['show']['banner'], cover: tmpimg },
    information: { format: info['show']['type'], episodeDuration: info['show']['episodeDuration'], status: info['show']['status'], season: info['show']['season'], airedStart: info['show']['airedStart'], episodesCount: info['show']['episodeCount'], airedEnd: info['show']['airedEnd'] },
    episodes: episodeList
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

export async function get_player_anime(id: string, episode: { type: string, ep: string }): Promise<{ url: string, res: string, hostname: string, hls: boolean }[]> {
  const players = await getPlayerUrls(id, episode.ep, episode.type)
  if (players) {
    return players
  }
  return []
}
