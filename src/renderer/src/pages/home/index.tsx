import { useNavigate } from "react-router-dom"

// Home css
import "./home.css"
import Input from "@renderer/components/input"
import Sidebar from "@renderer/components/sidebar"
import Container from "./components/container"
import { useSelector } from "react-redux"
import { useEffect } from "react"
import { containerData, homeData } from "@renderer/utils/GlobalInterface"
import { t } from "i18next"
import store from "@renderer/utils/store"
import { homeStopScrolling, setHomeData } from "@renderer/utils/pluginApi"
import { ReadContinue } from "@renderer/utils/history/continueWatch"
import { ReadHistory } from "@renderer/utils/history/history"

const Home = () => {
    const navigate = useNavigate()
    const plugin = useSelector((plugin: any) => plugin.plugin.informationPlugin);
    const homeCache: homeData = useSelector((cache: any) => cache.home);

    const sidebarData = {
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

    useEffect(() => {
        if (homeCache.data.length == 0) plugin.information.home()
        window.api.rpc.setActivity(undefined, t("discordrpc.home"))
    }, [])

    async function history(): Promise<containerData[]> {
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
        const currentPos = -document.getElementById("scrollID")!.scrollTop + document.getElementById("scrollID")!.scrollHeight
        const endPosition = document.getElementById("scrollID")!.offsetHeight
        const isFUCKINGBottom = parseInt(currentPos.toFixed(0)) <= endPosition+30
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

    return (
        <main className="home">
            <div className="home-header">
                <div className="home-header-left">
                    <Input placeholder={t("home.search")} onKeyDown={(text) => { store.dispatch({ type: "setSearch", payload: text }); store.dispatch({ type: "setPage", payload: 1 }); homeStopScrolling(false); plugin.information.search(text, 1) }} />
                </div>
                <div></div>
                <div className="home-header-right"></div>
            </div>
            <div id={"scrollID"} className={homeCache.isLoading ? "home-loading-container" : "home-container"} onScroll={handleScroll}>
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
