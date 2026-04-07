import { Socket } from "socket.io-client"
import { UUIDTypes } from "uuid"

// export const notificationProps = {
//     closeOnClick: true,
//     autoClose: 3000,
//     pauseOnHover: true,
//     theme: "dark"
// }

export const Anilist_ScoreFormatKeys = {
    POINT_100: "POINT_100",
    POINT_10_DECIMAL: "POINT_10_DECIMAL",
    POINT_10: "POINT_10",
    POINT_5: "POINT_5",
    POINT_3: "POINT_3",
} as const
export type Anilist_ScoreFormat = keyof typeof Anilist_ScoreFormatKeys

export const Anilist_UserTitleLanguageKeys = {
    ROMAJI: "ROMAJI",
    ENGLISH: "ENGLISH",
    NATIVE: "NATIVE",
    ROMAJI_STYLISED: "ROMAJI_STYLISED",
    ENGLISH_STYLISED: "ENGLISH_STYLISED",
    NATIVE_STYLISED: "NATIVE_STYLISED",
} as const
export type Anilist_UserTitleLanguage = keyof typeof Anilist_UserTitleLanguageKeys

export const Anilist_UserStaffNameLanguageKeys = {
    ROMAJI_WESTERN: "ROMAJI_WESTERN",
    ROMAJI: "ROMAJI",
    NATIVE: "NATIVE",
} as const
export type Anilist_UserStaffNameLanguage = keyof typeof Anilist_UserStaffNameLanguageKeys

export const Anilist_MediaListStatusKeys = {
    CURRENT: "CURRENT",
    PLANNING: "PLANNING",
    COMPLETED: "COMPLETED",
    REPEATING: "REPEATING",
    DROPPED: "DROPPED",
    PAUSED: "PAUSED"
}
export type Anilist_MediaListStatus = keyof typeof Anilist_MediaListStatusKeys

export interface anilistUSEMutation {
    about?: string
    titleLanguage?: Anilist_UserTitleLanguage
    staffNameLanguage?: Anilist_UserStaffNameLanguage
    airingNotifications?: Boolean
    displayAdultContent?: Boolean
    scoreFormat?: Anilist_ScoreFormat
    rowOrder?: string
    profileColor?: string
    donatorBadge?: string
    notificationOptions?: any // [NotificationOptionInput]
    animeListOptions?: any // MediaListOptionsInput
    mangaListOptions?: any // MediaListOptionsInput
    timezone?: string
    activityMergeTime?: number
    restrictMessagesToFollowing?: Boolean
    disabledListActivity?: any // [ListActivityOptionInput]
}

export interface DateObject {
    day: number | undefined
    month: number | undefined
    year: number | undefined
}

export interface Anilist_ListMutation {
    completedAt?: DateObject
    startedAt?: DateObject
    mediaId?: number // ID ANIME
    progress?: number // EPISODES
    repeat?: number
    score?: number

    status?: Anilist_MediaListStatus
    progressVolumes?: number
    private?: Boolean
    notes?: string
    // customLists: [string]
    hiddenFromStatusLists?: Boolean
    // advancedScores: [Float]
}

