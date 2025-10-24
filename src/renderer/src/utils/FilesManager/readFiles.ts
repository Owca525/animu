import { toast } from "react-toastify";
import { refetchHistory } from "../functions";
import { cardData, notificationProps } from "../GlobalInterface";
import i18n from "../i18n";
import store from "../store";
import { CreateBackup } from "../backup";
import { searchForConvertAnime } from "@renderer/plugins/anilistApi";


export async function ReadFile(file: string): Promise<cardData[]> {
    try {
        if (store.getState().global.incognito) return []
        await CheckFile(file)
        const dataFile = await window.api.os.read(`${file}.json`)
        if (typeof dataFile != "string") return []
        const data = JSON.parse(dataFile) as cardData[];
        if (data.length <= 0) return []
        let animeList = checkAnimeDuplicate(data).map((value: cardData) => { return { ...value, deletionCard: () => DeleteFromFile({ ...value, deletionCard: () => "", }, file) } }).reverse()
        store.dispatch({
            type: file == "continueWatch" ? "setNewContinueWatch" : "setNewHistory", payload: animeList
        })
        return animeList
    } catch (Error) {
        console.error(`${Error} in ReadFile`)
        return [];
    }
}

export async function DeleteFromFile(data: cardData, file: string) {
    try {
        if (store.getState().global.incognito) return
        if (!data.saveData) return
        await CheckFile(file)
        const saveFile = await window.api.os.read(`${file}.json`)
        if (typeof saveFile != "string") return console.error(`Wrong data in DeleteFromFile`, saveFile)
        const list = JSON.parse(saveFile) as cardData[];
        let index = -1
        if (data.AnimeData.id == "") {
            index = list.findIndex(
                (item) => item.AnimeData.title.romaji === data.AnimeData.title.romaji
            );
        } else {
            index = list.findIndex(
                (item) => item.AnimeData.id === data.AnimeData.id
            );
        }

        if (index != -1) list.splice(index, 1);

        await window.api.os.write(`${file}.json`, JSON.stringify(list))
        store.dispatch({
            type: file == "continueWatch" ? "setNewContinueWatch" : "setNewHistory", payload: list
        })
        refetchHistory()

        if (data.deletionCard) {
            if (file === "continueWatch") {
                toast.success(i18n.t("history.continuesaved"), notificationProps)
            } else if (file === "history") {
                toast.success(i18n.t("history.historysaved"), notificationProps)
            }
        }
        return true
    } catch (Error) {
        console.error(`${Error} in DeleteFromFile`)
        if (data.deletionCard) {
            if (file === "continueWatch") {
                toast.error(i18n.t("history.continuefailed"), notificationProps)
            } else if (file === "history") {
                toast.error(i18n.t("history.historyfailed"), notificationProps)
            }
        }
        return false
    }
}

export async function SaveToFile(data: cardData, file: string): Promise<boolean> {
    try {
        if (store.getState().global.incognito) return true
        await CheckFile(file)
        const saveFile = await window.api.os.read(`${file}.json`);
        if (typeof saveFile != "string") return false
        const tmpData = JSON.parse(saveFile) as cardData[];
        let index = -1
        if (data.AnimeData.id == "") {
            index = tmpData.findIndex(
                (item) => item.AnimeData.player_ID === data.AnimeData.player_ID
            );
        } else {
            index = tmpData.findIndex(
                (item) => item.AnimeData.id === data.AnimeData.id
            );
        }

        if (index != -1) tmpData.splice(index, 1);

        tmpData.push(data);
        await window.api.os.write(`${file}.json`, JSON.stringify(checkAnimeDuplicate(tmpData)))
        store.dispatch({
            type: file == "continueWatch" ? "setNewContinueWatch" : "setNewHistory", payload: tmpData
        })
        refetchHistory()
        return true
    } catch (Error) {
        console.error(`${Error} in SaveToFile`)
        return false
    }
}

export async function CheckFile(file: string): Promise<boolean> {
    try {
        if (await window.api.os.exists(`${file}.json`) == false ) {
            await window.api.os.write(
                `${file}.json`,
                JSON.stringify([])
            );
            return true
        }
        return false
    } catch (Error) {
        console.error(`${Error} in CheckFile`)
        return true
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
    let updatedToast = toast.loading(`Converting Success ${success} / Failed ${failed}`, notificationProps)
    for (let index = 0; index < data.length; index++) {
        const anime = data[index];
        try {
            let reqAnime = await searchForConvertAnime(anime.title)
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
        toast.update(updatedToast, { render: `Converting Success ${success} / Failed ${failed}` })
    }
    toast.update(updatedToast, { render: "Converting Done" })
    return animeList
}

export async function DetectOldVersionHistory() {
    try {
        let tmpHistory = await window.api.os.read("history.json")
        if (tmpHistory) {
            let history = JSON.parse(tmpHistory as string)
            if (Array.isArray(history)) {
                if ("id" in history[0]){
                    await CreateBackup()
                    toast.info("Detected Old history", notificationProps)
                    await window.api.os.write("history.json", JSON.stringify(await convertToNewVersion(history)))
                }
            }
        }
        let tmpcontinueWatch = await window.api.os.read("continueWatch.json")
        if (tmpcontinueWatch) {
        let continueWatch = JSON.parse(tmpcontinueWatch as string)
            if ("continue" in continueWatch) {
                if ("id" in continueWatch["continue"][0]) {
                    toast.info("Detected Old Continue Watch", notificationProps)
                    await window.api.os.write("continueWatch.json", JSON.stringify(await convertToNewVersion(continueWatch)))
                }
        }
        }
    
    } catch (error) {
        toast.error("Failed Convert all History", notificationProps)
        console.error("Error in DetectOldVersionHistory", error)
    }
}