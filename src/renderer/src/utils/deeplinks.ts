import { deeplinkFormat } from "./types";

class DeeplinkInstance {
    private activeDeeplinks: Map<string, deeplinkFormat> = new Map()

    private FetchDeeplink = (fetchedeeplink: string) => {
        try {
            const deeplink = new URL(fetchedeeplink)
            /* IFDEF DEBUG */
            console.warn("Deeplinks/FetchDeeplink", fetchedeeplink, deeplink)
            /* ENDIF */

            if (deeplink.host.length <= 0 && deeplink["search"].length == 0) return

            this.activeDeeplinks.forEach((item) => {
                if (deeplink["host"] == item["code"])
                    return item.func(deeplink.search, item.code)

                // if (item.code == "" && deeplink["host"].length > 0) 
                //     return item.func(deeplink.host, item.code)

                // if (deeplink.search.startsWith(`?${item.code}`)) 
                //     return item.func(deeplink.search.replaceAll(`?${item.code}=`, ""), item.code)
            })

        } catch (error) {
            console.error("Deeplinks/FetchDeeplink", fetchedeeplink, this.activeDeeplinks)
        }
    }

    constructor() {
        window.api.onProtocolRequest(this.FetchDeeplink)
    }

    add = (deep: deeplinkFormat): boolean => {
        if (this.activeDeeplinks.has(deep["name"])) return false

        const finded = this.activeDeeplinks.values().find((v) => `${v["code"]}`.replaceAll(" ", "") == deep["code"].replaceAll(" ", ""))
        if (finded) return false

        /* IFDEF DEBUG */
        console.warn("Deeplinks/add", deep)
        /* ENDIF */

        this.activeDeeplinks.set(deep["name"], deep)
        return true
    }

    remove = (name: string): boolean => {
        return this.activeDeeplinks.delete(name)
    }

    exist = (name: string): boolean => {
        return this.activeDeeplinks.has(name)
    }
}

const deeplink = new DeeplinkInstance()

export default deeplink