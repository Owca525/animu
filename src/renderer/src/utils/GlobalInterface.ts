export const notificationProps = {
    closeOnClick: true,
    autoClose: 3000,
    pauseOnHover: true,
    hideProgressBar: true
}

export interface AnimeData {
    averageScore?: number | undefined
    bannerImage?: string | undefined
    coverImage?: string | undefined
    description?: string | undefined
    duration?: number | undefined
    endDate?: {
        day: number
        month: number
        year: number
    } | undefined
    episodes?: number | undefined
    format?: string | undefined
    genres?: Array<String> | undefined
    nextAiringEpisode?: {
        airingAt: number
        episode: number
        timeUntilAiring: number
    } | undefined
    popularity?: number | undefined
    season?: string | undefined
    seasonYear?: number | undefined
    startDate?: {
        day: number
        month: number
        year: number
    } | undefined
    characters: {
        role: string,
        character: {
            id: string,
            name: string,
            image: string
        },
        voiceActor?: {
            id: string,
            name: string,
            image: string
        }
    }[]
    source?: string | undefined
    status?: string | undefined
    studios: string[]
    title: { english?: string, native: string, romaji: string }
    type?: string | undefined
    episodesList?: { episodes: { ep: string, img?: string, title?: string }[], type: string, name?: string }[]
    player_ID?: string
    id: string
    malID?: string
    trailer?: { id: string, site: string } | undefined
}

export interface homeData {
    data: containerData[]
    isLoading: boolean
    isError: boolean
    search: string
    page: number
    stopScrolling: boolean
    containerLoading: boolean
    localSearch: boolean
    filterTags: FilterParams | undefined
}

export interface playerData {
    hostname: string
    hls: boolean
    resolution: { res: string, url: string, defaultSubtitles?: boolean; }[]
    storyboardVTT?: string
    listChapters?: playerChapterList
    subtitles?: playerSubtitlesFormat[]
}

export interface playerSubtitlesFormat { url: string, lang: string, label: string, format: string }

export type playerChapterList = { start: number, end: number, type: "opening" | "ending" | "other", name?: string }[]

export interface indentityPlayer {
    pluginName: string
    last_Time: number
    episode: string
    type: string
}

export interface cardData {
    AnimeData: AnimeData
    saveData?: indentityPlayer
    deletionCard?: () => void
    onClick?: (data: AnimeData) => void
}

export interface containerData {
    title?: string
    data: cardData[]
    horizontal?: boolean
    onScrollDownFunction?: (page: number) => void
    onTitleClick?: () => void
    tags?: {
        remover: () => void
        name: string
    }[]
}

export interface sidebarData {
    icon: string
    text: string
    onClick?: () => void
}

export type ContextMenuProps = {
    option: string,
    onClick?: () => void,
    line?: boolean,
    deletion?: boolean
}[]

export interface themeMetadata { 
    version?: string; 
    author?: string; 
    pathcss: string; 
    animuTitle?: string; 
    name: string;
}

export interface pluginFormat {
    version: string
    name: string
    author: string
    icon?: string
    preferedLang: string[]
    information?: {
        pageSize: number
        search: (name: string, page: number, params?: { genres?: string[], years?: string, seasons?: string, format?: string[], airing?: string }) => void
        home: () => void
        anime: (id: string) => Promise<AnimeData | undefined>
        searchOption: { genres: string[], seasons: string[], years: string[], format: string[], statuses: string[] }
    } | null
    player?: {
        getUrls: (type: string, episode: string, id: string) => Promise<playerData[]>
        animeDataList: (animeData?: AnimeData, anime_id?: string) => Promise<episodeList | undefined>
        episodeList: (type: string, anime_id: string) => Promise<{ ep: string, img?: string, title?: string }[]>
        animeList: (name: AnimeData) => Promise<cardData[]>
    } | null
    sidebarAddon?: sidebarData[]
}

export interface episodeList { player_id: string, episodesData: { episodes: { ep: string, img?: string, title?: string }[], type: string, name?: string }[] }

export interface SettingsConfig {
    firstStart: boolean
    plugins: {
        // information: string
        player: string
    }
    General: {
        HoverSidebar: boolean
        HideSidebar: boolean
        language: string
        theme: string
        discordRPC: boolean
        Window: {
            AutoMaximize: boolean
            AutoFullscreen: boolean
            Zoom: number
        }
    }
    Player: {
        general: {
            Autoplay: boolean
            AutoFullscreen: boolean
            AutoSkipEpisode: boolean
            Volume: number
            LongTimeSkipForward: number | string
            LongTimeSkipBack: number | string
            TimeSkipLeft: number | string
            TimeSkipRight: number | string
            VideoStreching: boolean,
            DisableVolumeAnimation: boolean,
            RemovingSpaceAnimation: boolean
            PlayerBehavior: "home" | "information"
            autoSkipOpenings: boolean
            autoSkipEndings: boolean
        }
        screenShot: {
            alwaysAsk: boolean
            saveType: "File" | "Clipboard" | "Both"
            path: string
        },
        external: {
            enable: boolean,
            type: "Movian" | "VLC" | "Mpv" | "ChromeCast",
            movianIP: string
            vlcPath: string
            mpvPath: string
        }
        upToNextEpisode: {
            enable: boolean
            interval: number
            durationShow: number
            variants: "var1" | "var2" | "old"
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
            PictureInPicture: string
            toggleSubtitles: string
        }
    }
    History: {
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
    Developer: {
        DeveloperMode: boolean
        DevTools: boolean
        DevToolsOnStart: boolean
        playerDebug: boolean
    }
    update: {
        lastTime: string
        type: "On Start" | "Every Day" | "Every Week"
        enable: boolean
    }
}

export interface dialogProps {
    type: "error" | "info" | "refresh" | "none" 
    title: string
    description?: string
    buttons: {
        firstbutton: () => void
        secondbutton: () => void
    }
}

export interface Thumbnail {
    src: string;
    metadata: {
        start: number;
        end: number;
        imgX: number;
        imgY: number;
    }[]
};

export interface FilterParams {
  genres?: string[];
  years?: string;
  seasons?: string;
  format?: string[];
  airing?: string;
};