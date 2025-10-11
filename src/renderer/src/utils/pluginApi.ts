import { containerData, playerPluginFormat, SettingsConfig } from "./GlobalInterface";
import store from "./store";

export async function setHomeData(func: () => Promise<{ topCards?: containerData, sections: containerData[] }>) {
    try {
        homeStopScrolling(false)
        if (store.getState().home.isLoading) return
        store.dispatch({
            type: "setAllHomeData", payload: {
                isLoading: true, isError: false, data: { sections: [] }
            }
        })
        let data = await func()
        store.dispatch({
            type: "setAllHomeData", payload: {
                isLoading: false, isError: false, data: data
            }
        })
    } catch (error) {
        store.dispatch({
            type: "setAllHomeData", payload: {
                isLoading: false, isError: true
            }
        })
    }
}

export async function UpdateHomeData(func: () => Promise<{ data: containerData, maxPage: number }>) {
    try {
        homeStopScrolling(false)
        if (store.getState().home.isLoading) return
        store.dispatch({ type: "setcontainerLoading", payload: true })
        let data = await func()
        console.log(data, func)
        let tmp: { topCards?: containerData, sections: containerData[] } = store.getState().home.data

        if (data.data.data.length < data.maxPage) homeStopScrolling(true)

        store.dispatch({
            type: "setAllHomeData", payload: {
                isLoading: false, isError: false, data: { sections: [{ ...data.data, data: [...tmp.sections[0].data, ...data.data.data] }] }
            }
        })
        store.dispatch({ type: "setcontainerLoading", payload: false })
    } catch (error) {
        store.dispatch({ type: "setcontainerLoading", payload: false })
        console.error(error)
    }
}

export function homeStopScrolling(payload: boolean) {
    try {
        store.dispatch({
            type: "setStopScrolling", payload: payload
        })
    } catch (error) {
        console.error(error)
    }
}

export function setHomeLocalSearch(payload: boolean) {
    try {
        store.dispatch({
            type: "setLocalSearch", payload: payload
        })
    } catch (error) {
        console.error(error)
    }
}

export function InitialPlugin() {
    try {
        const config: SettingsConfig = store.getState().config
        const loadedPlugins: playerPluginFormat[] = store.getState().plugin.loadedPlugins
        for (let index = 0; index < loadedPlugins.length; index++) {
            const element = loadedPlugins[index];
            if (element.name == config.plugins.player) {
                store.dispatch({ type: "setPluginPlayer", payload: element })
                return
            }
        }

        loadedPlugins.forEach((element: playerPluginFormat) => {
            if (element.name == "Allmanga") {
                store.dispatch({ type: "setPluginPlayer", payload: element })
                return
            }
        })
    } catch (error) {
        console.error(error)
    }
}

export function ChangePlugin(name: string) {
    try {
        const loadedPlugins: playerPluginFormat[] = store.getState().plugin.loadedPlugins
        for (let index = 0; index < loadedPlugins.length; index++) {
            const element = loadedPlugins[index];
            if (element.name == name) {
                store.dispatch({ type: "setPluginPlayer", payload: element })
                return
            }
            if (name == "" && element.name == "Allmanga") {
                store.dispatch({ type: "setPluginPlayer", payload: element })
                return
            }
        }
    } catch (error) {
        console.error(error)
    }
}

export function getPluginList(): playerPluginFormat[] {
    try {
        return store.getState().plugin.loadedPlugins
    } catch (error) {
        console.error(error)
        return []
    }
}

export function setPluginPlayerCache(element: any) {
    try {
        store.dispatch({ type: "setPlayerPluginCache", payload: element })
    } catch (error) {
        console.error(error)
    }
}

export function getPlayerPluginCache(): any {
    try {
        return store.getState().plugin.playerPluginCache
    } catch (error) {
        console.error(error)
    }
}

export function ResetPluginPlayerCache() {
    try {
        store.dispatch({ type: "setPlayerPluginCache", payload: undefined })
    } catch (error) {
        console.error(error)
    }
}