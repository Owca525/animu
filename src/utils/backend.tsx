import { invoke } from "@tauri-apps/api/core";

export async function get_recent(): Promise<{ id: string, title: string; img: string; }[]> {
    var anime: { id: string; title: string; img: string; }[] = [];
    const response: string = await invoke("get_recent_anime");
    const recent = JSON.parse(response);
    console.log(recent)
    var tmp = await recent.data.shows.edges;
    tmp.forEach((element: any) => {
        var tmpimg: string = element["thumbnail"]
        if (tmpimg.startsWith("https") != true) {
            tmpimg = "https://wp.youtube-anime.com/aln.youtube-anime.com/" + tmpimg;
        };
        anime.push({ id: element["_id"], title: element["name"], img: tmpimg})
    });

    return anime
}