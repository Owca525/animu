import { useState } from "react"
import "./css/playersettings.css"

interface playerSettingsProps {
    sources: { name: string, change: () => void }[]
    resolution: { res: number, change: () => void }[]
    speed: { speed: number, change: () => void }[]
    disableSettings: () => void
    current: {
        currentHost: string,
        currentResolution: string | number,
        currentSpeed: number,
    }
}

const PlayerSettings: React.FC<playerSettingsProps> = ({ sources, resolution, speed, disableSettings, current }) => {
    const [currentSettings, setcurrentSettings] = useState<string>("settings")

    function reset(func: () => void) {
        func()
        disableSettings()
        setcurrentSettings("settings")
    }

    return (
        <div className="player-settings-container">
            {currentSettings === "settings" &&
                <>
                    <div className="player-settings-button" onClick={() => sources.length > 1 ? setcurrentSettings("source") : ""}>
                        <span className='player-settings-button-text'>Source</span> <span className={`player-settings-button-text ${sources.length <= 1 && "player-settings-button-text-gray"}`}>{current.currentHost}</span>
                    </div>
                    <div className="player-settings-button" onClick={() => resolution.length > 1 ? setcurrentSettings("res") : ""}>
                        <span className='player-settings-button-text'>Resolution</span> <span className={`player-settings-button-text ${resolution.length <= 1 && "player-settings-button-text-gray"}`}>{current.currentResolution + "p"}</span>
                    </div>
                    <div className="player-settings-button" onClick={() => setcurrentSettings("speed")}>
                        <span className='player-settings-button-text'>Speed</span> <span className="player-settings-button-text">{current.currentSpeed + "x"}</span>
                    </div>
                </>
            }
            {currentSettings === "source" &&
                <>
                    <div className="player-settings-button-back" onClick={() => setcurrentSettings("settings")}>
                        <span className="material-symbols-outlined">arrow_back</span><span>Source</span>
                    </div>
                    {sources.map((data) =>
                        <div className="player-settings-button" onClick={() => reset(data.change)}>
                            <span className="player-settings-button-text">{data.name}</span>
                        </div>
                    )}
                </>
            }
            {currentSettings === "res" &&
                <>
                    <div className="player-settings-button-back" onClick={() => setcurrentSettings("settings")}>
                        <span className="material-symbols-outlined">arrow_back</span><span>Resolution</span>
                    </div>
                    {resolution.map((data) =>
                        <div className="player-settings-button" onClick={() => reset(data.change)}>
                            <span className="player-settings-button-text">{data.res.toString() + "p"}</span>
                        </div>
                    )}
                </>
            }
            {currentSettings === "speed" &&
                <>
                    <div className="player-settings-button-back" onClick={() => setcurrentSettings("settings")}>
                        <span className="material-symbols-outlined">arrow_back</span><span>Speed</span>
                    </div>
                    {speed.map((data) =>
                        <div className="player-settings-button" onClick={() => { data.change(); setcurrentSettings("settings") }}>
                            <span className="player-settings-button-text">{data.speed.toString() + "x"}</span>
                        </div>
                    )}
                </>
            }
        </div>
    )
}

export default PlayerSettings
