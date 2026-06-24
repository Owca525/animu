import { cardData } from '../types';
import { CreateBackup } from '../backup';
import { getAnimuHistory, getGlobalCache, setGlobalHistory } from '../stores/global';
import { refetchHistory, RemoveAnimeDataCache } from '../functions';
import { toast, updateToast } from '../context/ToastNotification';
import { t } from '../i18n';
import { getInformationPlugin } from '../stores/plugins';

export function setNewHistory(data: cardData[]) {
    let tmpMap = new Map()
    data.forEach((card) => {
        tmpMap.set(card["AnimeData"]["id"], card)
    })
    
    setGlobalHistory(tmpMap)
    return tmpMap
}

export async function DeleteFromHistory(data: cardData) {
    try {
        if (getGlobalCache().incognito) return
        if (!data.saveData) return
        let historyCache = getAnimuHistory();

        if (data.AnimeData.id == "") {
            let tmp = historyCache.entries().find(([_, item]) => item.AnimeData.title === data.AnimeData.title)
            if (tmp) historyCache.delete(tmp[0])
        } else {
            historyCache.delete(data.AnimeData.id)
        }

        /* IFDEF DEBUG|PROD */
        await window.api.os.write(`history.json`, JSON.stringify(checkAnimeDuplicate(historyCache.values().toArray())))
        /* ENDIF */

        /* IFDEF WEB */
        localStorage.setItem("history", JSON.stringify(checkAnimeDuplicate(historyCache.values().toArray())))
        /* ENDIF */

        setGlobalHistory(historyCache)
        refetchHistory()
        return true
    } catch (Error) {
        console.error(`${Error} in DeleteFromFile`)
        return false
    }
}

export async function updateHistoryData(id: string, data: cardData): Promise<boolean> {
    try {
        if (getGlobalCache().incognito) return true
        let historyCache = getAnimuHistory();

        if (id == "" || data.AnimeData.id == "") {
            let tmp = historyCache.entries().find(([_, item]) => item.AnimeData.title === data.AnimeData.title)
            if (tmp) historyCache.set(tmp[0], RemoveAnimeDataCache(tmp[1]) as cardData)
        } else {
            let tmp = historyCache.get(id)
            if (tmp) historyCache.set(id, RemoveAnimeDataCache(tmp) as cardData)
        }

        /* IFDEF DEBUG|PROD */
        await window.api.os.write(`history.json`, JSON.stringify(checkAnimeDuplicate(historyCache.values().toArray())))
        /* ENDIF */

        /* IFDEF WEB */
        localStorage.setItem("history", JSON.stringify(checkAnimeDuplicate(historyCache.values().toArray())))
        /* ENDIF */
        setGlobalHistory(historyCache)
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
        let historyCache = getAnimuHistory();

        if (data.AnimeData.id == "") {
            let tmp = historyCache.entries().find(([_, item]) => item.AnimeData.title === data.AnimeData.title)
            if (tmp) historyCache.delete(tmp[0])
        } else {
            historyCache.delete(data.AnimeData.id)
        }

        let tmpHistoryCache = historyCache.values().toArray()
        tmpHistoryCache.unshift(data);

        historyCache = setNewHistory(tmpHistoryCache)

        /* IFDEF DEBUG|PROD */
        await window.api.os.write(`history.json`, JSON.stringify(checkAnimeDuplicate(historyCache.values().toArray())))
        /* ENDIF */

        /* IFDEF WEB */
        localStorage.setItem("history", JSON.stringify(checkAnimeDuplicate(historyCache.values().toArray())))
        /* ENDIF */
        setGlobalHistory(historyCache)
        refetchHistory()
        return true
    } catch (Error) {
        console.error(`${Error} in SaveToFile`)
        return false
    }
}

export async function OverWriteHistory(data: cardData[]): Promise<boolean> {
    try {
        /* IFDEF DEBUG|PROD */
        await window.api.os.write(`history.json`, JSON.stringify(checkAnimeDuplicate(data)))
        /* ENDIF */

        /* IFDEF WEB */
        localStorage.setItem("history", JSON.stringify(checkAnimeDuplicate(data)))
        /* ENDIF */
        return true
    } catch (Error) {
        console.error(`${Error} in OverWriteHistory`)
        return false
    }
}

function checkAnimeDuplicate(listcard: cardData[]): cardData[] {
    const map = new Map<string, cardData>()

    try {
        for (const element of listcard) {
            if (!element) continue

            const title = element.AnimeData.title.romaji
            const current = map.get(title)

            if (!current || (element.saveData && current.saveData && parseInt(element.saveData.episode.toString()) > parseInt(current.saveData.episode.toString()))) {
                map.set(title, element)
            }
        }
    } catch (error) {
        console.error("history/checkAnimeDuplicate", error)
    }

    return Array.from(map.values())
}

async function convertToNewVersion(data: { id: string, title: string, img: string, player?: { episodes: string[], episode: { type: string, ep: string, time: number } }, text: string }[]) {
    let animeList: cardData[] = []
    let success: number = 0
    let failed: number = 0
    const updatedToast = toast(t("oldBackup.convert", { success, failed }), { type: "loading", timer: true })
    for (let index = 0; index < data.length; index++) {
        const anime = data[index];
        try {
            let reqAnime = await getInformationPlugin().search(anime.title, 1)
            if (reqAnime.content.length <= 0) {
                failed += 1
                continue
            }
            let aniAnime = reqAnime.content[0]
            for (let index = 0; index < reqAnime.content.length; index++) {
                const element = reqAnime.content[index];
                if (element.AnimeData.coverImage == anime.img) aniAnime = element
            }
            animeList.push(
                {
                    ...aniAnime,
                    saveData: {
                        pluginName: "Allmanga",
                        last_Time: anime.player ? anime.player.episode.time : 0,
                        episode: anime.player ? anime.player.episode.ep : anime.text.split(" ").reverse()[0],
                        type: anime.player ? anime.player.episode.type : "sub"
                    }
                }
            )
            success += 1
        } catch (error) {
            failed += 1
        }
        updateToast(updatedToast, t("oldBackup.convert", { success, failed }))
    }
    updateToast(updatedToast, "oldBackup.done", { type: "success", timer: false })
    return animeList
}

export async function DetectOldVersionHistory() {
    try {
        if (!window.api) return
        let tmpHistory = await window.api.os.read("history.json")
        if (tmpHistory) {
            let history = JSON.parse(tmpHistory as string)
            if (Array.isArray(history)) {
                if ("id" in history[0]) {
                    await CreateBackup()
                    toast("oldBackup.oldhistory")
                    await window.api.os.write("history.json", JSON.stringify(await convertToNewVersion(history)))
                }
            }
        }
        let tmpcontinueWatch = await window.api.os.read("continueWatch.json")
        if (tmpcontinueWatch) {
            let continueWatch = JSON.parse(tmpcontinueWatch as string)
            if ("continue" in continueWatch) {
                if ("id" in continueWatch["continue"][0]) {
                    toast("oldBackup.oldcontinue", { type: "success" })
                    await window.api.os.write("continueWatch.json", JSON.stringify(await convertToNewVersion(continueWatch)))
                }
            }
        }

    } catch (error) {
        toast("oldBackup.failedconvertall", { type: "error" })
        console.error("Error in DetectOldVersionHistory", error)
    }
}