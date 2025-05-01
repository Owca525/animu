import { useNavigate } from "react-router-dom"

// Home css
import "./home.css"
import Button from "@renderer/components/buttons"
import Input from "@renderer/components/input"
import Sidebar from "@renderer/components/sidebar"
import Container from "./components/container"

function home() {
    const navigate = useNavigate()

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
                    <Input placeholder="Search..." />
                </div>
                <div></div>
                <div className="home-header-right">
                    <Button onClick={() => navigate("/info")} content="test information"/>
                </div>
            </div>
            <div className="home-container">
                <Container title="Test" data={[]}/>
            </div>
            <Sidebar data={sidebarData}/>
        </main>
    )
}

export default home