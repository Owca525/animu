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

export interface InformationProps {
  id_anime: string
  showPopup: boolean
  toggle: () => void
}

export interface InformationData {
  id: string
  title: string
  description: string
  img: string
  episodes: Array<string>
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

export interface NotificationProps {
  data: { title: string; information: string; onClick?: () => void }[]
}

interface SettingsConfigGeneral {
  HoverSidebar: boolean
  language: string
  color: string
  cardSize: string
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
    LongTimeSkipForward: number | string
    LongTimeSkipBack: number | string
    TimeSkipLeft: number | string
    TimeSkipRight: number | string
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
