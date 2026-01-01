import Button from '@renderer/components/buttons';
import ButtonGroup from './components/buttonGroup';
import CheckBox from '../../components/checkBox';
import CheckKeybind from './components/checkKeybind';
import Dropdown from '../../components/dropDown';
import HelpIcon from './components/helpIcon';
import SeekBar from '@renderer/components/seekBar';
import SettingsDrop from './components/settingsDrop';
import SettingsInput from './components/settingsInput';
import Sidebar from '@renderer/components/sidebar';
import {
    calculateZoomLevel,
    changeTheme,
    changeTitleAnimu,
    convertKeybinds,
    convertPath,
    openUrlFolder,
    request,
    updateObjectConfig
    } from '@renderer/utils/functions';
import { checkUpdate } from '@renderer/utils/update';
import {
    ContextMenuProps,
    playerPluginFormat,
    SettingsConfig,
    themeMetadata
    } from '@renderer/utils/types';
import { CreateBackup, RestoreBackup } from '@renderer/utils/backup';
import {
    createEffect,
    createSignal,
    For,
    onCleanup,
    onMount,
    Show
    } from 'solid-js';
import { createShortcut } from '@solid-primitives/keyboard';
import { DetectOldVersionHistory } from '@renderer/utils/FilesManager/history';
import { getConfig, setConfig } from '@renderer/utils/stores/config';
import { getPluginList, pluginManager } from '@renderer/utils/stores/plugins';
import { OpenContextMenu } from '@renderer/utils/context/ContextMenu';
import { saveConfig } from '@renderer/utils/FilesManager/config';
import { showDialog } from '@renderer/utils/context/DialogContext';
import { toast } from '@renderer/utils/context/ToastNotification';
import { unwrap } from 'solid-js/store';
import { useNavigate } from '@solidjs/router';
import './settings.css';
import { useI18n } from '@renderer/utils/i18n';

