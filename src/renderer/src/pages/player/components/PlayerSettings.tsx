import { useState } from "react"
import "./css/playersettings.css"

interface playerSettingsProps {
    sources: { name: string, change: () => void }[]
    resolution: { res: string, change: () => void }[]
    speed: { speed: number, change: () => void }[]
}

const PlayerSettings: React.FC<playerSettingsProps> = () => {
    const [currentSettings, setcurrentSettings] = useState<string>("")

    return (
        <div className="player-settings-container">
            { currentSettings === "source" && 
                <>
                    <div className="player-settings-button-back">
                        <span className="material-symbols-outlined">arrow_back</span><span>Source</span>
                    </div>
                </>
            }
            { currentSettings === "res" && 
                <>
                    <div className="player-settings-button-back">
                        <span className="material-symbols-outlined">arrow_back</span><span>Resolution</span>
                    </div>
                </>
            }
            { currentSettings === "speed" &&
                <>
                    <div className="player-settings-button-back">
                        <span className="material-symbols-outlined">arrow_back</span><span>Speed</span>
                    </div>
                </>
            }
        </div>
    )
}

export default PlayerSettings
