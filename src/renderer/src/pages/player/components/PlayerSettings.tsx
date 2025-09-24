import { useState } from "react"
import "./css/playersettings.css"
import { isNumberString } from "@renderer/utils/functions"
import { motion } from "framer-motion"
import { t } from "i18next"

interface playerSettingsProps {
    sources: { name: string, change: () => void }[]
    resolution: { res: string, change: () => void }[]
    speed: { speed: number, change: () => void }[]
    subtitles: { sub: string, change: () => void }[]
    audioTrack: { track: string, change: () => void }[]
    disableSettings: () => void
    current: {
        currentHost: string,
        currentResolution: string,
        currentSpeed: number,
        currentSub: string,
        currentTrack: string
    }
    state: boolean
}

const PlayerSettings: React.FC<playerSettingsProps> = ({ sources, resolution, speed, disableSettings, current, subtitles, audioTrack, state }) => {
    const [currentSettings, setcurrentSettings] = useState<string>("settings")

    function reset(func: () => void) {
        func()
        disableSettings()
        setcurrentSettings("settings")
    }

    const settingsContainerVariants = {
        initial: { opacity: 0, x: 100, display: "none", position: "absolute" },
        visible: { opacity: 1, x: 0, display: "", position: "" },
    };

    return (
        <motion.div initial={{ opacity: 0, display: "none" }} animate={state ? { opacity: 1, display: "" } : { opacity: 0, display: "none" }} transition={{ duration: 0.2 }} className="player-settings-container">
            <motion.div
                variants={settingsContainerVariants} initial={"initial"} animate={currentSettings === "settings" ? "visible" : "initial"} transition={{ duration: 0.1 }}
                className="player-settings-content"
            >
                <div tabIndex={-1} className="player-settings-button" onClick={() => sources.length > 1 ? setcurrentSettings("source") : ""}>
                    <div tabIndex={-1} className="player-settings-button-icon-container">
                        <span className="material-symbols-outlined">web</span>
                        <span className='player-settings-button-text'>{t("player.settings.source")}</span>
                    </div>
                    <span className={`player-settings-button-text ${sources.length <= 1 && "player-settings-button-text-gray"}`}>
                        {current.currentHost}
                    </span>
                </div>
                <div tabIndex={-1} className="player-settings-button" onClick={() => resolution.length > 1 ? setcurrentSettings("res") : ""}>
                    <div tabIndex={-1} className="player-settings-button-icon-container">
                        <span className="material-symbols-outlined">instant_mix</span>
                        <span className='player-settings-button-text'>{t("player.settings.resolution")}</span>
                    </div>
                    <span className={`player-settings-button-text ${resolution.length <= 1 && "player-settings-button-text-gray"}`}>
                        {isNumberString(current.currentResolution) ? current.currentResolution + "p" : current.currentResolution}
                    </span>
                </div>
                <div tabIndex={-1} className="player-settings-button" onClick={() => audioTrack.length > 1 ? setcurrentSettings("track") : ""}>
                    <div tabIndex={-1} className="player-settings-button-icon-container">
                        <span className="material-symbols-outlined">music_note</span>
                        <span className='player-settings-button-text'>{t("player.settings.audio")}</span>
                    </div>
                    <span className={`player-settings-button-text ${audioTrack.length <= 1 && "player-settings-button-text-gray"}`}>
                        {current.currentTrack}
                    </span>
                </div>
                <div tabIndex={-1} className="player-settings-button" onClick={() => subtitles.length >= 1 ? setcurrentSettings("sub") : ""}>
                    <div tabIndex={-1} className="player-settings-button-icon-container">
                        <span className="material-symbols-outlined">subtitles</span>
                        <span className='player-settings-button-text'>{t("player.settings.subtitles")}</span>
                    </div>
                    <span className={`player-settings-button-text ${subtitles.length <= 0 && "player-settings-button-text-gray"}`}>
                        {current.currentSub}
                    </span>
                </div>
                <div tabIndex={-1} className="player-settings-button" onClick={() => setcurrentSettings("speed")}>
                    <div tabIndex={-1} className="player-settings-button-icon-container">
                        <span className="material-symbols-outlined">speed</span>
                        <span className='player-settings-button-text'>{t("player.settings.speed")}</span>
                    </div>
                    <span className="player-settings-button-text">
                        {current.currentSpeed + "x"}
                    </span>
                </div>
            </motion.div>
            <motion.div
                variants={settingsContainerVariants} initial={"initial"} animate={currentSettings === "source" ? "visible" : "initial"} transition={{ duration: 0.1 }}
            >
                <div tabIndex={-1} className="player-settings-button-back" onClick={() => setcurrentSettings("settings")}>
                    <span tabIndex={-1} className="material-symbols-outlined">arrow_back</span><span>{t("player.settings.source")}</span>
                </div>
                {sources.map((data) =>
                    <div tabIndex={-1} className="player-settings-button" onClick={() => reset(data.change)}>
                        <span tabIndex={-1} className="player-settings-button-text">{data.name}</span>
                    </div>
                )}
            </motion.div>
            <motion.div
                variants={settingsContainerVariants} initial={"initial"} animate={currentSettings === "res" ? "visible" : "initial"} transition={{ duration: 0.1 }}
            >
                <div tabIndex={-1} className="player-settings-button-back" onClick={() => setcurrentSettings("settings")}>
                    <span tabIndex={-1} className="material-symbols-outlined">arrow_back</span><span>{t("player.settings.resolution")}</span>
                </div>
                {resolution.map((data) =>
                    <div tabIndex={-1} className="player-settings-button" onClick={() => reset(data.change)}>
                        <span tabIndex={-1} className="player-settings-button-text">{isNumberString(data.res) ? data.res + "p" : data.res}</span>
                    </div>
                )}
            </motion.div>
            <motion.div
                variants={settingsContainerVariants} initial={"initial"} animate={currentSettings === "sub" ? "visible" : "initial"} transition={{ duration: 0.1 }}
            >
                <div tabIndex={-1} className="player-settings-button-back" onClick={() => setcurrentSettings("settings")}>
                    <span tabIndex={-1} className="material-symbols-outlined">arrow_back</span><span>{t("player.settings.subtitles")}</span>
                </div>
                {subtitles.map((data) =>
                    <div tabIndex={-1} className="player-settings-button" onClick={() => reset(data.change)}>
                        <span tabIndex={-1} className="player-settings-button-text">{data.sub}</span>
                    </div>
                )}
            </motion.div>
            <motion.div
                variants={settingsContainerVariants} initial={"initial"} animate={currentSettings === "track" ? "visible" : "initial"} transition={{ duration: 0.1 }}
            >
                <div tabIndex={-1} className="player-settings-button-back" onClick={() => setcurrentSettings("settings")}>
                    <span tabIndex={-1} className="material-symbols-outlined">arrow_back</span><span>{t("player.settings.audio")}</span>
                </div>
                {audioTrack.map((data) =>
                    <div tabIndex={-1} className="player-settings-button" onClick={() => reset(data.change)}>
                        <span tabIndex={-1} className="player-settings-button-text">{data.track}</span>
                    </div>
                )}
            </motion.div>
            <motion.div
                variants={settingsContainerVariants} initial={"initial"} animate={currentSettings === "speed" ? "visible" : "initial"} transition={{ duration: 0.1 }}
            >
                <div tabIndex={-1} className="player-settings-button-back" onClick={() => setcurrentSettings("settings")}>
                    <span tabIndex={-1} className="material-symbols-outlined">arrow_back</span><span>{t("player.settings.speed")}</span>
                </div>
                {speed.map((data) =>
                    <div tabIndex={-1} className="player-settings-button" onClick={() => { data.change(); setcurrentSettings("settings") }}>
                        <span tabIndex={-1} className="player-settings-button-text">{data.speed.toString() + "x"}</span>
                    </div>
                )}
            </motion.div>
        </motion.div>
    )
}

export default PlayerSettings
