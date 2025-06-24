import { containerData } from "./GlobalInterface";
import store from "./store";

export async function setHomeData(func: () => Promise<containerData[]>) {
    try {
        homeStopScrolling(false)
        if (store.getState().home.isLoading) return
        store.dispatch({ type: "setLoadingHome", payload: { isLoading: true } })
        let data = await func()
        console.log(data)
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
        console.log(error)
    }
}

export async function homeStopScrolling(payload: boolean) {
    try {
        store.dispatch({
            type: "setStopScrolling", payload: payload
        })
    } catch (error) {
        console.log(error)
    }
}

export async function setHomeLocalSearch(payload: boolean) {
    try {
        store.dispatch({
            type: "setLocalSearch", payload: payload
        })
    } catch (error) {
        console.log(error)
    }
}