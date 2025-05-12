import { useNavigate } from "react-router-dom"

// Home css
import "./home.css"
import Input from "@renderer/components/input"
import Sidebar from "@renderer/components/sidebar"
import Container from "./components/container"
import { useSelector } from "react-redux"
import { useEffect } from "react"
import { homeData } from "@renderer/utils/GlobalInterface"
import { t } from "i18next"

function home() {
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
        if (homeCache.data.length == 0) {
            plugin.information.home()
        }
    }, [])
    
    return (
        <main className="home">
            <div className="home-header">
                <div className="home-header-left">
                    <Input placeholder={t("home.search")} onKeyDown={plugin.information.search} />
                </div>
                <div></div>
                <div className="home-header-right"></div>
            </div>
            <div className={homeCache.isLoading ? "home-loading-container" : "home-container"}>
                {
                    homeCache.isLoading ? <div className="material-symbols-outlined home-loading-animation">progress_activity</div> 
                    : 
                    homeCache.data.map((element) => <Container title={element.title} data={element.data} horizontal={element.horizontal} onScrollDownFunction={element.onScrollDownFunction} onTitleClick={element.onTitleClick} />)
                }
            </div>
            <Sidebar data={sidebarData}/>
        </main>
    )
}

export default home