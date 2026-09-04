import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { ActivityType } from 'discord-api-types/v10';
import {
    animuUserData,
    config,
    globalTray,
    mainTrayMenu,
    newConfigPath,
    userAgent,
    yt_dlp,
} from '.';
import {
    app,
    clipboard,
    ipcMain,
    Menu,
    nativeImage,
    shell
} from 'electron';
import { Client } from '@xhayper/discord-rpc';
import { exec, execSync } from 'child_process';
import { setCurrentLang, t } from './i18n';

// import express from "express";
// import { Readable } from "stream";
// import { requestResponseVideo } from "./types";

let rpc: Client | undefined = undefined

// Client id for Discord Rich presence
export const CLIENT_ID = '1320810160205070377';
export const runTime = new Date()

if (process.env.NODE_ENV != 'development') {
    rpc = new Client({ clientId: CLIENT_ID, transport: { type: 'ipc' } });
}

// Change activity in Discord Rich presence
ipcMain.handle('discordrpc:activity', (_event, { details, state, time, urlDetails }: { details?: string, state?: string, time?: Date, urlDetails?: string }) => {
    if (!rpc) return

    if (config.backend.discordrpcTime >= 0) {
        time = new Date(unixToDateTime(config.backend.discordrpcTime));
    }

    rpc.user?.setActivity({
        largeImageUrl: "https://github.com/Owca525/animu?tab=readme-ov-file#animu",
        // smallImageKey: "animu",
        detailsUrl: urlDetails,
        url: "https://github.com/Owca525/animu?tab=readme-ov-file#animu",
        details: details,
        state: state,
        startTimestamp: time ? time : runTime,
        largeImageKey: 'animu',
        type: ActivityType.Watching
    });
})

ipcMain.handle('discordrpc:run', (_event) => {
    setupDiscordRPC()
})

export function sha256FromString(text) {
    return crypto
        .createHash('sha256')
        .update(text, 'utf8')
        .digest('hex');
}

export function detectZoom(zoom: number) {
    try {
        if (isNaN(parseInt(zoom.toString()))) return 1
        return zoom / 100
    } catch (error) {
        console.error("Failed Fetch Zoom", zoom)
        return 1
    }
}

ipcMain.handle('runExternalPlayer', (_event, videoData: { url: string, path: string, time: number, title: string, subs?: { subList: string[], sid: number }, chapters?: string }, type: "mpv" | "vlc"): any => {
    if (videoData.path.replace(" ", "") == "") return
    let flatpakList = false
    if (os.platform() != "win32") {
        flatpakList = execSync(`flatpak list --columns=application`).toString().trim().split(" ").includes(videoData.path)
    }

    let path = videoData.path
    if (!fs.existsSync(videoData.path) && !flatpakList) return
    if (flatpakList) path = `flatpak run ${path}`
    switch (type) {
        case "mpv":
            let subtitlesFiles: string = ""
            if (videoData.subs && videoData.subs.subList) subtitlesFiles = videoData.subs.subList.map((sub) => `--sub-file="${sub}"`).join(" ") + ` --sid=${videoData.subs.sid}`
            exec(`${path} ${subtitlesFiles} ${videoData.chapters ? `--chapters-file=${videoData.chapters}` : ""} --force-media-title="${videoData.title}" --start=${videoData.time} '${videoData.url}'`, (error, stderr) => {
                if (error) console.error(error)
                if (stderr) console.error(error)
            })
            break;
        case "vlc":
            let subtitlesFilesVLC: string = ""
            if (videoData.subs && videoData.subs.subList) subtitlesFilesVLC = videoData.subs.subList.map((sub) => `--sub-file="${sub}"`).join(" ") + ` --sid=${videoData.subs.sid}`
            exec(`${path} --input-title-format='${videoData.title}' ${subtitlesFilesVLC} --start-time='${videoData.time}' '${videoData.url}'`, (error, stderr) => {
                if (error) console.error(error)
                if (stderr) console.error(error)
            })
    }
})

// open web browser if is url or is directory then open file manager
ipcMain.handle('open', async (_event, url: string): Promise<void> => {
    if (validUrl(url)) await shell.openExternal(url)
    else await shell.openPath(url)
})

