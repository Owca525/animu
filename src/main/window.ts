import { app, ipcMain } from "electron"
import { mainWindow } from "."

//
// This file is for fullscreen, zoom, exit, etc 
//

ipcMain.on('setMaximize', (_event) => {
    if (mainWindow) mainWindow.maximize()
})

ipcMain.on('setFullscreen', (_event, option: boolean) => {
    if (mainWindow) mainWindow.setFullScreen(option)
})

ipcMain.on('isFullscreen', (_event) => {
    if (mainWindow) return mainWindow.isFullScreen()
    return false
})

ipcMain.on('setZoom', (_event, option: number) => {
    if (mainWindow) mainWindow.webContents.setZoomLevel(option)
})

ipcMain.on('exit', (_event) => {
    app.quit()
})