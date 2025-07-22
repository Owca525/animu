import Sidebar from "@renderer/components/sidebar";
import CheckBox from "./components/checkBox";
import SettingsInput from "./components/settingsInput";
import "./settings.css";
import { useNavigate } from "react-router-dom";
import Dropdown from "../../components/dropDown";
import { useEffect, useState } from "react";
import Button from "@renderer/components/buttons";
import { t } from "i18next"
import { ContextMenuProps, notificationProps, SettingsConfig } from "@renderer/utils/GlobalInterface";
import { useSelector } from "react-redux";
import i18n from "i18next"
import { checkPictureFolder, saveConfig } from "@renderer/utils/config";
import { calculateZoomLevel, capitalizeFirstLetter, changeTheme, convertKeybinds } from "@renderer/utils/functions";
import CheckKeybind from "./components/checkKeybind";
import { showDialog } from "@renderer/utils/context/DialogContext";
import store from "@renderer/utils/store";
import { toast } from "react-toastify";
import SeekBar from "@renderer/components/seekBar";
import { motion } from "framer-motion";
import { useHotkeys } from "react-hotkeys-hook";
import HelpIcon from "./components/helpIcon";
import { OpenContextMenu } from "@renderer/utils/context/ContextMenu";
import { ContinueCheckConversion, ContinueDetectVersion } from "@renderer/utils/history/continueWatch";
import { HistoryCheckConvert, HistoryDetectVersion } from "@renderer/utils/history/history";

