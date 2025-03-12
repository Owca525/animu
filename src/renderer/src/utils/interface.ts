import { ReactNode } from "react";

export interface CardProps {
  id: string
  title: string
  img: string
  player?: { episodes: number[]; episode: { type: string, ep: number }; time: number | string }
  text?: string
}

export interface ContainerProps {
  title: string
  data?: CardProps[]
  className?: string
}

interface date { date?: number, hour?: number, minute?: number, month?: number, year?: number}

export interface InformationData {
  id: string
  title: string
  description: string
  information: { format: string, episodeDuration: number, status: string, season: { quarter: string, year: number }, episodesCount: number, airedStart: date, airedEnd: date }
  images: { banner: string, cover: string }
  episodes: Array<{ type: string, avaibleEpisodes: number, listEpisodes: Array<number> }>
}

export interface ListItem {
  value: string
  class?: string
  title: string
  page?: string
  onClick?: () => Promise<void>
}

export interface SidebarProps {
  top: ListItem[]
  bottom: ListItem[]
  class?: string
  onlyMax?: boolean
  sidebarHover?: boolean | undefined
  showVersion?: boolean
}

interface SettingsConfigGeneral {
  HoverSidebar: boolean
  HideSidebar: boolean
  language: string
  theme: string
  Window: {
    AutoMaximize: boolean
    AutoFullscreen: boolean
    Zoom: number
  }
}

interface SettingsConfigPlayer {
  general: {
    Autoplay: boolean
    AutoFullscreen: boolean
    AutoSkipEpisode: boolean
    Volume: number
    playerLoadType: string
    LongTimeSkipForward: number | string
    LongTimeSkipBack: number | string
    TimeSkipLeft: number | string
    TimeSkipRight: number | string
  }
  screenShot: {
    alwaysAsk: boolean
    path: string
  }
  keybinds: {
    Pause: string
    LongTimeSkipForward: string
    LongTimeSkipBack: string
    TimeSkipLeft: string
    TimeSkipRight: string
    Fullscreen: string
    ExitPlayer: string
    FrameSkipBack: string
    FrameSkipForward: string
    VolumeUp: string
    VolumeDown: string
    VolumeMute: string
    ScreenShot: string
  }
}

interface SettingsConfigHistory {
  history: {
    LimitedHistory: boolean
    maxSave: number | string
  }
  continue: {
    MinimalTimeSave: number | string
    MaximizeTimeSave: number | string
  }
}

export interface SettingsConfig {
  General: SettingsConfigGeneral
  Player: SettingsConfigPlayer
  History: SettingsConfigHistory
  Developer: {
    DeveloperMode: boolean
    DevTools: boolean
    DevToolsOnStart: boolean
    playerDebug: boolean
  }
  update: {
    lastTime: string
    type: "start" | "day" | "week" 
    enable: boolean
  }
}

export const notificationProps = {
  closeOnClick: true,
  autoClose: 3000,
  pauseOnHover: true,
  hideProgressBar: true
}

export interface dialogProps {
  header_text?: string
  text?: string
  type?: "info" | "custom"
  content?: ReactNode
  buttons?: { title: string; onClick: () => void }[]
}

export interface playerUrlProps {
  url: string, 
  res: { resolution: string, url: string }[], 
  hostname: string, 
  hls: boolean
}