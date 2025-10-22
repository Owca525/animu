import { app, clipboard, ipcMain, nativeImage, shell } from "electron"
import { Client } from "@xhayper/discord-rpc";
import { ActivityType } from "discord-api-types/v10"

import fs from "fs";
import path from "path";
import { mainWindow } from ".";
import { exec, execSync } from "child_process";
import express from "express";
import { Readable } from "stream";

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

ipcMain.handle('getVersion', (_event): String => app.getVersion())

ipcMain.handle('runExternalPlayer', (_event, videoData: { url: string, path: string, time: number, title: string, subs?: { subList: string[], sid: number }, chapters?: string }, type: "mpv" | "vlc"): any => {
    let flatpakList = execSync(`flatpak list --columns=application`).toString().trim().split(" ").includes(videoData.path)
    let path = videoData.path
    if (!fs.existsSync(videoData.path) && !flatpakList) return
    if (flatpakList) path = `flatpak run ${path}`
    if (videoData.path.replaceAll(" ", "") == "") return
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

ipcMain.handle('get-css-files', async (): Promise<{ version?: string; autor?: string; pathcss: string; animuTitle?: string; name: string; }[]> => {
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

async function getThemeList(path: string): Promise<{ version?: string; autor?: string; pathcss: string; animuTitle?: string; name: string; }[]> {
    let listFolder = await fs.promises.readdir(path)
    let finnalList: any = []
    for (let index = 0; index < listFolder.length; index++) {
        const element = listFolder[index];
        if (fs.statSync(`${path}/${element}`).isDirectory()) {
            let theme = await getMetadataTheme(`${path}/${element}`)
            if (theme) finnalList.push(theme)
        }
    }
    return finnalList
}

async function getMetadataTheme(path_theme: string): Promise<{ version?: string; autor?: string; pathcss: string; animuTitle?: string; name: string; } | undefined | {}> {
    try {
        let themeMetadata = {}
        if (!fs.existsSync(`${path_theme}/theme.json`)) return undefined
        let themeJSON = JSON.parse(fs.readFileSync(`${path_theme}/theme.json`, "utf-8"))

        if ("version" in themeJSON) {
            if (themeJSON.version.replace(" ", "") != "") themeMetadata = { ...themeMetadata, version: themeJSON.version }
        }
        if ("author" in themeJSON) {
            if (themeJSON.author.replace(" ", "") != "") themeMetadata = { ...themeMetadata, author: themeJSON.author }
        }
        if ("mainCSS" in themeJSON) {
            if (themeJSON.mainCSS.startsWith(".") && fs.existsSync(`${path_theme}${themeJSON.mainCSS.slice(1)}`)) themeMetadata = { ...themeMetadata, pathcss: `${path_theme}${themeJSON.mainCSS.slice(1)}` }
            else undefined
        }
        else return undefined

        if ("customTitle" in themeJSON) {
            if (themeJSON.customTitle.replace(" ", "") != "") themeMetadata = { ...themeMetadata, animuTitle: themeJSON.customTitle }
        }
        if ("themeName" in themeJSON) {
            if (themeJSON.themeName.replace(" ", "") != "") themeMetadata = { ...themeMetadata, name: themeJSON.themeName }
            else themeMetadata = { ...themeMetadata, name: path.basename(path_theme) }
        }

        return Object.keys(themeMetadata).length <= 0 ? undefined : themeMetadata
    } catch (error) {
        console.log(error)
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
    if (fs.existsSync(`${app.getPath("userData")}/${folder}`)) return `${app.getPath("userData")}/${folder}`
    fs.mkdirSync(`${app.getPath("userData")}/${folder}`)
    return `${app.getPath("userData")}/${folder}`
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

const createProxyServer = () => {
    const appServer = express();

    appServer.get("/video", async (req, res) => {
        const { url: encodedUrl } = req.query as { url?: string };
        if (!encodedUrl) return res.status(400).send("Url not found");

        const currentVideoUrl = Buffer.from(encodedUrl, "base64").toString("utf-8");

        let aborted = false;
        req.on("close", () => {
            aborted = true;
        });

        try {
            const headers: Record<string, string> = {};

            if (req.headers.range) {
                const match = req.headers.range.match(/bytes=(\d+)-(\d*)/);
                if (match) {
                    const start = parseInt(match[1], 10);
                    const end = start + 10 * 1024 * 1024 - 1;
                    headers["Range"] = `bytes=${start}-${end}`;
                }
            }

            const response = await fetch(currentVideoUrl, { headers });

            res.status(response.status);
            response.headers.forEach((value, key) => res.setHeader(key, value));

            if (!response.body) {
                res.status(500).send("body not found");
                return;
            }

            const nodeStream = Readable.fromWeb(response.body as any);

            req.on("close", () => {
                try {
                    nodeStream.destroy();
                    (response.body as any)?.cancel?.();
                } catch { }
            });

            nodeStream.on("error", (err) => {
                if (!aborted) {
                    console.error("Stream error:", err.message);
                    res.end();
                }
            });

            nodeStream.pipe(res);
            return
        } catch (err: any) {
            if (!aborted) {
                console.error("Proxy error:", err.message);
                res.status(500).send("error");
            }
            return
        }
    });

    appServer.listen(3001, () =>
        console.log("Video Proxy: http://localhost:3001")
    );
};


createProxyServer()

ipcMain.handle('advanceRequest', async (_, url: string, options?: { method: "POST" | "GET", headers: { [key: string]: string } }) => {
    const response = await fetch(url, options);
    if (!response.ok) return { text: "", buffer: [], status: response.status, statusText: response.statusText, url: response.url, success: response.ok }
    let cloned = response.clone()
    return {
        text: await response.text(),
        buffer: Buffer.from(await cloned.arrayBuffer()),
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        success: response.ok
    };
});