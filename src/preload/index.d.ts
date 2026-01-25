import { ElectronAPI } from "@electron-toolkit/preload";
import { cardData, pluginRepoExpanded, SettingsConfig, themeMetadata } from "@renderer/utils/types";

declare global {
  interface Window {
    api: {
      open: (url: string) => Promise<void>;
      saveToClipboard: (type: "text" | "image", content: string) => Promise<boolean>;
      chromecast: {
        startSearch: () => void,
        deviceList: () => Promise<{ host: string, port: number, name: string }[]>;
        connect: (device: { host: string, port: number, name: string }, metadata: { title: string, time: number, url: string, type: string }) => void
        stopSearch: () => void
      },
      update: {
        updateProgress: (
          callback: (event: Event, percent: number) => void
        ) => void;
        downloadUpdate: () => void;
        checkUpdate: () => Promise<{ available: boolean, version: string }>
      };
      yt_dlp: {
        versionList: () => Promise<string[]>
        install: (tag: string) => Promise<void>
        run: (command: string) => Promise<void>
      },
      request: {
        get: (
          url: string,
          header: Record<string, string>,
          type?: "json" | "text"
        ) => Promise<{
          success: boolean;
          data: any;
          status: number;
          statusText: string;
          error?: unknown;
        }>;
        post: (url: string, header: Record<string, string>, body?: { query: any, variables: Object }, type?: "json" | "text") => Promise<{
          success: boolean;
          data: any;
          status: number;
          statusText: string;
          error?: unknown;
        }>;
        advanceRequest: (url: string, options?: { method?: "POST" | "GET", header?: Record<string, string> }) => Promise<{ text: string, json: { [key: string]: any } | undefined, buffer: Buffer, status: number, statusText: string, url: string, success: boolean, responseHeader: { [key: string]: string } }>
      };
      rpc: {
        setActivity: (
          details: string | undefined,
          state: string | undefined
        ) => Promise<void>;
        runDiscordRPC: () => void;
      }
      os: {
        exists: (path: string) => Promise<boolean>;
        write: (path: string, data: string, format?: string) => Promise<boolean>
        read: (path: string, format?: string) => Promise<string | NonSharedBuffer | undefined>;
        saveDialog: (fileName: string, data: any, title: string, name: string, extensions: string[], format?: string) => Promise<boolean>
        openDialog: (path?: string, name?: string, extensions?: string[]) => Promise<string>
        getConfigPath: () => Promise<string>,
        getBrowserConfigPath: () => Promise<string>
      };
      backup: {
        make: () => Promise<{ success: boolean, error: any }>
        list: () => Promise<{ file: string, date: Date }[]>
        restore: (file: string) => Promise<{ success: boolean, error?: number }>
      }
      themes: {
        list: () => Promise<themeMetadata[]>
        config: (theme: themeMetadata) => Promise<Record<string, boolean | string> | {}>
        writeConfig: (theme: themeMetadata, data: Record<string, boolean | string>) => Promise<void>
      },
      plugins: {
        list: () => Promise<{ file: string, content: string, type: "official" | "user", sha256: string, pluginType: "player" | "information" }[]>
        saveConfig: (name: string, config: { [key: string]: any }) => Promise<void>
        getConfig: (name: string, config: { [key: string]: any }) => Promise<{ [key: string]: any }>
        installUpdate: (plugin: pluginRepoExpanded) => Promise<void>
      }
      runExternaPlayer: (videoData: {url: string, path: string, time: number, title: string, subs?: { subList: string[], sid: number }, chapters?: string}, type: "mpv" | "vlc") => any
      getOSDetails: () => Promise<{ platform: NodeJS.Platform, release: string, arch: string }>
      getListLang: () => Promise<{ data: any, lang: string }[]>
      getConfig: () => Promise<SettingsConfig>
      getHistory: () => Promise<cardData[]>
      onProtocolRequest: (callback: (url: string) => void) => void
    };
    backend: {
      ipcRenderer: {
        invoke(channel: string, ...args: any[]): Promise<any>;
      };
      version: () => Promise<string>;
      refresh: () => Promise<void>
    };
    electronAPI: ElectronAPI
    BrowserWindow: {
      setMaximize: () => void;
      setFullscreen: (option: boolean) => void;
      isFullscreen: () => Promise<boolean>;
      setZoom: (zoom: number) => void;
      exit: () => void;
      openDevTools: () => void;
      reload: () => void
    };
  }
}