export interface AnimeData {
    averageScore?: number | undefined
    bannerImage?: string | undefined
    coverImage?: string | undefined
    description?: string | undefined
    duration?: number | undefined
    endDate?: DateObject | undefined
    episodes?: number | undefined
    format?: string | undefined
    genres?: Array<string>
    nextAiringEpisode?: {
        airingAt: number
        episode: number
        timeUntilAiring: number
    } | undefined
    popularity?: number | undefined
    season?: string | undefined
    seasonYear?: number | undefined
    startDate?: DateObject | undefined
    characters?: {
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
    synonyms?: string[],
    studios?: string[]
    title: { english?: string, native: string, romaji: string }
    type?: string | undefined
    episodesList?: { episodes: { ep: string, img?: string, title?: string }[], type: string, name?: string }[]
    player_ID?: string
    id: string
    isAdult?: boolean
    malID?: string
    trailer?: { id: string, site: string } | undefined
    relations?: {
        id: number,
        title: { english?: string, native: string, romaji: string }
        bannerImage?: string
        coverImage: string
        relationType: string,
        status: string,
        format: string
        type: string
    }[]
    recommendations?: {
        id: number,
        title: { english?: string, native: string, romaji: string }
        bannerImage?: string
        coverImage: string
        type: string,
        format?: string
    }[]
}

export interface homeData {
    data: { topCards?: containerData, sections: containerData[] }
    isLoading: boolean
    isError: undefined | string | boolean
    search: string
    page: number
    stopScrolling: boolean
    activePage: "history" | "home" | string
    filterTags?: FilterParams,
    otherFilter: {
        page: string,
        filter: genres[]
    }[]
    mainContainer: {
        scrollLeft: number,
        scrollTop: number,
        offsetHeight: number,
        scrollHeight: number,
        clientHeight: number
    } | undefined
    onScrollContainer?: () => void
}

export interface deepLinkData {
    animeID: string,
    player?: {
        plugin: string,
        type: string,
        id: string,
        episode: string,
        time?: number
    }
}

export interface globalDataFormat {
    incognito: boolean,
    history: cardData[],
    deeplinkRunned: boolean,
    loadedTheme: themeMetadata[],
    activeThemes: Map<number, themeMetadata>
    token: UUIDTypes | undefined,
    service: serviceFormat[]
    deepLinks: deeplinkFormat[]
    socket?: {
        instance: Socket,
        currentRoom: string,
    },
    animuList: { AnimeData: AnimeData, animulist: animulistProps, onClick?: (data: AnimeData) => void }[]
    anilist_user_data?: { [key: string]: any; },
    isAnimuHidden: boolean
    isAnimuFocus: boolean
    notifications: NotificationProps[]
    todayAnimeAnilist: cardData[]
    animeOpeningsCache: { [key: number]: animeOpeningsFormat[] }
    audioOutput: MediaDeviceInfo | undefined
}

export interface NotificationProps {
    title: string,
    description: string,
    icon?: string,
    onClick?: () => void | Promise<void>
    readed?: boolean
}

export type playerDataExtended = playerData & {
    episode: {
        currentEpisode: string
        episodeList: string[]
        anime: AnimeData
        animeID: string
        type: string
    }
}

export interface playerData {
    hostname: string
    resolution: resolutionFormat[]
    dubResolution?: resolutionFormat[]
    splitHLS?: boolean
    defaultHost?: boolean
    storyboardVTT?: string
    listChapters?: playerChapterList[]
    subtitles?: playerSubtitlesFormat[]
    external?: externalPlayerFormat
    extractResolution?: (playerData: playerDataExtended) => Promise<playerData | undefined>
    isDubbing?: (playerData: playerDataExtended) => Promise<resolutionFormat[] | undefined>
}

export interface resolutionFormat {
    res: string,
    url: string,
    hls?: boolean
    reqHeader?: { [key: string]: string },
    doNotUseBackend?: boolean
    defaultSubtitles?: boolean;
    canBeDownloaded?: boolean
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
    isStarted?: boolean
    lastAnimeDataUpdate?: number
}

export interface animulistProps {
    status: Anilist_MediaListStatus,
    score: number,
    reapeat: number,
    startWatch: number,
    endWatch: number,
    added: number,
    lastUpdate: number,
    favorite?: boolean
    progress?: number
}

export interface cardData {
    AnimeData: AnimeData
    saveData?: indentityPlayer
    animulist?: animulistProps
    onClick?: (data: AnimeData) => void
}

export interface containerData {
    title?: string
    data: cardData[]
    horizontal?: boolean
    onScrollDownFunction?: (search: string | undefined, page: number, params?: genresSearchFormat) => Promise<{ data: cardData[], maxPage: number }>
    onTitleClick?: () => Promise<containerData>
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

// customTitle?: string,
export interface themeMetadata {
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

export interface playerPluginFormat {
    metadata: {
        version: string
        name: string
        author: string
        icon?: string
        urlWebsite?: string
        supportLang: string[]
        // sidebarAddon?: sidebarData[]
        searchOption?: genres
        adult?: boolean
    }
    config?: { [key: string]: any }
    extractPlayerData(type: string, episode: string, id: string): Promise<playerData[]>
    extractEpisodeList(animeData?: AnimeData, anime_id?: string): Promise<episodeList | undefined>
    extractOnlyEpisodesList(type: string, anime_id: string): Promise<{ ep: string, img?: string, title?: string }[]>
    searchAnime(name: string, page: number, params?: genresSearchFormat): Promise<cardData[]>
}

export interface informationPluginFormat {
    metadata: {
        version: string
        name: string
        pageSize: number
        author: string
        icon?: string
        urlWebsite?: string
        searchOption: genres[]
    }
    config?: { [key: string]: any }
    search(name: string, page: number, params?: genresSearchFormat): Promise<containerData | { error: string } | undefined>
    home(): Promise<{ topCards?: containerData, sections: containerData[] } | { error: string } | undefined>
    anime(context: { id: string }): Promise<AnimeData | undefined>
    schedule: (airingStart: number, airingEnd: number) => Promise<cardData[]>
    getManga: (id: string) => Promise<AnimeData | undefined>
    getAnimeList: () => Promise<cardData[]>
    setAnimeInList: (variable: Anilist_ListMutation) => Promise<boolean>
}

export interface playerPluginManagerFormat {
    currentPlugin: playerPluginFormat | undefined
    pluginList: playerPluginFormat[]
    changePlugin(plugin_id: string): playerPluginFormat
    initialPlugins(): void
}

export interface informationPluginManagerFormat {
    currentPlugin: informationPluginFormat
    searchAnime(name: string, page: number, params?: genresSearchFormat): void
    home(): void
    anime(id: string): Promise<AnimeData | undefined>
    initial(): Promise<void>
    schedule(airingStart: number, airingEnd: number): Promise<cardData[]>
    getManga: (id: string) => Promise<AnimeData | undefined>
    getAnimeList: () => Promise<cardData[]>
    setAnimeInList: (variable: Anilist_ListMutation) => Promise<boolean>
}

export type genres = {
    type: string,
    placeholder: string,
    title: string,
    langPath: string
    options: string[]
}

export interface genresSearchFormat { [key: string]: string }

export interface episodeList { player_id: string, episodesData: { episodes: { ep: string, img?: string, title?: string }[], type: string, name?: string }[] }

export interface SettingsConfig {
    firstStart: boolean
    deepLinkURL: string
    yt_dlp: string
    anilist: {
        scoreFormat: Anilist_ScoreFormat
        titleFormat: Anilist_UserTitleLanguage
        adultdefault: boolean
        maxpagesize: number
    }
    animulist: {
        historyConvert: boolean
    }
    plugins: {
        hiddenPlugins: string[]
        // information: string
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
    information: {
        openingininformation: boolean
    },
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

export interface FilterParams { [key: string]: string };

export interface pluginRepo {
    name: string,
    file: string,
    ver: string,
    author: string,
    urlWebsite: string,
    icon?: string,
    sha256: string,
    description?: string
}

export type pluginRepoExpanded = {
    name: string,
    file: string,
    ver: string,
    author: string,
    type: "information" | "player"
    urlWebsite: string,
    icon?: string,
    sha256: string,
    description?: string
} & { repoURL: string }

export interface animeOpeningsFormat {
    type: "OP" | "EN" | "IN"
    musicTitle: string,
    variant?: string
    artist: string
    videos: {
        filename: string,
        url: string,
        resolution: number
        audio?: string
    }[]
}

export interface serviceFormat {
    name: string
    interval?: NodeJS.Timeout,
    uuid: string
    func: () => Promise<any> | any
}

export interface deeplinkFormat {
    name: string,
    code: string,
    func: (deeplink: string, code: string) => any | Promise<any>
}

export interface playlistFormatData {
    anime: cardData,
    added: number,
    lastupdate: number,
    customData?: any
}