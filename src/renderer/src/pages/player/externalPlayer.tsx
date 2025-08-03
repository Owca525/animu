

import Button from "@renderer/components/buttons"
import "./components/css/externalPlayer.css"
import { cardData, notificationProps, playerData } from "@renderer/utils/GlobalInterface"
import { detectTitle } from "@renderer/utils/functions"
import { useEffect } from "react"
import { toast } from "react-toastify"
import { useNavigate } from "react-router-dom"

interface ExternalplayerProps {
    animeData: cardData
    playerData: playerData[]
    time: number
    setNextEpisode: (value: string) => void
    now_episodes: { episode: string, type: string, episodes: Array<string> }
}

const ExternalPlayer: React.FC<ExternalplayerProps> = ({ animeData, now_episodes, playerData, setNextEpisode }) => {
    const navigate = useNavigate()

    async function RunMovian() {
        let url = playerData[0].resolution[0].url
        let req = await window.api.request.get(`http://localhost:42000/showtime/open?url=${encodeURIComponent(url)}`, {})
        if (!req.success) {
            toast.error("Failed Run Movian", notificationProps)
        } 
    }

    console.log(playerData)

    function setEpisode(type: "next" | "prev") {
        let ep = now_episodes.episodes.indexOf(now_episodes.episode)
        if (type == 'prev') ep = ep - 1
        if (type == 'next') ep = ep + 1
        if (now_episodes.episodes[ep] === undefined) return
        setNextEpisode(ep.toString())
    }

    useEffect(() => {
        RunMovian()
    }, [])

    return (
        <div className="external-player-container">
            <div className="video-top">
                <Button icon="arrow_back" ButtonClass="player-buttons" onClick={() => navigate("/")} />
                <div className="player-title">{detectTitle({
                    ...animeData, saveData: {
                        episode: now_episodes.episode,
                        pluginName: "",
                        last_Time: 0,
                        type: ""
                    }
                })}</div>
                <div className="external-dropdown"> <div className="dropdown-container"><div className="dropdown-button">test</div></div> </div>
            </div>
            <div className="external-player-center">
                <div className="external-button-container">
                    <Button icon='skip_previous' ButtonClass="player-buttons" onClick={() => setEpisode("prev")} />
                    <Button icon='replay' ButtonClass="player-buttons" onClick={RunMovian} />
                    <Button icon='skip_next' ButtonClass="player-buttons" onClick={() => setEpisode("next")} />
                </div>
            </div>
            <div className="external-episodes-container">
                <div className="external-episodes-title">Episodes:</div>
                <div className="external-episodes">
                    {now_episodes.episodes.map((num) => (
                        <div className='information-episode-button' onClick={() => setNextEpisode(num)}>{num}</div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default ExternalPlayer