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
                isLoading: false, isError: true, data: []
            }
        })
    }
}