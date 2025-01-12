import { autoUpdater } from 'electron-updater'
import { mainWindow } from '.';
import { ipcMain } from 'electron';

autoUpdater.on('download-progress', (progressObj) => {
    const { percent } = progressObj;
    if (mainWindow) mainWindow.webContents.send('update-download-progress', percent);
});

autoUpdater.on('update-available', (update) => {
    if (mainWindow) mainWindow.webContents.send('update-available', true, update.version);
});

autoUpdater.on("error", () => {
    if (mainWindow) mainWindow.webContents.send('update-available', true, "0.4.0");
})

ipcMain.on("downloadUpdate", () => {
    autoUpdater.downloadUpdate()
    autoUpdater.quitAndInstall()
})

autoUpdater.checkForUpdatesAndNotify();