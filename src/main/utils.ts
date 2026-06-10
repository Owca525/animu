import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { ActivityType } from 'discord-api-types/v10';
import { advanceRequest } from './request';
import {
    config,
    globalTray,
    mainTrayMenu,
    newConfigPath,
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
import { exec, execSync, spawn } from 'child_process';
import { setCurrentLang, t } from './i18n';

// import express from "express";
// import { Readable } from "stream";
// import { requestResponseVideo } from "./types";

let yt_dlp_releases_cache: Map<string, any>[] = []
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
function pythonCheck() {
    return new Promise(resolve => {
        exec(`python3 --version`, error => {
            resolve(!error)
        })
    })
}

async function checkExistyt_dlp() {
    if (await pythonCheck() && fs.existsSync(path.join(app.getPath("userData"), "yt-dlp"))) return true

    if (process.platform == "win32" && fs.existsSync(path.join(app.getPath("userData"), "yt-dlp.exe"))) return true
    if (process.platform == "linux" && fs.existsSync(path.join(app.getPath("userData"), "yt-dlp_linux"))) return true
    return false
}

async function downloadyt_dlp(data: Map<string, any>, name: string) {
    const resp = await advanceRequest(data["browser_download_url"])
    if (!resp.success) return
    fs.writeFileSync(path.join(app.getPath("userData"), "yt-dlp.json"), JSON.stringify(yt_dlp_releases_cache), "utf-8")
    fs.writeFileSync(path.join(app.getPath("userData"), name), resp.buffer as any, "binary")
}

async function installyt_dlp(data: Map<string, any>) {
    for (let index = 0; index < data["assets"].length; index++) {
        const element = data["assets"][index];
        if (element["name"] == "yt-dlp" && await pythonCheck()) return await downloadyt_dlp(element, "yt-dlp")
        if (element["name"] == "yt-dlp.exe" && process.platform == "win32") return await downloadyt_dlp(element, "yt-dlp.exe")
        if (element["name"] == "yt-dlp_linux" && process.platform == "linux") return await downloadyt_dlp(element, "yt-dlp_linux")
    }
}

export async function runCheckYT_DLP() {
    const yt_dlp_latest = "https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest"
    const yt_dlp_releases = "https://api.github.com/repos/yt-dlp/yt-dlp/releases"

    const lastest = await advanceRequest(yt_dlp_latest)
    console.log("sex")
    console.error(lastest)
    if (!lastest.success || !lastest.json) return
    let updated = false
    if (fs.existsSync(path.join(app.getPath("userData"), "yt-dlp.json"))) {
        const tmp = JSON.parse(fs.readFileSync(path.join(app.getPath("userData"), "yt-dlp.json"), "utf-8"))
        if (tmp["tag_name"] != lastest.json["tag_name"]) updated = true
    }

    if (await checkExistyt_dlp() && updated == false) return

    if (config.yt_dlp.replaceAll(" ", "").length <= 0) {
        yt_dlp_releases_cache = lastest.json.map((v) => v["tag_name"])
        await installyt_dlp(lastest.json)
        return
    }

    const resp = await advanceRequest(yt_dlp_releases)
    if (!resp.success || !resp.json) return
    yt_dlp_releases_cache = resp.json.map((v) => v["tag_name"])

    for (let index = 0; index < resp.json.length; index++) {
        const element = resp.json[index];
        if (element["tag_name"] == config.yt_dlp) return installyt_dlp(element)
    }
}

ipcMain.handle("yt-dlp:install", async (_, tag: string) => {
    for (let index = 0; index < yt_dlp_releases_cache.length; index++) {
        const element = yt_dlp_releases_cache[index];
        if (element["tag_name"] == tag) await installyt_dlp(element)
    }
})
ipcMain.handle("yt-dlp:releases", async () => {
    let currentVersionYT_DLP: string = ""
    if (fs.existsSync(path.join(app.getPath("userData"), "yt-dlp.json"))) {
        const tmp = JSON.parse(fs.readFileSync(path.join(app.getPath("userData"), "yt-dlp.json"), "utf-8"))
        currentVersionYT_DLP = tmp["tag_name"]
    }

    if (yt_dlp_releases_cache.length <= 0) {
        const resp = await advanceRequest("https://api.github.com/repos/yt-dlp/yt-dlp/releases")
        if (!resp.success || !resp.json) return [currentVersionYT_DLP["tag_name"]]
        yt_dlp_releases_cache = resp.json.map((v) => v["tag_name"])
    }

    return { ver: currentVersionYT_DLP, listVer: yt_dlp_releases_cache }
})

ipcMain.handle("yt-dlp:run", async (_, url: string, commands?: string[]) => await getVideoInfo(url, commands))

async function CheckPathToYT_DLP(commands: string[]): Promise<[string, string[]]> {
    if (await pythonCheck() && fs.existsSync(path.join(app.getPath("userData"), "yt-dlp")))
        return ["/usr/bin/python3", [path.join(app.getPath("userData"), "yt-dlp"), ...commands]]

    if (process.platform == "win32" && fs.existsSync(path.join(app.getPath("userData"), "yt-dlp.exe")))
        return [path.join(app.getPath("userData"), "yt-dlp.exe"), commands]
    if (process.platform == "linux" && fs.existsSync(path.join(app.getPath("userData"), "yt-dlp_linux")))
        return [path.join(app.getPath("userData"), "yt-dlp_linux"), commands]

    return ["/usr/bin/python3", [path.join(app.getPath("userData"), "yt-dlp"), ...commands]]
}

// "-j",
// "--no-playlist",
function getVideoInfo(url: string, commands: string[] = ["-j"]) {
    return new Promise(async (resolve, reject) => {
        const pathCommands = await CheckPathToYT_DLP([...commands, url])

        const yt = spawn(pathCommands[0], pathCommands[1]);

        let data = "";
        let error = "";

        yt.stdout.on("data", chunk => {
            data += chunk.toString();
        });

        yt.stderr.on("data", chunk => {
            error += chunk.toString();
        });

        yt.on("close", code => {
            if (code !== 0) {
                reject(error);
            } else {
                resolve(JSON.parse(data));
            }
        });
    });
}
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

    fs.writeFileSync(path.join(app.getPath("userData"), `${formatedDate}-${hour}-logs.log`), content.join("\n"), "utf-8")
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
