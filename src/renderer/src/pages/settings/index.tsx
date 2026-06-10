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
import icon from '@resources/icon.png';
import {
    calculateZoomLevel,
    changeTheme,
    changeTitleAnimu,
    convertKeybinds,
    convertPath,
    LoginToAnilist,
    openUrlFolder,
    request,
    // savePluginConfig,
    updateObject
} from '@renderer/utils/functions';
import { checkUpdate } from '@renderer/utils/update';
import {
    ContextMenuProps,
    informationPluginFormat,
    playerPluginFormat,
    PluginLoadedFormat,
    SettingsConfig,
    themeMetadata
} from '@renderer/utils/types';
import { CreateBackup, RestoreBackup } from '@renderer/utils/backup';
import {
    createEffect,
    createSignal,
    For,
    Match,
    onCleanup,
    onMount,
    Show,
    Switch
} from 'solid-js';
import { DetectOldVersionHistory, OverWriteHistory } from '@renderer/utils/FilesManager/history';
import { getConfig, setConfig } from '@renderer/utils/stores/config';
import { getAllPluginList, getInformationPlugin, getPlayerPLugin, getPluginRepo, pluginManager } from '@renderer/utils/stores/plugins';
import { OpenContextMenu } from '@renderer/utils/context/ContextMenu';
import { saveConfig } from '@renderer/utils/FilesManager/config';
import { showDialog } from '@renderer/utils/context/DialogContext';
import { toast } from '@renderer/utils/context/ToastNotification';
import { unwrap } from 'solid-js/store';
import { useNavigate } from '@solidjs/router';
import './settings.css';
import { useI18n } from '@renderer/utils/i18n';
import { activeThemes, animulistData, getAnilistUserData, getCurrentYT_DLPVer, getDeeplinks, getGlobalCache, getListOfVerYT_DLP, loadedTheme, removeDeepLink, setAudioOutput, setDeepLink } from '@renderer/utils/stores/global';
import { hideCustomMenu, isCustomMenuActive, showCustomMenu } from '@renderer/utils/context/menuContext';
import SettingsPlugin from './components/settingsPlugin';
import semver from "semver";
import { OvewriteAnimuList } from '@renderer/utils/FilesManager/animulist';
import OtherSettings from './components/otherSettings';
import { SheepShortcut } from '@renderer/utils/hooks/useKeyPress';

export type pluginRepoExpandedSettings = {
    name: string,
    file: string,
    ver: string,
    author: string,
    type: "information" | "player"
    urlWebsite: string,
    icon?: string,
    sha256: string,
    description?: string
} & { repoURL: string, installed: boolean, update: boolean }

