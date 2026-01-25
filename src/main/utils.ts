import { app, BrowserWindow, clipboard, ipcMain, nativeImage, shell } from "electron"
import { Client } from "@xhayper/discord-rpc";
import { ActivityType } from "discord-api-types/v10"
import ini from "ini";
import crypto from 'crypto';

import path from "path"
import fs from "fs"
import { animuPlugins, config, mainWindow, newConfigPath, pluginsConfigPath, themeConfigPath } from ".";
import { exec, execSync } from "child_process";
// import express from "express";
// import { Readable } from "stream";
import os from "os"
import { pluginRepoExpanded, themeFormatType, ThemeSchema } from "./types";
import { advanceRequest } from "./request";
// import { requestResponseVideo } from "./types";

let yt_dlp_releases_cache: Map<string, any>[] = []
let rpc: Client | undefined = undefined

// Client id for Discord Rich presence
export const CLIENT_ID = '1320810160205070377';
export const runTime = new Date()

if (process.env.NODE_ENV != 'development') {
    rpc = new Client({ clientId: CLIENT_ID, transport: { type: 'ipc' } });
}

ipcMain.on("openDevTools", () => {
    if (!mainWindow) return
    mainWindow.webContents.openDevTools()
})

// Change activity in Discord Rich presence
ipcMain.handle('setActivity', (_event, details?: string, state?: string, time?: Date) => {
    if (!rpc) return

    rpc.user?.setActivity({
        details: details,
        state: state,
        startTimestamp: time ? time : runTime,
        largeImageKey: 'https://github.com/Owca525/animu/blob/electron/resources/icon.png?raw=true',
        instance: false,
        type: ActivityType.Watching
    });
})

ipcMain.handle('runDiscordRPC', (_event) => {
    setupDiscordRPC()
})

function sha256FromString(text) {
    return crypto
        .createHash('sha256')
        .update(text, 'utf8')
        .digest('hex');
}

function extractPlugin(folderPlugins: string, type: "official" | "user") {
    if (!fs.existsSync(folderPlugins)) return []
    const folder = fs.readdirSync(folderPlugins)

    let files = folder.filter((item) => {
        return fs.statSync(path.join(folderPlugins, item)).isFile()
    })

    files = files.filter((ele) => ele.endsWith(".js"))
    if (files.length <= 0) return []

    return files.map((item) => {
        const content = fs.readFileSync(path.join(folderPlugins, item), "utf-8")
        const isPlayer = content.includes("extractPlayerData")
        return { file: item, content: content, type, sha256: sha256FromString(content), pluginType: isPlayer ? "player" : "information" }
    })
}

export function detectZoom(zoom: number) {
    try {
        if (!isNaN(Number(zoom.toString()))) return 1
        return zoom / 100
    } catch (error) {
        console.error("Failed Fetch Zoom", zoom)
        return 1
    }
}

ipcMain.handle('externalPlugins', (_event) => {
    const user = extractPlugin(path.join(newConfigPath, "plugins"), "user")
    const official = extractPlugin(path.join(app.getPath("userData"), "animuPlugins"), "official")
    return [...user, ...official]
})

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
            exec(`${path} ${subtitlesFiles} ${videoData.chapters ? `--chapters-file=${videoData.chapters}` : ""} --force-media-title="${videoData.title}" --start=${videoData.time} '${videoData.url}'`, (error, stdout, stderr) => {
                if (error) console.error(error)
                if (stderr) console.error(error)
                console.log(stdout)
            })
            break;
        case "vlc":
            let subtitlesFilesVLC: string = ""
            if (videoData.subs && videoData.subs.subList) subtitlesFilesVLC = videoData.subs.subList.map((sub) => `--sub-file="${sub}"`).join(" ") + ` --sid=${videoData.subs.sid}`
            exec(`${path} --input-title-format='${videoData.title}' ${subtitlesFilesVLC} --start-time='${videoData.time}' '${videoData.url}'`, (error, stdout, stderr) => {
                if (error) console.error(error)
                if (stderr) console.error(error)
                console.log(stdout)
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
        console.log(Error)
        return false
    }
})

ipcMain.handle('get-css-files', async (): Promise<themeFormatType[]> => {
    // Directory for local css
    let stylesDir: string = "";
    if (process.env.NODE_ENV === 'development') {
        stylesDir = path.join(__dirname, '../../src/renderer/src/themes')
    } else {
        stylesDir = path.join(__dirname, '../../out/renderer/assets/themes')
    }

    const localList = await getThemeList(stylesDir)

    const configcss = checkConfigFolder("themes")
    if (configcss == undefined) return localList

    // Direcotry for config/theme css
    const customList = await getThemeList(configcss)

    return [...localList, ...customList]
});

