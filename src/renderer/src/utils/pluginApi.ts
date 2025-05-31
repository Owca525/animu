import { containerData } from "./GlobalInterface";
import store from "./store";

export async function setHomeData(func: () => Promise<containerData[]>) {
    store.dispatch({ type: "setLoadingHome", payload: { isLoading: true } })
    try {
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


export async function setSearchData(func: () => Promise<containerData>) {
    try {
        store.dispatch({ type: "setcontainerLoading", payload: true })
        let data = await func()
        let tmp = store.getState().home.data[0]

        if (data.data.length < store.getState().plugin.informationPlugin.information.pageSize) homeStopScrolling(true)
        
        store.dispatch({
            type: "setAllHomeData", payload: {
                isLoading: false, isError: false, data: [{ ...data, data: [ ...tmp.data, ...data.data ] }]
            }
        })
        store.dispatch({ type: "setcontainerLoading", payload: false })
    } catch (error) {
        store.dispatch({ type: "setcontainerLoading", payload: false })
        console.log(error)
    }
}

export async function homeStopScrolling(playload: boolean) {
    try {
        store.dispatch({
            type: "setStopScrolling", payload: playload
        })
    } catch (error) {
        console.log(error)
    }
}