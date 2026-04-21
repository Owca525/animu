import { formatTime, request, toSeconds } from "@renderer/utils/functions";
import { episodeMetadata, playerDataExtended, Thumbnail } from "@renderer/utils/types";

export async function VTTstoryBoardParser(url: string) {
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
                start: toSeconds(start),
                end: toSeconds(end),
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