function settings() {
    const navigate = useNavigate();
    const cfg: SettingsConfig = unwrap(getConfig());
    const pluginList: playerPluginFormat[] = getPluginList();
    const { t, changeLanguage, listLang } = useI18n()

    const [category, setCategory] = createSignal<string>("general");
    const [config, setNewConfig] = createSignal<{ old: SettingsConfig, new: SettingsConfig }>({ old: structuredClone(cfg), new: structuredClone(cfg) })
    const [themes, setThemes] = createSignal<{ label: string, onClick?: () => void }[]>([])
    const [versions] = createSignal(window.electronAPI.process.versions)
    const [isSaving, setSaving] = createSignal<boolean>(false)
    const [themeMetadata, setthemeMetadata] = createSignal<themeMetadata | undefined>(undefined)
    const [backupList, setBackupList] = createSignal<{ date: Date, file: string }[]>([])
    const [ContextMenu, setContextMenu] = createSignal<ContextMenuProps>([
        { option: "dialog.reload", onClick: () => location.reload() },
        { option: "", line: true },
        {
            option: "dialog.exit", onClick: () => showDialog({
                type: "info",
                title: "Action",
                description: t("global.exitAnimu"),
                buttons: [
                    {
                        title: t("dialog.yes"),
                        onClick: () => window.api ? window.BrowserWindow.exit() : ""
                    },
                    {
                        title: t("dialog.no"),
                        onClick: () => ""
                    },
                ]
            })
        }
    ])

    const [sidebarData, setSidebarData] = createSignal({
        top: [
            {
                icon: "manufacturing",
                text: "global.general",
                onClick: () => setCategory("general"),
            },
            {
                icon: "movie",
                text: "global.player",
                onClick: () => setCategory("player"),
            },
            {
                icon: "extension",
                text: "global.extensions",
                onClick: () => setCategory("extensions"),
            },
            {
                icon: "file_copy",
                text: "Files",
                onClick: () => setCategory("files"),
            },
            {
                icon: "info",
                text: "global.about",
                onClick: () => setCategory("about"),
            },
        ],
        bottom: [
            {
                icon: "home",
                text: "global.home",
                onClick: () => { navigate("/"); resetNewConfig() },
            },
        ],
    });

    if (window.api) {
        setSidebarData((prev) => {
            return {
                ...prev,
                bottom: [
                    ...prev.bottom,
                    {
                        icon: "folder",
                        text: "global.cfglocation",
                        onClick: async () =>
                            await window.api.open(await window.api.os.getConfigPath()),
                    }
                ].reverse()
            }
        })
    }

    createShortcut(["Control", "d"], () => {
        if (config().new.Developer.DeveloperMode) return
        showDialog({
            type: "info",
            title: "Action",
            description: t("settings.turnDeveloper"),
            buttons: [
                {
                    title: t("dialog.yes"),
                    onClick: () => {handleChange("Developer.DeveloperMode", true);turnOnDeveloperMode()}
                },
                {
                    title: t("dialog.no"),
                    onClick: () => handleChange("Developer.DeveloperMode", false)
                }
            ]
        })
    })

    createShortcut(["Escape"], () => {
        navigate("/");
    })

    function handleChange(path: string, value: string | number | boolean) {
        setNewConfig((prevConfig) => {
            return { old: prevConfig.old, new: updateObjectConfig(path, value, unwrap(prevConfig.new)) }
        })
    }

    createEffect(() => {
        if (JSON.stringify(config().old) != JSON.stringify(config().new)) setSaving(() => true)
    })

    onMount(async () => {
        changeTitleAnimu(`Animu - ${t("global.settings")}`)
        if (!window.api) return
        setBackupList(await window.api.backup.list())
        window.api.getlistThemes().then((data) => {
            let themes = data.map((element) => { return { label: element.themeName, onClick: () => { changeTheme(element.themeName); handleChange("General.theme", element.themeName); setthemeMetadata(() => element) } } })
            setThemes(() => themes)
            data.forEach(element => {
                if (element.themeName == config().new.General.theme) setthemeMetadata(() => element)
            });
        })
        if (config().new.General.discordRPC) window.api.rpc.setActivity(undefined, t("discordrpc.settings"))
        turnOnDeveloperMode()
    });

    onCleanup(() => {
        resetNewConfig()
    })

    async function ChangeScreenshot(path: string | any) {
        if (!path) return
        handleChange("Player.screenShot.path", path)
    }
    function turnOnDeveloperMode() {
        if (config().new.Developer.DeveloperMode && window.api) {
            setContextMenu((prev) => [prev[0], prev[1], { option: "contextMenu.devtools", onClick: window.BrowserWindow.openDevTools }, prev[2]])
        }
        if (config().new.Developer.DeveloperMode) {
            setSidebarData((prev) => ({
                ...prev,
                top: [
                    ...prev.top,
                    {
                        icon: "code",
                        text: "global.dev",
                        onClick: () => setCategory("developer" as any)
                    }
                ]
            }))
        }
    }

    function saveNewConfig() {
        try {
            setConfig(config().new)
            setNewConfig((prev) => {
                return { old: structuredClone(prev.new), new: structuredClone(prev.new) }
            })
            setSaving(() => false)
            saveConfig(config().new)
            setDynamicZoom(config().new.General.Window.Zoom)
            pluginManager().initialPlugins()
            toast(t("settings.saving.done"), { type: "success" })
        } catch (error) {
            toast(t("settings.saving.error"), { type: "success" })
        }
    }

    function resetNewConfig() {
        setNewConfig((prev) => {
            setNewLang(config().old.General.language)
            changeTheme(config().old.General.theme)
            return { old: structuredClone(prev.old), new: structuredClone(prev.old) }
        })
        pluginManager().initialPlugins()
        setSaving(() => false)
    }

    function setNewLang(lang: string) {
        changeLanguage(lang)
        handleChange("General.language", lang)
    }

    function setDynamicZoom(value: number) {
        if (!window.api) return
        window.BrowserWindow.setZoom(calculateZoomLevel(value))
    }

    async function buttonCheck() {
        toast(t("settings.history.check_start"))
        await DetectOldVersionHistory()
    }

    async function discord_server() {
        let data = await request("https://raw.githubusercontent.com/Owca525/animu/refs/heads/unstable/assets/discord.txt")
        if (!data.success) return
        openUrlFolder(data.text)
    }

    function backupWarning(file: string, date: string) {
        showDialog({
            type: "info",
            title: "Action",
            description: `Do you want restore backup from ${date}?`,
            buttons: [{
                title: "No",
                onClick: () => ""
            },
            {
                title: "Yes",
                onClick: async () => {RestoreBackup(file);setBackupList(await window.api.backup.list())},
            }
            ]
        })
    }

    return (
        <main class="settings-container" onContextMenu={(event) => OpenContextMenu(ContextMenu(), event)}>
            <Sidebar
                data={sidebarData() as any}
                showLogo
                activeElement
            />
            <div class="settings-shadow-sidebar"></div>
            <Show when={isSaving()}>
                <div class="settings-save-content">
                    <div class="settings-save-title">{t("settings.saving.notification")}</div>
                    <div class="settings-save-buttons">
                        <Button content={t("dialog.yes")} onClick={saveNewConfig} />
                        <Button content={t("dialog.reset")} onClick={resetNewConfig} />
                    </div>
                </div>
            </Show>
            <div class="settings-content-container">
                <Show when={category() == "general"}>
                    <div class="settings-page-container">
                        <div class="settings-page-title">{t("global.general")}</div>
                        {/* <div class="settings-setting-container">
                                {t("settings.general.hideSidebar")}
                                <CheckBox
                                    checked={config.new.General.HideSidebar}
                                    onChecked={(checked) =>
                                        handleChange('General.HideSidebar', checked)
                                    }
                                />
                            </div>
                            <div class="settings-line"></div>
                            <div class="settings-setting-container">
                                {t("settings.general.hoverSidebar")}
                                <CheckBox
                                    checked={config.new.General.HoverSidebar}
                                    onChecked={(checked) =>
                                        handleChange('General.HoverSidebar', checked)
                                    }
                                />
                            </div> */}
                        <div class="settings-setting-container">
                            {t("settings.general.language")}
                            <div class="settings-helpicon-space">
                                <Dropdown
                                    options={listLang().map(element => {
                                        return { label: t(`lang.${element}`), onClick: () => setNewLang(element) }
                                    })}
                                    buttonText={t(`lang.${config().new.General.language}`)}
                                    placeholderChange={() => t(`lang.${config().new.General.language}`)}
                                    disableX
                                />
                                <Show when={window.api}>
                                    <Button icon="folder" onClick={async () => window.api.open(await convertPath(`${await window.api.os.getConfigPath()}/lang`))} />
                                </Show>
                            </div>
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            {t("settings.general.theme")}
                            <div class="settings-helpicon-space">
                                {themeMetadata() && themeMetadata()?.author && <div class="settings-text-space">{themeMetadata()?.author}</div>}
                                {themeMetadata() && themeMetadata()?.version && <div class="settings-text-space">{themeMetadata()?.version}</div>}
                                <Dropdown
                                    options={themes()}
                                    buttonText={config().new.General.theme}
                                    disableX
                                />
                                <Show when={window.api}>
                                    <Button icon="folder" onClick={async () => window.api.open(await convertPath(`${await window.api.os.getConfigPath()}/themes`))} />
                                </Show>
                            </div>
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            {t("settings.general.discordrpc")}
                            <CheckBox
                                checked={config().new.General.discordRPC}
                                onChecked={(checked) =>
                                    handleChange('General.discordRPC', checked)
                                }
                            />
                        </div>
                    </div>
                    <div class="settings-page-container">
                        <div class="settings-page-title">{t("settings.general.updates")}</div>
                        <div class="settings-setting-container">
                            {t("settings.general.checkupdate")}
                            <Button content={t("settings.general.checkupdates")} icon="update" onClick={() => checkUpdate(true)} />
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            {t("settings.general.updates")}
                            <CheckBox
                                checked={config().new.update.enable}
                                onChecked={(checked) =>
                                    handleChange('update.enable', checked)
                                }
                            />
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            {t("settings.general.checkupdates")}
                            <ButtonGroup selectedValue={t(`settings.general.${config().new.update.type.toLowerCase().replaceAll(" ", "")}`)} listValues={[
                                { value: t("settings.general.onstart"), onClick: () => handleChange("update.type", "On Start") },
                                { value: t("settings.general.everyday"), onClick: () => handleChange("update.type", "Every Day") },
                                { value: t("settings.general.everyweek"), onClick: () => handleChange("update.type", "Every Week") },
                            ]}
                            />
                        </div>
                    </div>
                    <div class="settings-page-container">
                        <div class="settings-page-title">{t("settings.general.window")}</div>
                        <div class="settings-setting-container">
                            <span class="settings-helpicon-space">{t("settings.general.maximize")}<HelpIcon description={t("settings.tips.automaximize")} /></span>
                            <CheckBox
                                checked={config().new.General.Window.AutoMaximize}
                                onChecked={(checked) =>
                                    handleChange('General.Window.AutoMaximize', checked)
                                }
                            />
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            <span class="settings-helpicon-space">{t("settings.general.fullscreen")}<HelpIcon description={t("settings.tips.autofullscreen")} /></span>
                            <CheckBox
                                checked={config().new.General.Window.AutoFullscreen}
                                onChecked={(checked) =>
                                    handleChange('General.Window.AutoFullscreen', checked)
                                }
                            />
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            {t("settings.general.zoom")}
                            <div class="settings-setting-seekbar-container">
                                <span>50%</span>
                                <SeekBar maxValue={200} minValue={50} type="procent" currentValue={config().new.General.Window.Zoom} onSeek={(value) => { handleChange("General.Window.Zoom", parseInt(value.toFixed(0))) }} />
                                <span>200%</span>
                            </div>
                        </div>
                    </div>
                </Show>
                <Show when={category() == "player"}>
                    <div class="settings-page-container">
                        <div class="settings-page-title">{t("global.general")}</div>
                        <div class="settings-setting-container">
                            {t("settings.player.play")}
                            <CheckBox
                                checked={config().new.Player.general.Autoplay}
                                onChecked={(checked) =>
                                    handleChange('Player.general.Autoplay', checked)
                                }
                            />
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            <span class="settings-helpicon-space">{t("settings.general.fullscreen")}<HelpIcon description={t("settings.tips.autofullscreenplayer")} /></span>
                            <CheckBox
                                checked={config().new.Player.general.AutoFullscreen}
                                onChecked={(checked) =>
                                    handleChange('Player.general.AutoFullscreen', checked)
                                }
                            />
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            {t("settings.player.skip")}
                            <CheckBox
                                checked={config().new.Player.general.AutoSkipEpisode}
                                onChecked={(checked) =>
                                    handleChange('Player.general.AutoSkipEpisode', checked)
                                }
                            />
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            {t("settings.player.volume")}
                            <SettingsInput
                                iconChar="%"
                                type="number"
                                onKeyDown={(text) => handleChange("Player.general.Volume", parseInt(text))}
                                startValue={config().new.Player.general.Volume.toString()}
                            />
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            <span class="settings-helpicon-space">{t("settings.player.longskip")}<HelpIcon description={t("settings.tips.longskip")} /></span>
                            <SettingsInput
                                iconChar="s"
                                type="number"
                                onKeyDown={(text) => handleChange("Player.general.LongTimeSkipForward", parseInt(text))}
                                startValue={config().new.Player.general.LongTimeSkipForward.toString()}
                            />
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            <span class="settings-helpicon-space">{t("settings.player.longskipb")}<HelpIcon description={t("settings.tips.longskip")} /></span>
                            <SettingsInput
                                iconChar="s"
                                type="number"
                                onKeyDown={(text) => handleChange("Player.general.LongTimeSkipBack", parseInt(text))}
                                startValue={config().new.Player.general.LongTimeSkipBack.toString()}
                            />
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            <span class="settings-helpicon-space">{t("settings.player.shortskip")}<HelpIcon description={t("settings.tips.shotskip")} /></span>
                            <SettingsInput
                                iconChar="s"
                                type="number"
                                onKeyDown={(text) => handleChange("Player.general.TimeSkipRight", parseInt(text))}
                                startValue={config().new.Player.general.TimeSkipRight.toString()}
                            />
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            <span class="settings-helpicon-space">{t("settings.player.shortskipb")}<HelpIcon description={t("settings.tips.shotskip")} /></span>
                            <SettingsInput
                                iconChar="s"
                                type="number"
                                onKeyDown={(text) => handleChange("Player.general.TimeSkipLeft", parseInt(text))}
                                startValue={config().new.Player.general.TimeSkipLeft.toString()}
                            />
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            {t("settings.player.stretching")}
                            <CheckBox
                                checked={config().new.Player.general.VideoStreching}
                                onChecked={(checked) =>
                                    handleChange('Player.general.VideoStreching', checked)
                                }
                            />
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            {t("settings.player.playerexitbechaviour")}
                            <ButtonGroup selectedValue={t(`settings.player.playerbeexit.${config().new.Player.general.PlayerBehavior}`)} listValues={[
                                { value: t("settings.player.playerbeexit.information"), onClick: () => handleChange("Player.general.PlayerBehavior", "information") },
                                { value: t("settings.player.playerbeexit.home"), onClick: () => handleChange("Player.general.PlayerBehavior", "home") },
                            ]}
                            />
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            {t("settings.player.skipOpening")}
                            <CheckBox
                                checked={config().new.Player.general.autoSkipOpenings}
                                onChecked={(checked) =>
                                    handleChange('Player.general.autoSkipOpenings', checked)
                                }
                            />
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            {t("settings.player.skipEnding")}
                            <CheckBox
                                checked={config().new.Player.general.autoSkipEndings}
                                onChecked={(checked) =>
                                    handleChange('Player.general.autoSkipEndings', checked)
                                }
                            />
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            <span class="settings-helpicon-space">
                                {t("settings.player.showBrokenBuffer")}
                                <HelpIcon description={t("settings.tips.brokenBuffer")} />
                            </span>
                            <CheckBox
                                checked={config().new.Player.general.showBrokenBuffer}
                                onChecked={(checked) =>
                                    handleChange('Player.general.showBrokenBuffer', checked)
                                }
                            />
                        </div>
                    </div>
                    <div class="settings-page-container">
                        <div class="settings-page-title">{t("settings.player.uptonextep")}</div>
                        <div class="settings-setting-container">
                            {t("global.enable")}
                            <CheckBox
                                checked={config().new.Player.upToNextEpisode.enable}
                                onChecked={(checked) =>
                                    handleChange('Player.upToNextEpisode.enable', checked)
                                }
                            />
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            {t("settings.player.notif_interval")}
                            <SettingsInput
                                iconChar="s"
                                type="number"
                                onKeyDown={(text) => handleChange("Player.upToNextEpisode.interval", parseInt(text))}
                                startValue={config().new.Player.upToNextEpisode.interval.toString()}
                            />
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            {t("settings.player.epshorter")}
                            <SettingsInput
                                iconChar="m"
                                type="number"
                                onKeyDown={(text) => handleChange("Player.upToNextEpisode.durationShow", parseInt(text))}
                                startValue={config().new.Player.upToNextEpisode.durationShow.toString()}
                            />
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            {t("settings.upNext.upNextStyle")}
                            <ButtonGroup selectedValue={t(`settings.upNext.${config().new.Player.upToNextEpisode.variants}`)} listValues={[
                                { value: t("settings.upNext.var1"), onClick: () => handleChange("Player.upToNextEpisode.variants", "var1") },
                                { value: t("settings.upNext.var2"), onClick: () => handleChange("Player.upToNextEpisode.variants", "var2") },
                                { value: t("settings.upNext.old"), onClick: () => handleChange("Player.upToNextEpisode.variants", "old") },
                            ]}
                            />
                        </div>
                    </div>
                    <div class="settings-page-container">
                        <div class="settings-page-title">{"Player Animations"}</div>
                        <div class="settings-setting-container">
                            {t("settings.playerUI.dvolumeanimation")}
                            <CheckBox
                                checked={config().new.Player.ui.DisableVolumeAnimation}
                                onChecked={(checked) =>
                                    handleChange('Player.ui.DisableVolumeAnimation', checked)
                                }
                            />
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            {t("settings.playerUI.dspaceanimation")}
                            <CheckBox
                                checked={config().new.Player.ui.DisableSpaceAnimation}
                                onChecked={(checked) =>
                                    handleChange('Player.ui.DisableSpaceAnimation', checked)
                                }
                            />
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            {t("settings.playerUI.dskipanimation")}
                            <CheckBox
                                checked={config().new.Player.ui.DisableSkipAnimation}
                                onChecked={(checked) =>
                                    handleChange('Player.ui.DisableSkipAnimation', checked)
                                }
                            />
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            {t("settings.playerUI.dloadinganimation")}
                            <CheckBox
                                checked={config().new.Player.ui.DisableLoadingAnimation}
                                onChecked={(checked) =>
                                    handleChange('Player.ui.DisableLoadingAnimation', checked)
                                }
                            />
                        </div>
                    </div>
                    <div class="settings-page-container">
                        <div class="settings-page-title">{t("settings.player.external")}</div>
                        <div class="settings-setting-container">
                            {t("settings.player.enable_external")}
                            <CheckBox
                                checked={config().new.Player.external.enable}
                                onChecked={(checked) =>
                                    handleChange('Player.external.enable', checked)
                                }
                            />
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            {t("settings.player.select_player")}
                            <Dropdown
                                options={[
                                    { label: "Movian", onClick: () => handleChange("Player.external.type", "Movian") },
                                    { label: "Mpv", onClick: () => handleChange("Player.external.type", "Mpv") },
                                    { label: "VLC", onClick: () => handleChange("Player.external.type", "VLC") },
                                    { label: "ChromeCast", onClick: () => handleChange("Player.external.type", "ChromeCast") }
                                ]}
                                buttonText={config().new.Player.external.type}
                                disableX
                            />
                        </div>
                        <Show when={config().new.Player.external.type != "ChromeCast"}>
                            <div class="settings-line"></div>
                        </Show>
                        <Show when={config().new.Player.external.type === "Movian"}>
                            <div class="settings-setting-container">
                                {t("settings.player.movianip")}
                                <SettingsInput
                                    iconChar=" "
                                    type="text"
                                    onKeyDown={(text) => handleChange("Player.external.movianIP", text)}
                                    startValue={config().new.Player.external.movianIP}
                                />
                            </div>
                        </Show>
                        <Show when={config().new.Player.external.type === "Mpv"}>
                            <div class="settings-setting-container">
                                {t("settings.player.mpvpath")}
                                <SettingsInput
                                    type="text"
                                    onKeyDown={(text) => handleChange("Player.external.mpvPath", text)}
                                    startValue={config().new.Player.external.mpvPath}
                                />
                            </div>
                        </Show>
                        <Show when={config().new.Player.external.type === "VLC"}>
                            <div class="settings-setting-container">
                                {t("settings.player.vlcpath")}
                                <SettingsInput
                                    type="text"
                                    onKeyDown={(text) => handleChange("Player.external.vlcPath", text)}
                                    startValue={config().new.Player.external.vlcPath}
                                />
                            </div>
                        </Show>
                    </div>
                    <div class="settings-page-container">
                        <div class="settings-page-title">{t("settings.player.screenshot")}</div>
                        <div class="settings-setting-container">
                            {t("settings.player.screenask")}
                            <CheckBox
                                checked={config().new.Player.screenShot.alwaysAsk}
                                onChecked={(checked) =>
                                    handleChange('Player.screenShot.alwaysAsk', checked)
                                }
                            />
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            {t("settings.player.type")}
                            <ButtonGroup selectedValue={t(`settings.player.${config().new.Player.screenShot.saveType.toLowerCase()}`)} listValues={[
                                { value: t("settings.player.file"), onClick: () => handleChange("Player.screenShot.saveType", "File") },
                                { value: t("settings.player.clipboard"), onClick: () => handleChange("Player.screenShot.saveType", "Clipboard") },
                                { value: t("settings.player.both"), onClick: () => handleChange("Player.screenShot.saveType", "Both") },
                            ]}
                            />
                        </div>
                        <Show when={window.api}>
                            <div class="settings-line"></div>
                            <div class="settings-setting-container">
                                <div class="settings-mini-container">
                                    {t("settings.player.path")}
                                    <span class="settings-text-space">{config().new.Player.screenShot.path}</span>
                                </div>
                                <Button content={t("settings.player.changelocaton")} onClick={async () => await ChangeScreenshot(await window.api.os.openDialog(undefined, undefined, ["openDirectory"]))} />
                            </div>
                        </Show>
                    </div>
                    <div class="settings-page-container">
                        <div class="settings-page-title">{t("settings.player.keybind")}</div>
                        <div class="settings-setting-container">
                            {t("settings.player.keybinds.pause")}
                            <CheckKeybind content={convertKeybinds(config().new.Player.keybinds.Pause)} keyBind={(keys) => handleChange("Player.keybinds.Pause", keys)} />
                        </div>
                        <div class="settings-setting-container">
                            {t("settings.player.keybinds.fullscreen")}
                            <CheckKeybind content={convertKeybinds(config().new.Player.keybinds.Fullscreen)} keyBind={(keys) => handleChange("Player.keybinds.Fullscreen", keys)} />
                        </div>
                        <div class="settings-setting-container">
                            {t("settings.player.keybinds.exitplayer")}
                            <CheckKeybind content={convertKeybinds(config().new.Player.keybinds.ExitPlayer)} keyBind={(keys) => handleChange("Player.keybinds.ExitPlayer", keys)} />
                        </div>
                        <div class="settings-setting-container">
                            {t("settings.player.keybinds.lskipforward")}
                            <CheckKeybind content={convertKeybinds(config().new.Player.keybinds.LongTimeSkipForward)} keyBind={(keys) => handleChange("Player.keybinds.LongTimeSkipForward", keys)} />
                        </div>
                        <div class="settings-setting-container">
                            {t("settings.player.keybinds.lskipbackward")}
                            <CheckKeybind content={convertKeybinds(config().new.Player.keybinds.LongTimeSkipBack)} keyBind={(keys) => handleChange("Player.keybinds.LongTimeSkipBack", keys)} />
                        </div>
                        <div class="settings-setting-container">
                            {t("settings.player.keybinds.skipforward")}
                            <CheckKeybind content={convertKeybinds(config().new.Player.keybinds.TimeSkipRight)} keyBind={(keys) => handleChange("Player.keybinds.TimeSkipRight", keys)} />
                        </div>
                        <div class="settings-setting-container">
                            {t("settings.player.keybinds.skipbackward")}
                            <CheckKeybind content={convertKeybinds(config().new.Player.keybinds.TimeSkipLeft)} keyBind={(keys) => handleChange("Player.keybinds.TimeSkipLeft", keys)} />
                        </div>
                        <div class="settings-setting-container">
                            {t("settings.player.keybinds.fskipforward")}
                            <CheckKeybind content={convertKeybinds(config().new.Player.keybinds.FrameSkipForward)} keyBind={(keys) => handleChange("Player.keybinds.FrameSkipForward", keys)} />
                        </div>
                        <div class="settings-setting-container">
                            {t("settings.player.keybinds.fskipbackward")}
                            <CheckKeybind content={convertKeybinds(config().new.Player.keybinds.FrameSkipForward)} keyBind={(keys) => handleChange("Player.keybinds.FrameSkipForward", keys)} />
                        </div>
                        <div class="settings-setting-container">
                            {t("settings.player.keybinds.nextepisode")}
                            <CheckKeybind content={convertKeybinds(config().new.Player.keybinds.NextEpisode)} keyBind={(keys) => handleChange("Player.keybinds.NextEpisode", keys)} />
                        </div>
                        <div class="settings-setting-container">
                            {t("settings.player.keybinds.prevepisode")}
                            <CheckKeybind content={convertKeybinds(config().new.Player.keybinds.PrevEpisode)} keyBind={(keys) => handleChange("Player.keybinds.PrevEpisode", keys)} />
                        </div>
                        <div class="settings-setting-container">
                            {t("settings.player.keybinds.skipOpeningEnding")}
                            <CheckKeybind content={convertKeybinds(config().new.Player.keybinds.skipOpeningEnding)} keyBind={(keys) => handleChange("Player.keybinds.skipOpeningEnding", keys)} />
                        </div>
                        <div class="settings-setting-container">
                            {t("settings.player.keybinds.toggleSubtitles")}
                            <CheckKeybind content={convertKeybinds(config().new.Player.keybinds.toggleSubtitles)} keyBind={(keys) => handleChange("Player.keybinds.toggleSubtitles", keys)} />
                        </div>
                        <div class="settings-setting-container">
                            {t("settings.player.keybinds.pip")}
                            <CheckKeybind content={convertKeybinds(config().new.Player.keybinds.PictureInPicture)} keyBind={(keys) => handleChange("Player.keybinds.PictureInPicture", keys)} />
                        </div>
                        <div class="settings-setting-container">
                            {t("settings.player.keybinds.volumeup")}
                            <CheckKeybind content={convertKeybinds(config().new.Player.keybinds.VolumeUp)} keyBind={(keys) => handleChange("Player.keybinds.VolumeUp", keys)} />
                        </div>
                        <div class="settings-setting-container">
                            {t("settings.player.keybinds.volumedown")}
                            <CheckKeybind content={convertKeybinds(config().new.Player.keybinds.VolumeDown)} keyBind={(keys) => handleChange("Player.keybinds.VolumeDown", keys)} />
                        </div>
                        <div class="settings-setting-container">
                            {t("settings.player.keybinds.volumemute")}
                            <CheckKeybind content={convertKeybinds(config().new.Player.keybinds.VolumeMute)} keyBind={(keys) => handleChange("Player.keybinds.VolumeMute", keys)} />
                        </div>
                        <div class="settings-setting-container">
                            {t("settings.player.keybinds.screenshot")}
                            <CheckKeybind content={convertKeybinds(config().new.Player.keybinds.ScreenShot)} keyBind={(keys) => handleChange("Player.keybinds.ScreenShot", keys)} />
                        </div>
                    </div>
                </Show>
                <Show when={category() == "files"}>
                    <div class="settings-page-container">
                        <div class="settings-page-title">{"History Managment"}</div>
                        <div class="settings-setting-container">
                            {t("settings.history.limited")}
                            <CheckBox
                                checked={config().new.History.history.LimitedHistory}
                                onChecked={(checked) =>
                                    handleChange('History.history.LimitedHistory', checked)
                                }
                            />
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            {t("settings.history.limit")}
                            <SettingsInput
                                iconChar=" "
                                type="number"
                                onKeyDown={(text) => handleChange("History.history.maxSave", parseInt(text))}
                                startValue={config().new.History.history.maxSave.toString()}
                            />
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            {t("settings.history.check_history")}
                            <Button content={t("settings.history.check")} onClick={buttonCheck} />
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            <span class="settings-helpicon-space">{t("settings.history.startsave")}<HelpIcon description={t("settings.tips.continuewatchsavehistory")} /></span>
                            <SettingsInput
                                iconChar="s"
                                type="number"
                                onKeyDown={(text) => handleChange("History.continue.MinimalTimeSave", parseInt(text))}
                                startValue={config().new.History.continue.MinimalTimeSave.toString()}
                            />
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            <span class="settings-helpicon-space">{t("settings.history.stopsave")}<HelpIcon description={t("settings.tips.continuewatchsavehistory")} /></span>
                            <SettingsInput
                                iconChar="s"
                                type="number"
                                onKeyDown={(text) => handleChange("History.continue.MaximizeTimeSave", parseInt(text))}
                                startValue={config().new.History.continue.MaximizeTimeSave.toString()}
                            />
                        </div>
                    </div>
                    <div class="settings-page-container">
                        <div class="settings-page-title">{"Backup"}</div>
                        <div class="settings-setting-container">
                            {"Backup Making"}
                            <Button content="Make New Backup" onClick={CreateBackup} />
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            {"Enable Backups"}
                            <CheckBox
                                checked={config().new.backup.enable}
                                onChecked={(checked) =>
                                    handleChange('backup.enable', checked)
                                }
                            />
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            {"When Making Backup"}
                            <ButtonGroup selectedValue={t(`settings.general.${config().new.backup.check.toLowerCase().replaceAll(" ", "")}`)} listValues={[
                                { value: t("settings.general.everyday"), onClick: () => handleChange("update.type", "Every Day") },
                                { value: t("settings.general.everyweek"), onClick: () => handleChange("update.type", "Every Week") },
                                { value: t("settings.general.everymonth"), onClick: () => handleChange("update.type", "Every Month") },
                            ]}
                            />
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            {"Max number of backups"}
                            <SettingsInput
                                iconChar=""
                                type="number"
                                onKeyDown={(text) => handleChange("backup.maxBackups", parseInt(text))}
                                startValue={config().new.backup.maxBackups.toString()}
                            />
                        </div>
                        <SettingsDrop LeftHeader="Backups" leftbutton={{ icon: "folder", onClick: async () => window.api.open(await convertPath(`${await window.api.os.getBrowserConfigPath()}/animuBackup`)) }} content={
                            <div class="settings-backup-container">
                                <For each={backupList().reverse()}>
                                    {(value) => {
                                        const [year, month, day, hour, min] = [value.date.getFullYear(), value.date.getMonth(), value.date.getDate(), value.date.getHours(), value.date.getMinutes()]
                                        return (
                                            <span class="settings-button-backup" onclick={() => backupWarning(value.file, `${year}/${month}/${day} ${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`)}>
                                                Backup From <span class="settings-button-date">{`${year}/${month.toString().padStart(2, "0")}/${day.toString().padStart(2, "0")} ${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`}</span>
                                            </span>
                                        )
                                    }}
                                </For>
                            </div>
                        } />
                    </div>
                </Show>
                <Show when={category() == "developer"}>
                    <div class="settings-page-container">
                        <div class="settings-page-title">{"DevTools"}</div>
                        <div class="settings-setting-container">
                            {t("settings.devmode.developermode")}
                            <CheckBox
                                checked={config().new.Developer.DeveloperMode}
                                onChecked={(checked) =>
                                    handleChange('Developer.DeveloperMode', checked)
                                }
                            />
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            {t("settings.devmode.tornondevtools")}
                            <CheckBox
                                checked={config().new.Developer.DevTools}
                                onChecked={(checked) =>
                                    handleChange('Developer.DevTools', checked)
                                }
                            />
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            {t("settings.devmode.devtoolsonstart")}
                            <CheckBox
                                checked={config().new.Developer.DevToolsOnStart}
                                onChecked={(checked) =>
                                    handleChange('Developer.DevToolsOnStart', checked)
                                }
                            />
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            {t("settings.devmode.playerdebug")}
                            <CheckBox
                                checked={config().new.Developer.playerDebug}
                                onChecked={(checked) =>
                                    handleChange('Developer.playerDebug', checked)
                                }
                            />
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            Toast Notification Test
                            <span class="settings-custom-space">
                                <Button content="success" onClick={() => toast("Test Notification", {type: "success"})} />
                                <Button content="error" onClick={() => toast("Test Notification", {type: "error"})} />
                                <Button content="loading" onClick={() => toast("Test Notification", {type: "loading"})} />
                                <Button content="default" onClick={() => toast("Test Notification")} />
                            </span>
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            Dialog Test
                            <span class="settings-custom-space">
                                <Button content="error" onClick={() =>
                                    showDialog({
                                        type: "error",
                                        title: "Error in Player",
                                        description: t("player.error.notfound"),
                                        buttons: [{
                                            title: t("dialog.exit"),
                                            onClick: () => ""
                                        }]
                                    })
                                } />
                                <Button content="info" onClick={() =>
                                    showDialog({
                                        type: "info",
                                        title: "Info in Player",
                                        description: t("player.error.notfound"),
                                        buttons: [{
                                            title: t("dialog.exit"),
                                            onClick: () => ""
                                        }]
                                    })
                                } />
                            </span>
                        </div>
                    </div>
                    <div class="settings-page-container">
                        <div class="settings-page-title">{t("settings.devmode.information")}</div>
                        <div class="settings-setting-container">
                            <span>{t("settings.devmode.electronver")}</span>
                            <span>{versions().electron}</span>
                        </div>
                        <div class="settings-setting-container">
                            <span>{t("settings.devmode.chromiumver")}</span>
                            <span>{versions().chrome}</span>
                        </div>
                        <div class="settings-setting-container">
                            <span>{t("settings.devmode.nodever")}</span>
                            <span>{versions().node}</span>
                        </div>
                    </div>
                </Show>
                <Show when={category() == "extensions"}>
                    <div class="settings-page-container">
                        <div class="settings-page-title">{t("global.extensions")}</div>
                        <div class="settings-container-extensions">
                            <table class="settings-table-extensions">
                                {/* TODO: Change style of extension tab (this make creash idk why) */}
                                {/* <tr>
                                    <th>{t("settings.extensions.name")}</th>
                                    <th>{t("settings.extensions.author")}</th>
                                    <th>{t("settings.extensions.version")}</th>
                                    <th>{t("settings.extensions.type")}</th>
                                </tr> */}
                                {pluginList.map((plugin) => (
                                    <tr class="settings-table-button">
                                        <td class="settings-extensions-title">{plugin.metadata.icon ? <img class="settings-extensions-icon" src={plugin.metadata.icon} /> : <div class="settings-extensions-icon-placeholder"></div>}{plugin.metadata.name}</td>
                                        <td><div class="settings-extensions-background">{plugin.metadata.author}</div></td>
                                        <td><div class="settings-extensions-background">{plugin.metadata.version}</div></td>
                                        <td>
                                            <div class="settings-extensions-button-container">
                                                <div class="settings-extensions-type-container">
                                                    <div class="settings-extensions-background">{t("global.player")}</div>
                                                </div>
                                                <div class="settings-helpicon-space">
                                                    <CheckBox checked={config().new.plugins.player == plugin.metadata.name ? true : plugin.metadata.name == "AnilistApi" ? true : false} onChecked={() => plugin.metadata.name != "AnilistApi" ? handleChange('plugins.player', plugin.metadata.name) : ""} />
                                                    {/* <Button icon="settings" ButtonClass="settings-extensions-button" /> */}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </table>
                        </div>
                    </div>
                </Show>
                <Show when={category() == "about"}>
                    <div class="settings-page-container">
                        <div class="settings-page-title">{t("settings.general.links")}</div>
                        <div class="settings-special-container">
                            <img class="settings-special-images" onClick={() => openUrlFolder("https://github.com/Owca525/animu")} src="https://github.com/fluidicon.png" alt="Github Logo" />
                            <img class="settings-special-images" onClick={discord_server} src="https://cdn.prod.website-files.com/6257adef93867e50d84d30e2/66e3d80db9971f10a9757c99_Symbol.svg" alt="Discord Logo" />
                            <img class="settings-special-images" onClick={() => openUrlFolder("https://buymeacoffee.com/owca525")} src="https://studio.buymeacoffee.com/assets/img/bmc-meta-new/new/android-icon-192x192.png" alt="Buymeacoffee logo" />
                        </div>
                    </div>
                    <div class="settings-page-container">
                        <div class="settings-page-title">{t("settings.general.credits")}</div>
                        <div class="settings-setting-container"><span class="settings-user-title">Owca525</span> {t("credits.owca525")}</div>
                        <div class="settings-setting-container"><div class="settings-user-title">KartQ</div>  {t("credits.kartq")}</div>
                        <div class="settings-setting-container"><div class="settings-user-title">DawoleQ</div>  {t("credits.dawoleq")}</div>
                        <div class="settings-setting-container"><div class="settings-user-title">Ary</div>  {t("credits.ary")}</div>
                        <div class="settings-setting-container"><div class="settings-user-title">Rain_kyle</div>  {t("credits.rain_kyle")}</div>
                        <div class="settings-setting-container"><div class="settings-user-title">AkaShiro</div>  {t("credits.akashiro")}</div>
                    </div>
                    <div class="settings-page-container">
                        <div class="settings-page-title">{t("settings.general.specialthanks")}</div>
                        <div class="settings-setting-container"><div class="settings-user-title">Talon</div> {t("credits.talon")}</div>
                        <div class="settings-setting-container"><div class="settings-user-title">Zomi</div> {t("credits.zomi")}</div>
                    </div>
                </Show>
            </div>
        </main>
    );
}

export default settings;
