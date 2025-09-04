import { useState } from "react"
import "./css/playersettings.css"

interface playerSettingsProps {
    sources: { name: string, change: () => void }[]
    resolution: { res: number, change: () => void }[]
    speed: { speed: number, change: () => void }[]
    subtitles: { sub: string, change: () => void }[]
    audioTrack: { track: string, change: () => void }[]
    disableSettings: () => void
    current: {
        currentHost: string,
        currentResolution: string | number,
        currentSpeed: number,
        currentSub: string,
        currentTrack: string
    }
}

const PlayerSettings: React.FC<playerSettingsProps> = ({ sources, resolution, speed, disableSettings, current, subtitles, audioTrack }) => {
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
                    <div tabIndex={-1} className="player-settings-button" onClick={() => sources.length > 1 ? setcurrentSettings("source") : ""}>
                        <div tabIndex={-1} className="player-settings-button-icon-container"><span className="material-symbols-outlined">web</span><span className='player-settings-button-text'>Source</span></div> <span className={`player-settings-button-text ${sources.length <= 1 && "player-settings-button-text-gray"}`}>{current.currentHost}</span>
                    </div>
                    <div tabIndex={-1} className="player-settings-button" onClick={() => resolution.length > 1 ? setcurrentSettings("res") : ""}>
                        <div tabIndex={-1} className="player-settings-button-icon-container"><span className="material-symbols-outlined">instant_mix</span><span className='player-settings-button-text'>Resolution</span></div><span className={`player-settings-button-text ${resolution.length <= 1 && "player-settings-button-text-gray"}`}>{current.currentResolution + "p"}</span>
                    </div>
                    <div tabIndex={-1} className="player-settings-button" onClick={() => resolution.length > 1 ? setcurrentSettings("track") : ""}>
                        <div tabIndex={-1} className="player-settings-button-icon-container"><span className="material-symbols-outlined">music_note</span><span className='player-settings-button-text'>Audio</span></div><span className={`player-settings-button-text ${audioTrack.length <= 1 && "player-settings-button-text-gray"}`}>{current.currentTrack}</span>
                    </div>
                    <div tabIndex={-1} className="player-settings-button" onClick={() => resolution.length > 1 ? setcurrentSettings("sub") : ""}>
                        <div tabIndex={-1} className="player-settings-button-icon-container"><span className="material-symbols-outlined">subtitles</span><span className='player-settings-button-text'>Subtitles</span></div><span className={`player-settings-button-text ${subtitles.length <= 0 && "player-settings-button-text-gray"}`}>{current.currentSub}</span>
                    </div>
                    <div tabIndex={-1} className="player-settings-button" onClick={() => setcurrentSettings("speed")}>
                        <div tabIndex={-1} className="player-settings-button-icon-container"><span className="material-symbols-outlined">speed</span><span className='player-settings-button-text'>Speed</span></div> <span className="player-settings-button-text">{current.currentSpeed + "x"}</span>
                    </div>
                </>
            }
            {currentSettings === "source" &&
                <>
                    <div tabIndex={-1} className="player-settings-button-back" onClick={() => setcurrentSettings("settings")}>
                        <span tabIndex={-1} className="material-symbols-outlined">arrow_back</span><span>Source</span>
                    </div>
                    {sources.map((data) =>
                        <div tabIndex={-1} className="player-settings-button" onClick={() => reset(data.change)}>
                            <span tabIndex={-1} className="player-settings-button-text">{data.name}</span>
                        </div>
                    )}
                </>
            }
            {currentSettings === "res" &&
                <>
                    <div tabIndex={-1} className="player-settings-button-back" onClick={() => setcurrentSettings("settings")}>
                        <span tabIndex={-1} className="material-symbols-outlined">arrow_back</span><span>Resolution</span>
                    </div>
                    {resolution.map((data) =>
                        <div tabIndex={-1} className="player-settings-button" onClick={() => reset(data.change)}>
                            <span tabIndex={-1} className="player-settings-button-text">{data.res.toString() + "p"}</span>
                        </div>
                    )}
                </>
            }
            {currentSettings === "sub" &&
                <>
                    <div tabIndex={-1} className="player-settings-button-back" onClick={() => setcurrentSettings("settings")}>
                        <span tabIndex={-1} className="material-symbols-outlined">arrow_back</span><span>Subtitles</span>
                    </div>
                    {subtitles.map((data) =>
                        <div tabIndex={-1} className="player-settings-button" onClick={() => reset(data.change)}>
                            <span tabIndex={-1} className="player-settings-button-text">{data.sub}</span>
                        </div>
                    )}
                </>
            }
            {currentSettings === "track" &&
                <>
                    <div tabIndex={-1} className="player-settings-button-back" onClick={() => setcurrentSettings("settings")}>
                        <span tabIndex={-1} className="material-symbols-outlined">arrow_back</span><span>Audio</span>
                    </div>
                    {audioTrack.map((data) =>
                        <div tabIndex={-1} className="player-settings-button" onClick={() => reset(data.change)}>
                            <span tabIndex={-1} className="player-settings-button-text">{data.track}</span>
                        </div>
                    )}
                </>
            }
            {currentSettings === "speed" &&
                <>
                    <div tabIndex={-1} className="player-settings-button-back" onClick={() => setcurrentSettings("settings")}>
                        <span tabIndex={-1} className="material-symbols-outlined">arrow_back</span><span>Speed</span>
                    </div>
                    {speed.map((data) =>
                        <div tabIndex={-1} className="player-settings-button" onClick={() => { data.change(); setcurrentSettings("settings") }}>
                            <span tabIndex={-1} className="player-settings-button-text">{data.speed.toString() + "x"}</span>
                        </div>
                    )}
                </>
            }
        </div>
    )
}

export default PlayerSettings
