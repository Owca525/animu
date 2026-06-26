import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";
import { playlistFormatData, pluginRepoExpanded } from "../main/types";

const api = {};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("api", {
      open: (url: string) => ipcRenderer.invoke("open", url),
      saveToClipboard: (type: "text" | "image", content: string) => ipcRenderer.invoke("saveToClipboard", type, content),
      getConfigAvatar: () => ipcRenderer.invoke("config:fetchAvatar"),
      animePlaylist: {
        read: (playlist: string) => ipcRenderer.invoke("playlist:read", playlist),
        save: (playlist: string, data: playlistFormatData) => ipcRenderer.invoke("playlist:save", playlist, data),
        update: (playlist: string, data: playlistFormatData) => ipcRenderer.invoke("playlist:update", playlist, data),
        delete: (playlist: string, animeID: string) => ipcRenderer.invoke("playlist:delete", playlist, animeID),
        deleteAll: (playlist: string) => ipcRenderer.invoke("playlist:deleteAll", playlist),
      },
      chromecast: {
        startSearch: () => ipcRenderer.invoke("searchChromeCast"),
        deviceList: () => ipcRenderer.invoke("getListChromcasts"),
        stopSearch: () => ipcRenderer.invoke("stopSearchChromcast"),
        connect: (device: { host: string, port: number, name: string }, metadata: { title: string, time: number, url: string, type: string }) => ipcRenderer.invoke("playOnChromeCast", device, metadata)
      },
      update: {
        updateProgress: (callback) =>
          ipcRenderer.on("update:progress", callback),
        downloadUpdate: () => ipcRenderer.send("update:startdownload"),
        checkUpdate: () => ipcRenderer.invoke("update:checkUpdates"),
      },
      request: (url: string, options?: { method?: "POST" | "GET", header?: Record<string, string> }) => ipcRenderer.invoke('advanceRequest', url, options),
      rpc: {
        setActivity: (details: string | undefined, state: string | undefined, time?: Date, urlDetails?: string) =>
          ipcRenderer.invoke("discordrpc:activity", details, state, time, urlDetails),
        runDiscordRPC: () => ipcRenderer.invoke("discordrpc:run"),
      },
      os: {
        exists: (path: string) => ipcRenderer.invoke("fs:exist", path),
        write: (path: string, data: string, format?: string) => ipcRenderer.invoke("fs:write", path, data, format),
        read: (path: string, format?: string) => ipcRenderer.invoke("fs:read", path, format),
        saveDialog: (fileName: string, data: any, title: string, name: string, extensions: string[], format?: string) => ipcRenderer.invoke("os:saveDialog", fileName, data, title, name, extensions, format),
        openDialog: (path?: string, name?: string, extensions?: string[]) => ipcRenderer.invoke("os:openDialog", path, name, extensions),
        getConfigPath: () => ipcRenderer.invoke("backend:configPath"),
        getBrowserConfigPath: () => ipcRenderer.invoke("backend:BrowserConfigPath")
      },
      backup: {
        make: () => ipcRenderer.invoke("backup:make"),
        list: () => ipcRenderer.invoke("backup:list"),
        restore: (file: string) => ipcRenderer.invoke("backup:restore", file)
      },
      themes: {
        list: () => ipcRenderer.invoke("theme:listTheme"),
        config: (theme) => ipcRenderer.invoke("theme:ConfigTheme", theme),
        writeConfig: (theme, data: Record<string, boolean | string>) => ipcRenderer.invoke("theme:SaveConfig", theme, data)
      },
      plugins: {
        list: () => ipcRenderer.invoke("plugins:list"),
        saveConfig: (name: string, config: { [key: string]: any }) => ipcRenderer.invoke("plugins:saveConfig", name, config),
        getConfig: (name: string, config: { [key: string]: any }) => ipcRenderer.invoke("plugins:getConfig", name, config),
        installUpdate: (plugin: pluginRepoExpanded) => ipcRenderer.invoke("plugins:install", plugin)
      },
      yt_dlp: {
        versionList: () => ipcRenderer.invoke('yt-dlp:releases'),
        install: (tag: string) => ipcRenderer.invoke('yt-dlp:install', tag),
        run: (commands: string[]) => ipcRenderer.invoke('yt-dlp:run', commands),
      },
      animulist: {
        add: (anime) => ipcRenderer.invoke('animulist:saveToDatabase', anime),
        delete: (id) => ipcRenderer.invoke('animulist:deleteFromDatabase', id),
        update: (id, anime) => ipcRenderer.invoke('animulist:updateDatabase', id, anime),
        getDatabase: () => ipcRenderer.invoke('animulist:getAllInformation'),
        overWrite: () => ipcRenderer.invoke('animulist:overwrite')
      },
      runExternaPlayer: (videoData: { url: string, path: string, time: number, title: string, subs?: { subList: string[], sid: number }, chapters?: string }, type: "mpv" | "vlc") => ipcRenderer.invoke("runExternalPlayer", videoData, type),
      getOSDetails: () => ipcRenderer.invoke('os:information'),
      getUserLang: () => ipcRenderer.invoke("lang:files"),
      saveConfig: (config) => ipcRenderer.invoke("os:saveConfig", config),
      getConfig: () => ipcRenderer.invoke("backend:config"),
      getHistory: () => ipcRenderer.invoke("backend:history"),
      onProtocolRequest: (callback: (url: string) => void) => {
        ipcRenderer.on('protocol-request', (_, url) => callback(url));
      },
    });
    contextBridge.exposeInMainWorld("backend", {
      // ipcRenderer: {
      //   invoke: (channel: string, ...args: any[]): Promise<any> =>
      //     ipcRenderer.invoke(channel, ...args),
      // },
      saveLog: (v) => ipcRenderer.invoke("backend:saveLogs", v),
      setLang: (v) => ipcRenderer.invoke("backend:setLang", v),
      changeHeader: (v) => ipcRenderer.invoke("backend:customheader", v),
      version: () => ipcRenderer.invoke("backend:version"),
      refresh: () => ipcRenderer.invoke("backend:refresh"),
      debug: () => ipcRenderer.invoke("debug:memory")
    });
    contextBridge.exposeInMainWorld("electronAPI", electronAPI)
    contextBridge.exposeInMainWorld("BrowserWindow", {
      setMaximize: () => ipcRenderer.send("window:maximize"),
      setFullscreen: (option: boolean) =>
        ipcRenderer.send("window:fullscreen", option),
      isFullscreen: () => ipcRenderer.invoke("window:isfullscreen"),
      setZoom: (zoom: number) => ipcRenderer.send("window:zoom", zoom),
      exit: () => ipcRenderer.send("window:exit"),
      openDevTools: () => ipcRenderer.send("window:devtools"),
      reload: () => ipcRenderer.send("window:reload"),
      createWindow: () => ipcRenderer.send("window:createNewWindow"),
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
