import { containerData } from "./GlobalInterface";
import store from "./store";

export async function setHomeData(func: () => Promise<containerData[]>) {
    store.dispatch({ type: "setLoadingHome", payload: { isLoading: true } })
    try {
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


export async function setSearchData(func: () => Promise<containerData>) {
    try {
        let data = await func()
        let tmp = store.getState().home.data[0]
        store.dispatch({
            type: "setAllHomeData", payload: {
                isLoading: false, isError: false, data: [{ ...data, data: [ ...tmp.data, ...data.data ] }]
            }
        })
    } catch (error) {
        console.log(error)
    }
}

export async function homeStopScrolling() {
    try {
        store.dispatch({
            type: "setStopScrolling", payload: true
        })
    } catch (error) {
        console.log(error)
    }
}