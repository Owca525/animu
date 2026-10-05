import { unwrap } from "solid-js/store"
import { toast, updateToast } from "../context/ToastNotification"
import { animulistData, getGlobalCache, GetUser, setAnimulistData } from "../stores/global"
import { AnimeData, AnimuListFormat, animulistProps, cardData } from "../types"
import { getHomeCache } from "../stores/home"
import { AnimuListSearch } from "@renderer/pages/home/homeUtils"
import { dateToUnix, detectTitleConfig, getHistory, RemoveAnimeDataCache, sleep, TrieFunction } from "../functions"
import { getInformationPlugin } from "../stores/plugins"
import { t } from "../i18n"

export function setNewAnimuList(data: AnimuListFormat[]) {
    let tmpMap = new Map()
    data.forEach((card) => {
        tmpMap.set(card["AnimeData"]["id"], card)
    })
    
    setAnimulistData(tmpMap)
    return tmpMap
}

export async function addToAnimuList(animulist: animulistProps, anime: AnimeData, notification: boolean = false) {
    if (getGlobalCache().incognito) return
    if (anime.id == "") return

    /* IFDEF DEBUG|PROD */
    await window.api.animulist.add({ AnimeData: { ...unwrap(anime), nextAiringEpisode: undefined }, animulist: unwrap(animulist) })
    /* ENDIF */

    /* IFDEF WEB */
    let database = structuredClone(unwrap(animulistData()))

    const tmp = database.get(anime.id)
    if (tmp) database.delete(anime.id)

    let tmpDatabase = database.values().toArray()

    tmpDatabase.unshift({ AnimeData: { ...anime, nextAiringEpisode: undefined }, animulist: animulist })
    localStorage.setItem("animulist", JSON.stringify(tmpDatabase))
    /* ENDIF */

    refreashAnimulist()
    if (notification) toast(`Succesfully Added ${detectTitleConfig(anime.title)} to animulist`)
}

export async function removeFromAnimulist(id: string, notification: boolean = false) {
    if (getGlobalCache().incognito) return
    if (id == "") return

    /* IFDEF DEBUG|PROD */
    await window.api.animulist.delete(unwrap(id))
    /* ENDIF */

    /* IFDEF WEB */
    let database = structuredClone(unwrap(animulistData()))
    database.delete(id)
    localStorage.setItem("animulist", JSON.stringify(database.values().toArray()))
    /* ENDIF */

    refreashAnimulist()
    if (notification) toast(`Succesfully Removed From animulist`)
}

export async function updateDataInAnimulist(id: string, anime: { AnimeData: AnimeData; animulist: animulistProps }, notification: boolean = false) {
    if (getGlobalCache().incognito) return
    if (anime.AnimeData.id == "") return

    /* IFDEF DEBUG|PROD */
    await window.api.animulist.update(unwrap(id), unwrap(anime))
    /* ENDIF */

    /* IFDEF WEB */
    let database = structuredClone(unwrap(animulistData()))
    database.set(id, anime)
    localStorage.setItem("animulist", JSON.stringify(database.values().toArray().forEach((v) => RemoveAnimeDataCache(v))))
    /* ENDIF */

    refreashAnimulist()
    if (notification) toast(`Succesfully Updated in animulist`)
}

export async function refreashAnimulist() {
    /* IFDEF DEBUG|PROD */
    setNewAnimuList(await window.api.animulist.getDatabase())
    /* ENDIF */

    /* IFDEF WEB */
    setAnimulistData(JSON.parse(localStorage.getItem("animulist") as any))
    /* ENDIF */

    const global = unwrap(getHomeCache())

    if (GetUser()["logged"]) {
        SynchronizeAnimulistWithPlugin()
    }

    if (global.activePage != "global.animulist") return

    AnimuListSearch(global.search, global.filterTags)
}

