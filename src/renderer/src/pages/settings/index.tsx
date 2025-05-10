import Sidebar from "@renderer/components/sidebar";
import CheckBox from "./components/checkBox";
import SettingsInput from "./components/settingsInput";
import "./settings.css";
import { useNavigate } from "react-router-dom";
import Dropdown from "./components/dropDown";
import { useState } from "react";
import Button from "@renderer/components/buttons";
import { t } from "i18next"

function settings() {
    const navigate = useNavigate();

    const [category, setCategory] = useState<string>("general");

    const sidebarData = {
        top: [
            {
                icon: "manufacturing",
                text: t("global.general"),
                onClick: () => setCategory(() => "general"),
            },
            {
                icon: "movie",
                text: t("global.player"),
                onClick: () => setCategory(() => "player"),
            },
            {
                icon: "history",
                text: t("global.history"),
                onClick: () => setCategory(() => "history"),
            },
        ],
        bottom: [
            {
                icon: "folder",
                text: t("global.cfglocation"),
                onClick: async () =>
                    await window.api.open(await window.api.os.getPath("userData")),
            },
            {
                icon: "home",
                text: t("global.home"),
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
                            <div className="settings-page-title">{t("global.general")}</div>
                            <div className="settings-setting-container">
                                {t("settings.general.language")}
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
                                {t("settings.general.theme")}
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
                            <div className="settings-page-title">{t("settings.general.updates")}</div>
                            <div className="settings-setting-container">
                                {t("settings.general.updates")}
                                <CheckBox />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                {t("settings.general.checkupdates")}
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
                            <div className="settings-page-title">{t("settings.general.window")}</div>
                            <div className="settings-setting-container">
                                {t("settings.general.maximize")}
                                <CheckBox />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                {t("settings.general.fullscreen")}
                                <CheckBox />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                {t("settings.general.zoom")}
                                <SettingsInput iconChar="%" />
                            </div>
                        </div>
                    </>
                )}
                {category == "player" && (
                    <>
                        <div className="settings-page-container">
                            <div className="settings-page-title">{t("global.general")}</div>
                            <div className="settings-setting-container">
                                {t("settings.player.play")}
                                <CheckBox />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                {t("settings.general.fullscreen")}
                                <CheckBox />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                {t("settings.player.skip")}
                                <CheckBox />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                {t("settings.player.volume")}
                                <SettingsInput iconChar="%" />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                {t("settings.player.longskip")}
                                <SettingsInput iconChar="s" />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                {t("settings.player.longskipb")}
                                <SettingsInput iconChar="s" />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                {t("settings.player.shortskip")}
                                <SettingsInput iconChar="s" />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                {t("settings.player.shortskipb")}
                                <SettingsInput iconChar="s" />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                {t("settings.player.preload")}
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
                            <div className="settings-page-title">{t("settings.player.screenshot")}</div>
                            <div className="settings-setting-container">
                                {t("settings.player.screenask")}
                                <CheckBox />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                {t("settings.player.type")}
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
                                {t("settings.player.path")}
                                <Button content="Change Location" />
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
                            <div className="settings-page-title">{t("global.general")}</div>
                            <div className="settings-setting-container">
                                {t("settings.history.limited")}
                                <CheckBox />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                {t("settings.history.limit")}
                                <SettingsInput iconChar=" " />
                            </div>
                        </div>
                        <div className="settings-page-container">
                            <div className="settings-page-title">{t("global.continuewatch")}</div>
                            <div className="settings-setting-container">
                                {t("settings.history.startsave")}
                                <SettingsInput iconChar="s" />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                {t("settings.history.stopsave")}
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