function settings() {
    const navigate = useNavigate();
    const cfg: SettingsConfig = unwrap(getConfig());
    const { t, changeLanguage, listLang } = useI18n()

    let filePickerImport: HTMLInputElement | undefined

    const [category, setCategory] = createSignal<string>("general");
    const [config, setNewConfig] = createSignal<{ old: SettingsConfig, new: SettingsConfig }>({ old: structuredClone(cfg), new: structuredClone(cfg) })
    const [themes, setThemes] = createSignal<themeMetadata[]>([])
    const [lastActiveTheme, setLastActiveTheme] = createSignal<Map<number, themeMetadata>>(new Map())
    const [versions] = createSignal(window.api ? window.electronAPI.process.versions : undefined)
    const [isSaving, setSaving] = createSignal<boolean>(false)

    const [audioOutput, setaudioOutput] = createSignal<MediaDeviceInfo[]>([])

    const [backupList, setBackupList] = createSignal<{ date: Date, file: string }[]>([])
    const [pluginList, setpluginList] = createSignal<{ active: boolean, plugin: PluginLoadedFormat }[]>([])
    const [hiddenPluginList, setHiddenPluginList] = createSignal<string[]>([])
    const [ContextMenu, setContextMenu] = createSignal<ContextMenuProps>([
        { option: "dialog.reload", onClick: () => location.reload() },
        { option: "", line: true },
        {
            option: "dialog.exit", onClick: () => showDialog({
                type: "info",
                title: t("global.action"),
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
                text: "global.files",
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
                onClick: () => { navigate("/") },
            },
        ],
    });

    /* IFDEF DEBUG|PROD */
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
    /* ENDIF */

    SheepShortcut(["Control", "d"], () => {
        if (config().new.Developer.DeveloperMode) return
        showDialog({
            type: "info",
            title: t("global.action"),
            description: t("settings.turnDeveloper"),
            buttons: [
                {
                    title: t("dialog.yes"),
                    onClick: () => { handleChange("Developer.DeveloperMode", true); turnOnDeveloperMode() }
                },
                {
                    title: t("dialog.no"),
                    onClick: () => handleChange("Developer.DeveloperMode", false)
                }
            ]
        })
    })

    SheepShortcut(["Escape"], () => {
        if (isCustomMenuActive()) return hideCustomMenu()
        navigate("/");
    })

    function handleChange(path: string, value: string | number | boolean | any) {
        setNewConfig((prevConfig) => {
            return { old: prevConfig.old, new: updateObject(path, value, unwrap(prevConfig.new)) }
        })
    }

    createEffect(() => {
        if (JSON.stringify(config().old) != JSON.stringify(config().new)) setSaving(() => true)
    })

    onMount(async () => {
        navigator.mediaDevices.enumerateDevices().then((element) => {
            const audioOutputs = element.filter(device => device.kind === "audiooutput")
            setaudioOutput(audioOutputs)
        })

        const plugin = getPlayerPLugin()
        setLastActiveTheme(structuredClone(unwrap(activeThemes())))
        const playerPluginList = getAllPluginList().map((pl) => {
            if (!plugin) return { active: false, plugin: pl }
            return { active: plugin.metadata.name == pl.metadata.name, plugin: pl }
        })
        setHiddenPluginList(getConfig().plugins.hiddenPlugins)
        setpluginList(playerPluginList)
        setThemes(loadedTheme().filter((val) => ![...activeThemes().entries()].map(([_, val]) => val.themeName).includes(val.themeName)))
        changeTitleAnimu(`Animu - ${t("global.settings")}`)
        turnOnDeveloperMode()

        /* IFDEF DEBUG|PROD */
        setBackupList(await window.api.backup.list())
        if (config().new.General.discordRPC) window.api.rpc.setActivity({ state: t("discordrpc.settings") })
        /* ENDIF */
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
            setLastActiveTheme(structuredClone(unwrap(activeThemes())))
            setConfig(config().new)
            setNewConfig((prev) => {
                return { old: structuredClone(prev.new), new: structuredClone(prev.new) }
            })
            setSaving(() => false)
            saveConfig(config().new)
            setDynamicZoom(config().new.General.Window.Zoom)
            pluginManager().initialPlugins()
            window.backend.refresh()
            toast(t("settings.saving.done"), { type: "success" })
        } catch (error) {
            toast(t("settings.saving.error"), { type: "success" })
        }
    }

    function resetNewConfig() {
        setNewConfig((prev) => {
            setNewLang(config().old.General.language)
            changeTheme(lastActiveTheme())
            return { old: structuredClone(prev.old), new: structuredClone(prev.old) }
        })
        setpluginList((prev) => prev.map(pl => ({ ...pl, active: pl.plugin.metadata.name == config().old.plugins.player })))

        const tmp = activeThemes().entries().filter((item) => !config().old.General.theme.includes(item[1].themeName))
        tmp.forEach((v) => {
            updateTheme(v[1], true, v[0])
        })

        setThemes(loadedTheme().filter((val) => ![...activeThemes().entries()].map((v) => v[1].themeName).includes(val.themeName)))
        pluginManager().initialPlugins()
        setSaving(() => false)
    }

    function setNewLang(lang: string) {
        changeLanguage(lang)
        handleChange("General.language", lang)
    }

    function setDynamicZoom(value: number) {
        /* IFDEF DEBUG|PROD */
        window.BrowserWindow.setZoom(calculateZoomLevel(value))
        /* ENDIF */
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
            title: t("global.action"),
            description: t("settings.backup.askrestore", { date }),
            buttons: [{
                title: t("dialog.no"),
                onClick: () => ""
            },
            {
                title: t("dialog.yes"),
                onClick: async () => { RestoreBackup(file); setBackupList(await window.api.backup.list()) },
            }
            ]
        })
    }

    function updateTheme(theme: themeMetadata, remove: boolean = false, id?: number, num?: number) {
        let active = unwrap(activeThemes())
        if (remove == true && id != undefined) active.delete(id)
        else if (num == undefined) {
            const lastID = [...active.entries()].at(-1)
            if (lastID) active.set(lastID[0] + 1, unwrap(theme))
        }

        if (id != undefined && num != undefined && active.get(id + num)?.themeName != "DarkerAnimu") {
            active = new Map([...active.entries().map((item) => {
                if (item[0] === id)
                    return { ...item, 0: id + num };
                if (item[0] === id + num)
                    return { ...item, 0: id }
                return item;
            })])
        }

        active = new Map([...active.entries()]
            .sort(([a], [b]) => a - b)
            .map((item, index) => ({
                ...item,
                0: index
            }))
            .filter(
                (item, index, self) =>
                    index === self.findIndex(t => t[1].themeName === item[1].themeName)
            ))

        setThemes(loadedTheme().filter((val) => ![...active.entries()].map((v) => v[1].themeName).includes(val.themeName)))
        changeTheme(active)
        handleChange("General.theme", unwrap([...activeThemes().entries()].map((val) => val[1].themeName)) as unknown as string)
    }

    async function openThemeOption(theme: themeMetadata) {
        const themeConfig = await window.api.themes.config(unwrap(theme))

        showCustomMenu(OtherSettings({
            title: t("settings.extensions.conf", { title: theme.themeName }),
            themeConfig: {
                theme: theme,
                config: themeConfig,
                onChange: async (theme: themeMetadata, change: string, update: string | boolean) => {
                    const record: Record<string, boolean | string> = {
                        [change]: update
                    }
                    await window.api.themes.writeConfig(unwrap(theme), unwrap(record))

                    const finded = [...activeThemes().entries()].map((v) => v[1].themeName)
                    if (finded.find((v) => v == theme.themeName)) updateTheme(theme)
                },
            }
        }))
    }

    async function setActivePlugin(active: boolean, plugin: PluginLoadedFormat) {
        let loadedPlugin: informationPluginFormat | playerPluginFormat = undefined as any

        if (new Set(hiddenPluginList()).has(plugin.metadata.name)) {
            unHidePlugin(plugin)
            saveNewConfig()
        }

        let tmpPlugin = plugin
        if (!active) tmpPlugin = pluginList()[0]["plugin"]

        if (tmpPlugin["metadata"]["type"] == "information") loadedPlugin = await pluginManager().changeInformationPlugin(tmpPlugin["metadata"]["name"])
        if (tmpPlugin["metadata"]["type"] == "information") loadedPlugin = await pluginManager().changePlayerPlugin(tmpPlugin["metadata"]["name"])

        if (!loadedPlugin) {
            toast(t("Failed Change Plugin", { type: "error" }))
            return
        }

        setpluginList((prev) => prev.map((pl) => ({ ...pl, active: tmpPlugin.metadata.name == pl.plugin["metadata"].name })))
        handleChange("plugins.player", tmpPlugin.metadata.name)
    }

    // function openPluginSettings(plugin: PluginLoadedFormat) {
    //     if (!plugin.config) return
    //     showCustomMenu(OtherSettings({
    //         title: t("settings.extensions.conf", { title: plugin.metadata.name }),
    //         pluginConfig: {
    //             config: plugin.config,
    //             onChange: (v, a) => savePluginSettings(plugin.config as any, v, a, plugin)
    //         }
    //     }))
    // }

    // function savePluginSettings(config: { [key: string]: any }, variable: string, change: any, plugin: PluginLoadedFormat) {
    //     let tmpConfig = config
    //     for (const key in config) {
    //         if (key == variable) tmpConfig = { ...tmpConfig, [key]: change }
    //     }
    //     savePluginConfig(plugin, tmpConfig)
    //     plugin.config = tmpConfig

    //     if ("home" in plugin) {
    //         getInformationPlugin().currentPlugin = plugin
    //         return
    //     }

    //     const listplugins = getPluginList()
    //     // TODO: maybe fix this and maybe this make some erro fuck it i'm tired
    //     setPluginPlayerList(listplugins.map((p) => p.metadata.name == plugin.metadata.name ? plugin : p) as any)
    // }

    function hidePlayerPlugin(plugin: PluginLoadedFormat, active: boolean) {
        if (active) setActivePlugin(false, plugin)

        setHiddenPluginList((prev) => [...prev, plugin.metadata.name])
        handleChange("plugins.hiddenPlugins", [...hiddenPluginList()])
    }

    function unHidePlugin(plugin: PluginLoadedFormat) {
        setHiddenPluginList((prev) => prev.filter(i => i !== plugin.metadata.name))
        handleChange("plugins.hiddenPlugins", [...hiddenPluginList()])
    }

    function changeYT_DLP(v: string) {
        handleChange("yt_dlp", v)
        window.api.yt_dlp.install(v)
    }

    function getDatabaseOfRepo(): pluginRepoExpandedSettings[] {
        const repo = getPluginRepo()
        const plugins = getAllPluginList()
        const infoPlugin = getInformationPlugin()

        return repo.map((item) => {
            if (item.type == "information") {
                return { ...item, update: semver.gt(semver.coerce(item.ver) as any, semver.coerce(infoPlugin.metadata.version) as any), installed: true }
            }

            const finded = plugins.find((value) => value.metadata.name == item.name)
            if (!finded) return { ...item, installed: false, update: false }

            return {
                ...item,
                installed: true,
                update: semver.gt(semver.coerce(item.ver) as any, semver.coerce(finded.metadata.version) as any)
            }
        })
    }

    function getStatusStore(tmp: pluginRepoExpandedSettings): string {
        if (!tmp.installed) return "settings.pluginstore.install"
        if (tmp.update) return "settings.pluginstore.update"
        return "settings.pluginstore.installed"
    }

    function importConfig(event: Event) {
        const input = event.currentTarget as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        const file = input.files[0];

        if (file.type !== "text/plain") return

        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const file = JSON.parse(reader.result as any)

                // animulist
                OvewriteAnimuList(file["animulist"])

                // History
                OverWriteHistory(file["history"])

                // Config
                setConfig(file["config"])
                saveConfig(file["config"])

                toast("Sucessfully Imported Data To Animu", { type: "success" })
                /* IFDEF DEBUG|PROD */
                window.BrowserWindow.reload()
                /* ENDIF */

                /* IFDEF WEB */
                location.reload()
                /* ENDIF */

            } catch (error) {
                console.error("Error in importConfig", error)
                toast("Failed Import Data", { type: "error" })
            }
        };
        reader.readAsText(file);
    }

    async function exportConfig() {
        try {
            const handle = await (window as any).showSaveFilePicker({
                suggestedName: "animuExport.txt",
                types: [
                    {
                        description: "Text Files",
                        accept: { "text/plain": [".txt"] },
                    },
                ],
            });

            const exported = JSON.stringify({
                animulist: unwrap(animulistData()),
                history: unwrap(getGlobalCache().history),
                config: unwrap(getConfig())
            })

            const writable = await handle.createWritable();
            await writable.write(exported);
            await writable.close();
            toast("Succesfully Exported Data", { type: "success" })
        } catch (error) {
            console.error("Error in exportConfig", error)
            toast("Failed Exported Data", { type: "error" })
        }
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
                            {/* {t("settings.general.theme")}
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
                            </div> */}
                            <SettingsDrop LeftHeader={t("settings.general.theme")} leftbutton={{ icon: "folder", onClick: async () => window.api.open(await convertPath(`${await window.api.os.getConfigPath()}/themes`)) }} content={
                                <div class="settings-theme-spliter">
                                    <span class='settings-theme-span'>{t("settings.theme.active")}</span>
                                    <div class="settings-theme-container">
                                        <For each={[...activeThemes().entries()].reverse()}>
                                            {([id, value]) => (<div class={`settings-button-theme ${value.themeName != "DarkerAnimu" && [...activeThemes().entries()].length > 2 ? "settings" : ""}`} onclick={() => value.themeName != "DarkerAnimu" ? updateTheme(value, true, id) : ""}>
                                                {value.themeName}
                                                <span class='settings-theme-button-span'>
                                                    <Show when={value.themeName != "DarkerAnimu" && [...activeThemes().entries()].length > 2}>
                                                        <Button icon='arrow_drop_up' ButtonClass='settings-settings-theme-button' onClick={(ev) => { ev.stopPropagation(); updateTheme(value, false, id, 1) }} />
                                                        <Button icon='arrow_drop_down' ButtonClass='settings-settings-theme-button' onClick={(ev) => { ev.stopPropagation(); updateTheme(value, false, id, -1) }} />
                                                    </Show>
                                                    <Show when={value.options}>
                                                        <Button icon='settings' ButtonClass="settings-settings-theme-button" onClick={(event) => { event.stopPropagation(); openThemeOption(value) }} />
                                                    </Show>
                                                    <CheckBox checked onChecked={() => value.themeName != "DarkerAnimu" ? updateTheme(value, true, id) : ""} disable={value.themeName == "DarkerAnimu"} />
                                                </span>
                                            </div>
                                            )}
                                        </For>
                                    </div>
                                    <span class='settings-theme-span'>{t("settings.theme.loaded")}</span>
                                    <div class="settings-theme-container">
                                        <For each={themes()}>
                                            {(value) => (
                                                <div class={`settings-button-theme ${value.options ? "settings" : ""}`} onclick={() => updateTheme(value)}>
                                                    {value.themeName}
                                                    <span class='settings-theme-button-span'>
                                                        <Show when={value.options}>
                                                            <Button icon='settings' ButtonClass="settings-settings-theme-button" onClick={(event) => { event.stopPropagation(); openThemeOption(value) }} />
                                                        </Show>
                                                        <CheckBox checked={false} onChecked={() => updateTheme(value, true)} />
                                                    </span>
                                                </div>
                                            )}
                                        </For>
                                    </div>
                                </div>
                            } />
                        </div>
                        <Show when={window.api}>
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
                            <div class="settings-line"></div>
                            <div class="settings-setting-container">
                                <span class="settings-helpicon-space">
                                    {t("settings.yt-dlp")}
                                </span>
                                <Dropdown disableX
                                    placeholder={getCurrentYT_DLPVer() != "" ? getCurrentYT_DLPVer() : getListOfVerYT_DLP()[0]}
                                    options={getListOfVerYT_DLP().map((v) => ({ label: v, onClick: () => changeYT_DLP(v) }))}
                                />
                            </div>
                        </Show>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            {t("Audio Output")}
                            <div class="settings-helpicon-space">
                                <Dropdown
                                    options={audioOutput().map(element => {
                                        return {
                                            label: element.label, onClick: () => {
                                                handleChange('General.audioOutput', element.label)
                                                setAudioOutput(element)
                                            }
                                        }
                                    })}
                                    buttonText={config().new.General.audioOutput}
                                    placeholderChange={() => config().new.General.audioOutput}
                                    disableX
                                />
                            </div>
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            {t("Manage Data in animu")}
                            <div class='settings-mini-container'>
                                <Button content='Import Data' onClick={() => {
                                    showDialog({
                                        type: "info",
                                        title: t("Double Check"),
                                        description: t("Are you sure importing file, this action overwrite everything"),
                                        buttons: [
                                            {
                                                title: t("dialog.no"),
                                                onClick: () => ""
                                            },
                                            {
                                                title: t("dialog.yes"),
                                                onClick: () => filePickerImport?.click()
                                            }
                                        ]
                                    })

                                }} />
                                <Button content='Export Data' onClick={exportConfig} />
                                <input
                                    type="file"
                                    accept=".txt"
                                    ref={filePickerImport}
                                    style={{ display: "none" }}
                                    onChange={importConfig}
                                />
                            </div>
                        </div>
                    </div>
                    <div class="settings-page-container">
                        <div class="settings-page-title">{t("Anilist")}</div>
                        <Switch>
                            <Match when={getAnilistUserData() == undefined}>
                                <div class="settings-setting-container">
                                    {t("Link Anilist Account to Animu")}
                                    <Button content={t('Login')} onClick={LoginToAnilist} />
                                </div>
                            </Match>
                        </Switch>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            {t("Default Adult Mode")}
                            <CheckBox
                                checked={config().new.anilist.adultdefault}
                            />
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            {t("Max Anime Cards")}
                            <SettingsInput
                                iconChar=""
                                type="number"
                                onKeyDown={(text) => handleChange("anilist.maxpagesize", parseInt(text))}
                                startValue={config().new.anilist.maxpagesize.toString()}
                            />
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            {t("Title Format In Animu")}
                            <ButtonGroup selectedValue={t(`anilist.titles.${config().new.anilist.titleFormat}`)} listValues={[
                                { value: t("anilist.titles.ROMAJI"), onClick: () => handleChange("anilist.titleFormat", "ROMAJI") },
                                { value: t("anilist.titles.NATIVE"), onClick: () => handleChange("anilist.titleFormat", "NATIVE") },
                                { value: t("anilist.titles.ENGLISH"), onClick: () => handleChange("anilist.titleFormat", "ENGLISH") },
                            ]}
                            />
                        </div>
                    </div>
                    <div class="settings-page-container">
                        <div class="settings-page-title">{t("Information Page")}</div>
                        <div class="settings-setting-container">
                            {t("Always Update Anime In Information")}
                            <CheckBox
                                checked={config().new.information.alwaysUpdateAnime}
                                onChecked={(checked) =>
                                    handleChange('information.alwaysUpdateAnime', checked)
                                }
                            />
                        </div>
                        {/* <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            {t("Default Episode Variants")}
                            <ButtonGroup selectedValue={t(`settings.variants.${config().new.information.episodeVariants}`)} listValues={[
                                { value: t("Variant 1"), onClick: () => handleChange("information.episodeVariants", "v1") },
                                { value: t("Variant 2"), onClick: () => handleChange("information.episodeVariants", "v2") },
                            ]}
                            />
                        </div> */}
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            {t("Play Opening In Information")}
                            <CheckBox
                                checked={config().new.information.openingininformation}
                                onChecked={(checked) =>
                                    handleChange('information.openingininformation', checked)
                                }
                            />
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            {t("Trailer player Type")}
                            <ButtonGroup selectedValue={t(`settings.information.trailertype.${config().new.information.trailerplayertype}`)} listValues={[
                                { value: t("Animu Player"), onClick: () => handleChange("information.trailerplayertype", "player") },
                                { value: t("Embed"), onClick: () => handleChange("information.trailerplayertype", "embed") },
                            ]}
                            />
                        </div>
                        <Show when={config().new.information.trailerplayertype == "player"}>
                            <div class="settings-line"></div>
                            <div class="settings-setting-container">
                                {t("Preload Trailer")}
                                <CheckBox
                                    checked={config().new.information.preloadTrailer}
                                    onChecked={(checked) =>
                                        handleChange('information.preloadTrailer', checked)
                                    }
                                />
                            </div>
                        </Show>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            {t("Preload Opening/Ending")}
                            <CheckBox
                                checked={config().new.information.preloadOpening}
                                onChecked={(checked) =>
                                    handleChange('information.preloadOpening', checked)
                                }
                            />
                        </div>
                    </div>
                    <Show when={window.api}>
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
                                {t("Close Animu On Exit Button")}
                                <CheckBox
                                    checked={config().new.General.Window.trayIconClose}
                                    onChecked={(checked) =>
                                        handleChange('General.Window.trayIconClose', checked)
                                    }
                                />
                            </div>
                            <div class="settings-line"></div>
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
                            <div class='settings-setting-seekbar-container'>
                                <span>0</span>
                                <SeekBar 
                                    maxValue={100} 
                                    minValue={0} 
                                    type="value"
                                    currentValue={config().new.Player.general.Volume} 
                                    onSeek={(value) => { handleChange("Player.general.Volume", parseInt(value.toFixed(0))) }} 
                                />
                                <span>100</span>
                            </div>
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
                            {t("Disable More Information in player")}
                            <CheckBox
                                checked={config().new.Player.general.disablemoreinformation}
                                onChecked={(checked) =>
                                    handleChange('Player.general.disablemoreinformation', checked)
                                }
                            />
                        </div>
                        {/* <div class="settings-line"></div>
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
                        </div> */}
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
                        <div class="settings-page-title">{t("settings.player.animations")}</div>
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
                    <Show when={window.api}>
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
                                        // { label: "ChromeCast", onClick: () => handleChange("Player.external.type", "ChromeCast") }
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
                    </Show>
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
                        <div class="settings-setting-container">
                            {t("settings.player.keybinds.screenshot2")}
                            <CheckKeybind content={convertKeybinds(config().new.Player.keybinds.noSubbtitlesreenshot)} keyBind={(keys) => handleChange("Player.keybinds.noSubbtitlesreenshot", keys)} />
                        </div>
                        <div class="settings-setting-container">
                            {t("Start Record Clip")}
                            <CheckKeybind content={convertKeybinds(config().new.Player.keybinds.startRecordClip)} keyBind={(keys) => handleChange("Player.keybinds.startRecordClip", keys)} />
                        </div>
                        <div class="settings-setting-container">
                            {t("Stop Record Clip")}
                            <CheckKeybind content={convertKeybinds(config().new.Player.keybinds.stopRecordClip)} keyBind={(keys) => handleChange("Player.keybinds.stopRecordClip", keys)} />
                        </div>
                    </div>
                </Show>
                <Show when={category() == "files"}>
                    <div class="settings-page-container">
                        <div class="settings-page-title">{t("settings.history.managment")}</div>
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
                    <Show when={window.api}>
                        <div class="settings-page-container">
                            <div class="settings-page-title">{t("settings.backup.title")}</div>
                            <div class="settings-setting-container">
                                {t("settings.backup.make")}
                                <Button content={t("settings.backup.newbackup")} onClick={CreateBackup} />
                            </div>
                            <div class="settings-line"></div>
                            <div class="settings-setting-container">
                                {t("settings.backup.enable")}
                                <CheckBox
                                    checked={config().new.backup.enable}
                                    onChecked={(checked) =>
                                        handleChange('backup.enable', checked)
                                    }
                                />
                            </div>
                            <div class="settings-line"></div>
                            <div class="settings-setting-container">
                                {t("settings.backup.when")}
                                <ButtonGroup selectedValue={t(`settings.general.${config().new.backup.check.toLowerCase().replaceAll(" ", "")}`)} listValues={[
                                    { value: t("settings.general.everyday"), onClick: () => handleChange("update.type", "Every Day") },
                                    { value: t("settings.general.everyweek"), onClick: () => handleChange("update.type", "Every Week") },
                                    { value: t("settings.general.everymonth"), onClick: () => handleChange("update.type", "Every Month") },
                                ]}
                                />
                            </div>
                            <div class="settings-line"></div>
                            <div class="settings-setting-container">
                                {t("settings.backup.max")}
                                <SettingsInput
                                    iconChar=""
                                    type="number"
                                    onKeyDown={(text) => handleChange("backup.maxBackups", parseInt(text))}
                                    startValue={config().new.backup.maxBackups.toString()}
                                />
                            </div>
                            <SettingsDrop LeftHeader={t("settings.backup.backups")} leftbutton={{ icon: "folder", onClick: async () => window.api.open(await convertPath(`${await window.api.os.getBrowserConfigPath()}/animuBackup`)) }} content={
                                <div class="settings-backup-container">
                                    <For each={backupList().reverse()}>
                                        {(value) => {
                                            const [year, month, day, hour, min] = [value.date.getFullYear(), value.date.getMonth(), value.date.getDate(), value.date.getHours(), value.date.getMinutes()]
                                            return (
                                                <span class="settings-button-backup" onclick={() => backupWarning(value.file, `${year}/${month}/${day} ${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`)}>
                                                    {t("settings.backup.from")} <span class="settings-button-date">{`${year}/${month.toString().padStart(2, "0")}/${day.toString().padStart(2, "0")} ${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`}</span>
                                                </span>
                                            )
                                        }}
                                    </For>
                                </div>
                            } />
                        </div>
                    </Show>
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
                        {/* <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            {t("settings.devmode.playerdebug")}
                            <CheckBox
                                checked={config().new.Developer.playerDebug}
                                onChecked={(checked) =>
                                    handleChange('Developer.playerDebug', checked)
                                }
                            />
                        </div> */}
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            {t("settings.devmode.notificationtest")}
                            <span class="settings-custom-space">
                                <Button content={t("types.success")} onClick={() => toast(t("notification.test"), { type: "success" })} />
                                <Button content={t("types.error")} onClick={() => toast(t("notification.test"), { type: "error" })} />
                                <Button content={t("types.loading")} onClick={() => toast(t("notification.test"), { type: "loading" })} />
                                <Button content={t("types.default")} onClick={() => toast(t("notification.test"))} />
                            </span>
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            {t("settings.devmode.dialogtest")}
                            <span class="settings-custom-space">
                                <Button content={t("types.error")} onClick={() =>
                                    showDialog({
                                        type: "error",
                                        title: t("global.action"),
                                        description: t("player.error.notfound"),
                                        buttons: [{
                                            title: t("dialog.exit"),
                                            onClick: () => ""
                                        }]
                                    })
                                } />
                                <Button content={t("types.info")} onClick={() =>
                                    showDialog({
                                        type: "info",
                                        title: t("global.action"),
                                        description: t("player.error.notfound"),
                                        buttons: [{
                                            title: t("dialog.exit"),
                                            onClick: () => ""
                                        }]
                                    })
                                } />
                            </span>
                        </div>
                        <Show when={window.api}>
                            <div class="settings-line"></div>
                            <div class="settings-setting-container">
                                {t("Run Test DeepLink")}
                                <CheckBox
                                    checked={getDeeplinks().find((val) => val.name == "Animu Deeplink Test") ? true : false}
                                    onChecked={(checked) => {
                                        if (checked) {
                                            setDeepLink({
                                                name: 'Animu Deeplink Test',
                                                code: 'animutest',
                                                func: function (deeplink: string) {
                                                    toast(t("Ping Pong, Animu Received Deepling " + deeplink))
                                                }
                                            })
                                        } else {
                                            removeDeepLink("Animu Deeplink Test")
                                        }
                                    }}
                                />
                            </div>
                        </Show>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            {t("Use Websocket")}
                            <CheckBox
                                checked={config().new.socket.useSocket}
                                onChecked={(checked) => handleChange('socket.useSocket', checked)}
                            />
                        </div>
                        <Show when={config().new.socket.useSocket}>
                            <div class="settings-line"></div>
                            <div class="settings-setting-container">
                                {t("Web Socket Backend")}
                                <SettingsInput
                                    iconChar=""
                                    type='text'
                                    onKeyDown={(text) => handleChange("socket.backend", text)}
                                    startValue={config().new.socket.backend.toString()}
                                />
                            </div>
                        </Show>
                    </div>
                    <Show when={versions()}>
                        <div class="settings-page-container">
                            <div class="settings-page-title">{t("settings.devmode.information")}</div>
                            <div class="settings-setting-container">
                                <span>{t("settings.devmode.electronver")}</span>
                                <span>{versions()!.electron}</span>
                            </div>
                            <div class="settings-setting-container">
                                <span>{t("settings.devmode.chromiumver")}</span>
                                <span>{versions()!.chrome}</span>
                            </div>
                            <div class="settings-setting-container">
                                <span>{t("settings.devmode.nodever")}</span>
                                <span>{versions()!.node}</span>
                            </div>
                        </div>
                    </Show>
                </Show>
                <Show when={category() == "extensions"}>
                    <div class="settings-page-container">
                        <div class="settings-page-title">{t("global.extensions")}</div>
                        <div class="settings-setting-container">
                            {t("settings.extensions.userplugins")}
                            <CheckBox
                                checked={config().new.plugins.userPlugins}
                                onChecked={(checked) =>
                                    handleChange('plugins.userPlugins', checked)
                                }
                            />
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            {t("settings.extensions.updatecheck")}
                            <ButtonGroup selectedValue={t(`settings.general.${config().new.plugins.pluginCheckType.toLowerCase().replaceAll(" ", "")}`)} listValues={[
                                { value: t("settings.general.onstart"), onClick: () => handleChange("plugins.pluginCheckType", "On Start") },
                                { value: t("settings.general.everyday"), onClick: () => handleChange("plugins.pluginCheckType", "Every Day") },
                                { value: t("settings.general.everyweek"), onClick: () => handleChange("plugins.pluginCheckType", "Every Week") },
                            ]}
                            />
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-setting-container">
                            {t("settings.extensions.updateplugin")}
                            <Button content={t("settings.general.checkupdate")} onClick={async () => {
                                await pluginManager().checkUpdates()
                            }} />
                        </div>
                        <div class="settings-line"></div>
                        <div class='settings-setting-container'>
                            <SettingsDrop LeftHeader={t("settings.pluginstore.store")} content={
                                <div class='settings-plugin-store-splitter'>
                                    <For each={getDatabaseOfRepo()}>
                                        {(item) => (
                                            <div class='setttings-plugin-store-container'>
                                                <div class='settings-plugin-store-image-container'>
                                                    <img src={item.icon ? item.icon : icon} class='setttings-plugin-store-image' />
                                                    <span class='setttings-plugin-store-name'>{item.name}</span>
                                                </div>
                                                <span class='setttings-plugin-store-author'>{item.author}</span>
                                                <span class='setttings-plugin-store-version'>{item.ver}</span>
                                                <span class='setttings-plugin-store-type'>{t(`settings.extensions.${item.type}`)}</span>
                                                <Button
                                                    content={t(getStatusStore(item))}
                                                    ButtonClass={`setttings-plugin-store-button ${item.installed ? "installed" : ""}`}
                                                    onClick={async () => {
                                                        if (!item.update && item.installed) return
                                                        await window.api.plugins.installUpdate(item)

                                                        await pluginManager().checkUpdates()
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </For>
                                </div>
                            } />
                        </div>
                        <div class="settings-line"></div>
                        <div class="settings-container-extensions-menu">
                            <span class='settings-container-title'>{t("settings.extensions.installed")}</span>
                            <div class="settings-container-extensions">
                                <For each={pluginList()}>
                                    {(tmp) => (
                                        <Show when={!new Set(hiddenPluginList()).has(tmp.plugin["metadata"].name)}>
                                            <SettingsPlugin
                                                active={"home" in tmp.plugin ? true : tmp.active}
                                                unHidePlugin={unHidePlugin} plugin={tmp.plugin}
                                                hidePlugin={hidePlayerPlugin}
                                                // pluginSettings={openPluginSettings}
                                                setActivePlugin={setActivePlugin}
                                            />
                                        </Show>
                                    )}
                                </For>
                            </div>

                            <Show when={hiddenPluginList().length > 0}>
                                <span class='settings-container-title'>{t("settings.extensions.hidden")}</span>
                                <div class="settings-container-extensions">
                                    <For each={pluginList()}>
                                        {(tmp) => (
                                            <Show when={new Set(hiddenPluginList()).has(tmp.plugin["metadata"].name)}>
                                                <SettingsPlugin isHidden
                                                    unHidePlugin={unHidePlugin}
                                                    active={tmp.active}
                                                    plugin={tmp.plugin}
                                                    hidePlugin={hidePlayerPlugin}
                                                    // pluginSettings={openPluginSettings}
                                                    setActivePlugin={setActivePlugin}
                                                />
                                            </Show>
                                        )}
                                    </For>
                                </div>
                            </Show>
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
                        <div class="settings-setting-container"><div class="settings-user-title">TheCrabeuh</div>  {t("credits.TheCrabeuh")}</div>
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
