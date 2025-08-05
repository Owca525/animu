import { autoUpdater } from 'electron-updater'
import { mainWindow } from '.';
import { ipcMain } from 'electron';

autoUpdater.on('download-progress', (progressObj) => {
    const { percent } = progressObj;
    if (mainWindow) mainWindow.webContents.send('update-download-progress', percent);
});

autoUpdater.on("error", (_event) => {
    console.error(_event)
    if (mainWindow) mainWindow.webContents.send('update-available', false);
})

ipcMain.handle("checkUpdates", async () => {
    let data = await autoUpdater.checkForUpdates()
    if (!data) return { available: false, version: autoUpdater.currentVersion.version }
    return { available: true, version: data.updateInfo.version }
})

ipcMain.on("downloadUpdate", () => {
    autoUpdater.downloadUpdate()
    autoUpdater.quitAndInstall()
})

autoUpdater.autoDownload = false

autoUpdater.checkForUpdates();