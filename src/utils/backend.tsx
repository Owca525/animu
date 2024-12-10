import { invoke } from "@tauri-apps/api/core";
import { InformationData } from "../utils/interface"

export async function get_recent(): Promise<{ id: string, title: string; img: string; }[]> {
    var anime: { id: string; title: string; img: string; }[] = [];
    const response: string = await invoke("get_recent_anime");
    const recent = JSON.parse(response);
    console.log("recent:", recent)
    var tmp = await recent["data"]["shows"]["edges"];
    tmp.forEach((element: any) => {
        let tmpimg: string = element["thumbnail"]
        if (tmpimg != null && tmpimg.startsWith("https") != true) {
            tmpimg = "https://wp.youtube-anime.com/aln.youtube-anime.com/" + tmpimg;
        };
        anime.push({ id: element["_id"], title: element["name"], img: tmpimg})
    });

    return anime
}

export async function get_information(id: string): Promise<InformationData> {
    const resp: string = await invoke("get_anime_data", { id: id})
    const info = JSON.parse(resp);
    console.log("info anime: ", info)
    const episode_list = info["data"]["show"]["availableEpisodesDetail"]["sub"];
    episode_list.reverse();
    var tmpimg = info["data"]["show"]["thumbnail"];
    if (tmpimg != null && tmpimg.startsWith("https") != true) {
        tmpimg = "https://wp.youtube-anime.com/aln.youtube-anime.com/" + tmpimg;
    };
    return { id: info["data"]["show"]["_id"], title: info["data"]["show"]["name"], description: info["data"]["show"]["description"], img: tmpimg, episodes: episode_list}
}

export async function get_search(name: string): Promise<{ id: string, title: string; img: string; }[]> {
    var anime: { id: string; title: string; img: string; }[] = [];
    const resp: string = await invoke("get_search", { name: name })
    const search = JSON.parse(resp);
    console.log("seach", search)
    var tmp = await search["data"]["shows"]["edges"];
    tmp.forEach((element: any) => {
        let tmpimg: string = element["thumbnail"]
        if (tmpimg != null && tmpimg.startsWith("https") != true) {
            tmpimg = "https://wp.youtube-anime.com/aln.youtube-anime.com/" + tmpimg;
        };
        anime.push({ id: element["_id"], title: element["name"], img: tmpimg})
    });

    return anime
}

export async function get_player_anime(id: string, ep: string | number): Promise<{ players: any[] }> {
    var player_urls: any[] = [];
    const resp: string = await invoke("get_episode_url", { id: id, ep: ep });
    const players = JSON.parse(resp);
    players.forEach((element: any) => {
        element = JSON.parse(element)["links"][0]["link"];
        player_urls.push(element)
    })
    return { players: player_urls };
}