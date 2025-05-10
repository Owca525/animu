import Sidebar from "@renderer/components/sidebar";
import CheckBox from "./components/checkBox";
import SettingsInput from "./components/settingsInput";
import "./settings.css";
import { useNavigate } from "react-router-dom";
import Dropdown from "./components/dropDown";
import { useEffect, useState } from "react";
import Button from "@renderer/components/buttons";
import { t } from "i18next"
import { SettingsConfig } from "@renderer/utils/GlobalInterface";
import { useSelector } from "react-redux";
import i18n from "i18next"
import { checkPictureFolder } from "@renderer/utils/config";
import { capitalizeFirstLetter } from "@renderer/utils/functions";
import useHotkeys from "@reecelucas/react-use-hotkeys";

function settings() {
    const navigate = useNavigate();
    const cfg: SettingsConfig = useSelector((data: any) => data.config);
    const [category, setCategory] = useState<string>("general");
    const [config, setConfig] = useState<{ old: SettingsConfig, new: SettingsConfig }>({ old: structuredClone(cfg), new: structuredClone(cfg) })

    let sidebarData = {
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

    function handleChange(path: string, value: string | number | boolean) {
        setConfig((prevConfig) => {
            const keys = path.split('.')
            const newConfig = prevConfig.new

            let current: any = newConfig
            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i]

                if (!current[key]) current[key] = {}
                current = current[key]
            }

            current[keys[keys.length - 1]] = value
            console.log(newConfig)
            return { old: prevConfig.old, new: newConfig }
        })
    }

    useEffect(() => {
        // console.log(config.new)
    }, [config.new])

    async function ChangeScreenshot(path: string | any) {
        if (!path) handleChange("Player.screenShot.path", await checkPictureFolder())
        else handleChange("Player.screenShot.path", path)
    }

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
                                    options={i18n.languages.map(element => {
                                        return { label: t(`lang.${element}`), onClick: () => i18n.changeLanguage(element) }
                                    })}
                                    placeholder={t(`lang.${config.new.General.language}`)}
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
                                <CheckBox
                                    checked={config.new.update.enable}
                                    onChecked={(checked) =>
                                        handleChange('update.enable', checked)
                                    } 
                                />
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
                                <CheckBox
                                    checked={config.new.General.Window.AutoFullscreen}
                                    onChecked={(checked) =>
                                        handleChange('General.Window.AutoFullscreen', checked)
                                    }
                                />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                {t("settings.general.fullscreen")}
                                <CheckBox
                                    checked={config.new.General.Window.AutoMaximize}
                                    onChecked={(checked) =>
                                        handleChange('General.Window.AutoMaximize', checked)
                                    } 
                                />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                {t("settings.general.zoom")}
                                <SettingsInput 
                                    iconChar="%"
                                    type="number"
                                    onKeyDown={(text) => handleChange("General.Window.Zoom", parseInt(text))}
                                    startValue={config.new.General.Window.Zoom.toString()}
                                />
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
                                <CheckBox
                                    checked={config.new.Player.general.Autoplay}
                                    onChecked={(checked) =>
                                        handleChange('Player.general.Autoplay', checked)
                                    }
                                />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                {t("settings.general.fullscreen")}
                                <CheckBox
                                    checked={config.new.Player.general.AutoFullscreen}
                                    onChecked={(checked) =>
                                        handleChange('Player.general.Autoplay', checked)
                                    }
                                />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                {t("settings.player.skip")}
                                <CheckBox
                                    checked={config.new.Player.general.AutoSkipEpisode}
                                    onChecked={(checked) =>
                                        handleChange('Player.general.AutoSkipEpisode', checked)
                                    }
                                />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                {t("settings.player.volume")}
                                <SettingsInput 
                                    iconChar="%"
                                    type="number"
                                    onKeyDown={(text) => handleChange("Player.general.Volume", parseInt(text))}
                                    startValue={config.new.Player.general.Volume.toString()}
                                />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                {t("settings.player.longskip")}
                                <SettingsInput 
                                    iconChar="s"
                                    type="number"
                                    onKeyDown={(text) => handleChange("Player.general.LongTimeSkipForward", parseInt(text))}
                                    startValue={config.new.Player.general.LongTimeSkipForward.toString()}
                                />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                {t("settings.player.longskipb")}
                                <SettingsInput 
                                    iconChar="s"
                                    type="number"
                                    onKeyDown={(text) => handleChange("Player.general.LongTimeSkipBack", parseInt(text))}
                                    startValue={config.new.Player.general.LongTimeSkipBack.toString()}
                                />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                {t("settings.player.shortskip")}
                                <SettingsInput 
                                    iconChar="s"
                                    type="number"
                                    onKeyDown={(text) => handleChange("Player.general.TimeSkipRight", parseInt(text))}
                                    startValue={config.new.Player.general.TimeSkipRight.toString()}
                                />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                {t("settings.player.shortskipb")}
                                <SettingsInput 
                                    iconChar="s"
                                    type="number"
                                    onKeyDown={(text) => handleChange("Player.general.TimeSkipLeft", parseInt(text))}
                                    startValue={config.new.Player.general.TimeSkipLeft.toString()}
                                />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                {t("settings.player.preload")}
                                <Dropdown
                                    options={[
                                        { label: "Metadata", onClick: () => handleChange("Player.general.playerLoadType", "metadata") },
                                        { label: "Auto", onClick: () => handleChange("Player.general.playerLoadType", "auto") },
                                    ]}
                                    placeholder={capitalizeFirstLetter(config.new.Player.general.playerLoadType)}
                                />
                            </div>
                        </div>
                        <div className="settings-page-container">
                            <div className="settings-page-title">{t("settings.player.screenshot")}</div>
                            <div className="settings-setting-container">
                                {t("settings.player.screenask")}
                                <CheckBox
                                    checked={config.new.Player.screenShot.alwaysAsk}
                                    onChecked={(checked) =>
                                        handleChange('Player.screenShot.alwaysAsk', checked)
                                    }
                                />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                {t("settings.player.type")}
                                <Dropdown
                                    options={[
                                        { label: "File", onClick: () => handleChange("Player.screenShot.saveType", "File") },
                                        { label: "Clipboard", onClick: () => handleChange("Player.screenShot.saveType", "Clipboard") },
                                        { label: "Both", onClick: () => handleChange("Player.screenShot.saveType", "Both") },
                                    ]}
                                    placeholder={config.new.Player.screenShot.saveType}
                                />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                <div className="settings-mini-container">
                                    {t("settings.player.path")}
                                    <span className="settings-text-space">{config.new.Player.screenShot.path}</span>
                                </div>
                                <Button content="Change Location" onClick={async () => await ChangeScreenshot(await window.api.os.openDialog(undefined, undefined, ["openDirectory"]))} />
                            </div>
                        </div>
                        <div className="settings-page-container">
                            <div className="settings-page-title">Keybinds</div>
                            <div className="settings-setting-container">
                                Pause
                            </div>
                            <div className="settings-setting-container">
                                Fullscreen
                            </div>
                            <div className="settings-setting-container">
                                Exit Player
                            </div>
                            <div className="settings-setting-container">
                                Long Skip Forward
                            </div>
                            <div className="settings-setting-container">
                                Long Skip Backward
                            </div>
                            <div className="settings-setting-container">
                                Short Skip Forward
                            </div>
                            <div className="settings-setting-container">
                                Short Skip Backward
                            </div>
                            <div className="settings-setting-container">
                                Frame Skip Forward
                            </div>
                            <div className="settings-setting-container">
                                Frame Skip Backward
                            </div>
                            <div className="settings-setting-container">
                                Next Episode
                            </div>
                            <div className="settings-setting-container">
                                Previus Episode
                            </div>
                            <div className="settings-setting-container">
                                Volume Up
                            </div>
                            <div className="settings-setting-container">
                                Volume Down
                            </div>
                            <div className="settings-setting-container">
                                Volume Mute
                            </div>
                            <div className="settings-setting-container">
                                Take a screenshot
                            </div>
                        </div>
                    </>
                )}
                {category == "history" && (
                    <>
                        <div className="settings-page-container">
                            <div className="settings-page-title">{t("global.general")}</div>
                            <div className="settings-setting-container">
                                {t("settings.history.limited")}
                                <CheckBox
                                    checked={config.new.History.history.LimitedHistory}
                                    onChecked={(checked) =>
                                        handleChange('History.history.LimitedHistory', checked)
                                    }
                                />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                {t("settings.history.limit")}
                                <SettingsInput 
                                    iconChar=" "
                                    type="number"
                                    onKeyDown={(text) => handleChange("History.history.maxSave", parseInt(text))}
                                    startValue={config.new.History.history.maxSave.toString()}
                                />
                            </div>
                        </div>
                        <div className="settings-page-container">
                            <div className="settings-page-title">{t("global.continuewatch")}</div>
                            <div className="settings-setting-container">
                                {t("settings.history.startsave")}
                                <SettingsInput 
                                    iconChar="s"
                                    type="number"
                                    onKeyDown={(text) => handleChange("History.continue.MaximizeTimeSave", parseInt(text))}
                                    startValue={config.new.History.continue.MaximizeTimeSave.toString()}
                                />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                {t("settings.history.stopsave")}
                                <SettingsInput 
                                    iconChar="s"
                                    type="number"
                                    onKeyDown={(text) => handleChange("History.continue.MinimalTimeSave", parseInt(text))}
                                    startValue={config.new.History.continue.MinimalTimeSave.toString()}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}

export default settings;
