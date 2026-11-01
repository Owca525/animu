import "./css/welcomeScreen.css"
import icon from "@resources/icon.png"
import Button from "@renderer/components/buttons"
import Dropdown from "@renderer/components/dropDown"
import { createSignal, Match, Show, Switch } from "solid-js"
import { useI18n } from "@renderer/utils/i18n"
import { getConfig } from "@renderer/utils/stores/config"

export default function WelcomeScreen() {
    const config = getConfig()

    const [page, setPage] = createSignal(1)

    // const { t, changeLanguage, listLang } = useI18n()

    return (
        <main class="welcomescreen-void">

            <div class="welcomescreen-container">

                <div class="welcomescreen-left">
                    <sheep-img src={icon} class="welcomescreen-img" />
                </div>

                <div class="welcomescreen-right">

                    <Switch>
                        <Match when={page() == 1}>
                            Test
                        </Match>
                    </Switch>

                    <div class="welcomescreen-buttons">
                        <Button content="Skip" />
                        <Button content="Next" />
                    </div>

                </div>

            </div>

        </main>
    )
}