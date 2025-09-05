import { containerData, pluginFormat, SettingsConfig } from "./GlobalInterface";
import store from "./store";

export async function setHomeData(func: () => Promise<containerData[]>) {
    try {
        homeStopScrolling(false)
        if (store.getState().home.isLoading) return
        store.dispatch({ type: "setLoadingHome", payload: { isLoading: true } })
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
        let tmp = store.getState().home.data[0]

        if (data.data.data.length < data.maxPage) homeStopScrolling(true)
        
        store.dispatch({
            type: "setAllHomeData", payload: {
                isLoading: false, isError: false, data: [{ ...data.data, data: [ ...tmp.data, ...data.data.data ] }]
            }
        })
        store.dispatch({ type: "setcontainerLoading", payload: false })
    } catch (error) {
        store.dispatch({ type: "setcontainerLoading", payload: false })
        console.error(error)
    }
}

export async function homeStopScrolling(payload: boolean) {
    try {
        store.dispatch({
            type: "setStopScrolling", payload: payload
        })
    } catch (error) {
        console.error(error)
    }
}

export async function setHomeLocalSearch(payload: boolean) {
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
        const loadedPlugins: pluginFormat[] = store.getState().plugin.loadedPlugins
        for (let index = 0; index < loadedPlugins.length; index++) {
            const element = loadedPlugins[index];
            if (element.name == config.plugins.player) {
                store.dispatch({type: "setPluginPlayer", payload: element})
                return
            }
        }

        loadedPlugins.forEach((element: pluginFormat) => {
            if (element.name == "Allmanga") {
                store.dispatch({type: "setPluginPlayer", payload: element})
                return
            }
        })
    } catch (error) {
        console.error(error)
    }
}

export async function ChangePlugin(name: string) {
    try {
        const loadedPlugins: pluginFormat[] = store.getState().plugin.loadedPlugins
        for (let index = 0; index < loadedPlugins.length; index++) {
            const element = loadedPlugins[index];
            if (element.name == name) {
                store.dispatch({type: "setPluginPlayer", payload: element})
                return
            }
            if (name == "" && element.name == "Allmanga") {
                store.dispatch({type: "setPluginPlayer", payload: element})
                return
            }
        }
    } catch (error) {
        console.error(error)
    }
}