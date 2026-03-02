import { unwrap } from "solid-js/store"
import { toast } from "../context/ToastNotification"
import { animulistData, getGlobalCache, setAnimulistData } from "../stores/global"
import { AnimeData, animulistProps } from "../types"
import { getHomeCache } from "../stores/home"
import { AnimuListSearch } from "@renderer/pages/home/homeUtils"
import { dateToUnix, getHistory } from "../functions"

export async function addToAnimuList(animulist: animulistProps, anime: AnimeData, notification: boolean = false) {
    if (getGlobalCache().incognito) return
    if (window.api) await window.api.animulist.add({ AnimeData: { ...unwrap(anime), nextAiringEpisode: undefined }, animulist: unwrap(animulist) })
    else {
        let database = structuredClone(unwrap(animulistData()))
        database.unshift({ AnimeData: { ...unwrap(anime), nextAiringEpisode: undefined }, animulist: unwrap(animulist) })
        console.log(database)
        localStorage.setItem("animulist", JSON.stringify(database))
    }
    refreashAnimulist()
    if (notification) toast(`Succesfully Added ${anime.title.romaji} to animulist`)
}

export async function removeFromAnimulist(id: string, notification: boolean = false) {
    if (getGlobalCache().incognito) return
    if (window.api) await window.api.animulist.delete(unwrap(id))
    else {
        let database = structuredClone(unwrap(animulistData()))
        localStorage.setItem("animulist", JSON.stringify(database.filter((v) => v.AnimeData.id != id)))
    }
    refreashAnimulist()
    if (notification) toast(`Succesfully Removed From animulist`)
}

export async function updateDataInAnimulist(id: string, anime: { AnimeData: AnimeData; animulist: animulistProps }, notification: boolean = false) {
    if (getGlobalCache().incognito) return
    if (window.api) await window.api.animulist.update(unwrap(id), unwrap(anime))
    else {
        let database = structuredClone(unwrap(animulistData()))
        localStorage.setItem("animulist", JSON.stringify(database.map((v) => v.AnimeData.id == id ? { ...anime, 
        AnimeData: { 
            ...anime.AnimeData,
            nextAiringEpisode: undefined,
            recommendations: undefined
        }
    } : {
        ...v,
        AnimeData: {
            ...v.AnimeData,
            nextAiringEpisode: undefined,
            recommendations: undefined
        }
    })))
    }
    refreashAnimulist()
    if (notification) toast(`Succesfully Updated in animulist`)
}

export async function refreashAnimulist() {
    if (window.api) setAnimulistData(await window.api.animulist.getDatabase())
    else setAnimulistData(JSON.parse(localStorage.getItem("animulist") as any))
    
    const global = unwrap(getHomeCache())
    if (global.activePage != "global.animulist") return

    AnimuListSearch(global.search, global.filterTags)
}

export async function HardResetAnimulist() {
    if (window.api) setAnimulistData([])
    else setAnimulistData(JSON.parse([] as any))
    refreashAnimulist()
}

export function convertHistoryToAnimuList() {
    const history = unwrap(getHistory()).history.reverse()
    if (history.length <= 0) return
    const animulist = unwrap(animulistData())

    for (let index = 0; index < history.length; index++) {
        const element = history[index];
        if (element.AnimeData.id.replaceAll(" ", "") == "") return
        const finded = animulist.find((v) => v.AnimeData.id.toString() == element.AnimeData.id.toString())
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
    }
}