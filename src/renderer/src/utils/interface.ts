import { ReactNode } from "react";

export interface CardProps {
  AnimeID: string
  data: AnimeData
  player?: { 
    id: string
    episodes: number[]; 
    episode: { 
      type: string, 
      ep: number 
    }; 
    time: number | string 
  }
  BottomText?: string
  deletion?: (event: any, id: string) => void
}

export interface AnimeData {
  averageScore: number | null
  bannerImage: string | null
  coverImage: string | null
  description: string | null
  duration: number | null
  endDate: {
    day: number
    month: number
    year: number
  } | null
  episodes: number | null
  format: string | null
  genres: Array<String> | null
  isAdult: boolean
  nextAiringEpisode: {
    airingAt: number
    episode: number
    timeUntilAiring: number
  } | null
  popularity: number
  season: string | null
  seasonYear: number | null
  startDate: {
    day: number
    month: number
    year: number
  } | null
  status: string | null
  studios: any
  title: string
  type: string | null
}

// AnimeID is for anilist etc, playerID is for player
export interface InformationData {
  PlayerID: string | null
  AnimeID: string | null
  data: AnimeData
  episodesList: Array<{ type: string, avaibleEpisodes: number, listEpisodes: Array<number> }> | null
}

export interface ListItem {
  icon?: string
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
  type?: boolean
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
    saveType: "File" | "Clip" | "Both"
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
    NextEpisode: string
    PrevEpisode: string
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
    AlwaysAsk: boolean
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