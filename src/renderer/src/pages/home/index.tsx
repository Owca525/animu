import { useNavigate } from "react-router-dom"

// Home css
import "./home.css"
import Input from "@renderer/components/input"
import Sidebar from "@renderer/components/sidebar"
import Container from "./components/container"
import { useSelector } from "react-redux"
import { useEffect, useRef, useState } from "react"
import { containerData, FilterParams, homeData } from "@renderer/utils/GlobalInterface"
import { t } from "i18next"
import store from "@renderer/utils/store"
import { homeStopScrolling, setHomeData, setHomeLocalSearch } from "@renderer/utils/pluginApi"
import { ReadContinue } from "@renderer/utils/history/continueWatch"
import { ReadHistory } from "@renderer/utils/history/history"
import { OpenContextMenu } from "@renderer/utils/context/ContextMenu"
import { CreateContextMenuOptions } from "@renderer/utils/functions"
import Button from "@renderer/components/buttons"
import Dropdown from "../../components/dropDown"

const Home = () => {
    const navigate = useNavigate()
    const plugin = useSelector((plugin: any) => plugin.plugin.informationPlugin);
    const homeCache: homeData = useSelector((cache: any) => cache.home);
    const pluginPlayer = useSelector((plugin: any) => plugin.plugin.playerPlugin);
    const [showFilter, setShowFilter] = useState<boolean>(false)

    const divRef = useRef<HTMLDivElement | null>(null);

    let sidebarData = {
        top: [
            {
                icon: "home",
                text: t("global.home"),
                onClick: plugin.information.home
            },
            {
                icon: "history",
                text: t("global.history"),
                onClick: () => setHomeData(history)
            }
        ],
        bottom: [
            {
                icon: "settings",
                text: t("global.settings"),
                onClick: () => navigate("/settings")
            }
        ]
    }

    if (pluginPlayer.sidebarAddon) {
        sidebarData = {
            bottom: [...sidebarData.bottom],
            top: [...sidebarData.top, ...pluginPlayer.sidebarAddon]
        }
    }

    useEffect(() => {
        if (homeCache.data.length == 0) plugin.information.home()
        window.api.rpc.setActivity(undefined, t("discordrpc.home"))
    }, [])

    useEffect(() => {
        if (!divRef.current) return
        if (homeCache.data.length == 0) return
        if (homeCache.data.length > 1) return
        const { scrollHeight, clientHeight } = divRef.current;
        if (scrollHeight > clientHeight == false) handleScroll()
    }, [homeCache.data])
    
    async function history(): Promise<containerData[]> {
        setHomeLocalSearch(true)
        return [
            {
                title: t("global.continuewatch"),
                data: await ReadContinue(20),
                horizontal: true,
                onTitleClick: () => setHomeData(async () => [{ title: t("global.continuewatch"), data: await ReadContinue(), horizontal: false }])
            },
            {
                title: t("global.history"),
                data: await ReadHistory(20),
                horizontal: true,
                onTitleClick: () => setHomeData(async () => [{ title: t("global.history"), data: await ReadHistory(), horizontal: false }])
            },
        ]
    }

    console.log(homeCache)

    const handleScroll = () => {
        if (homeCache.data.length > 1) return
        if (!divRef.current) return
        const currentPos = -divRef.current.scrollTop + divRef.current.scrollHeight
        const endPosition = divRef.current.offsetHeight
        const isFUCKINGBottom = parseInt(currentPos.toFixed(0)) <= endPosition + 30
        console.log("handleScroll", isFUCKINGBottom, homeCache, homeCache.data[0].onScrollDownFunction)
        if (isFUCKINGBottom && homeCache.stopScrolling == false && homeCache.data.length === 1) {
            if (homeCache.data[0].onScrollDownFunction) {
                store.dispatch({ type: "setPage", payload: homeCache.page + 1 })
                homeCache.data[0].onScrollDownFunction(homeCache.page + 1)
            }
            return
        }
        if (isFUCKINGBottom && !homeCache.stopScrolling) {
            store.dispatch({ type: "setPage", payload: homeCache.page + 1 })
            plugin.information.search(homeCache.search, homeCache.page + 1, homeCache.filterTags)
        }
    }

    async function OnSearch(text: string) {
        if (!homeCache.localSearch) {
            store.dispatch({ type: "setSearch", payload: text });
            store.dispatch({ type: "setPage", payload: 1 });
            homeStopScrolling(false);
            plugin.information.search(text, 1, store.getState().home.filterTags)
            return
        }

        if (text == "" || text == " ") {
            await setHomeData(history)
            return
        }

        let HomeData = homeCache.data;
        if (homeCache.data.length == 2 || homeCache.data.length == 0) {
            HomeData = await history()
        }
        if (homeCache.data.length == 1 && homeCache.data[0].title == t("global.history")) {
            HomeData = [{ ...homeCache.data[0], data: await ReadHistory() }]
        }
        if (homeCache.data.length == 1 && homeCache.data[0].title == t("global.continuewatch")) {
            HomeData = [{ ...homeCache.data[0], data: await ReadContinue() }]
        }

        let newData = HomeData.map((containerData) => {
            let data = containerData.data.filter(data => data.AnimeData.title.romaji.toLowerCase().includes(text.toLowerCase()));
            if (data.length == 0) return
            return { ...containerData, data: data }
        })
        setHomeData(async () => newData.filter((value) => value != undefined))
    }

    function onChange(params?: FilterParams, removeParam?: string) {
        if (removeParam) {
            const newParams: FilterParams = { ...homeCache.filterTags };
            if (newParams[removeParam] !== undefined) {
                delete newParams[removeParam];
            }
            store.dispatch({ type: "setTags", payload: newParams })
            OnSearch(homeCache.search)
            return
        }

        if (!homeCache.filterTags) store.dispatch({ type: "setTags", payload: params })
        else store.dispatch({ type: "setTags", payload: { ...homeCache.filterTags, ...params } })
        OnSearch(homeCache.search)
    }

    function CreateTagList() {
        if (!homeCache.filterTags) return
        let data: any = []
        for (const [key, type] of Object.entries(homeCache.filterTags)) {
            data.push({ remover: () => onChange(undefined, key), name: type })
        }

        return data
    }

    return (
        <main className="home" onContextMenu={(event) => OpenContextMenu(CreateContextMenuOptions(), event)}>
            <div className="home-header">
                <div className="home-header-left">
                <div className="button home-header-sidebar-placeholder"><span className="material-symbols-outlined">menu</span></div>
                    <Input placeholder={t("home.search")} InputClass="home-header-search" onKeyDown={OnSearch} />
                    <div className="home-filter-void">
                        <Button icon="tune" onClick={() => setShowFilter((prev) => !prev)}/>
                        {/* TODO: Change from mouseleave to when click mouse to exit filter menu */}
                        {showFilter && 
                            <div className="home-filter-container" onMouseLeave={() => setShowFilter(() => false)}>
                                <div className="home-filter-space">
                                    <div className="home-filter-title">{t("filter.genres")}</div>
                                    <Dropdown onClickX={() => onChange(undefined, "genres")} buttonText={homeCache.filterTags?.genres ? homeCache.filterTags.genres[0] : ""} options={plugin.information.searchOption.genres.map((element) => {return { label: element, onClick: (text) => onChange({ genres: [text] }) } })} placeholder={"Genres"} />
                                </div>
                                <div className="home-filter-space">
                                    <div className="home-filter-title">{t("filter.year")}</div>
                                    <Dropdown onClickX={() => onChange(undefined, "years")} buttonText={homeCache.filterTags?.years ? homeCache.filterTags.years : ""} options={plugin.information.searchOption.years.map((element) => {return { label: element, onClick: (text) => onChange({ years: text }) } })} placeholder={"Years"} />
                                </div>
                                <div className="home-filter-space">
                                    <div className="home-filter-title">{t("filter.season")}</div>
                                    <Dropdown onClickX={() => onChange(undefined, "seasons")} buttonText={homeCache.filterTags?.seasons ? homeCache.filterTags.seasons : ""} options={plugin.information.searchOption.seasons.map((element) => {return { label: element, onClick: (text) => onChange({ seasons: text }) } })} placeholder={"Season"} />
                                </div>
                                <div className="home-filter-space">
                                    <div className="home-filter-title">{t("filter.format")}</div>
                                    <Dropdown onClickX={() => onChange(undefined, "format")} buttonText={homeCache.filterTags?.format ? homeCache.filterTags.format[0] : ""} options={plugin.information.searchOption.format.map((element) => {return { label: element, onClick: (text) => onChange({ format: [text] }) } })} placeholder={"Format"} />
                                </div>
                                <div className="home-filter-space">
                                    <div className="home-filter-title">{t("filter.airing")}</div>
                                    <Dropdown onClickX={() => onChange(undefined, "airing")} buttonText={homeCache.filterTags?.airing ? homeCache.filterTags.airing : ""} options={plugin.information.searchOption.statuses.map((element) => {return { label: element, onClick: (text) => onChange({ airing: text }) } })} placeholder={"Aring"} />
                                </div>
                            </div>
                        }
                    </div>
                </div>
                <div></div>
                <div className="home-header-right"></div>
            </div>
            <div ref={divRef} className={`home-container ${homeCache.isLoading && "home-loading-container"} ${homeCache.isError && "home-loading-container"} ${homeCache.data.length <= 0 && "home-loading-container"}`} onScroll={handleScroll}>
                {homeCache.isLoading && homeCache.isError == false && <div className="material-symbols-outlined home-loading-animation">progress_activity</div>}
                {homeCache.isError && homeCache.isLoading == false && <div className="home-error-container"><span className="material-symbols-outlined home-error-icon">error</span>Error Occured</div>}
                {homeCache.isLoading == false && homeCache.isError == false && homeCache.data.length > 0 && homeCache.data.map((element) => <Container tags={homeCache.filterTags && homeCache.data.length == 1 ? CreateTagList() : undefined} title={element.title} data={element.data} horizontal={element.horizontal} onScrollDownFunction={element.onScrollDownFunction} onTitleClick={element.onTitleClick} />)}
                {homeCache.isError == false && homeCache.isLoading == false && homeCache.data.length <= 0 && <div className="home-empty-container"><span className="material-symbols-outlined home-empty-icon">error</span>Nothing Found Here</div>}
            </div>
            <Sidebar data={sidebarData} />
        </main>
    )
}

export default Home
