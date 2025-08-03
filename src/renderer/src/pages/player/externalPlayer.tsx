

import Button from "@renderer/components/buttons"
import "./components/css/externalPlayer.css"
import Drop from "../information/components/drop"
import { cardData, playerData } from "@renderer/utils/GlobalInterface"
import { detectTitle } from "@renderer/utils/functions"

interface ExternalplayerProps {
    animeData: cardData
    playerData: playerData[]
    time: number
    setNextEpisode: (value: string) => void
    now_episodes: { episode: string, type: string, episodes: Array<string> }
}

const ExternalPlayer: React.FC<ExternalplayerProps> = ({ animeData, now_episodes, playerData }) => {

    function makeButtons(episode: string[]) {
        return (
            <div className='information-buttons-episode-container'>
                {episode.map((num) => (
                    <div className='information-episode-button'>{num}</div>
                ))}
            </div>
        )
    }

    async function RunMocian() {
        let url = playerData[0].resolution[0].url
        console.log(await window.api.request.get(`http://localhost:42000/showtime/open?url=${encodeURIComponent(url)}`, {}))
    }

    console.log(playerData)

    return (
        <div className="external-player-container">
            <div className="video-top">
                <Button icon="arrow_back" ButtonClass="player-buttons" />
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
                    <Button icon='skip_previous' ButtonClass="player-buttons" />
                    <Button icon='replay' ButtonClass="player-buttons" onClick={RunMocian} />
                    <Button icon='skip_next' ButtonClass="player-buttons" />
                </div>
                <Drop content={makeButtons(now_episodes.episodes)} LeftHeader={"Episodes"} RightHeader={""} />
            </div>
        </div>
    )
}

export default ExternalPlayer