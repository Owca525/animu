import "./css/welcomeScreen.css"
import icon from "@resources/icon.png"
import Button from "@renderer/components/buttons"
import Dropdown from "@renderer/components/dropDown"
import { createSignal, Show } from "solid-js"
import { useI18n } from "@renderer/utils/i18n"
import { getConfig } from "@renderer/utils/stores/config"

export default function WelcomeScreen() {
    const config = getConfig()
    const [currentPage, setCurrentPage] = createSignal<number>(0)
    const { t, changeLanguage, listLang } = useI18n()

    return (
        <main tabIndex={-1} class="welcome-screen-void">
            <div class="welcome-screen-content">
                <div class="welcome-screen-header-container">
                    <div class="welcome-screen-title">Welcome To Animu</div>
                    <img src={icon} alt="animu icon" class="welcome-screen-main-icon" />
                </div>
                <div class="welcome-screen-option-container">
                    <Show when={currentPage() == 0}>
                        <div class="welcome-screen-option-description">Select language</div>
                        <Dropdown
                            options={listLang().map(element => {
                                return { label: t(`lang.${element}`) }
                            })}
                            buttonText={t(`lang.${config.General.language}`)}
                            placeholderChange={() => t(`lang.${config.General.language}`)}
                            disableX
                        />
                    </Show>
                    <Show when={currentPage() == 1}>
                        <div class="welcome-screen-option-description">Select Default Plugin</div>
                        {/* <Dropdown
                            options={Object.keys(i18n.store.data).map(element => {
                                return { label: t(`lang.${element}`), onClick: () => "" }
                            })}
                            buttonText={t(`lang.${config.General.language}`)}
                            placeholderChange={() => t(`lang.${config.General.language}`)}
                            disableX
                        /> */}
                    </Show>
                </div>
                <div class="welcome-screen-button-container">
                    {/* <Show when={}>
                        <Button content="Skip" onClick={() => setCurrentPage(() => "plugins")} />
                    </Show> */}
                    <Show when={currentPage() == 1}>
                        <Button content="Exit" />
                    </Show>
                    <Button content="Next" onClick={() => setCurrentPage((v) => v + 1)} />
                </div>
            </div>
        </main>
    )
}