export async function SynchronizeAnimulistWithPlugin(animu_overwrite = false) {
    const info_plugin = getInformationPlugin()
    if (!info_plugin.setAnimeInList || !info_plugin.removeAnimeFromList || !info_plugin.getAnimeList) return

    const animulist = animulistData().values().toArray()
    const pluginAnimeList = await info_plugin.getAnimeList()

    /* IFDEF DEBUG */
    console.warn("Animulist/SynchronizeAnimulistWithPlugin Before", animulist, pluginAnimeList)
    /* ENDIF */

    let saveInAnimu: cardData[] = []
    let saveInPlugin: cardData[] = []

    animulist.forEach((anime) => {
        try {
            const finded = pluginAnimeList.find((v) => v["AnimeData"]["id"] == anime["AnimeData"]["id"])
            if (finded) {
                
                if (animu_overwrite) return saveInPlugin.push(anime)

                if (finded["animulist"]!["lastUpdate"] < anime["animulist"]["lastUpdate"]) 
                    return saveInPlugin.push(anime)

                return
            }

            saveInPlugin.push(anime)
            return
        } catch (error) {
            console.error("animulist/SynchronizeAnimulistWithPlugin/animulist", error)
            return 
        }
    })

    if (!animu_overwrite) {
        pluginAnimeList.forEach((anime) => {
            try {
                const finded = animulist.find((v) => v["AnimeData"]["id"] == anime["AnimeData"]["id"])
                if (finded) {

                    if (finded["animulist"]!["lastUpdate"] > anime["animulist"]!["lastUpdate"])
                        return saveInAnimu.push(anime)

                    return
                }

                saveInAnimu.push(anime)
                return
            } catch (error) {
                console.error("animulist/SynchronizeAnimulistWithPlugin/pluginAnimeList", error)
                return
            }
        })
    }
    
    /* IFDEF DEBUG */
    console.warn("Animulist/SynchronizeAnimulistWithPlugin", saveInAnimu, saveInPlugin)
    /* ENDIF */

    const updatetAnimulist = animulist.map((item) => saveInAnimu.find((v) => v["AnimeData"]["id"] == item["AnimeData"]["id"]) ?? item)

    await window.api.animulist.overWrite(JSON.parse(JSON.stringify(updatetAnimulist)))

    if (saveInPlugin.length <= 0) return

    let success = 0
    let failed = 0

    const toast_id = toast(t(`Sync Anime ${success}/${saveInPlugin.length} failed: ${failed}`), { type: "loading", timer: false })

    for (let index = 0; index < saveInPlugin.length; index++) {
        const anime = saveInPlugin[index];
        
        await sleep(Math.floor(Math.random() * (2000 - 500 + 1)) + 500)

        try {

            const resp = await TrieFunction(async () => {
                return await info_plugin.setAnimeInList!(anime["AnimeData"]["id"], anime["animulist"]!)
            }, Math.floor(Math.random() * (20000 - 6000 + 1)) + 6000)
            
            if (resp) {
                success += 1
            } else failed += 1

        } catch (error) {
            console.error("animulist/SynchronizeAnimulistWithPlugin/saveInPlugin", error)
            failed += 1
        }

        updateToast(toast_id, t(`Sync Anime ${success}/${saveInPlugin.length} failed: ${failed}`))
    }
}

export async function OvewriteAnimuList(data: { AnimeData: AnimeData; animulist: animulistProps }[]) {
    setNewAnimuList(data)
    refreashAnimulist()
}

export function convertHistoryToAnimuList() {
    const history = unwrap(getHistory()).history.reverse()
    if (history.length <= 0) return
    const animulist = unwrap(animulistData())

    for (let index = 0; index < history.length; index++) {
        const element = history[index];
        try {
            if (element.AnimeData.id.replaceAll(" ", "") == "") return
            const finded = animulist.get(element.AnimeData.id)
            if (finded) continue
            if (!element.saveData.episode) continue
            let status: animulistProps = {
                status: "COMPLETED",
                score: 0,
                reapeat: 0,
                startWatch: 0,
                endWatch: 0,
                added: dateToUnix(new Date().toString()),
                lastUpdate: dateToUnix(new Date().toString())
            }

            if (element.AnimeData.episodes && parseInt(element.saveData.episode) < element.AnimeData.episodes)
                status = { ...status, status: "CURRENT", startWatch: dateToUnix(new Date().toString()) }

            addToAnimuList(status, {
                ...element.AnimeData,
                nextAiringEpisode: undefined,
                recommendations: undefined
            })
        } catch (error) {
            console.error("convertHistoryToAnimuList have error", error, element)
        }
    }
}