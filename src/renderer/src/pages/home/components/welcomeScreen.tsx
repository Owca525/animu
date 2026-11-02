import "./css/welcomeScreen.css"
import icon from "@resources/icon.png"
import Button from "@renderer/components/buttons"
import Dropdown from "@renderer/components/dropDown"
import { createSignal, For, Match, onMount, Show, Switch } from "solid-js"
import { useI18n } from "@renderer/utils/i18n"
import { getConfig } from "@renderer/utils/stores/config"
import ButtonGroup from "@renderer/pages/settings/components/buttonGroup"
import CheckBox from "@renderer/components/checkBox"
import { createStore, unwrap } from "solid-js/store"
import { discord_server, GetLogo, openUrlFolder, updateObject } from "@renderer/utils/functions"
import { saveConfig } from "@renderer/utils/FilesManager/config"
import SeekBar from "@renderer/components/seekBar"

export default function WelcomeScreen() {
    const [page, setPage] = createSignal(1)
    const [text, setText] = createSignal<{ title: string, desc: string, img?: string, icon?: string }>({ title: "welcomescreen.animu_title", desc: "welcomescreen.animu_desc", img: icon })
    const [listlng, setLNG] = createSignal<{ active: boolean, name: string }[]>([])

    const [config, updateConfig] = createStore(structuredClone(unwrap(getConfig())))

    const { t, changeLanguage, listLang } = useI18n()

    function handleChange(path: string, value: string | number | boolean | any): void {
        updateConfig(updateObject(path, value, config))
        saveConfig(config)
    }

    function ChangePage(num: number) {
        if (num == 6) return Leave()
        switch (num) {
            case 1:
                setText({ title: "welcomescreen.animu_title", desc: "welcomescreen.animu_desc", img: icon })
                break
            case 2:
                setText({ title: "welcomescreen.information_title", desc: "welcomescreen.information_desc", icon: "info" })
                break
            case 3:
                setText({ title: "welcomescreen.player_title", desc: "welcomescreen.player_desc", icon: "video_camera_back" })
                break
            case 4:
                setText({ title: "welcomescreen.plugin_title", desc: "welcomescreen.plugin_desc", icon: "apps_plus" })
                break
            case 5:
                setText({ title: "welcomescreen.support_title", desc: "welcomescreen.support_desc", img: icon })
                break
        }
        setPage(num)
    }

    function Leave() {
        handleChange("firstStart", false)
    }

    function UpdateExeptLang(data: { active: boolean, name: string }) {
        let listExeptLang = structuredClone(unwrap(config.plugins.includeOnly))

        if (data["active"]) listExeptLang = listExeptLang.filter((v) => data["name"] != v)
        else listExeptLang.push(data["name"])

        handleChange("plugins.exeptLang", listExeptLang)

        setLNG(listLang().map((v) => ({
            active: listExeptLang.includes(v),
            name: v
        })))
    }

    onMount(() => {
        try {
            if (!Array.isArray(config["plugins"]["includeOnly"])) return

            let exeptList: string[] = config["plugins"]["includeOnly"]

            setLNG(listLang().map((v) => ({
                active: exeptList.includes(v),
                name: v
            })))

        } catch (error) { }
    })

    return (
        <main class="welcomescreen-void">

            <div class="welcomescreen-container">

                <span class="welcomescreen-progress">{page()} / 5</span>

                <div class="welcomescreen-left">
                    <Show when={text()["img"]}>
                        <sheep-img src={text()["img"]} class="welcomescreen-img" />
                    </Show>
                    <Show when={text()["icon"]}>
                        <span class="material-symbols-outlined welcomescreen-icon">{text()["icon"]}</span>
                    </Show>
                </div>

                <div class="welcomescreen-right">
                    <div class="welcomescreen-text">
                        <span class="welcomescreen-title">{t(text()["title"])}</span>
                        <span class="welcomescreen-desc">{t(text()["desc"])}</span>
                    </div>

                    <Switch>
                        <Match when={page() == 1}>

                            <div class="welcomescreen-content">

                                <div class="welcomescreen-option">
                                    <span>{t("settings.general.language")}</span>

                                    <Dropdown
                                        options={listLang().map(element => {
                                            return {
                                                label: t(`lang.${element}`), onClick: () => {
                                                    changeLanguage(element)
                                                    handleChange("General.language", element)
                                                }
                                            }
                                        })}
                                        buttonText={t(`lang.${config.General.language}`)}
                                        placeholderChange={() => t(`lang.${config.General.language}`)}
                                        disableX
                                    />
                                </div>

                                <div class="welcomescreen-option">
                                    <span>{t("animu.format_title")}</span>
                                    <ButtonGroup selectedValue={t(`anilist.titles.${config.animu.titleFormat}`)} listValues={[
                                        { value: t("anilist.titles.ROMAJI"), onClick: () => handleChange("animu.titleFormat", "ROMAJI") },
                                        { value: t("anilist.titles.NATIVE"), onClick: () => handleChange("animu.titleFormat", "NATIVE") },
                                        { value: t("anilist.titles.ENGLISH"), onClick: () => handleChange("animu.titleFormat", "ENGLISH") },
                                    ]} />
                                </div>

                                <div class="welcomescreen-option">
                                    <span>{t("settings.general.updates")}</span>
                                    <CheckBox
                                        checked={config.update.enable}
                                        onChecked={(v) => handleChange("update.enable", v)}
                                    />
                                </div>

                                <div class="welcomescreen-option">
                                    <span>{t("settings.general.tray")}</span>
                                    <CheckBox
                                        checked={config.General.Window.trayIconClose}
                                        onChecked={(v) => handleChange("General.Window.trayIconClose", v)}
                                    />
                                </div>

                                <div class="welcomescreen-option">
                                    <span>{t("settings.general.recomendation")}</span>
                                    <CheckBox
                                        checked={config.animu.recomendation}
                                        onChecked={(v) => handleChange("animu.recomendation", v)}
                                    />
                                </div>

                            </div>

                        </Match>

                        <Match when={page() == 2}>

                            <div class="welcomescreen-content">

                                <div class="welcomescreen-option">
                                    {t("settings.information.always_update")}
                                    <CheckBox
                                        checked={config.information.alwaysUpdateAnime}
                                        onChecked={(checked) =>
                                            handleChange('information.alwaysUpdateAnime', checked)
                                        }
                                    />
                                </div>

                                <div class="welcomescreen-option">
                                    {t("settings.information.opening_information")}
                                    <CheckBox
                                        checked={config.information.openingininformation}
                                        onChecked={(checked) =>
                                            handleChange('information.openingininformation', checked)
                                        }
                                    />
                                </div>

                                <div class="welcomescreen-option">
                                    {t("settings.information.trailer_player_type")}
                                    <ButtonGroup selectedValue={t(`settings.information.trailertype.${config.information.trailerplayertype}`)} listValues={[
                                        { value: t("settings.information.trailertype.player"), onClick: () => handleChange("information.trailerplayertype", "player") },
                                        { value: t("settings.information.trailertype.embed"), onClick: () => handleChange("information.trailerplayertype", "embed") },
                                    ]}
                                    />
                                </div>

                                <div class="welcomescreen-option">
                                    {t("settings.information.preload_opening")}
                                    <CheckBox
                                        checked={config.information.preloadOpening}
                                        onChecked={(checked) =>
                                            handleChange('information.preloadOpening', checked)
                                        }
                                    />
                                </div>

                                <div class="welcomescreen-option">
                                    {t("settings.information.preload_trailer")}
                                    <CheckBox
                                        checked={config.information.preloadTrailer}
                                        onChecked={(checked) =>
                                            handleChange('information.preloadTrailer', checked)
                                        }
                                    />
                                </div>

                            </div>

                        </Match>

                        <Match when={page() == 3}>

                            <div class="welcomescreen-content">

                                <div class="welcomescreen-option">
                                    {t("settings.player.play")}
                                    <CheckBox
                                        checked={config.Player.general.Autoplay}
                                        onChecked={(checked) =>
                                            handleChange('Player.general.Autoplay', checked)
                                        }
                                    />
                                </div>

                                <div class="welcomescreen-option">
                                    {t("settings.player.volume")}
                                    <div class='welcomescreen-seekbar-container'>
                                        <span>0%</span>
                                        <SeekBar
                                            maxValue={100}
                                            minValue={0}
                                            type="value"
                                            currentValue={config.Player.general.Volume}
                                            onSeek={(value) => { handleChange("Player.general.Volume", parseInt(value.toFixed(0))) }}
                                        />
                                        <span>100%</span>
                                    </div>
                                </div>

                                <div class="welcomescreen-option">
                                    {t("settings.general.fullscreen")}
                                    <CheckBox
                                        checked={config.Player.general.AutoFullscreen}
                                        onChecked={(checked) =>
                                            handleChange('Player.general.AutoFullscreen', checked)
                                        }
                                    />
                                </div>

                                <div class="welcomescreen-option">
                                    {t("settings.player.skip")}
                                    <CheckBox
                                        checked={config.Player.general.AutoSkipEpisode}
                                        onChecked={(checked) =>
                                            handleChange('Player.general.AutoSkipEpisode', checked)
                                        }
                                    />
                                </div>

                                <div class="welcomescreen-option">
                                    {t("settings.player.skipOpening")}
                                    <CheckBox
                                        checked={config.Player.general.autoSkipOpenings}
                                        onChecked={(checked) =>
                                            handleChange('Player.general.autoSkipOpenings', checked)
                                        }
                                    />
                                </div>

                                <div class="welcomescreen-option">
                                    {t("settings.player.skipEnding")}
                                    <CheckBox
                                        checked={config.Player.general.autoSkipEndings}
                                        onChecked={(checked) =>
                                            handleChange('Player.general.autoSkipEndings', checked)
                                        }
                                    />
                                </div>

                            </div>

                        </Match>

                        <Match when={page() == 4}>

                            <div class="welcomescreen-content">

                                <div class="welcomescreen-option">
                                    {t("settings.extensions.userplugins")}
                                    <CheckBox
                                        checked={config.plugins.userPlugins}
                                        onChecked={(checked) =>
                                            handleChange('plugins.userPlugins', checked)
                                        }
                                    />
                                </div>

                                <div class="welcomescreen-option">
                                    {t("settings.use_worker")}
                                    <CheckBox
                                        checked={config.plugins.userWorker}
                                        onChecked={(checked) =>
                                            handleChange('plugins.userWorker', checked)
                                        }
                                    />
                                </div>

                                <div class="welcomescreen-option">
                                    {t("settings.extensions.updatecheck")}
                                    <ButtonGroup selectedValue={t(`settings.general.${config.plugins.pluginCheckType.toLowerCase().replaceAll(" ", "")}`)} listValues={[
                                        { value: t("settings.general.onstart"), onClick: () => handleChange("plugins.pluginCheckType", "On Start") },
                                        { value: t("settings.general.everyday"), onClick: () => handleChange("plugins.pluginCheckType", "Every Day") },
                                        { value: t("settings.general.everyweek"), onClick: () => handleChange("plugins.pluginCheckType", "Every Week") },
                                    ]}
                                    />
                                </div>

                                <div class="welcomescreen-option">
                                    {t("settings.extensions.includeOnly")}

                                    <div class="welcomescreen-option container">
                                        <For each={listlng()}>
                                            {(v) => (
                                                <span class={`welcomescreen-exept-plugin ${v["active"] ? "active" : ""}`} onClick={() => UpdateExeptLang(v)}>
                                                    {t(`lang.${v["name"]}`)}
                                                </span>
                                            )}
                                        </For>
                                    </div>
                                </div>

                            </div>

                        </Match>

                        <Match when={page() == 5}>

                            <div class="welcomescreen-content">
                                <div class="welcomescreen-option support">
                                    <div class="welcomescreen-support">
                                        <sheep-img
                                            class="welcomescreen-images"
                                            onClick={() => openUrlFolder("https://github.com/Owca525/animu")}
                                            src={GetLogo({ name: "github", url: "https://github.com/fluidicon.png" })}
                                            alt="Github Logo" />
                                        Github
                                    </div>

                                    <div class="welcomescreen-support">
                                        <sheep-img
                                            class="welcomescreen-images"
                                            onClick={discord_server}
                                            src={GetLogo({ name: "discord", url: "https://cdn.prod.website-files.com/6257adef93867e50d84d30e2/66e3d80db9971f10a9757c99_Symbol.svg" })}
                                            alt="Discord Logo" />
                                        Discord
                                    </div>

                                    <div class="welcomescreen-support">
                                        <sheep-img
                                            class="welcomescreen-images"
                                            onClick={() => openUrlFolder("https://buymeacoffee.com/owca525")}
                                            src={GetLogo({ name: "buymeacoffe", url: "https://cdn.buymeacoffee.com/assets/homepage/meta/apple-icon-180x180.png" })}
                                            alt="Buymeacoffee logo" />
                                        Buy Me A Coffe
                                    </div>
                                </div>
                            </div>

                        </Match>

                    </Switch>

                    <div class="welcomescreen-buttons">
                        <Show when={page() < 5}>
                            <Button content={t("welcomescreen.skip")} ButtonClass="welcomescreen-button" onClick={Leave} />
                        </Show>
                        <Button content={t(page() == 5 ? "welcomescreen.finish" : "welcomescreen.next")} ButtonClass="welcomescreen-button next" onClick={() => ChangePage(page() + 1)} />
                    </div>

                </div>

            </div>

        </main>
    )
}