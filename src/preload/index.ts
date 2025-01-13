import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";

const api = {};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("api", {
      open: (url: string) => ipcRenderer.invoke("open", url),
      update: {
        updateAvailable: (callback) =>
          ipcRenderer.on("update-available", callback),
        updateProgress: (callback) =>
          ipcRenderer.on("update-download-progress", callback),
        downloadUpdate: () => ipcRenderer.send("downloadUpdate"),
      },
      request: {
        get: (url: string, header: Record<string, string>) =>
          ipcRenderer.invoke("fetch-data", url, header),
      },
      rpc: {
        setActivity: (details: string | undefined, state: string | undefined) =>
          ipcRenderer.send("setActivity", details, state),
      },
      os: {
        getPath: (
          name:
            | "home"
            | "appData"
            | "userData"
            | "sessionData"
            | "temp"
            | "exe"
            | "module"
            | "desktop"
            | "documents"
            | "downloads"
            | "music"
            | "pictures"
            | "videos"
            | "recent"
            | "logs"
            | "crashDumps"
        ) => ipcRenderer.invoke("getPath", name),
        exists: (path: string) => ipcRenderer.invoke("exist", path),
        write: (path: string, data: string, format?: string) => ipcRenderer.invoke("write", path, data, format),
        read: (path: string, format?: string) => ipcRenderer.invoke("read", path, format),
        mkdir: (path: string) => ipcRenderer.invoke("mkdir", path),
        saveDialog: (fileName: string, data: any, title: string, name: string, extensions: string[], format?: string) => ipcRenderer.invoke("saveDialog", fileName, data, title, name, extensions, format),
        openDialog: (path?: string, name?: string, extensions?: string[]) => ipcRenderer.invoke("openDialog", path, name, extensions),
      },
    });
    contextBridge.exposeInMainWorld("electron", {
      Buffer: require("buffer").Buffer,
      ipcRenderer: {
        invoke: (channel: string, ...args: any[]): Promise<any> =>
          ipcRenderer.invoke(channel, ...args),
      },
      version: () => ipcRenderer.send("getVersion"),
    });
    contextBridge.exposeInMainWorld("BrowserWindow", {
      setMaximize: () => ipcRenderer.send("setMaximize"),
      setFullscreen: (option: boolean) =>
        ipcRenderer.send("setFullscreen", option),
      isFullscreen: () => ipcRenderer.send("isFullscreen"),
      setZoom: (zoom: number) => ipcRenderer.send("setZoom", zoom),
      exit: () => ipcRenderer.send("exit"),
    });
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
