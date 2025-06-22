import { useNavigate } from "react-router-dom"

// Home css
import "./home.css"
import Input from "@renderer/components/input"
import Sidebar from "@renderer/components/sidebar"
import Container from "./components/container"
import { useSelector } from "react-redux"
import { useEffect, useRef } from "react"
import { containerData, homeData } from "@renderer/utils/GlobalInterface"
import { t } from "i18next"
import store from "@renderer/utils/store"
import { homeStopScrolling, setHomeData, setHomeLocalSearch } from "@renderer/utils/pluginApi"
import { ReadContinue } from "@renderer/utils/history/continueWatch"
import { ReadHistory } from "@renderer/utils/history/history"

const Home = () => {
    const navigate = useNavigate()
    const plugin = useSelector((plugin: any) => plugin.plugin.informationPlugin);
    const homeCache: homeData = useSelector((cache: any) => cache.home);
    const pluginPlayer = useSelector((plugin: any) => plugin.plugin.playerPlugin);

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
        console.log(scrollHeight > clientHeight)
        if (scrollHeight > clientHeight == false) {
            handleScroll()
        }
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
        if (isFUCKINGBottom && homeCache.stopScrolling == false && homeCache.data.length === 1) {
            console.log(homeCache.data[0])
            if (homeCache.data[0].onScrollDownFunction) {
                store.dispatch({ type: "setPage", payload: homeCache.page + 1 })
                homeCache.data[0].onScrollDownFunction(homeCache.page + 1)
            }
            return
        }
        if (isFUCKINGBottom && !homeCache.stopScrolling) {
            store.dispatch({ type: "setPage", payload: homeCache.page + 1 })
            plugin.information.search(homeCache.search, homeCache.page + 1)
        }
    }

    async function OnSearch(text: string) {
        if (!homeCache.localSearch) {
            store.dispatch({ type: "setSearch", payload: text });
            store.dispatch({ type: "setPage", payload: 1 });
            homeStopScrolling(false);
            plugin.information.search(text, 1)
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
            let data = containerData.data.filter(data => data.AnimeData.title.toLowerCase().includes(text.toLowerCase()));
            if (data.length == 0) return
            return { ...containerData, data: data }
        })
        setHomeData(async () => newData.filter((value) => value != undefined))
    }

    return (
        <main className="home">
            <div className="home-header">
                <div className="home-header-left">
                    <Input placeholder={t("home.search")} onKeyDown={OnSearch} />
                </div>
                <div></div>
                <div className="home-header-right"></div>
            </div>
            <div ref={divRef} className={homeCache.isLoading ? "home-loading-container" : "home-container"} onScroll={handleScroll}>
                {
                    homeCache.isLoading ? <div className="material-symbols-outlined home-loading-animation">progress_activity</div>
                        :
                        homeCache.data.map((element) => <Container title={element.title} data={element.data} horizontal={element.horizontal} onScrollDownFunction={element.onScrollDownFunction} onTitleClick={element.onTitleClick} />)
                }
            </div>
            <Sidebar data={sidebarData} />
        </main>
    )
}

export default Home
