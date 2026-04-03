import { ipcMain } from 'electron';

ipcMain.handle("searchChromeCast", (_event) => {
    // DEPRECATED
});

ipcMain.handle("getListChromcasts", (_event) => {
    // DEPRECATED
    return []
});

ipcMain.handle("stopSearchChromcast", (_event) => {
    // DEPRECATED
});

ipcMain.handle("playOnChromeCast", (_event, _device: { host: string, port: number, name: string }, _metadata: { title: string, time: number, url: string, type: string }) => {
    // DEPRECATED
});