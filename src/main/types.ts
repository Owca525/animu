import { app } from "electron"
import path from "path"
import { checkPath } from "./utils"

import config from "../../resources/config.json"

export interface SettingsConfig {
    firstStart: boolean
    deepLinkURL: string
    yt_dlp: string
    animulist: {
        historyConvert: boolean
    }
    anilist: {
        scoreFormat: "POINT_100" | "POINT_10_DECIMAL" | "POINT_10" | "POINT_5" | "POINT_3"
        titleFormat: "ROMAJI" | "ENGLISH" | "NATIVE"
        adultdefault: boolean
        maxpagesize: number
    }
    information: {
        openingininformation: boolean,
        alwaysUpdateAnime: boolean,
        episodeVariants: "v1" | "v2",
        trailerplayertype: "embed" | "player",
        preloadTrailer: boolean,
        preloadOpening: boolean
    },
    plugins: {
        // information: string
        hiddenPlugins: string[]
        userPlugins: boolean
        player: string
        repoURL: string[]
        pluginCheckType: "On Start" | "Every Day" | "Every Week"
        lastTimeCheck: number
    }
    General: {
        // HoverSidebar: boolean
        // HideSidebar: boolean
        language: string
        theme: string[]
        discordRPC: boolean
        audioOutput: string
        Window: {
            AutoMaximize: boolean
            AutoFullscreen: boolean
            Zoom: number
            trayIconClose: boolean
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
            PlayerBehavior: "home" | "information"
            autoSkipOpenings: boolean
            autoSkipEndings: boolean
            showBrokenBuffer: boolean
            minusTime: boolean
            disablemoreinformation: boolean
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
        ui: {
            DisableVolumeAnimation: boolean,
            DisableSpaceAnimation: boolean,
            DisableSkipAnimation: boolean,
            DisableLoadingAnimation: boolean
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
            skipOpeningEnding: string
            noSubbtitlesreenshot: string
            startRecordClip: string,
            stopRecordClip: string
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
    backup: {
        enable: boolean,
        lastCheck: number,
        maxBackups: number,
        check: "Every Day" | "Every Week" | "Every Month"
    }
    Developer: {
        DeveloperMode: boolean
        DevTools: boolean
        DevToolsOnStart: boolean
        playerDebug: boolean
    }
    update: {
        lastTime: number
        type: "On Start" | "Every Day" | "Every Week"
        enable: boolean
    }
    socket: {
        useSocket: boolean,
        backend: string
    }
    backend: {
        useragent: string
        discordrpcTime: number
    }
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
    genres: Array<String> | undefined
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
    recommendations?: {
        id: number,
        title: { english?: string, native: string, romaji: string }
        bannerImage?: string
        coverImage: string
    }[]
}

export interface indentityPlayer {
    pluginName: string
    last_Time: number
    episode: string
    type: string
    duration?: number
    isStarted?: boolean
    lastAnimeDataUpdate?: number
}

export interface cardData {
    AnimeData: AnimeData
    saveData?: indentityPlayer
    onClick?: (data: AnimeData) => void
}

export interface requestResponseVideo {
    url: string
    header: { [key: string]: string }
}

export const defaultConfig = {
    ...config,
    Player: {
        ...config.Player,
        screenShot: {
            ...config.Player.screenShot,
            alwaysAsk: true,
            saveType: "File",
            path: path.join(app.getPath("pictures"), "animu"),
        },
        external: {
            ...config.Player.external,
            type: config.Player.external,
            mpvPath: checkPath("mpv"),
            vlcPath: checkPath("vlc")
        },
    }
};


export type pluginRepoExpanded = {
    name: string,
    file: string,
    ver: string,
    author: string,
    urlWebsite: string,
    icon?: string,
    sha256: string,
    type: "information" | "player"
    description?: string
} & { repoURL: string }

export interface themeFormatType {
    api?: string,
    version?: string,
    author: string,
    themeName: string
    mainCSS: string,
    options?: {
        name: string,
        dropDown?: { option: string, css: string }[]
        css?: string,
        default?: boolean
    }[]
}

export interface animulistData {
    AnimeData: AnimeData
    animulist: {
        status: "CURRENT" | "PLANNING" | "COMPLETED" | "REPEATING" | "DROPPED" | "PAUSED",
        score: number,
        reapeat: number,
        startWatch: number,
        endWatch: number,
        added: number,
        lastUpdate: number,
        favorite?: boolean
    }
}

export interface playlistFormatData {
    anime: cardData,
    added: number,
    lastupdate: number
}