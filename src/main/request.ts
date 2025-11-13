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
        console.error(`Error in fetch-data: ${(error as Error).message} ${(error as Error).name} ${(error as Error).cause} \n ${(error as Error).stack}`)
        return { success: false, error: (error as Error).message, status: 500, data: undefined, statusText: "Backend Error" }
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

        console.log(response)

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
        console.error(`Error in send-post: ${(error as Error).message} ${(error as Error).name} ${(error as Error).cause} \n ${(error as Error).stack}`)
        return { success: false, error: (error as Error).message, status: 500, data: undefined, statusText: "Backend Error" }
    } finally {
        clearTimeout(id);
    }
}
)

ipcMain.handle('advanceRequest', async (_, url: string, options?: { method?: "POST" | "GET", headers?: { [key: string]: string } }) => {
    try {
        const response = await fetch(url, options);
        if (!response.ok) return { text: "", buffer: [], status: response.status, statusText: response.statusText, url: response.url, success: response.ok, json: undefined, responseHeader: response.headers }
        let bufferCloned = response.clone()
        let jsontext;
        let text = "";

        try {
            jsontext = await response.json()
        } catch (error) {}
        try {
            text = await response.text()
        } catch (error) {}

        return {
            text: text,
            json: jsontext,
            buffer: Buffer.from(await bufferCloned.arrayBuffer()),
            status: response.status,
            statusText: response.statusText,
            url: response.url,
            success: response.ok,
            responseHeader: response.headers
        };
    } catch (error) {
        console.error(`Error in advanceRequest: ${(error as Error).message} ${(error as Error).name} ${(error as Error).cause} \n ${(error as Error).stack}`)
        return {
            text: (error as Error).message,
            json: undefined,
            buffer: Buffer.from(""),
            status: 500,
            statusText: "Backend Error",
            url: url,
            success: false,
            responseHeader: {}
        }
    }
});