function getFolderPath(folderPath: string) {
    try {
        if (fs.statSync(folderPath).isDirectory()) return folderPath
        return path.dirname(folderPath)
    } catch (error) {
        return folderPath
    }
}

async function getThemeList(themePath: string): Promise<themeFormatType[]> {
    let listFolder = await fs.promises.readdir(themePath)
    let finallist: themeFormatType[] = []
    for (let index = 0; index < listFolder.length; index++) {
        const element = listFolder[index];
        const folderTheme = path.join(themePath, element)
        if (fs.statSync(folderTheme).isDirectory()) {
            let theme = await getMetadataTheme(folderTheme)
            if (theme) finallist.push(theme)
        }
    }
    return finallist.map((theme) => {
        if (!theme.options) return theme
        const mainCSSPath = getFolderPath(theme.mainCSS)
        return {
            ...theme, options: theme.options.map((value) => {
                if (value.css && value.css.replaceAll(" ", "") != "") return { ...value, css: path.join(mainCSSPath, value.css) }
                if (value.dropDown) return { ...value, dropDown: value.dropDown.map((val) => ({ ...val, css: val.css != "" ? path.join(mainCSSPath, val.css) : "" })) }
                return value
            })
        }
    })
}

async function getMetadataTheme(path_theme: string): Promise<themeFormatType | undefined> {
    try {
        const pathTheme = path.join(path_theme, "/theme.json")

        if (!fs.existsSync(pathTheme)) return undefined
        let themeJSON = JSON.parse(fs.readFileSync(pathTheme, "utf-8"))
        const theme = ThemeSchema.parse(themeJSON)
        return { ...theme, mainCSS: path.join(path_theme, theme.mainCSS) }
    } catch (error) {
        console.log("Error parsing theme", error)
        return undefined
    }
}

ipcMain.handle('get-lang-files', async (): Promise<{ data: any, lang: string }[]> => {
    let langDir: string = "";
    if (process.env.NODE_ENV === 'development') {
        langDir = path.join(__dirname, '../../src/renderer/src/utils/lang')
    } else {
        langDir = path.join(__dirname, '../../out/renderer/assets/lang')
    }

    let langPaths = await takeFileExtensionAndPath(langDir, ".json")
    let langList = langPaths.map((element) => {
        try {
            return { data: fs.readFileSync(element, "utf-8"), lang: path.basename(element).replace(".json", "") }
        } catch (error) {
            return { data: {}, lang: "" }
        }
    })

    const userLangPath = checkConfigFolder("lang")
    if (!userLangPath) return langList.filter((data) => data.lang != "")

    let userlangListPath = await takeFileExtensionAndPath(userLangPath, ".json")
    let userLangList = userlangListPath.map((element) => {
        try {
            return { data: fs.readFileSync(element, "utf-8"), lang: path.basename(element).replace(".json", "") }
        } catch (error) {
            return { data: {}, lang: "" }
        }
    })

    for (let index = 0; index < userLangList.length; index++) {
        const element = userLangList[index];
        const indexList = langList.findIndex((item) => item.lang.toLowerCase() == element.lang.toLowerCase());
        if (indexList != -1) langList.splice(indexList, 1);
    }

    return [...langList.filter((data) => data.lang != ""), ...userLangList.filter((data) => data.lang != "")]
});

function checkConfigFolder(folder: string): string | undefined {
    if (fs.existsSync(`${newConfigPath}/${folder}`)) return `${newConfigPath}/${folder}`
    fs.mkdirSync(`${newConfigPath}/${folder}`)
    return `${newConfigPath}/${folder}`
}

async function takeFileExtensionAndPath(dir: string, format: string): Promise<string[]> {
    return await fs.promises.readdir(dir).then(files => {
        files = files.filter(file => file.endsWith(format));
        return files.map((file) => `${dir}/${file}`)
    });
}

