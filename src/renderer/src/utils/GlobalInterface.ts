export const notificationProps = {
    closeOnClick: true,
    autoClose: 3000,
    pauseOnHover: true,
    hideProgressBar: true
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
    episodesList?: { episodes: string[], type: string, name?: string }[]
    player_ID?: string
    id: string
}

export interface homeData {
    data: containerData[]
    isLoading: boolean
    isError: boolean
    search: string
    page: number
    stopScrolling: boolean
    containerLoading: boolean
}

export interface playerData {
    hostname: string
    hls: boolean
    resolution: { res: string, url: string }[]
}

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
    title: string
    data: cardData[]
    horizontal?: boolean
    onScrollDownFunction?: (page: number) => void
    onTitleClick?: () => void
}

export interface sidebarData {
    icon: string
    text: string
    onClick?: () => any
}

export interface pluginFormat {
    version: string
    name: string
    author: string
    information?: {
        pageSize: number
        search: (name: string, page: number) => void
        home: () => void
    } | null
    player?: {
        getUrls: (type: string, episode: string, id: string) => Promise<playerData[]>
        animeDataList: (name?: string, anime_id?: string) => Promise<{ player_id: string, episodesData: { episodes: string[], type: string, name?: string }[] }>
        episodeList: (type: string, anime_id: string) => Promise<Array<string> | null>
        animeList: (name: string) => Promise<cardData[]>
    } | null
    sidebarAddon?: sidebarData[]
}

export interface SettingsConfig {
    General: {
        // HoverSidebar: boolean
        // HideSidebar: boolean
        language: string
        theme: string
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
            playerLoadType: string
            LongTimeSkipForward: number | string
            LongTimeSkipBack: number | string
            TimeSkipLeft: number | string
            TimeSkipRight: number | string
        }
        screenShot: {
            alwaysAsk: boolean
            saveType: "File" | "Clipboard" | "Both"
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
    type: "error" | "info" | "none"
    title: string
    description?: string
    buttons: {
        yesButton: () => void
        noButton: () => void
    }
}