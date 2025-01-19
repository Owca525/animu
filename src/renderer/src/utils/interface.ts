export interface CardProps {
  id: string
  title: string
  img: string
  player?: { episodes: number[]; episode: number; time: number | string }
  text?: string
}

export interface ContainerProps {
  title: string
  data?: CardProps[]
  className?: string
}

export interface InformationData {
  id: string
  title: string
  description: string
  img: string
  banner: string

  episodes: Array<{ type: string, avaibleEpisodes: number, listEpisodes: Array<number> }>
}

interface ListItem {
  value: string
  class?: string
  title: string
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
}

export const notificationProps = {
  closeOnClick: true,
  autoClose: 3000,
  pauseOnHover: true,
  hideProgressBar: true
}

export interface dialogProps {
  header_text: string
  text: string
  buttons: { title: string; onClick: () => void }[]
}