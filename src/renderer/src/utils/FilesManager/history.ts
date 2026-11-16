import { AnimeData, cardData } from '../types';
import { getGlobalCache } from '../stores/global';
import { GetAnimeID, GetAnimeIDObject, refetchHistory, RemoveAnimeDataCache } from '../functions';
import { AddCardDataToDatabase, animuDatabase, GetAllAnimeFromDatabase, GetAnimeFromDatabase } from './anime_database';
import { unwrap } from 'solid-js/store';

export async function DeleteFromHistory(data: cardData) {
    try {
        if (getGlobalCache().incognito) return
        if (!data.saveData) return
        if (typeof data.AnimeData.id == "string") return


        const id = GetAnimeIDObject(data)
        if (!id) {
            console.error("history/DeleteFromHistory FAILED ADD ANIME", data)
            return
        }

        const finded = animuDatabase.get({ table: "ids", row: id["name"], value: `${id["id"]}` })
        if (!finded) return

        animuDatabase.delete("savedata", [`${finded["id"]}`])

        refetchHistory()
        return true
    } catch (Error) {
        console.error(`${Error} in DeleteFromFile`)
        return false
    }
}

export async function updateHistoryData(data: cardData): Promise<boolean> {
    try {
        if (getGlobalCache().incognito) return true
        if (!data.saveData) return false

        AddCardDataToDatabase(RemoveAnimeDataCache(unwrap(data)) as cardData)

        refetchHistory()
        return true
    } catch (Error) {
        console.error(`${Error} in SaveToFile`)
        return false
    }
}

export async function SaveHistory(data: cardData): Promise<boolean> {
    try {
        if (getGlobalCache().incognito) return true
        if (!data.saveData) return false

        AddCardDataToDatabase(RemoveAnimeDataCache(unwrap(data)) as cardData)

        refetchHistory()
        return true
    } catch (Error) {
        console.error(`${Error} in SaveToFile`)
        return false
    }
}

export async function OverWriteHistory(_data: cardData[]): Promise<boolean> {
    try {
        // TODO: ADD THIS
        return true
    } catch (Error) {
        console.error(`${Error} in OverWriteHistory`)
        return false
    }
}

// function checkAnimeDuplicate(listcard: cardData[]): cardData[] {
//     const map = new Map<string, cardData>()

//     try {
//         for (const element of listcard) {
//             if (!element) continue

//             const title = element.AnimeData.title.romaji
//             const current = map.get(title)

//             if (!current || (element.saveData && current.saveData && parseInt(element.saveData.episode.toString()) > parseInt(current.saveData.episode.toString()))) {
//                 map.set(title, element)
//             }
//         }
//     } catch (error) {
//         console.error("history/checkAnimeDuplicate", error)
//     }

//     return Array.from(map.values())
// }

export function GetAllAnimuHistory() {
    return GetAllAnimeFromDatabase().filter((v) => v["saveData"])
}

export function GetAnimuHistory(id: AnimeData | cardData) {
    const tmp = GetAnimeFromDatabase(GetAnimeID(id))
    if (!tmp) return
    if (!tmp["saveData"]) return
    return tmp
}
