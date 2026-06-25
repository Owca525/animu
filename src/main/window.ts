import { app, BrowserWindow, ipcMain } from "electron"
import { mainWindow } from "."

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
    mainWindow.webContents.openDevTools()
})

ipcMain.on("window:createNewWindow", () => {
    let mainWindow = new BrowserWindow({
        width: 1500,
        height: 800,
        minHeight: 495,
        minWidth: 860,
        autoHideMenuBar: true,
        webPreferences: {
            sandbox: true,
            webSecurity: true,
            contextIsolation: true,
            allowRunningInsecureContent: false,
            nodeIntegration: false,
        },
    })

    mainWindow.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
        let newHeader = {
            ...details.requestHeaders,
            "Referer": "",
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36"
        }
        callback({ requestHeaders: newHeader });
    })

    mainWindow.webContents.session.webRequest.onCompleted((details) => {
        if (details["url"] == "") console.log(details)
    })

    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.executeJavaScript(`
        `);
    });

    mainWindow.loadURL("")
})