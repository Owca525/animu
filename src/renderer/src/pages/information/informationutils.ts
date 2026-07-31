import { AnimeData, animulistProps, indentityPlayer } from "@renderer/utils/types"

export interface informationTmpProps {
    anime: AnimeData,
    saveData?: indentityPlayer,
    animulist?: animulistProps
    DontOverWrite?: boolean
}

class InformationCacheInstance {
    anime: informationTmpProps = {
        anime: {
            title: {
                native: "Information Cache Instance",
                romaji: "Information Cache Instance"
            },
            id: ""
        }
    }

    constructor() {
        const cache = localStorage.getItem("informationCache")
        if (!cache) return
        try {
            this.anime = JSON.parse(cache)
        } catch (error) {
            console.error("Failed Load Information Cache")
        }
    }

    update = (anime: informationTmpProps | undefined) => {
        if (!anime) return
        this.anime = anime
        localStorage.setItem("informationCache", JSON.stringify(anime))
    }
}

if (!window["informationCache"]) {
    window["informationCache"] = new InformationCacheInstance()
}

export const informationCache: InformationCacheInstance = window["informationCache"]