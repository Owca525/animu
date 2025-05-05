import { useNavigate } from "react-router-dom"

// Home css
import "./home.css"
import Input from "@renderer/components/input"
import Sidebar from "@renderer/components/sidebar"
import Container from "./components/container"
import { useDispatch, useSelector } from "react-redux"
import { isError, useQuery } from "react-query"
import { useEffect, useState } from "react"
import { homeData } from "@renderer/utils/GlobalInterface"
import Button from "@renderer/components/buttons"

function home() {
    const navigate = useNavigate()
    const dispatch = useDispatch();
    const plugin = useSelector((plugin: any) => plugin.plugin.informationPlugin);
    const homeCache: homeData = useSelector((cache: any) => cache.home);

    console.log(homeCache)

    const sidebarData = {
        top: [
            {
                icon: "home",
                text: "Home",
                onClick: plugin.information.home
            },
            {
                icon: "history",
                text: "History",
            }
        ],
        bottom: [
            {
                icon: "settings",
                text: "Settings",
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
                    <Input placeholder="Search..." onKeyDown={plugin.information.search} />
                </div>
                <div></div>
                <div className="home-header-right"></div>
            </div>
            <div className={homeCache.isLoading ? "home-loading-container" : "home-container"}>
                {
                    homeCache.isLoading ? <div className="material-symbols-outlined home-loading-animation">progress_activity</div> 
                    : 
                    homeCache.data.map((element) => <Container title={element.title} data={element.data} horizontal={element.horizontal} onScrollDownFunction={element.onScrollDownFunction} />)
                }
            </div>
            <Sidebar data={sidebarData}/>
        </main>
    )
}

export default home