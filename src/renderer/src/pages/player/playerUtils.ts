import { formatTime, request, SaveToClipboard, timeToSeconds } from "@renderer/utils/functions";
import { getConfig } from "@renderer/utils/stores/config";
import { AnimeData, animulistProps, episodeMetadata, indentityPlayer, playerChapterList, playerDataExtended, Thumbnail } from "@renderer/utils/types";
import { unwrap } from "solid-js/store";

export async function VTTstoryBoardParser(url: string | undefined) {
    if (!url) return

    let data = await request(url)
    if (!data.success) return
    const lines = data.text.split("\n").map((l: string) => l.trim());
    let thumbnails: Thumbnail = { src: "", metadata: [] };
    const src: string = url.slice(0, url.lastIndexOf("/") + 1)
    let metadata: { start: number; end: number; imgX: number; imgY: number; }[] = []

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("-->")) {
            const [start, end] = lines[i].split(" --> ");
            const next = lines[i + 1];
            if (!next) continue;

            const [file, fragment] = next.split("#");
            let x = 0,
                y = 0

            if (fragment?.startsWith("xywh=")) {
                const [xx, yy] = fragment.replace("xywh=", "").split(",").map(Number);
                x = xx;
                y = yy;
            }

            const finnalSrc: string = `${src}${file}`
            thumbnails = { ...thumbnails, src: finnalSrc }
            metadata.push({
                start: timeToSeconds(start),
                end: timeToSeconds(end),
                imgX: x,
                imgY: y,
            });
        }
    }

    return { ...thumbnails, metadata: metadata };
}

export function addTime(durration: number): string {
    const now = new Date();
    let [sec, min, hour] = formatTime(durration).split(":").reverse()

    if (hour) now.setMinutes(now.getHours() + parseInt(hour));
    if (min) now.setMinutes(now.getMinutes() + parseInt(min));
    if (sec) {
        let tmp = parseInt(sec)
        if (tmp <= 59) now.setSeconds(now.getSeconds() + (tmp - 1))
        if (tmp <= 0) now.setSeconds(now.getSeconds() + (tmp + 2))
    };

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    return `${hours}:${minutes}`;
}

export function countImages(data: episodeMetadata[]): boolean {
    let counter: number = 0
    for (let index = 0; index < data.length; index++) {
        const element = data[index];
        if (element.img) counter += 1
    }
    if (data.length <= counter) return true
    return false
}

export async function fetchResolutions<F extends (data: playerDataExtended) => Promise<any>>(tmpData: playerDataExtended, func: F): Promise<{ success: boolean, data: Awaited<ReturnType<F>> | undefined }> {
    if (!func) return { success: false, data: undefined }
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000);

    try {
        return { success: true, data: await func(tmpData) }
    } catch (error) {
        console.error(error, "fetchResolutions player")
        return { success: false, data: undefined }
    } finally {
        clearInterval(id)
    }
}

export function GenerateOpeningEnding(data: playerChapterList[] | undefined, duration: number): { left: number, width: number, name?: string, type: "opening" | "ending" | "other" }[] {
    if (!data) return []

    return data.map((element) => ({
        left: (element.start / duration) * 100,
        width: ((element.end - element.start) / duration) * 100,
        name: element.name,
        type: element.type
    }))
}

export function EpisodeAvaible(cur: episodeMetadata, list: episodeMetadata[]) {
    if (list.length <= 0) return { nextEpisode: undefined, prevEpisode: undefined }

    const index = list.findIndex((v) => v["ep"] == cur["ep"])
    if (index < 0) return { nextEpisode: undefined, prevEpisode: undefined }

    return {
        nextEpisode: list[index + 1],
        prevEpisode: list[index - 1]
    }
}

export function generateShareURL(anime_data?: { AnimeData: AnimeData, saveData: indentityPlayer, animulist?: animulistProps }, episode?: { type: string, current: string }, currentTime?: number) {
    if (!anime_data || !episode || currentTime) return

    const deepStr = `${anime_data.AnimeData.id},${anime_data.saveData.pluginName},${episode.type},${anime_data.AnimeData.player_ID},${episode.current},${currentTime}`

    const config = unwrap(getConfig())
    SaveToClipboard("text", `${config.deepLinkURL}/?anime=${btoa(deepStr)}`)
}

export function DownloadVideo(url: string) {
    const link = document.createElement('a');
    link.href = url;
    link.download = url;
    link.click();
}