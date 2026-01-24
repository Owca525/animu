import { cardData } from '../types';
import { CreateBackup } from '../backup';
import { getGlobalCache, setGlobalHistory } from '../stores/global';
import { refetchHistory } from '../functions';
import { toast, updateToast } from '../context/ToastNotification';
import { unwrap } from 'solid-js/store';
import { searchInAnilist } from '@renderer/plugins/anilistApi';
import { t } from '../i18n';

export async function DeleteFromHistory(data: cardData) {
    try {
        if (getGlobalCache().incognito) return
        if (!data.saveData) return
        let historyCache = unwrap(getGlobalCache().history);

        let index = -1
        if (data.AnimeData.id == "") {
            index = historyCache.findIndex(
                (item) => item.AnimeData.title.romaji === data.AnimeData.title.romaji
            );
        } else {
            index = historyCache.findIndex(
                (item) => item.AnimeData.id === data.AnimeData.id
            );
        }

        if (index != -1) historyCache.splice(index, 1);

        if (window.api) await window.api.os.write(`history.json`, JSON.stringify(historyCache))
        else localStorage.setItem("history", JSON.stringify(historyCache))
        setGlobalHistory(historyCache)
        refetchHistory()
        return true
    } catch (Error) {
        console.error(`${Error} in DeleteFromFile`)
        return false
    }
}

export async function SaveHistory(data: cardData): Promise<boolean> {
    try {
        if (getGlobalCache().incognito) return true
        let historyCache = unwrap(getGlobalCache().history);

        let index = -1
        if (data.AnimeData.id == "") {
            index = historyCache.findIndex(
                (item) => item.AnimeData.player_ID === data.AnimeData.player_ID
            );
        } else {
            index = historyCache.findIndex(
                (item) => item.AnimeData.id === data.AnimeData.id
            );
        }

        if (index != -1) historyCache.splice(index, 1);
        historyCache.unshift(data);
        if (window.api) await window.api.os.write(`history.json`, JSON.stringify(checkAnimeDuplicate(historyCache)))
        else localStorage.setItem("history", JSON.stringify(checkAnimeDuplicate(historyCache)))
        setGlobalHistory(historyCache)
        refetchHistory()
        return true
    } catch (Error) {
        console.error(`${Error} in SaveToFile`)
        return false
    }
}

function checkAnimeDuplicate(listcard: cardData[]): cardData[] {
    const map = new Map<string, cardData>()

    for (const element of listcard) {
        const title = element.AnimeData.title.romaji
        const current = map.get(title)

        if (!current || (element.saveData && current.saveData && parseInt(element.saveData.episode.toString()) > parseInt(current.saveData.episode.toString()))) {
            map.set(title, element)
        }
    }

    return Array.from(map.values())
}

async function convertToNewVersion(data: { id: string, title: string, img: string, player?: { episodes: string[], episode: { type: string, ep: string, time: number } }, text: string }[]) {
    let animeList: cardData[] = []
    let success: number = 0
    let failed: number = 0
    const updatedToast = toast(t("oldBackup.convert", { success, failed }), { type: "loading", removeTimer: true })
    for (let index = 0; index < data.length; index++) {
        const anime = data[index];
        try {
            let reqAnime = await searchInAnilist(anime.title, 1)
            if (reqAnime.data.length <= 0) {
                failed += 1
                continue
            }
            let aniAnime = reqAnime.data[0]
            for (let index = 0; index < reqAnime.data.length; index++) {
                const element = reqAnime.data[index];
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
    updateToast(updatedToast, "oldBackup.done", { type: "success", removeTimer: false })
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