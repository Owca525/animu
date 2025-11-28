import { refetchHistory } from "../functions";
import { cardData } from "../types";
// import i18n from "../i18n";
import { CreateBackup } from "../backup";
import { getGlobalCache, setGlobalHistory } from "../stores/global";
import { unwrap } from "solid-js/store";

export async function DeleteFromHistory(data: cardData, notification: boolean = false) {
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

        if (!(!data.saveData && !notification)) return true

        // TODO: Napraw żeby pokazywało status
        // if (file === "continueWatch") {
        //     toast.success(i18n.t("history.continuesaved"))
        // } 
        // if (file === "history") {
        //     toast.success(i18n.t("history.historysaved"))
        // }
        return true
    } catch (Error) {
        console.error(`${Error} in DeleteFromFile`)
        if (!(!data.saveData && !notification)) return false
        // if (file === "continueWatch") {
        //     toast.error(i18n.t("history.continuefailed"))
        // } 
        // if (file === "history") {
        //     toast.error(i18n.t("history.historyfailed"))
        // }
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

// TODO: ADD SUPPORT FOR NEW TOASTS
async function convertToNewVersion(data: { id: string, title: string, img: string, player?: { episodes: string[], episode: { type: string, ep: string, time: number } }, text: string }[]) {
    let animeList: cardData[] = []
    let success: number = 0
    let failed: number = 0
    // let updatedToast = toast.loading(`Converting Success ${success} / Failed ${failed}`)
    for (let index = 0; index < data.length; index++) {
        const anime = data[index];
        try {
            //  await searchForConvertAnime(anime.title)
            let reqAnime = "" as any
            if (reqAnime.length <= 0) {
                failed += 1
                continue
            }
            animeList.push(
                {
                    ...reqAnime[0],
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
        // toast.loading(`Converting Success ${success} / Failed ${failed}`, { id: updatedToast })
    }
    // toast.success("Converting Done", { id: updatedToast })
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
                    // toast.success("Detected Old history")
                    await window.api.os.write("history.json", JSON.stringify(await convertToNewVersion(history)))
                }
            }
        }
        let tmpcontinueWatch = await window.api.os.read("continueWatch.json")
        if (tmpcontinueWatch) {
            let continueWatch = JSON.parse(tmpcontinueWatch as string)
            if ("continue" in continueWatch) {
                if ("id" in continueWatch["continue"][0]) {
                    // toast.success("Detected Old Continue Watch")
                    await window.api.os.write("continueWatch.json", JSON.stringify(await convertToNewVersion(continueWatch)))
                }
            }
        }

    } catch (error) {
        // toast.error("Failed Convert all History")
        console.error("Error in DetectOldVersionHistory", error)
    }
}