function settings() {
    const navigate = useNavigate();
    const cfg: SettingsConfig = useSelector((data: any) => data.config);
    const [category, setCategory] = useState<string>("general");
    const [config, setConfig] = useState<{ old: SettingsConfig, new: SettingsConfig }>({ old: structuredClone(cfg), new: structuredClone(cfg) })
    const [themes, setThemes] = useState<{ label: string, onClick?: () => void }[]>([])
    const [versions] = useState(window.electronAPI.process.versions)
    const [isSaving, setSaving] = useState<boolean>(false)

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

    if (config.new.Developer.DeveloperMode) {
        sidebarData.top.push({
            icon: "code",
            text: t("global.dev"),
            onClick: () => setCategory(() => "developer")
        })
    }

    useHotkeys(["ctrl+d"], () => {
        if (config.new.Developer.DeveloperMode) return
        showDialog({
            type: "info",
            title: t("settings.turnDeveloper"),
            buttons: {
                firstbutton: () => handleChange("Developer.DeveloperMode", true),
                secondbutton: () => handleChange("Developer.DeveloperMode", false)
            }
        })
    })

    let ContextMenu: ContextMenuProps = [
        { option: t("dialog.reload"), onClick: () => location.reload() },
        { option: "", line: true },
        {
            option: t("dialog.exit"), onClick: () => showDialog({
                type: "info",
                title: t("global.exitAnimu"),
                buttons: {
                    firstbutton: () => window.BrowserWindow.exit(),
                    secondbutton: () => ""
                }
            })
        }
    ]

    if (config.new.Developer.DeveloperMode) {
        ContextMenu.push({ option: t("contextMenu.devtools"), onClick: window.BrowserWindow.openDevTools })
    }

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
            return { old: prevConfig.old, new: newConfig }
        })
    }

    useEffect(() => {
        if (JSON.stringify(config.old) != JSON.stringify(config.new)) setSaving(() => true)
    }, [config])

    useEffect(() => {
        window.api.getlistThemes().then((data) => {
            let themes = data.map((element) => { return { label: element.filename.replace(".css", ""), onClick: () => { changeTheme(element.filename.replace(".css", "")); handleChange("General.theme", element.filename.replace(".css", "")) } } })
            setThemes(() => themes)
        })
        window.api.rpc.setActivity(undefined, t("discordrpc.settings"))
    }, [])

    async function ChangeScreenshot(path: string | any) {
        if (!path) handleChange("Player.screenShot.path", await checkPictureFolder())
        else handleChange("Player.screenShot.path", path)
    }

    function saveNewConfig() {
        try {
            store.dispatch({ type: "setConfig", payload: config.new })
            setConfig((prev) => {
                return { old: structuredClone(prev.new), new: structuredClone(prev.new) }
            })
            setSaving(() => false)
            saveConfig(config.new)
            toast.success(t("settings.saving.done"), notificationProps)
        } catch (error) {
            toast.success(t("settings.saving.error"), notificationProps)
        }
    }

    function resetConfig() {
        setConfig((prev) => {
            return { old: structuredClone(prev.old), new: structuredClone(prev.old) }
        })
        setSaving(() => false)
    }

    function ChangeLanguage(lang: string) {
        i18n.changeLanguage(lang)
        handleChange("General.language", lang)
    }

    function setDynamicZoom(value: number) {
        window.BrowserWindow.setZoom(calculateZoomLevel(value))
    }

    const saveCommunicateAnimation = {
        hidden: { y: 200 },
        visible: { y: 0 },
    };

    async function buttonCheck() {
        toast.info("Start Checking History", notificationProps)
        await ContinueCheckConversion()
        await HistoryCheckConvert()
        if (await HistoryDetectVersion()) {
            toast.info("History is good, nothing to change", notificationProps)
        }
        if (await ContinueDetectVersion()) {
            toast.info("Continue watch is good, nothing to change", notificationProps)
        }
    }

    return (
        <main className="settings-container" onContextMenu={(event) => OpenContextMenu(ContextMenu, event)}>
            <Sidebar
                data={sidebarData}
                sidebarClass={{
                    container: "settings-sidebar-container",
                    sidebar: "settings-sidebar",
                }}
                hideButton
                showLogo
            />
            <div className="settings-save-container">
                <motion.div variants={saveCommunicateAnimation} initial={"hidden"} animate={isSaving ? "visible" : "hidden"} transition={{ duration: 0.2 }} className="settings-save-content">
                    <div className="settings-save-title">{t("settings.saving.notification")}</div>
                    <div className="settings-save-buttons">
                        <Button content={t("dialog.yes")} onClick={saveNewConfig} />
                        <Button content={t("dialog.reset")} onClick={resetConfig} />
                    </div>
                </motion.div>
            </div>
            <div className="settings-content-container">
                {category == "general" && (
                    <>
                        <div className="settings-page-container">
                            <div className="settings-page-title">{t("global.general")}</div>
                            <div className="settings-setting-container">
                                {t("settings.general.language")}
                                <Dropdown
                                    options={Object.keys(i18n.store.data).map(element => {
                                        return { label: t(`lang.${element}`), onClick: () => ChangeLanguage(element) }
                                    })}
                                    buttonText={t(`lang.${config.new.General.language}`)}
                                    placeholderChange={() => t(`lang.${config.new.General.language}`)}
                                    disableX
                                />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                {t("settings.general.theme")}
                                <Dropdown
                                    options={themes}
                                    buttonText={config.new.General.theme}
                                    disableX
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
                                        { label: "On Start", onClick: () => handleChange("update.type", "On Start") },
                                        { label: "Every Day", onClick: () => handleChange("update.type", "Every Day") },
                                        { label: "Every Week", onClick: () => handleChange("update.type", "Every Week") },
                                    ]}
                                    disableX
                                    buttonText={config.new.update.type}
                                />
                            </div>
                        </div>
                        <div className="settings-page-container">
                            <div className="settings-page-title">{t("settings.general.window")}</div>
                            <div className="settings-setting-container">
                                <span className="settings-helpicon-space">{t("settings.general.maximize")}<HelpIcon description={t("settings.tips.automaximize")} /></span>
                                <CheckBox
                                    checked={config.new.General.Window.AutoMaximize}
                                    onChecked={(checked) =>
                                        handleChange('General.Window.AutoMaximize', checked)
                                    }
                                />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                <span className="settings-helpicon-space">{t("settings.general.fullscreen")}<HelpIcon description={t("settings.tips.autofullscreen")} /></span>
                                <CheckBox
                                    checked={config.new.General.Window.AutoFullscreen}
                                    onChecked={(checked) =>
                                        handleChange('General.Window.AutoFullscreen', checked)
                                    }
                                />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                {t("settings.general.zoom")}
                                <div className="settings-setting-seekbar-container">
                                    <span>50%</span>
                                    <SeekBar maxValue={200} minValue={50} type="procent" currentValue={config.new.General.Window.Zoom} onSeek={(value) => { handleChange("General.Window.Zoom", parseInt(value.toFixed(0))); setDynamicZoom(parseInt(value.toFixed(0))) }} />
                                    <span>200%</span>
                                </div>
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
                                <span className="settings-helpicon-space">{t("settings.general.fullscreen")}<HelpIcon description={t("settings.tips.autofullscreenplayer")} /></span>
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
                                <span className="settings-helpicon-space">{t("settings.player.longskip")}<HelpIcon description={t("settings.tips.longskip")} /></span>
                                <SettingsInput
                                    iconChar="s"
                                    type="number"
                                    onKeyDown={(text) => handleChange("Player.general.LongTimeSkipForward", parseInt(text))}
                                    startValue={config.new.Player.general.LongTimeSkipForward.toString()}
                                />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                <span className="settings-helpicon-space">{t("settings.player.longskipb")}<HelpIcon description={t("settings.tips.longskip")} /></span>
                                <SettingsInput
                                    iconChar="s"
                                    type="number"
                                    onKeyDown={(text) => handleChange("Player.general.LongTimeSkipBack", parseInt(text))}
                                    startValue={config.new.Player.general.LongTimeSkipBack.toString()}
                                />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                <span className="settings-helpicon-space">{t("settings.player.shortskip")}<HelpIcon description={t("settings.tips.shotskip")} /></span>
                                <SettingsInput
                                    iconChar="s"
                                    type="number"
                                    onKeyDown={(text) => handleChange("Player.general.TimeSkipRight", parseInt(text))}
                                    startValue={config.new.Player.general.TimeSkipRight.toString()}
                                />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                <span className="settings-helpicon-space">{t("settings.player.shortskipb")}<HelpIcon description={t("settings.tips.shotskip")} /></span>
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
                                    buttonText={capitalizeFirstLetter(config.new.Player.general.playerLoadType)}
                                    disableX
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
                                    buttonText={config.new.Player.screenShot.saveType}
                                    disableX
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
                            <div className="settings-page-title">{t("settings.player.keybind")}</div>
                            <div className="settings-setting-container">
                                {t("settings.player.keybinds.pause")}
                                <CheckKeybind content={convertKeybinds(config.new.Player.keybinds.Pause)} keyBind={(keys) => handleChange("Player.keybinds.Pause", keys)} />
                            </div>
                            <div className="settings-setting-container">
                                {t("settings.player.keybinds.fullscreen")}
                                <CheckKeybind content={convertKeybinds(config.new.Player.keybinds.Fullscreen)} keyBind={(keys) => handleChange("Player.keybinds.Fullscreen", keys)} />
                            </div>
                            <div className="settings-setting-container">
                                {t("settings.player.keybinds.exitplayer")}
                                <CheckKeybind content={convertKeybinds(config.new.Player.keybinds.ExitPlayer)} keyBind={(keys) => handleChange("Player.keybinds.ExitPlayer", keys)} />
                            </div>
                            <div className="settings-setting-container">
                                {t("settings.player.keybinds.lskipforward")}
                                <CheckKeybind content={convertKeybinds(config.new.Player.keybinds.LongTimeSkipForward)} keyBind={(keys) => handleChange("Player.keybinds.LongTimeSkipForward", keys)} />
                            </div>
                            <div className="settings-setting-container">
                                {t("settings.player.keybinds.lskipbackward")}
                                <CheckKeybind content={convertKeybinds(config.new.Player.keybinds.LongTimeSkipBack)} keyBind={(keys) => handleChange("Player.keybinds.LongTimeSkipBack", keys)} />
                            </div>
                            <div className="settings-setting-container">
                                {t("settings.player.keybinds.skipforward")}
                                <CheckKeybind content={convertKeybinds(config.new.Player.keybinds.TimeSkipRight)} keyBind={(keys) => handleChange("Player.keybinds.TimeSkipRight", keys)} />
                            </div>
                            <div className="settings-setting-container">
                                {t("settings.player.keybinds.skipbackward")}
                                <CheckKeybind content={convertKeybinds(config.new.Player.keybinds.TimeSkipLeft)} keyBind={(keys) => handleChange("Player.keybinds.TimeSkipLeft", keys)} />
                            </div>
                            <div className="settings-setting-container">
                                {t("settings.player.keybinds.fskipforward")}
                                <CheckKeybind content={convertKeybinds(config.new.Player.keybinds.FrameSkipForward)} keyBind={(keys) => handleChange("Player.keybinds.FrameSkipForward", keys)} />
                            </div>
                            <div className="settings-setting-container">
                                {t("settings.player.keybinds.fskipbackward")}
                                <CheckKeybind content={convertKeybinds(config.new.Player.keybinds.FrameSkipForward)} keyBind={(keys) => handleChange("Player.keybinds.FrameSkipForward", keys)} />
                            </div>
                            <div className="settings-setting-container">
                                {t("settings.player.keybinds.nextepisode")}
                                <CheckKeybind content={convertKeybinds(config.new.Player.keybinds.NextEpisode)} keyBind={(keys) => handleChange("Player.keybinds.NextEpisode", keys)} />
                            </div>
                            <div className="settings-setting-container">
                                {t("settings.player.keybinds.prevepisode")}
                                <CheckKeybind content={convertKeybinds(config.new.Player.keybinds.PrevEpisode)} keyBind={(keys) => handleChange("Player.keybinds.PrevEpisode", keys)} />
                            </div>
                            <div className="settings-setting-container">
                                {t("settings.player.keybinds.volumeup")}
                                <CheckKeybind content={convertKeybinds(config.new.Player.keybinds.VolumeUp)} keyBind={(keys) => handleChange("Player.keybinds.VolumeUp", keys)} />
                            </div>
                            <div className="settings-setting-container">
                                {t("settings.player.keybinds.volumedown")}
                                <CheckKeybind content={convertKeybinds(config.new.Player.keybinds.VolumeDown)} keyBind={(keys) => handleChange("Player.keybinds.VolumeDown", keys)} />
                            </div>
                            <div className="settings-setting-container">
                                {t("settings.player.keybinds.volumemute")}
                                <CheckKeybind content={convertKeybinds(config.new.Player.keybinds.VolumeMute)} keyBind={(keys) => handleChange("Player.keybinds.VolumeMute", keys)} />
                            </div>
                            <div className="settings-setting-container">
                                {t("settings.player.keybinds.screenshot")}
                                <CheckKeybind content={convertKeybinds(config.new.Player.keybinds.ScreenShot)} keyBind={(keys) => handleChange("Player.keybinds.ScreenShot", keys)} />
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
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                {t("settings.history.check_history")}
                                <Button content="Check" onClick={buttonCheck}/>
                            </div>
                        </div>
                        <div className="settings-page-container">
                            <div className="settings-page-title">{t("global.continuewatch")}</div>
                            <div className="settings-setting-container">
                                <span className="settings-helpicon-space">{t("settings.history.startsave")}<HelpIcon description={t("settings.tips.continuewatchsavehistory")} /></span>
                                <SettingsInput
                                    iconChar="s"
                                    type="number"
                                    onKeyDown={(text) => handleChange("History.continue.MinimalTimeSave", parseInt(text))}
                                    startValue={config.new.History.continue.MinimalTimeSave.toString()}
                                />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                <span className="settings-helpicon-space">{t("settings.history.stopsave")}<HelpIcon description={t("settings.tips.continuewatchsavehistory")} /></span>
                                <SettingsInput
                                    iconChar="s"
                                    type="number"
                                    onKeyDown={(text) => handleChange("History.continue.MaximizeTimeSave", parseInt(text))}
                                    startValue={config.new.History.continue.MaximizeTimeSave.toString()}
                                />
                            </div>
                        </div>
                    </>
                )}
                {category == "developer" && (
                    <>
                        <div className="settings-page-container">
                            <div className="settings-page-title">{"DevTools"}</div>
                            <div className="settings-setting-container">
                                {"Developer Mode"}
                                <CheckBox
                                    checked={config.new.Developer.DeveloperMode}
                                    onChecked={(checked) =>
                                        handleChange('Developer.DeveloperMode', checked)
                                    }
                                />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                {"Turn on DevTools"}
                                <CheckBox
                                    checked={config.new.Developer.DevTools}
                                    onChecked={(checked) =>
                                        handleChange('Developer.DevTools', checked)
                                    }
                                />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                {"DevTools On Start"}
                                <CheckBox
                                    checked={config.new.Developer.DevToolsOnStart}
                                    onChecked={(checked) =>
                                        handleChange('Developer.DevToolsOnStart', checked)
                                    }
                                />
                            </div>
                            <div className="settings-line"></div>
                            <div className="settings-setting-container">
                                {"PlayerDebug Stats"}
                                <CheckBox
                                    checked={config.new.Developer.playerDebug}
                                    onChecked={(checked) =>
                                        handleChange('Developer.playerDebug', checked)
                                    }
                                />
                            </div>
                        </div>
                        <div className="settings-page-container">
                            <div className="settings-page-title">{"Information"}</div>
                            <div className="settings-setting-container">
                                <span>Electron Version</span>
                                <span>{versions.electron}</span>
                            </div>
                            <div className="settings-setting-container">
                                <span>Chromium Version</span>
                                <span>{versions.chrome}</span>
                            </div>
                            <div className="settings-setting-container">
                                <span>Node Version</span>
                                <span>{versions.node}</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}

export default settings;
