import { dateToUnix, getHistory, searchDataInCards, setHomeData } from "@renderer/utils/functions";
import { animulistData } from "@renderer/utils/stores/global";
import { getHomeCache, setHomeNewData, setHomeSearch, setHomeSearchPage, setHomeStopScrolling } from "@renderer/utils/stores/home";
import { getInformationPlugin } from "@renderer/utils/stores/plugins";
import { cardData, containerData, FilterParams, homeData } from "@renderer/utils/types";
import { unwrap } from "solid-js/store";

export function setCalendary(date?: string) {
    let tmp = new Date()
    if (date) tmp = new Date(date)

    const startOfDay = new Date(tmp);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(tmp);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(startOfDay, endOfDay)

    setHomeData(async () => getInformationPlugin().schedule(dateToUnix(startOfDay.toString()), dateToUnix(endOfDay.toString())))
}

export function setAnimuList() {
    setHomeData(undefined, {
        sections: [
            {
                data: unwrap(animulistData())
            }
        ]
    })
}

export function setHistory() {
    let history = getHistory()

    let data: homeData["data"] = {
        sections: [
            {
                title: "global.continuewatch",
                data: history.continue.slice(0, 20),
                horizontal: true,
                onTitleClick: async () => ({
                    title: "global.continuewatch",
                    data: history.continue,
                    horizontal: false,
                }),
            },
            {
                title: "global.history",
                data: history.history.slice(0, 20) as cardData[],
                horizontal: true,
                onTitleClick: async () => ({
                    title: "global.history",
                    data: history.history as cardData[],
                    horizontal: false,
                })
            },
        ],
    };
    setHomeData(undefined, data)
}

export function anilistSearch(search: string, params: FilterParams | undefined) {
    const plugin = getInformationPlugin()
    setHomeSearch(search)
    setHomeSearchPage(1)
    setHomeStopScrolling(false);
    plugin.searchAnime(search, 1, params);
}

export function historySearch(search: string = "", params: FilterParams | undefined) {
    if (search.replaceAll(" ", "") == "" && params == undefined) {
      setHistory()
      return
    }
    const history = getHistory()
    const homeCache = getHomeCache().data["sections"]
    let finnalContainer: containerData[] = []

    if (homeCache.length <= 0) return

    if (homeCache.length == 1) {
        finnalContainer.push({
            title: homeCache[0].title == "global.history" ? "global.history" : "global.continuewatch",
            data: homeCache[0].title == "global.history" ? searchDataInCards(history.history as cardData[], search, params) : 
                searchDataInCards(history.continue as cardData[], search, params)
        })
    } else {
        finnalContainer.push({
            title: "global.continuewatch",
            data: searchDataInCards(history.continue as cardData[], search, params),
            horizontal: true
        })
        finnalContainer.push({
            title: "global.history",
            data: searchDataInCards(history.history as cardData[], search, params),
            horizontal: true
        })
    }

    setHomeNewData({ sections: finnalContainer })
}

export function AnimuListSearch(search: string = "", params: FilterParams | undefined) {
    if (search.replaceAll(" ", "") == "" && params == undefined) return setAnimuList()
    setHomeData(undefined, {
        sections: [
            {   
                title: search != "" ? `Searching: ${search}` : undefined,
                data: searchDataInCards(unwrap(animulistData()), search, params)
            }
        ]
    })
}