import { autoUpdater } from 'electron-updater'
import { mainWindow } from '.';
import { ipcMain } from 'electron';

autoUpdater.on('download-progress', (progressObj) => {
    const { percent } = progressObj;
    if (mainWindow) mainWindow.webContents.send('update-download-progress', percent);
});

autoUpdater.on('update-available', (update) => {
    console.log(update)
    if (mainWindow) mainWindow.webContents.send('update-available', true, update.version);
});

autoUpdater.on("error", (_event) => {
    console.error(_event)
    if (mainWindow) mainWindow.webContents.send('update-available', false);
})

ipcMain.on("downloadUpdate", () => {
    autoUpdater.downloadUpdate()
    autoUpdater.quitAndInstall()
})

autoUpdater.autoDownload = false

autoUpdater.checkForUpdates();