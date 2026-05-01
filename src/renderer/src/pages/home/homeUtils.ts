import { convertParams, dateToUnix, getHistory, searchDataInCards, setHomeData } from "@renderer/utils/functions";
import { t } from "@renderer/utils/i18n";
import { animulistData, isPluginSearchMode } from "@renderer/utils/stores/global";
import { getHomeCache, setHomeNewData, setHomeSearch, setHomeSearchPage, setHomeSearchTags, setHomeStopScrolling } from "@renderer/utils/stores/home";
import { getInformationPlugin, getPlayerPLugin } from "@renderer/utils/stores/plugins";
import { cardData, containerData, FilterParams, homeData } from "@renderer/utils/types";
import { unwrap } from "solid-js/store";

export function setCalendary(date?: string) {
    let tmp = new Date()
    if (typeof date == "string") tmp = new Date(date)

    const startOfDay = new Date(tmp);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(tmp);
    endOfDay.setHours(23, 59, 59, 999);

    const days = [t("week.sunday"), t("week.monday"), t("week.tuesday"), t("week.wednesday"), t("week.thursday"), t("week.friday"), t("week.saturday")];

    setHomeData(async () => ({
        sections: [{
            title: days[startOfDay.getDay()],
            data: await getInformationPlugin().schedule(dateToUnix(startOfDay.toString()), dateToUnix(endOfDay.toString()))
        }]
    }))
}

export function setHome() {
    const plugin = getInformationPlugin()
    setHomeData(async () => await plugin.home())
}

export function setAnimuList(): any {
    const animulist = unwrap(animulistData())
    if (animulist.length <= 0) return setHomeData(undefined, { sections: [{ data: [] }] })
    let finnalContainer: containerData[] = []
    const global = unwrap(getHomeCache())

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

    if (finnalContainer.length <= 1) return setHomeData(undefined, { sections: [{ data: unwrap(animulistData()) }] })

    setHomeData(undefined, {
        sections: finnalContainer
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

export async function anilistSearch(search: string, params: FilterParams | undefined) {
    setHomeSearch(search)
    setHomeSearchPage(1)
    setHomeStopScrolling(false);
    if (isPluginSearchMode()) {
        const plugin = getPlayerPLugin()
        const tmp = await plugin?.searchAnime(search, 1, convertParams(params))

        setHomeData(undefined, {
            sections: [
                {
                    title: `home.searching/${search}`,
                    data: tmp ? tmp : []
                }
            ]
        })
    } else {
        const plugin = getInformationPlugin()
        setHomeData(async () => await plugin.search(search, 1, convertParams(params)));
    }
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
    let tmp = searchDataInCards(unwrap(animulistData()), search, convertParams(params))
    if (params && params["watching"]) tmp = tmp.filter((v) => v.animulist?.status == params["watching"].val)
    setHomeSearchTags(params)
    setHomeData(undefined, {
        sections: [
            {
                title: search != "" ? `Searching: ${search}` : undefined,
                data: tmp
            }
        ]
    })
}