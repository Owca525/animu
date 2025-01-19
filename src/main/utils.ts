import { app, ipcMain, shell } from "electron"
import * as RPC from 'discord-rpc';

import fs from "fs";
import path from "path";

export const rpc = new RPC.Client({ transport: 'ipc' });

// Client id for Discord Rich presence
export const CLIENT_ID = '1320810160205070377';
export const runTime = new Date()

ipcMain.handle('fetch-data', async (_event, url: string, header: Record<string, string>): Promise<{ success: boolean; data?: any; status?: number; statusText?: string; error?: unknown; }> => {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: header
        })

        if (response.ok) {
            const data = await response.json()
            return { success: true, data }
        } else {
            return { success: false, status: response.status, statusText: response.statusText }
        }
    } catch (error) {
        return { success: false, error: (error as Error).message }
    }
}
)

// Change activity in Discord Rich presence
ipcMain.handle('setActivity', (_event, details: string | undefined, state: string | undefined) => {
    if (rpc) {
        rpc.setActivity({
            details: details,
            state: state,
            startTimestamp: runTime,
            largeImageKey: 'https://github.com/Owca525/animu/blob/electron/resources/icon.png?raw=true',
            instance: false,
        });
    }
})

ipcMain.handle('getVersion', (_event): String => app.getVersion())

// open web browser if is url or is directory then open file manager
ipcMain.handle('open', async (_event, url: string): Promise<void> => {
    if (validUrl(url)) await shell.openExternal(url)
    else await shell.openPath(url)
})

ipcMain.handle('get-css-files', async (): Promise<{ path: string, filename: string, type: "user" | "official" }[]> => {
    // Directory for local css
    const stylesDir = path.join(__dirname, '../../out/renderer/assets/themes');
    const localList = await takeFileExtensionAndPath(stylesDir, '.css')

    // this prevent load user theme because in version dev this can't load, idk why. Show status 200 but no css data, maybe i fix someday
    if (process.env.NODE_ENV === 'development') return convertListTodict(await takeFileExtensionAndPath(path.join(__dirname, '../../src/renderer/src/css/themes'), '.css'), "official")

    const configcss = checkConfigFolder()
    if (configcss == undefined) return convertListTodict(localList, "official")

    // Direcotry for config/theme css
    const customList = await takeFileExtensionAndPath(configcss, '.css')

    return [...convertListTodict(localList, "official"), ...convertListTodict(customList, "user")]
});

function convertListTodict(list: string[], type: "user" | "official"): { path: string, filename: string, type: "user" | "official" }[] {
    return list.map((element) => {
        return { path: element, filename: path.basename(element), type: type }
    })
}

function checkConfigFolder(): string | undefined {
    if (fs.existsSync(`${app.getPath("userData")}/themes`)) return `${app.getPath("userData")}/themes`
    return undefined
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
            });
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