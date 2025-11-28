import { containerData, playerPluginFormat, SettingsConfig } from "./types";
import { getConfig } from "./stores/config";
import { getHomeCache, setAllHomeData, setHomeStopScrolling } from "./stores/home";
import { getPluginList, setPlayerPlugin } from "./stores/plugins";

export async function setHomeData(func: () => Promise<{ topCards?: containerData, sections: containerData[] }>) {
    console.log("setHomeData")
    try {
        setHomeStopScrolling(false)
        if (getHomeCache().isLoading) return
        setAllHomeData({isLoading: true, isError: false, data: { sections: [] }} as any)
        // let data = await func()
        // console.log(data)
        setAllHomeData({isLoading: false, isError: false, data: []} as any)
    } catch (error) {
        setAllHomeData({isLoading: false, isError: true, data: []} as any)
    }
}

export async function UpdateHomeData(func: () => Promise<{ data: containerData, maxPage: number }>) {
    try {
        setHomeStopScrolling(false)
        let homeCache = getHomeCache()
        if (homeCache.isLoading) return
        let data = await func()
        let tmp: { topCards?: containerData, sections: containerData[] } = homeCache.data

        if (data.data.data.length < data.maxPage) setHomeStopScrolling(true)
        setAllHomeData({isLoading: false, isError: false, data: { sections: [{ ...data.data, data: [...tmp.sections[0].data, ...data.data.data] }] }} as any)
    } catch (error) {
        console.error(error)
    }
}

export function InitialPlayerPlugin() {
    try {
        const config: SettingsConfig = getConfig()
        const loadedPlugins: playerPluginFormat[] = getPluginList()
        for (let index = 0; index < loadedPlugins.length; index++) {
            const element = loadedPlugins[index];
            if (element.name == config.plugins.player) {
                setPlayerPlugin(element)
                return
            }
        }

        loadedPlugins.forEach((element: playerPluginFormat) => {
            if (element.name == "Allmanga") {
                setPlayerPlugin(element)
                return
            }
        })
    } catch (error) {
        console.error(error)
    }
}

export function ChangePlugin(name: string): playerPluginFormat {
    const loadedPlugins: playerPluginFormat[] = getPluginList()
    try {
        for (let index = 0; index < loadedPlugins.length; index++) {
            const element = loadedPlugins[index];
            if (element.name == name) {
                setPlayerPlugin(element)
                return element
            }
            if (name == "" && element.name == "Allmanga") {
                setPlayerPlugin(element)
                return element
            }
        }
        return loadedPlugins[0]
    } catch (error) {
        console.error(error)
        return loadedPlugins[0]
    }
}

// export function setPluginPlayerCache(element: any) {
//     try {
//         store.dispatch({ type: "setPlayerPluginCache", payload: element })
//     } catch (error) {
//         console.error(error)
//     }
// }

// export function getPlayerPluginCache(): any {
//     try {
//         return store.getState().plugin.playerPluginCache
//     } catch (error) {
//         console.error(error)
//     }
// }

export function ResetPluginPlayerCache() {
    try {
        setPlayerPlugin(undefined)
    } catch (error) {
        console.error(error)
    }
}