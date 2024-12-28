import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        invoke(channel: string, ...args: any[]): Promise<any>
      }
    }
    api: unknown
  }
}
