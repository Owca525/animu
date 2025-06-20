import { ElectronAPI } from "@electron-toolkit/preload";

declare global {
  interface Window {
    api: {
      open: (url: string) => Promise<void>;
      saveToClipboard: (type: "text" | "image", content: string) => Promise<boolean>;
      update: {
        updateAvailable: (
          callback: (
            event: Event,
            isAvailable: boolean,
            version: string
          ) => void
        ) => void;
        updateProgress: (
          callback: (event: Event, percent: number) => void
        ) => void;
        downloadUpdate: () => void;
      };
      request: {
        get: (
          url: string,
          header: Record<string, string>
        ) => Promise<{
          success: boolean;
          data?: any;
          status?: number;
          statusText?: string;
          error?: unknown;
        }>;
        post: (url: string, header: Record<string, string>, body?: { query: string, variables: Object }) => Promise<{
          success: boolean;
          data?: any;
          status?: number;
          statusText?: string;
          error?: unknown;
        }>;
      };
      rpc: {
        setActivity: (
          details: string | undefined,
          state: string | undefined
        ) => Promise<void>;
      }
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
        ) => Promise<string>;
        exists: (path: string) => Promise<boolean>;
        write: (path: string, data: string, format?: string) => Promise<boolean>
        read: (path: string, format?: string) => Promise<any>;
        mkdir: (path: string) => Promise<boolean>;
        saveDialog: (fileName: string, data: any, title: string, name: string, extensions: string[], format?: string) => Promise<boolean>
        openDialog: (path?: string, name?: string, extensions?: string[]) => Promise<string>
      };
      runExternaPlayer: (url: string, path: string, time: string, type: "mpv" | "vlc") => any
      getlistThemes: () => Promise<{ path: string, filename: string, type: "user" | "official" }[]>
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
