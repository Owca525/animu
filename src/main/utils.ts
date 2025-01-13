import { app, ipcMain, shell } from "electron"
import * as RPC from 'discord-rpc';

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

ipcMain.handle('getVersion', (_event) => app.getVersion())

// open web browser if is url or is directory then open file manager
ipcMain.handle('open', async (_event, url: string) => {
    if (validUrl(url)) await shell.openExternal(url)
    else await shell.openPath(url)
})

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