// Setup Discord Rich presence
export function setupDiscordRPC(): void {
    if (!rpc) return
    rpc.on('ready', () => {
        rpc.user?.setActivity({
            startTimestamp: runTime,
            largeImageKey: 'https://github.com/Owca525/animu/blob/electron/resources/icon.png?raw=true',
            instance: false,
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
//             console.log(response)

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

//     appServer.listen(3001, () => console.log("Video Proxy: http://localhost:3001"));
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

ipcMain.handle("animuVersion", () => app.getVersion())

ipcMain.handle('getThemeConfig', async (_event, theme: themeFormatType): Promise<Record<string, string | boolean> | {}> => getThemeConfig(theme))

function getThemeConfig(theme: themeFormatType) {
    if (!fs.existsSync(path.join(themeConfigPath, `${theme.themeName}.ini`))) return generateConfigTheme(theme)
    return ini.parse(fs.readFileSync(path.join(themeConfigPath, `${theme.themeName}.ini`), "utf-8"))
}

function generateConfigTheme(theme: themeFormatType) {
    if (!theme.options) return {}

    let generetatedConfig: Record<string, boolean | string> = {}

    for (let index = 0; index < theme.options.length; index++) {
        const element = theme.options[index];

        if (element.css != undefined) {
            generetatedConfig[element.name] = element.default ? element.default : false
        } else if (element.dropDown) {
            generetatedConfig[element.name] = element.dropDown[0].option
        }
    }

    fs.writeFileSync(path.join(themeConfigPath, `${theme.themeName}.ini`), ini.stringify(generetatedConfig), "utf-8")
    return generetatedConfig
}

ipcMain.handle('saveConfigTheme', async (_event, theme: themeFormatType, data: Record<string, boolean | string>): Promise<void> => saveThemeConfig(theme, data))

function saveThemeConfig(theme: themeFormatType, data: Record<string, boolean | string> | {}): any {
    let content = data
    if (!fs.existsSync(path.join(themeConfigPath, `${theme.themeName}.ini`))) {
        content = { ...generateConfigTheme(theme), ...content }
    } else {
        content = { ...getThemeConfig(theme), ...content }
    }
    fs.writeFileSync(path.join(themeConfigPath, `${theme.themeName}.ini`), ini.stringify(content), "utf-8")
}

ipcMain.handle("getPluginConfig", (_, name: string, config: { [key: string]: any }) => getPluginConfig(name, config))
ipcMain.handle("savePluginConfig", (_, name: string, config: { [key: string]: any }) => savePluginConfig(name, config))

function getPluginConfig(name: string, config: { [key: string]: any }) {
    if (!fs.existsSync(path.join(pluginsConfigPath, `${name}.ini`))) return generetaPluginConfig(name, config)
    return ini.parse(fs.readFileSync(path.join(pluginsConfigPath, `${name}.ini`), "utf-8"))
}

function generetaPluginConfig(name: string, config: { [key: string]: any }) {
    fs.writeFileSync(path.join(pluginsConfigPath, `${name}.ini`), ini.stringify(config), "utf-8")
    return config
}

function savePluginConfig(name: string, config: { [key: string]: any }) {
    fs.writeFileSync(path.join(pluginsConfigPath, `${name}.ini`), ini.stringify(config), "utf-8")
}

ipcMain.handle("installPluginUpdate", async (_, plugin: pluginRepoExpanded) => {
    const resp = await advanceRequest(`${plugin.repoURL}${plugin.file}`)
    if (!resp.success || !resp.text) return
    fs.writeFileSync(path.join(animuPlugins, path.basename(plugin.file)), resp.text, "utf-8")
})

ipcMain.on("reload-window", () => {
    BrowserWindow.getAllWindows()[0].reload();
});

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
    console.log(resp)
    if (!resp.success) return
    fs.writeFileSync(path.join(app.getPath("appData"), "yt-dlp.json"), JSON.stringify(data), "utf-8")
    fs.writeFileSync(path.join(app.getPath("appData"), name), resp.buffer, "binary")
}

async function installyt_dlp(data: Map<string, any>) {
    console.log(data)
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
    if (!lastest.success || !lastest.json) return
    let updated = false
    if (fs.existsSync(path.join(app.getPath("appData"), "yt-dlp.json"))) {
        const tmp = JSON.parse(fs.readFileSync(path.join(app.getPath("appData"), "yt-dlp.json"), "utf-8"))
        if (tmp["tag_name"] == lastest.json["tag_name"]) updated = true
    }

    console.log(await checkExistyt_dlp())

    if (await checkExistyt_dlp() && updated != false) return

    if (config.yt_dlp.replaceAll(" ", "").length <= 0) {
        await installyt_dlp(lastest.json)
        return
    }

    const resp = await advanceRequest(yt_dlp_releases)
    if (!resp.success || !resp.json) return
    yt_dlp_releases_cache = resp.json

    for (let index = 0; index < resp.json.length; index++) {
        const element = resp.json[index];
        if (element["tag_name"] == config.yt_dlp) return installyt_dlp(element)
    }
}

ipcMain.handle("installyt-dlp", async (_, tag: string) => {
    for (let index = 0; index < yt_dlp_releases_cache.length; index++) {
        const element = yt_dlp_releases_cache[index];
        if (element["tag_name"] == tag) await installyt_dlp(element)
    }
})
ipcMain.handle("getyt-dlp_releases", async () => {
    if (yt_dlp_releases_cache.length <= 0) {
        const resp = await advanceRequest("https://api.github.com/repos/yt-dlp/yt-dlp/releases")
        if (!resp.success || !resp.json) return []
        yt_dlp_releases_cache = resp.json.map((v) => v["tag_name"])
    }
    return yt_dlp_releases_cache.map((v) => v["tag_name"])
})
