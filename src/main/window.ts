import { app, BrowserWindow, ipcMain } from "electron"
import { mainWindow, userAgent } from "."

//
// This file is for fullscreen, zoom, exit, etc 
//

ipcMain.on('window:maximize', (_event): void => {
    if (mainWindow) mainWindow.maximize()
})

ipcMain.on('window:fullscreen', (_event, option: boolean): void => {
    if (mainWindow) mainWindow.setFullScreen(option)
})

ipcMain.handle('window:isfullscreen', (_event): boolean => {
    if (mainWindow) return mainWindow.isFullScreen()
    return false
})

ipcMain.on('window:zoom', (_event, option: number): void => {
    if (mainWindow) mainWindow.webContents.setZoomFactor(option)
})

ipcMain.on('window:exit', (_event): void => {
    app.quit()
})

ipcMain.on("window:reload", () => {
    BrowserWindow.getAllWindows()[0].reload();
});

ipcMain.on("window:devtools", () => {
    if (!mainWindow) return
    mainWindow.webContents.openDevTools({ mode: "detach", title: "Animu Debugger" })
})

function find_cf_clearence(data: string[]) {
    return data.find(str => str.includes("cf_clearance="))
}

function createWindow() {
    return new BrowserWindow({
        width: 1200,
        height: 700,
        minHeight: 400,
        minWidth: 600,
        autoHideMenuBar: true,
        webPreferences: {
            sandbox: true,
            webSecurity: true,
            contextIsolation: true,
            allowRunningInsecureContent: false,
            nodeIntegration: false,
        },
    })
}

function HandleCloduflare(url: string) {
    let mainWindow = createWindow()
    mainWindow.webContents.session.clearData()
    mainWindow.webContents.session.clearCache()

    mainWindow.webContents.setUserAgent(userAgent)

    return new Promise((resolve) => {
        mainWindow.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
            details.requestHeaders['User-Agent'] = userAgent
            details.requestHeaders['sec-ch-ua-platform'] = '"Windows"';
            details.requestHeaders['Referer'] = url;
            console.log("before", details)

            if (details["requestHeaders"] && details["requestHeaders"]["Cookie"]) {
                const cookie = details["requestHeaders"]["Cookie"]

                if (cookie.includes("cf_clearance=")) {
                    resolve({ cookie: cookie, header: details["requestHeaders"] })
                    mainWindow.close()
                }
            }

            callback({ requestHeaders: details.requestHeaders });
        })

        mainWindow.webContents.session.webRequest.onCompleted((details) => {
            if (!details["responseHeaders"]) return
            if (!details["responseHeaders"]["set-cookie"]) return

            const cf_clearance = find_cf_clearence(details["responseHeaders"]["set-cookie"])
            if (cf_clearance) {
                resolve({ cookie: cf_clearance, header: details["responseHeaders"] as any })
                mainWindow.close()
            }
        })

        let count = 0;

        mainWindow.webContents.on('did-navigate', (_, url) => {
            count++;
            console.log('NAV #' + count, url);
            if (count >= 3) {
                mainWindow.close()
                resolve({ cookie: "", header: {} })
            }
        });

        mainWindow.loadURL(url)
    })
}

ipcMain.handle("window:createNewWindow", async (_, props: { url: string, type: string }): Promise<any> => {
    switch (props["type"]) {
        case "CloudFlare":
            return HandleCloduflare(props["url"])
    }
})