ipcMain.handle('saveToClipboard', async (_event, type: "text" | "image", content: string): Promise<boolean> => {
    try {
        if (type == "text") {
            clipboard.writeText(content)
            return true
        }
        if (type == "image") {
            const response = await fetch(content);
            const buffer = await response.arrayBuffer();
            const image = nativeImage.createFromBuffer(Buffer.from(buffer));
            clipboard.writeImage(image);
            return true
        }
        return false
    } catch (Error) {
        console.error(Error)
        return false
    }
})

export function getFolderPath(folderPath: string) {
    try {
        if (fs.statSync(folderPath).isDirectory()) return folderPath
        return path.dirname(folderPath)
    } catch (error) {
        return folderPath
    }
}

ipcMain.handle('lang:files', async (): Promise<{ content: string, lang: string }[]> => {
    const userLangPath = checkConfigFolder("lang")
    if (!userLangPath) return []

    let userlangListPath = await takeFileExtensionAndPath(userLangPath, ".json")
    let userLangList = userlangListPath.map((element) => {
        try {
            return { content: fs.readFileSync(element, "utf-8"), lang: path.basename(element).replace(".json", "") }
        } catch (error) {
            return { content: "", lang: "" }
        }
    })

    return userLangList.filter((data) => data.lang != "")
});

export function checkConfigFolder(folder: string): string | undefined {
    if (fs.existsSync(`${newConfigPath}/${folder}`)) return `${newConfigPath}/${folder}`
    fs.mkdirSync(`${newConfigPath}/${folder}`)
    return `${newConfigPath}/${folder}`
}

export async function takeFileExtensionAndPath(dir: string, format: string): Promise<string[]> {
    return await fs.promises.readdir(dir).then(files => {
        files = files.filter(file => file.endsWith(format));
        return files.map((file) => `${dir}/${file}`)
    });
}

// Setup Discord Rich presence
export function setupDiscordRPC(): void {
    if (!rpc) return

    let time: Date | undefined;

    if (config.backend.discordrpcTime >= 0) {
        time = new Date(unixToDateTime(config.backend.discordrpcTime));
    }

    rpc.on('ready', () => {
        rpc.user?.setActivity({
            startTimestamp: time ? time : runTime,
            largeImageKey: "animu",
            type: ActivityType.Watching
        });
    });

    rpc.login()
};

// Check if string is url
export function validUrl(urlString: string): boolean {
    try {
        new URL(urlString);
        return true;
    } catch (_) { return false }
}

// function createProxyServer() {
//     const appServer = express();

//     appServer.get("/video", async (req, res) => {
//         const { url: encodedUrl } = req.query as { url?: string };
//         if (!encodedUrl) return res.status(400).send("Url not found");

//         const currentVideoUrl: requestResponseVideo =
//             JSON.parse(Buffer.from(encodedUrl, "base64").toString("utf-8"));

//         const range = req.headers.range;
//         const headers: Record<string, string> = {
//             ...req.headers,
//             ...currentVideoUrl.header,
//         };
//         delete headers["sec-ch-ua"];
//         delete headers["referer"];

//         try {
//             const fetchHeaders: Record<string, string> = {};
//             if (range) fetchHeaders["Range"] = range;

//             const response = await fetch(currentVideoUrl.url, { headers: fetchHeaders });
//             console.info(response)

//             if (!response.ok) {
//                 res.status(response.status).send("Failed to fetch video");
//                 return;
//             }

//             res.status(response.status);
//             response.headers.forEach((value, key) => res.setHeader(key, value));

//             if (!response.body) {
//                 res.status(500).send("No body in response");
//                 return;
//             }

//             const nodeStream = Readable.fromWeb(response.body as any);

//             let aborted = false;
//             req.on("close", () => {
//                 aborted = true;
//                 try {
//                     nodeStream.destroy();
//                     (response.body as any)?.cancel?.();
//                 } catch { }
//             });

//             nodeStream.on("error", (err) => {
//                 if (!aborted) {
//                     console.error("Stream error:", err.message);
//                     res.end();
//                 }
//             });

//             nodeStream.pipe(res);
//         } catch (err: any) {
//             console.error("Proxy error:", err.message);
//             if (!res.headersSent) res.status(500).send("Proxy error");
//         }
//     });

//     appServer.listen(3001, () => console.info("Video Proxy: http://localhost:3001"));
// };

// createProxyServer()

