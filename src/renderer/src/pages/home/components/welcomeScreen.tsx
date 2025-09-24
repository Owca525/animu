import "./css/welcomeScreen.css"
import { t } from "i18next"
import icon from "../../../../../../resources/icon.png"
import Button from "@renderer/components/buttons"
import Dropdown from "@renderer/components/dropDown"
import i18n from "@renderer/utils/i18n"
import { SettingsConfig } from "@renderer/utils/GlobalInterface"
import { useSelector } from "react-redux"
import { useState } from "react"

const WelcomeScreen: React.FC<{}> = () => {
    // TODO: ADD WELCOME SCREEN
    const config: SettingsConfig = useSelector((data: any) => data.config);
    const [currentPage, setPage] = useState<"lang" | "plugins">("lang")

    function setConfig() {
        
    }

    return (
        <main tabIndex={-1} className="welcome-screen-void">
            <div className="welcome-screen-content">
                <div className="welcome-screen-header-container">
                    <div className="welcome-screen-title">Welcome To Animu</div>
                    <img src={icon} alt="animu icon" className="welcome-screen-main-icon" />
                </div>
                <div className="welcome-screen-option-container">
                    {currentPage == "lang" &&
                        <>
                            <div className="welcome-screen-option-description">Select language</div>
                            <Dropdown
                                options={Object.keys(i18n.store.data).map(element => {
                                    return { label: t(`lang.${element}`), onClick: () => "" }
                                })}
                                buttonText={t(`lang.${config.General.language}`)}
                                placeholderChange={() => t(`lang.${config.General.language}`)}
                                disableX
                            />
                        </>
                    }
                    {currentPage == "plugins" &&
                        <>
                            <div className="welcome-screen-option-description">Select Plugin</div>
                            <Dropdown
                                options={Object.keys(i18n.store.data).map(element => {
                                    return { label: t(`lang.${element}`), onClick: () => "" }
                                })}
                                buttonText={t(`lang.${config.General.language}`)}
                                placeholderChange={() => t(`lang.${config.General.language}`)}
                                disableX
                            />
                        </>
                    }
                </div>
                <div className="welcome-screen-button-container">
                    {currentPage == "lang" &&
                        <Button content="Skip" onClick={() => setPage(() => "plugins")} />
                    }
                    {currentPage == "plugins" &&
                        <Button content="Exit" />
                    }
                    <Button content="Next" />
                </div>
            </div>
        </main>
    )
}

export default WelcomeScreen
