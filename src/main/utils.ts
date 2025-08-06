import { app, clipboard, ipcMain, nativeImage, shell } from "electron"
import * as RPC from 'discord-rpc';

import fs from "fs";
import path from "path";
import { mainWindow } from ".";
import { exec } from "child_process";
let rpc: any = undefined

if (process.env.NODE_ENV != 'development') {
    rpc = new RPC.Client({ transport: 'ipc' });
}

// Client id for Discord Rich presence
export const CLIENT_ID = '1320810160205070377';
export const runTime = new Date()

ipcMain.on("openDevTools", () => {
    if (!mainWindow) return
    mainWindow.webContents.openDevTools()
})

// Change activity in Discord Rich presence
ipcMain.handle('setActivity', (_event, details: string | undefined, state: string | undefined) => {
    if (rpc != undefined) {
        rpc.setActivity({
            details: details,
            state: state,
            startTimestamp: runTime,
            largeImageKey: 'https://github.com/Owca525/animu/blob/electron/resources/icon.png?raw=true',
            instance: false,
        } as any);
    }
})

ipcMain.handle('getVersion', (_event): String => app.getVersion())

ipcMain.handle('runExternalPlayer', (_event, videoData: {url: string, path: string, time: number, title: string}, type: "mpv" | "vlc"): any => {
    switch (type) {
        case "mpv":
            exec(`${videoData.path} --title='${videoData.title}' --start=${videoData.time} '${videoData.url}'`, (error, stdout, stderr) => {
                if (error) console.error(error)
                if (stderr) console.error(error)
                console.log(stdout)
            })
            break;
        case "vlc":
            exec(`${videoData.path} --input-title-format='${videoData.title}' --start-time='${videoData.time}' '${videoData.url}'`, (error, stdout, stderr) => {
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

ipcMain.handle('get-css-files', async (): Promise<{ path: string, filename: string, type: "user" | "official" }[]> => {
    // Directory for local css
    let stylesDir: string = "";
    if (process.env.NODE_ENV === 'development') {
        stylesDir = path.join(__dirname, '../../src/renderer/src/themes')
    } else {
        stylesDir = path.join(__dirname, '../../out/renderer/assets/themes')
    }
    
    const localList = await takeFileExtensionAndPath(stylesDir, '.css')

    const configcss = checkConfigFolder("themes")
    if (configcss == undefined) return convertListTodict(localList, "official")

    // Direcotry for config/theme css
    const customList = await takeFileExtensionAndPath(configcss, '.css')

    return [...convertListTodict(localList, "official"), ...convertListTodict(customList, "user")]
});

ipcMain.handle('get-lang-files', async (): Promise<{ data: any, lang: string }[]> => {
    let langDir: string = "";
    if (process.env.NODE_ENV === 'development') {
        langDir = path.join(__dirname, '../../src/renderer/src/utils/lang')
    } else {
        langDir = path.join(__dirname, '../../out/renderer/assets/lang')
    }
    
    let langPaths = await takeFileExtensionAndPath(langDir, ".json")
    let langList = langPaths.map((element) => {return{ data: fs.readFileSync(element, "utf-8"), lang: path.basename(element).replace(".json", "") }})

    const userLangPath = checkConfigFolder("lang")
    if (!userLangPath) return langList

    let userlangListPath = await takeFileExtensionAndPath(userLangPath, ".json")
    let userLangList = userlangListPath.map((element) => {return{ data: fs.readFileSync(element, "utf-8"), lang: path.basename(element).replace(".json", "") }})
    
    for (let index = 0; index < userLangList.length; index++) {
        const element = userLangList[index];
        const indexList = langList.findIndex((item) => item.lang.toLowerCase() == element.lang.toLowerCase());
        if (indexList != -1) langList.splice(indexList, 1);
    }

    return [...langList, ...userLangList]
});

function convertListTodict(list: string[], type: "user" | "official"): { path: string, filename: string, type: "user" | "official" }[] {
    return list.map((element) => {
        return { path: element, filename: path.basename(element), type: type }
    })
}

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
    if (RPC.register(CLIENT_ID)) {
        rpc.on('ready', () => {
            rpc.setActivity({
                startTimestamp: runTime,
                largeImageKey: 'https://github.com/Owca525/animu/blob/electron/resources/icon.png?raw=true',
                instance: false,
            } as any);
        });

        rpc.login({ clientId: CLIENT_ID }).catch((error) => console.log(`Discord RPC has ${error}`))
    } else {
        console.error("CLIENT_ID Is not register")
    }
};

// Check if string is url
export function validUrl(urlString: string): boolean {
    try {
        new URL(urlString);
        return true;
    } catch (_) { return false }
}