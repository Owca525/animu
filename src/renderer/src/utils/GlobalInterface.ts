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

export interface homeData {
    data: containerData[]
    isLoading: boolean
    isError: boolean
}

export interface playerData {
    title: string
    resolutions: {
        res: string
        url: string
        hostname: string
        hls: boolean
    }[]
}

export interface indentityPlayer {
    animeID: string
    pluginName: string
}

export interface cardData {
    AnimeData: AnimeData
    saveData?: indentityPlayer
    deletionCard?: () => void
}

export interface containerData {
    title: string
    data: cardData[]
    horizontal?: boolean
    onScrollDownFunction?: () => void
}

export interface pluginFormat {
    version: string
    name: string
    author: string
    information?: {
        search: (name: string) => void
        home: () => void
    } | null
    player?: {
        getUrls: () => playerData
        listEpisodes: () => string[]
    } | null
}