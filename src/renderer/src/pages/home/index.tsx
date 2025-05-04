import { useNavigate } from "react-router-dom"

// Home css
import "./home.css"
import Button from "@renderer/components/buttons"
import Input from "@renderer/components/input"
import Sidebar from "@renderer/components/sidebar"
import Container from "./components/container"
import { useSelector } from "react-redux"
import { useQuery } from "react-query"
import { useState } from "react"

function home() {
    const navigate = useNavigate()
    const plugin = useSelector((plugin: any) => plugin.plugin.informationPlugin);
    const [ func, setfunc ] = useState<() => Promise<any>>(() => plugin.information.home)
    const { data, error, isLoading, refetch } = useQuery(
        [func.toString()],
        func,
        {
            refetchOnWindowFocus: false,
            cacheTime: 0,
        }
    );

    const sidebarData = {
        top: [
            {
                icon: "home",
                text: "Home",
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
            }
        ]
    }
    
    return (
        <main className="home">
            <div className="home-header">
                <div className="home-header-left">
                    <Input placeholder="Search..." onKeyDown={(text) => setfunc(() => () => plugin.information.search(text))} />
                </div>
                <div></div>
                <div className="home-header-right">
                    <Button onClick={() => navigate("/info")} content="test information"/>
                </div>
            </div>
            <div className={isLoading ? "home-loading-container" : "home-container"}>
                {
                    isLoading ? <div className="material-symbols-outlined home-loading-animation">progress_activity</div> 
                    : 
                    data.map((element) => <Container title={element.title} data={element.data} horizontal={element.horizontal} onScrollDownFunction={element.onScrollDownFunction} />)
                }
            </div>
            <Sidebar data={sidebarData}/>
        </main>
    )
}

export default home