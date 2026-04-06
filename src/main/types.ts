import { app } from "electron"
import path from "path"
import { checkPath } from "./utils"
import { z } from "zod";

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
        openingininformation: boolean
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

export const defaultConfig: SettingsConfig = {
    deepLinkURL: "https://owca525.github.io/",
    firstStart: true,
    General: {
        language: "en",
        theme: ["DarkerAnimu"],
        Window: {
            AutoMaximize: false,
            AutoFullscreen: false,
            Zoom: 100,
            trayIconClose: false
        },
        discordRPC: true,
        audioOutput: "Default"
    },
    Player: {
        general: {
            Autoplay: true,
            AutoFullscreen: false,
            AutoSkipEpisode: true,
            Volume: 25,
            LongTimeSkipForward: 90,
            LongTimeSkipBack: 90,
            TimeSkipLeft: 5,
            TimeSkipRight: 5,
            VideoStreching: false,
            PlayerBehavior: "information",
            autoSkipOpenings: false,
            autoSkipEndings: false,
            showBrokenBuffer: false,
            minusTime: false,
            disablemoreinformation: false
        },
        screenShot: {
            alwaysAsk: true,
            saveType: "File",
            path: path.join(app.getPath("pictures"), "animu"),
        },
        external: {
            enable: false,
            type: "Mpv",
            movianIP: "localhost:42000",
            mpvPath: checkPath("mpv"),
            vlcPath: checkPath("vlc")
        },
        upToNextEpisode: {
            enable: true,
            interval: 15,
            durationShow: 5,
            variants: "var1"
        },
        keybinds: {
            Pause: " ",
            LongTimeSkipForward: "ArrowUp",
            LongTimeSkipBack: "ArrowDown",
            TimeSkipLeft: "ArrowLeft",
            TimeSkipRight: "ArrowRight",
            Fullscreen: "F",
            ExitPlayer: "Escape",
            NextEpisode: "PageUp",
            PrevEpisode: "PageDown",
            FrameSkipBack: ",",
            FrameSkipForward: ".",
            VolumeDown: "9",
            VolumeUp: "0",
            VolumeMute: "m",
            ScreenShot: "f10",
            PictureInPicture: "P",
            toggleSubtitles: "C",
            skipOpeningEnding: "S",
            noSubbtitlesreenshot: "CTRL+f10",
            startRecordClip: "F7",
            stopRecordClip: "F8"
        },
        ui: {
            DisableVolumeAnimation: false,
            DisableSpaceAnimation: false,
            DisableSkipAnimation: false,
            DisableLoadingAnimation: false
        }
    },
    History: {
        history: {
            LimitedHistory: false,
            maxSave: 50,
            AlwaysAsk: true
        },
        continue: {
            MinimalTimeSave: 20,
            MaximizeTimeSave: 100,
        },
    },
    Developer: {
        DeveloperMode: false,
        DevTools: false,
        DevToolsOnStart: false,
        playerDebug: false
    },
    update: {
        lastTime: 0,
        type: "On Start",
        enable: true
    },
    plugins: {
        player: "Allmanga",
        userPlugins: false,
        hiddenPlugins: [],
        repoURL: ["https://raw.githubusercontent.com/Owca525/animu-plugins/refs/heads/main"],
        pluginCheckType: "Every Day",
        lastTimeCheck: 0
    },
    backup: {
        enable: false,
        lastCheck: 0,
        check: "Every Day",
        maxBackups: 3
    },
    yt_dlp: "",
    animulist: {
        historyConvert: true
    },
    anilist: {
        scoreFormat: "POINT_100",
        titleFormat: "ROMAJI",
        adultdefault: false,
        maxpagesize: 20
    },
    information: {
        openingininformation: false
    },
    socket: {
        useSocket: false,
        backend: ""
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

export const ThemeSchema = z.object({
    api: z.string().optional(),
    version: z.string().optional(),
    author: z.string(),
    themeName: z.string(),
    mainCSS: z.string(),
    options: z.array(
        z.object({
            name: z.string(),
            css: z.string().optional(),
            default: z.boolean().optional(),
            dropDown: z.array(
                z.object({
                    option: z.string(),
                    css: z.string()
                })
            ).optional()
        })
    ).optional()
});

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