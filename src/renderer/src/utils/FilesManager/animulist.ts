import { unwrap } from "solid-js/store"
import { removeToast, toast, updateToast } from "../context/ToastNotification"
import { getGlobalCache, GetUser, isSynchronizeAnime, SetSynchronizeAnime } from "../stores/global"
import { AnimeData, AnimuListFormat, animulistProps, cardData } from "../types"
import { getHomeCache } from "../stores/home"
import { AnimuListSearch } from "@renderer/pages/home/homeUtils"
import { dateToUnix, detectTitleConfig, GetAnimeID, GetAnimeIDObject, sleep, TrieFunction } from "../functions"
import { getInformationPlugin } from "../stores/plugins"
import { t } from "../i18n"
import { AddCardDataToDatabase, animuDatabase, GetAllAnimeFromDatabase, GetAnimeFromDatabase, getAnimuHistoryIContinue } from "./anime_database"

export async function addToAnimuList(animulist: animulistProps, anime: AnimeData, notification: boolean = false) {
    if (getGlobalCache().incognito) return

    AddCardDataToDatabase({ AnimeData: { ...unwrap(anime), nextAiringEpisode: undefined }, animulist: unwrap(animulist) })

    refreashAnimulist()
    // TRANSLATE
    if (notification) toast(`Succesfully Added ${detectTitleConfig(anime.title)} to animulist`)
}

export async function removeFromAnimulist(anime: AnimeData, notification: boolean = false) {
    if (getGlobalCache().incognito) return

    const id = GetAnimeIDObject(anime)
    if (!id) {
        console.error("animulist/removeFromAnimulist FAILED ADD ANIME", anime)
        return
    }

    const finded = animuDatabase.get({ table: "ids", row: id["name"], value: `${id["id"]}` })
    if (!finded) return

    animuDatabase.delete("animulist", [`${finded["id"]}`])

    refreashAnimulist()
    // TRANSLATE
    if (notification) toast(`Succesfully Removed From animulist`)
}

export async function updateDataInAnimulist(anime: { AnimeData: AnimeData; animulist: animulistProps }, notification: boolean = false) {
    if (getGlobalCache().incognito) return

    AddCardDataToDatabase(unwrap(anime))

    refreashAnimulist()
    // TRANSLATE
    if (notification) toast(`Succesfully Updated in animulist`)
}

export async function refreashAnimulist() {
    const global = unwrap(getHomeCache())

    if (GetUser()["logged"]) {
        SynchronizeAnimulistWithPlugin()
    }

    if (global.activePage != "global.animulist") return

    AnimuListSearch(global.search, global.filterTags)
}

export async function SynchronizeAnimulistWithPlugin(animu_overwrite = false) {
    const info_plugin = getInformationPlugin()
    const user = GetUser()

    if (isSynchronizeAnime()) return

    if (!user["logged"]) return

    if (!info_plugin.setAnimeInList || !info_plugin.removeAnimeFromList || !info_plugin.getAnimeList) return
    SetSynchronizeAnime(true)

    const animulist = GetAllAnimuAnimulist()
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

    for (let index = 0; index < updatetAnimulist.length; index++) {
        const element = updatetAnimulist[index];
        await updateDataInAnimulist(element as any)
    }

    if (saveInPlugin.length <= 0) return

    let success = 0
    let failed = 0

    let toast_id: string | undefined = undefined
    if  (saveInPlugin.length > 9) toast_id = toast(t(`Sync Anime ${success}/${saveInPlugin.length} failed: ${failed}`), { type: "loading", noTimer: false })

    for (let index = 0; index < saveInPlugin.length; index++) {
        const anime = saveInPlugin[index];
        
        await sleep(Math.floor(Math.random() * (2000 - 500 + 1)) + 500)

        try {

            const resp = await TrieFunction(async () => {
                return await info_plugin.setAnimeInList!(`${GetAnimeID(anime["AnimeData"], info_plugin["metadata"]["name"])}`, anime["animulist"]!)
            }, Math.floor(Math.random() * (20000 - 6000 + 1)) + 6000)
            
            if (resp) {
                success += 1
            } else failed += 1

        } catch (error) {
            console.error("animulist/SynchronizeAnimulistWithPlugin/saveInPlugin", error)
            failed += 1
        }

        if (toast_id) updateToast(toast_id, t(`Sync Anime ${success}/${saveInPlugin.length} failed: ${failed}`))
    }

    if (toast_id) removeToast(toast_id)
    SetSynchronizeAnime(false)
}

// export async function OvewriteAnimuList(data: { AnimeData: AnimeData; animulist: animulistProps }[]) {
//     setNewAnimuList(data)
//     refreashAnimulist()
// }

export function convertHistoryToAnimuList() {
    const history = getAnimuHistoryIContinue().history.reverse()
    if (history.length <= 0) return

    for (let index = 0; index < history.length; index++) {
        const element = history[index];
        try {
            if (!element.AnimeData.id) return

            const finded = GetAnimuAnimulist(element["AnimeData"])
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

export function GetAllAnimuAnimulist(): AnimuListFormat[] {
    return GetAllAnimeFromDatabase().filter((v) => v["animulist"]) as AnimuListFormat[]
}

export function GetAnimuAnimulist(id: AnimeData | cardData): AnimuListFormat | undefined {
    const tmp = GetAnimeFromDatabase(GetAnimeID(id))
    if (!tmp) return
    if (!tmp["animulist"]) return
    return tmp as AnimuListFormat
}