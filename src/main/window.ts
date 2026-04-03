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