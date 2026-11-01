import "./css/welcomeScreen.css"
import icon from "@resources/icon.png"
import Button from "@renderer/components/buttons"
import Dropdown from "@renderer/components/dropDown"
import { createSignal, Match, Show, Switch } from "solid-js"
import { useI18n } from "@renderer/utils/i18n"
import { getConfig } from "@renderer/utils/stores/config"
import ButtonGroup from "@renderer/pages/settings/components/buttonGroup"
import CheckBox from "@renderer/components/checkBox"

export default function WelcomeScreen() {
    const config = getConfig()

    const [page, setPage] = createSignal(1)

    const { t, changeLanguage, listLang } = useI18n()

    function handleChange(arg0: string, arg1: string): void {
        
    }

    return (
        <main class="welcomescreen-void">

            <div class="welcomescreen-container">

                <div class="welcomescreen-left">
                    <sheep-img src={icon} class="welcomescreen-img" />
                </div>

                <div class="welcomescreen-right">

                    <Switch>
                        <Match when={page() == 1}>

                            <div class="welcomescreen-text">
                                <span class="welcomescreen-title">Welcome To The Animu</span>
                                <span class="welcomescreen-desc">Select Basic Options</span>
                            </div>

                            <div class="welcomescreen-content">
                                
                                <div class="welcomescreen-option">
                                    <span>{t("settings.general.language")}</span>

                                    <Dropdown
                                        options={listLang().map(element => {
                                            return { label: t(`lang.${element}`), onClick: () => changeLanguage(element) }
                                        })}
                                        buttonText={t(`lang.${config.General.language}`)}
                                        placeholderChange={() => t(`lang.${config.General.language}`)}
                                        disableX
                                    />
                                </div>

                                <div class="welcomescreen-option">
                                    <span>{t("animu.format_title")}</span>
                                    <ButtonGroup selectedValue={t(`anilist.titles.${config.anilist.titleFormat}`)} listValues={[
                                        { value: t("anilist.titles.ROMAJI"), onClick: () => handleChange("anilist.titleFormat", "ROMAJI") },
                                        { value: t("anilist.titles.NATIVE"), onClick: () => handleChange("anilist.titleFormat", "NATIVE") },
                                        { value: t("anilist.titles.ENGLISH"), onClick: () => handleChange("anilist.titleFormat", "ENGLISH") },
                                    ]}/>
                                </div>

                                <div class="welcomescreen-option">
                                    <span>{t("settings.general.updates")}</span>
                                    <CheckBox
                                        checked={config.update.enable}
                                    />
                                </div>

                                <div class="welcomescreen-option">
                                    <span>{t("settings.general.tray")}</span>
                                    <CheckBox
                                        checked={config.General.Window.trayIconClose}
                                    />
                                </div>

                            </div>
                    
                        </Match>
                    </Switch>

                    <div class="welcomescreen-buttons">
                        <Button content="Skip" ButtonClass="welcomescreen-button"/>
                        <Button content="Next" ButtonClass="welcomescreen-button next"/>
                    </div>

                </div>

            </div>

        </main>
    )
}