import { ipcMain } from "electron";
import { DEBUG } from ".";

export async function advanceRequest(url: string, options?: { method?: "POST" | "GET", headers?: { [key: string]: string }, body?: any }) {
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
            responseHeader: new Map<string, string>(response.headers.entries()),
        }

        if (DEBUG) console.log("advanceRequest\n", response) // options

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

ipcMain.handle('advanceRequest', async (_, url: string, options?: { method?: "POST" | "GET", headers?: { [key: string]: string }, body: any }) => await advanceRequest(url, options));