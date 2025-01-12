import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        invoke(channel: string, ...args: any[]): Promise<any>
      },
      update: {
        updateAvailable: (callback: (event: Event, isAvailable: boolean, version: string) => void) => void;
        updateProgress: (callback: (event: Event, percent: number) => void) => void;
        downloadUpdate: () => void;
      }
    }
    api: unknown
  }
}