export function checkPath(program: string) {
    try {
        if (os.platform() === "win32") return ""
        let paths = execSync(`whereis ${program}`).toString().trim().split(" ")
        if (!(paths.length <= 1)) return paths[1]
        let flatpakPaths = execSync(`flatpak list --columns=application`).toString().trim().split("\n")
        for (let index = 0; index < flatpakPaths.length; index++) {
            const element = flatpakPaths[index];
            if (element.toLowerCase().includes(program.toLocaleLowerCase())) return element.replace("\n", "")
        }
        return ""
    } catch (error) {
        console.error(error)
        return ""
    }
}

export function deepMerge(target: any, source: any): any {
    for (const key in source) {
        if (source[key] && typeof source[key] === "object") {
            if (!target[key]) {
                target[key] = {};
            }
            deepMerge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}

ipcMain.handle("backend:version", () => app.getVersion())

// YT_DLP
ipcMain.handle("yt-dlp:install", async (_, tag: string) => {
    if (!yt_dlp) return

    await yt_dlp.install(tag)
})
ipcMain.handle("yt-dlp:releases", async () => {
    if (!yt_dlp) return
    await yt_dlp.getVersionList()

    return { ver: yt_dlp.currentVersion, listVer: yt_dlp.versionList }
})

ipcMain.handle("yt-dlp:run", async (_, commands: string[]) => {
    if (!yt_dlp) throw new Error("Missing Instance of yt-dlp")

    return yt_dlp.execute(commands)
})
/////////////////////

const extensions = ["png", "jpg", "jpeg", "svg", "webp"];
const mimeMap: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    svg: "image/svg+xml",
    webp: "image/webp"
};

ipcMain.handle("config:fetchAvatar", async () => {
    for (const ext of extensions) {
        const file = path.join(newConfigPath, `avatar.${ext}`);
        if (fs.existsSync(file)) {
            const buffer = fs.readFileSync(file);
            return {
                mime: mimeMap[ext],
                data: buffer.toString("base64")
            };
        }
    }

    return undefined
});

const toMB = (bytes) => bytes / 1024 / 1024;

ipcMain.handle("debug:memory", async (_) => {
    const mem = process.memoryUsage();
    return {
        rss: toMB(mem.rss),
        heapUsed: toMB(mem.heapUsed),
        heapTotal: toMB(mem.heapTotal)
    }
});

ipcMain.handle("backend:setLang", async (_, lang) => {
    setCurrentLang(lang)
});

ipcMain.handle("backend:saveLogs", async (_, content: string[]) => {
    const date = new Date();
    const hour = new Date().toLocaleTimeString("en-EN", { hour12: false });

    const formatedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    fs.writeFileSync(path.join(animuUserData, `${formatedDate}-${hour}-logs.log`), content.join("\n"), "utf-8")
});

export function unixToDateTime(unixTimestamp: number | undefined): string {
    if (unixTimestamp == undefined) return new Date().toString()
    const date = new Date(unixTimestamp * 1000);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function updateTray() {
    if (!globalTray) return

    const newTray = mainTrayMenu.map((v) => v["label"] ? { ...v, label: t(v["label"]) } : v)

    globalTray.setContextMenu(Menu.buildFromTemplate(newTray as any))
}

export async function advanceRequest(url: string, options: RequestInit = { headers: { "user-agent": userAgent }}) {
    try {
        const response = await fetch(url, options);

        const respTextClone = response.clone()
        let text = "";
        try {
            text = await respTextClone.text()
        } catch (error) {}

        const bufferCloned = response.clone()
        let jsontext;

        try {
            jsontext = await response.json()
        } catch (error) {}

        const convertedResponse = {
            text: text,
            json: jsontext,
            buffer: await bufferCloned.arrayBuffer(),
            status: response.status,
            statusText: response.statusText,
            url: response.url,
            success: response.ok,
            requestHeader: options ? options["headers"] : {},
            responseHeader: new Map<string, string>(response.headers.entries()),
        }

        /* IFDEF DEBUG */
        console.info("advanceRequest\n", convertedResponse) // options
        /* ENDIF */

        return convertedResponse;
    } catch (error) {
        console.error(`Error in advanceRequest: ${(error as Error).message} ${(error as Error).name} ${(error as Error).cause} \n ${(error as Error).stack}`, url)
        return {
            text: (error as Error).message,
            json: undefined,
            buffer: [],
            status: 500,
            statusText: (error as Error).message,
            url: url,
            success: false,
            responseHeader: {}
        }
    }
}

export function dateToUnix(dateStr: string): number {
    const date = new Date(dateStr);
    return Math.floor(date.getTime() / 1000);
}