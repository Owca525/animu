import { ipcMain } from "electron";

ipcMain.handle('fetch-data', async (_event, url: string, header: Record<string, string>): Promise<{ success: boolean; data?: any; status?: number; statusText?: string; error?: unknown; }> => {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: header
        })

        if (response.ok) {
            const data = await response.json()
            return { success: true, data }
        }
        return { success: false, status: response.status, statusText: response.statusText }
    } catch (error) {
        return { success: false, error: (error as Error).message }
    }
}
)

ipcMain.handle('send-post', async (_event, url: string, header: Record<string, string>, body?: { query: string, variables: Object }): Promise<{ success: boolean; data?: any; status?: number; statusText?: string; error?: unknown; }> => {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: header,
            body: JSON.stringify(body)
        })

        if (response.ok) {
            const data = await response.json()
            return { success: true, data }
        }
        return { success: false, status: response.status, statusText: response.statusText }
    } catch (error) {
        return { success: false, error: (error as Error).message }
    }
}
)