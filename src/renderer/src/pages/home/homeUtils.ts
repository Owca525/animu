import { convertParams, getHistory, getWeek, searchDataInCards, setHomeData, SortCardataByDays } from "@renderer/utils/functions";
import { animulistData, GetCalendaryCache, isFetchingCallendary, isPluginSearchMode } from "@renderer/utils/stores/global";
import { getHomeCache, setHomeNewData, setHomeSearch, setHomeSearchPage, setHomeSearchTags, setHomeStopScrolling } from "@renderer/utils/stores/home";
import { getInformationPlugin, getPlayerPLugin } from "@renderer/utils/stores/plugins";
import { cardData, containerData, FilterParams, homeData } from "@renderer/utils/types";
import Calendary from "./components/calendary";
import { t } from "@renderer/utils/i18n";

export async function setCalendary(date?: string) {
    if (typeof date == "object") date = undefined

    let week_calendary: cardData[] = []

    if (date) {

        const week = getWeek(date)
        week_calendary = await getInformationPlugin().schedule(week.startWeekUnix, week.endWeekUnix)

    } else {

        if (isFetchingCallendary()) {
            let timestamp = setInterval(() => {
                if (isFetchingCallendary()) return

                week_calendary = GetCalendaryCache()

                clearInterval(timestamp)
            }, 500)
        } else {
            week_calendary = GetCalendaryCache()
        }

    }

    setHomeData({ jsx: () => Calendary(SortCardataByDays(week_calendary)) })
}

export async function SearchInCalendary(search: string = "", params: FilterParams | undefined) {
    let tmp = searchDataInCards(GetCalendaryCache(), search, convertParams(params))

    if (search.length <= 0) {
        return setCalendary()
    }

    // TODO: Fix searching
    setHomeData({
        content: {
            sections: [
                {
                    title: search != "" ? t(`Searching Calendary: ${search}`) : undefined,
                    data: tmp
                }
            ]
        }
    })
}

export function setHome() {
    const plugin = getInformationPlugin()
    setHomeData({
        wrapper: plugin.home
    })
}

export function setAnimuList(): any {
    const animulist = animulistData().values().toArray()
    if (animulist.length <= 0) return setHomeData({ content: { sections: [{ data: [] }] } })

    let finnalContainer: containerData[] = []
    const global = getHomeCache()

    const currentAnime = animulist.filter((v) => v.animulist.status == "CURRENT")
    if (currentAnime.length >= 1)
        finnalContainer.push({
            title: "animulist.status.CURRENT",
            data: currentAnime,
            horizontal: true,
            onTitleClick: () => AnimuListSearch("", {
                ...global.filterTags, watching: {
                    val: "CURRENT",
                    name: "animulist.status.CURRENT"
                }
            })
        })

    const watchedAnime = animulist.filter((v) => v.animulist.status == "COMPLETED")
    if (watchedAnime.length >= 1)
        finnalContainer.push({
            title: "animulist.status.COMPLETED",
            data: watchedAnime,
            horizontal: true,
            onTitleClick: () => AnimuListSearch("", {
                ...global.filterTags, watching: {
                    val: "COMPLETED",
                    name: "animulist.status.COMPLETED"
                }
            })
        })

    const planningAnime = animulist.filter((v) => v.animulist.status == "PLANNING")
    if (planningAnime.length >= 1) finnalContainer.push({
        title: "animulist.status.PLANNING",
        data: planningAnime,
        horizontal: true,
        onTitleClick: () => AnimuListSearch("", {
            ...global.filterTags, watching: {
                val: "PLANNING",
                name: "animulist.status.PLANNING"
            }
        })
    })

    const pausedAnime = animulist.filter((v) => v.animulist.status == "PAUSED")
    if (pausedAnime.length >= 1) finnalContainer.push({
        title: "animulist.status.PAUSED",
        data: pausedAnime,
        horizontal: true,
        onTitleClick: () => AnimuListSearch("", {
            ...global.filterTags, watching: {
                val: "PAUSED",
                name: "animulist.status.PAUSED"
            }
        })
    })

    if (finnalContainer.length <= 1) return setHomeData({ content: { sections: [{ data: animulist }] } })

    setHomeData({
        content: {
        sections: finnalContainer
    }
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
    setHomeData({ content: data })
}

export async function anilistSearch(search: string, params: FilterParams | undefined) {
    setHomeSearch(search)
    setHomeSearchPage(1)
    setHomeStopScrolling(false);
    if (isPluginSearchMode()) {
        const plugin = getPlayerPLugin()
        const tmp = await plugin?.searchAnime(search, 1, convertParams(params))

        setHomeData({
            content: {
            sections: [
                {
                    title: `home.searching/${search}`,
                    data: tmp ? tmp : []
                }
            ]
        }
        })
        return
    }

    let title: string | undefined = undefined
    if (!(search.replaceAll(" ", "") == "")) title = `home.searching/${search}`
    // async () => await plugin.search(search, 1, convertParams(params))
    const plugin = getInformationPlugin()
    setHomeData({
        content: {
        title: title,
        data: [],
        onScrollDownFunction: plugin.search,
        useResponse: true
    }
    });

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
            data: homeCache[0].title == "global.history" ? searchDataInCards(history.history as cardData[], search, convertParams(params)) :
                searchDataInCards(history.continue as cardData[], search, convertParams(params))
        })
    } else {
        finnalContainer.push({
            title: "global.continuewatch",
            data: searchDataInCards(history.continue as cardData[], search, convertParams(params)),
            horizontal: true
        })
        finnalContainer.push({
            title: "global.history",
            data: searchDataInCards(history.history as cardData[], search, convertParams(params)),
            horizontal: true
        })
    }

    setHomeNewData({ sections: finnalContainer })
}

export function AnimuListSearch(search: string = "", params: FilterParams | undefined) {
    if (search.replaceAll(" ", "") == "" && params == undefined) return setAnimuList()
    let tmp = searchDataInCards(animulistData().values().toArray(), search, convertParams(params))
    if (params && params["watching"]) tmp = tmp.filter((v) => v.animulist?.status == params["watching"].val)
    setHomeSearchTags(params)
    setHomeData({
        content: {
            sections: [
                {
                    title: search != "" ? t(`Searching Animulist: ${search}`) : undefined,
                    data: tmp
                }
            ]
        }
    })
}