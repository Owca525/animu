import { ipcMain } from "electron";

ipcMain.handle('fetch-data', async (_event, url: string, header: Record<string, string>, type: "json" | "text" = "json"): Promise<{ success: boolean; data: any; status: number; statusText: string; error?: unknown; }> => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000);
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: header,
            signal: controller.signal
        })

        if (response.ok && type == "json") {
            const data = await response.json()
            return { success: true, data, status: response.status, statusText: response.statusText }
        }
        if (response.ok && type == "text") {
            const data = await response.text()
            return { success: true, data, status: response.status, statusText: response.statusText }
        }
        return { success: false, data: undefined, status: response.status, statusText: response.statusText }
    } catch (error) {
        return { success: false, error: (error as Error).message, status: 1, data: undefined, statusText: (error as Error).message }
    } finally {
        clearTimeout(id);
    }
}
)

ipcMain.handle('send-post', async (_event, url: string, header: Record<string, string>, body?: { query: string, variables: Object }, type: "json" | "text" = "json"): Promise<{ success: boolean; data: any; status: number; statusText: string; error?: unknown; }> => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000);
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: header,
            body: JSON.stringify(body),
            signal: controller.signal
        })

        if (response.ok && type == "json") {
            const data = await response.json()
            return { success: true, data, status: response.status, statusText: response.statusText }
        }
        if (response.ok && type == "text") {
            const data = await response.text()
            return { success: true, data, status: response.status, statusText: response.statusText }
        }
        return { success: false, status: response.status, statusText: response.statusText, data: undefined }
    } catch (error) {
        return { success: false, error: (error as Error).message, status: 1, data: undefined, statusText: (error as Error).message }
    } finally {
        clearTimeout(id);
    }
}
)

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