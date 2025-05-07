import Sidebar from "@renderer/components/sidebar"
import CheckBox from "./components/checkBox"
import SettingsInput from "./components/settingsInput"
import "./settings.css"
import { useNavigate } from "react-router-dom"

function settings() {
    const navigate = useNavigate()

    const sidebarData = {
        top: [
            {
                icon: "manufacturing",
                text: "General",
            },
            {
                icon: "movie",
                text: "Player",
            },
            {
                icon: "history",
                text: "History",
            }
        ],
        bottom: [
            {
                icon: "folder",
                text: "Config Location",
                onClick: async () => await window.api.open(await window.api.os.getPath("userData"))
            },
            {
                icon: "home",
                text: "Home",
                onClick: () => navigate("/")
            }
        ]
    }

    return (
        <main className="settings-container">
            <Sidebar data={sidebarData} sidebarClass={{ container: "settings-sidebar-container", sidebar: "settings-sidebar" }} hideButton showLogo />
            <div className="settings-content-container">
                <div className="settings-page-container">
                    <div className="settings-page-title">General</div>
                    <div className="settings-setting-container">
                        Language
                        <SettingsInput iconChar="l" />
                    </div>
                    <div className="settings-line"></div>
                    <div className="settings-setting-container">
                        Theme
                        <SettingsInput iconChar="T" />
                    </div>
                </div>
                <div className="settings-page-container">
                    <div className="settings-page-title">Updates</div>
                    <div className="settings-setting-container">
                        Updates
                        <CheckBox />
                    </div>
                </div>
                <div className="settings-page-container">
                    <div className="settings-page-title">Window</div>
                    <div className="settings-setting-container">
                        Auto Maximize
                        <CheckBox />
                    </div>
                    <div className="settings-line"></div>
                    <div className="settings-setting-container">
                        Auto Fullscreen
                        <CheckBox />
                    </div>
                    <div className="settings-line"></div>
                    <div className="settings-setting-container">
                        Zoom
                        <SettingsInput iconChar="%" />
                    </div>
                </div>
            </div>
        </main>
    )
}

export default settings