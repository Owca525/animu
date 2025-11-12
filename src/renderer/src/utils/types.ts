export const notificationProps = {
    closeOnClick: true,
    autoClose: 3000,
    pauseOnHover: true,
    theme: "dark"
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
}

export interface homeData {
    data: { topCards?: containerData, sections: containerData[] }
    isLoading: boolean
    isError: boolean
    search: string
    page: number
    stopScrolling: boolean
    localSearch: boolean
    filterTags?: FilterParams
    mainContainer: {
        scrollLeft: number,
        scrollTop: number,
        offsetHeight: number,
        scrollHeight: number,
        clientHeight: number
    } | undefined
    onScrollContainer?: () => void 
}

export interface globalDataFormat {
    incognito: boolean,
    history: { continue: cardData[], history: cardData[] }
}

export interface playerData {
    hostname: string
    resolution: resolutionFormat[]
    splitHLS?: boolean
    defaultHost?: boolean
    storyboardVTT?: string
    listChapters?: playerChapterList[]
    subtitles?: playerSubtitlesFormat[]
    external?: externalPlayerFormat
    extractResolution?: (episode: string, type: string, playerData: playerData, customData?: any, id?: string) => Promise<playerData | undefined>
}

export interface resolutionFormat {
    res: string,
    url: string,
    hls?: boolean
    reqHeader?: { [key: string]: string },
    doNotUseBackend?: boolean
    defaultSubtitles?: boolean;
}

export interface externalPlayerFormat {
    chaptersUrl: string
}

export interface playerSubtitlesFormat { url: string, lang: string, label: string, format: string }

export type playerChapterList = { start: number, end: number, type: "opening" | "ending" | "other", name?: string }

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
    onScrollDownFunction?: (title: string | undefined, page: number, params?: genresSearchFormat) => Promise<{ data: cardData[], maxPage: number }>
    titlevent?: {
        onTitleClick?: (context: any) => void
        onTitleClickContext: any
    }
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

export interface playerPluginFormat {
    version: string
    name: string
    author: string
    icon?: string
    urlWebsite?: string
    preferedLang: string[]
    sidebarAddon?: sidebarData[]
    searchOption?: genres
    player: {
        extractPlayerData: (type: string, episode: string, id: string) => Promise<playerData[]>
        extractEpisodeList: (animeData?: AnimeData, anime_id?: string) => Promise<episodeList | undefined>
        extractOnlyEpisodesList: (type: string, anime_id: string) => Promise<{ ep: string, img?: string, title?: string }[]>
        searchAnime: (name: string, page: number, params?: genresSearchFormat) => Promise<cardData[]>
    }
}

export interface informationPluginFormat {
    version: string
    name: string
    author: string
    icon?: string
    preferedLang: string[]
    pageSize: number
    info: {
        search: (name: string, page: number, params?: genresSearchFormat) => Promise<void>
        home: () => Promise<void>
        anime: (id: string) => Promise<AnimeData | undefined>
    }
    searchOption: genres
    sidebarAddon?: sidebarData[]
}

export interface newInformationPluginFormat {
    metadata: {
        version: string
        name: string
        pageSize: number
        searchOption: genres
    }
    search(
        context: { name: string, page: number, params?: genresSearchFormat },
        callbacks: { onSuccess: (data: containerData) => void, onError: (error: string) => void }
    ): Promise<void>
    home(
        callbacks: { onSuccess: (data: { topCards?: containerData, sections: containerData[] }) => void, onError: (error: string) => void }
    ): Promise<void>
    anime(
        context: { id: string },
    ): Promise<AnimeData | undefined>
    onTitleClick(content: any, callbacks: { onSuccess: (data: containerData) => void, onError: (error: string) => void }): Promise<void>
}

export interface informationPluginManagerFormat {
    currentPlugin: newInformationPluginFormat
    searchAnime(name: string, page: number, params?: genresSearchFormat): void
    home(): void
    anime(id: string): Promise<AnimeData | undefined>
    onTitleClick(content: any): void
}

export type genres = { genres: string[], seasons: string[], years: string[], format: string[], statuses: string[] }
export interface genresSearchFormat { genres?: string[], years?: string, seasons?: string, format?: string[], airing?: string }

export interface episodeList { player_id: string, episodesData: { episodes: { ep: string, img?: string, title?: string }[], type: string, name?: string }[] }

export interface SettingsConfig {
    firstStart: boolean
    plugins: {
        // information: string
        player: string
    }
    General: {
        // HoverSidebar: boolean
        // HideSidebar: boolean
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
            PlayerBehavior: "home" | "information"
            autoSkipOpenings: boolean
            autoSkipEndings: boolean
            showBrokenBuffer: boolean
            minusTime: boolean
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
        title: string,
        onClick: () => void
    }[]
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