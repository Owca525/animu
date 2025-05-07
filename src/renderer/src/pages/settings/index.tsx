import Sidebar from "@renderer/components/sidebar";
import CheckBox from "./components/checkBox";
import SettingsInput from "./components/settingsInput";
import "./settings.css";
import { useNavigate } from "react-router-dom";
import Dropdown from "./components/dropDown";
import { useState } from "react";
import Button from "@renderer/components/buttons";

function settings() {
    const navigate = useNavigate();

    const [category, setCategory] = useState<string>("general");

    const sidebarData = {
        top: [
            {
                icon: "manufacturing",
                text: "General",
                onClick: () => setCategory(() => "general"),
            },
            {
                icon: "movie",
                text: "Player",
                onClick: () => setCategory(() => "player"),
            },
            {
                icon: "history",
                text: "History",
                onClick: () => setCategory(() => "history"),
            },
        ],
        bottom: [
            {
                icon: "folder",
                text: "Config Location",
                onClick: async () =>
                    await window.api.open(await window.api.os.getPath("userData")),
            },
            {
                icon: "home",
                text: "Home",
                onClick: () => navigate("/"),
            },
        ],
    };

    return (
        <main className="settings-container">
            <Sidebar
                data={sidebarData}
                sidebarClass={{
                    container: "settings-sidebar-container",
                    sidebar: "settings-sidebar",
                }}
                hideButton
                showLogo
            />
            <div className="settings-content-container">
                {category == "general" && (
                    <>
                        <div className="settings-page-container">
                            <div className="settings-page-title">General</div>
                            <div className="settings-setting-container">
                                Language
                                <Dropdown
                                    options={[
                                        { label: "English" },
                                        { label: "Polish" },
                                        { label: "Hungarian" },
                                    ]}
                                    placeholder="English"
                                />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                Theme
                                <Dropdown
                                    options={[
                                        { label: "DarkAnimu" },
                                        { label: "WhiteAnimu" },
                                        { label: "GruvBox" },
                                    ]}
                                    placeholder="DarkAnimu"
                                />
                            </div>
                        </div>
                        <div className="settings-page-container">
                            <div className="settings-page-title">Updates</div>
                            <div className="settings-setting-container">
                                Updates
                                <CheckBox />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                Check Updates
                                <Dropdown
                                    options={[
                                        { label: "On Start" },
                                        { label: "Every Day" },
                                        { label: "Every Week" },
                                    ]}
                                    placeholder="On Start"
                                />
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
                    </>
                )}
                {category == "player" && (
                    <>
                        <div className="settings-page-container">
                            <div className="settings-page-title">General</div>
                            <div className="settings-setting-container">
                                Auto Play
                                <CheckBox />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                Auto Fullscreen
                                <CheckBox />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                Auto Skip Episodes
                                <CheckBox />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                Default Volume
                                <SettingsInput iconChar="%" />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                Long Skip Forward
                                <SettingsInput iconChar="s" />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                Long Skip Backward
                                <SettingsInput iconChar="s" />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                Short Skip Forward
                                <SettingsInput iconChar="s" />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                Short Skip Backward
                                <SettingsInput iconChar="s" />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                Player Preloard Type
                                <Dropdown
                                    options={[
                                        { label: "Metadata" },
                                        { label: "Auto" },
                                    ]}
                                    placeholder="Metadata"
                                />
                            </div>
                        </div>
                        <div className="settings-page-container">
                            <div className="settings-page-title">ScreenShots</div>
                            <div className="settings-setting-container">
                                Always ask Where Save Screemshot
                                <CheckBox />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                Save type
                                <Dropdown
                                    options={[
                                        { label: "File" },
                                        { label: "Clipboard" },
                                        { label: "Both" },
                                    ]}
                                    placeholder="File"
                                />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                ScreenShot Save path
                                <Button content="Change Location"/>
                            </div>
                        </div>
                        <div className="settings-page-container">
                            <div className="settings-page-title">Keybinds</div>
                        </div>
                    </>
                )}
                {category == "history" && (
                    <>
                        <div className="settings-page-container">
                            <div className="settings-page-title">General</div>
                            <div className="settings-setting-container">
                                Limited Save History
                                <CheckBox />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                Limit for history
                                <SettingsInput iconChar=" " />
                            </div>
                        </div>
                        <div className="settings-page-container">
                            <div className="settings-page-title">Continue Watch</div>
                            <div className="settings-setting-container">
                                When Start Save History
                                <SettingsInput iconChar="s" />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                When Stop Save History
                                <SettingsInput iconChar="s" />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}

export default settings;
