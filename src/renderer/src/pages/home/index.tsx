import { useNavigate } from "react-router-dom"

// Home css
import "./home.css"
import Button from "@renderer/components/buttons"
import Input from "@renderer/components/input"

function home() {
    const navigate = useNavigate()
    
    return (
        <main className="home">
            <div className="home-header">
                <div className="home-header-left">
                    <Button icon="menu" />
                    <Input placeholder="Search..." />
                </div>
                <div></div>
                <div className="home-header-right">
                    <Button onClick={() => navigate("/info")} content="test information"/>
                </div>
            </div>
            <div className="home-container">

            </div>
        </main>
    )
}

export default home