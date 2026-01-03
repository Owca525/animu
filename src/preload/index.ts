import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";

const api = {};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("api", {
      open: (url: string) => ipcRenderer.invoke("open", url),
      saveToClipboard: (type: "text" | "image", content: string) => ipcRenderer.invoke("saveToClipboard", type, content),
      chromecast: {
        startSearch: () => ipcRenderer.invoke("searchChromeCast"),
        deviceList: () => ipcRenderer.invoke("getListChromcasts"),
        stopSearch: () => ipcRenderer.invoke("stopSearchChromcast"),
        connect: (device: { host: string, port: number, name: string }, metadata: { title: string, time: number, url: string, type: string }) => ipcRenderer.invoke("playOnChromeCast", device, metadata)
      },
      update: {
        updateProgress: (callback) =>
          ipcRenderer.on("update-download-progress", callback),
        downloadUpdate: () => ipcRenderer.send("downloadUpdate"),
        checkUpdate: () => ipcRenderer.invoke("checkUpdates"),
      },
      request: {
        get: (url: string, header: Record<string, string>, type?: "json" | "text") =>
          ipcRenderer.invoke("fetch-data", url, header, type),
        post: (url: string, header: Record<string, string>, body?: { query: any, variables: Object }, type?: "json" | "text") =>
          ipcRenderer.invoke("send-post", url, header, body, type),
        advanceRequest: (url: string, options?: { method?: "POST" | "GET", header?: Record<string, string> }) => ipcRenderer.invoke('advanceRequest', url, options),
      },
      rpc: {
        setActivity: (details: string | undefined, state: string | undefined) =>
          ipcRenderer.invoke("setActivity", details, state),
        runDiscordRPC: () => ipcRenderer.invoke("runDiscordRPC"),
      },
      os: {
        exists: (path: string) => ipcRenderer.invoke("exist", path),
        write: (path: string, data: string, format?: string) => ipcRenderer.invoke("write", path, data, format),
        read: (path: string, format?: string) => ipcRenderer.invoke("read", path, format),
        saveDialog: (fileName: string, data: any, title: string, name: string, extensions: string[], format?: string) => ipcRenderer.invoke("saveDialog", fileName, data, title, name, extensions, format),
        openDialog: (path?: string, name?: string, extensions?: string[]) => ipcRenderer.invoke("openDialog", path, name, extensions),
        getPathProgram: (program: string) => ipcRenderer.invoke("getPathProgram", program),
        checkPictureFolder: () => ipcRenderer.invoke("createPictureFolder"),
        getConfigPath: () => ipcRenderer.invoke("getConfigPath"),
        getBrowserConfigPath: () => ipcRenderer.invoke("getBrowserConfigPath")
      },
      backup: {
        make: () => ipcRenderer.invoke("makeBackup"),
        list: () => ipcRenderer.invoke("backupList"),
        restore: (file: string) => ipcRenderer.invoke("restoreBackup", file)
      },
      themes: {
        list: () => ipcRenderer.invoke("get-css-files"),
        config: (theme) => ipcRenderer.invoke("getThemeConfig", theme),
        writeConfig: (theme, data: Record<string, boolean | string>) => ipcRenderer.invoke("saveConfigTheme", theme, data)
      },
      runExternaPlayer: (videoData: { url: string, path: string, time: number, title: string, subs?: { subList: string[], sid: number }, chapters?: string }, type: "mpv" | "vlc") => ipcRenderer.invoke("runExternalPlayer", videoData, type),
      getOSDetails: () => ipcRenderer.invoke('get-os-info'),
      getListLang: () => ipcRenderer.invoke("get-lang-files"),
      getConfig: () => ipcRenderer.invoke("getConfig"),
      getHistory: () => ipcRenderer.invoke("getHistory"),
      onProtocolRequest: (callback: (url: string) => void) => {
        ipcRenderer.on('protocol-request', (_, url) => callback(url));
      },
    });
    contextBridge.exposeInMainWorld("backend", {
      Buffer: require("buffer").Buffer,
      ipcRenderer: {
        invoke: (channel: string, ...args: any[]): Promise<any> =>
          ipcRenderer.invoke(channel, ...args),
      },
      version: () => ipcRenderer.invoke("animuVersion")
    });
    contextBridge.exposeInMainWorld("electronAPI", electronAPI)
    contextBridge.exposeInMainWorld("BrowserWindow", {
      setMaximize: () => ipcRenderer.send("setMaximize"),
      setFullscreen: (option: boolean) =>
        ipcRenderer.send("setFullscreen", option),
      isFullscreen: () => ipcRenderer.invoke("isFullscreen"),
      setZoom: (zoom: number) => ipcRenderer.send("setZoom", zoom),
      exit: () => ipcRenderer.send("exit"),
      openDevTools: () => ipcRenderer.send("openDevTools")
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
