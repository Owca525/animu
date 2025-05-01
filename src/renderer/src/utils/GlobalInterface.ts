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

export interface playerData {
    title: string
    resolutions: {
        res: string
        url: string
        hostname: string
        hls: boolean
    }[]
}

export interface cardData {
    AnimeData: AnimeData
    saveData?: playerData
    deletionCard?: () => void
    CardOnClick?: () => void
}

export interface containerData {
    title: string
    data: cardData[]
    horizontal?: boolean
    onScrollDownFunction?: () => void
}