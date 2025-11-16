import { ElectronAPI } from "@electron-toolkit/preload";
import { cardData, SettingsConfig } from "@renderer/utils/types";

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
        getConfigPath: () => Promise<string>
      };
      backup: {
        make: () => Promise<{ success: boolean, error: any }>
      }
      runExternaPlayer: (videoData: {url: string, path: string, time: number, title: string, subs?: { subList: string[], sid: number }, chapters?: string}, type: "mpv" | "vlc") => any
      getlistThemes: () => Promise<{ version?: string; autor?: string; pathcss: string; animuTitle?: string; name: string; pathIcon?: string }[]>
      getOSDetails: () => Promise<{ platform: NodeJS.Platform, release: string, arch: string }>
      getListLang: () => Promise<{ data: any, lang: string }[]>
      getConfig: () => Promise<SettingsConfig>
      getHistory: () => Promise<cardData[]>
    };
    backend: {
      ipcRenderer: {
        invoke(channel: string, ...args: any[]): Promise<any>;
      };
      version: () => Promise<string>;
    };
    electronAPI: ElectronAPI
    BrowserWindow: {
      setMaximize: () => void;
      setFullscreen: (option: boolean) => void;
      isFullscreen: () => Promise<boolean>;
      setZoom: (zoom: number) => void;
      exit: () => void;
      openDevTools: () => void;
    };
  }
}
