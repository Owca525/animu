import { app, ipcMain } from "electron"
import { mainWindow } from "."

//
// This file is for fullscreen, zoom, exit, etc 
//

ipcMain.on('setMaximize', (_event): void => {
    if (mainWindow) mainWindow.maximize()
})

ipcMain.on('setFullscreen', (_event, option: boolean): void => {
    if (mainWindow) mainWindow.setFullScreen(option)
})

ipcMain.handle('isFullscreen', (_event): boolean => {
    if (mainWindow) return mainWindow.isFullScreen()
    return false
})

ipcMain.on('setZoom', (_event, option: number): void => {
    if (mainWindow) mainWindow.webContents.setZoomLevel(option)
})

ipcMain.on('exit', (_event): void => {
    app.quit()
})