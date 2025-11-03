import { Component } from "solid-js";
import "./css/playerEpisodeElement.css"

interface playerEpisodeElementProps {
    animeTitle: string,
    episodes: {
        ep: string;
        img?: string;
        title?: string;
    }
    currentEpisode: string,
    nextEpisode: (num: string) => void
}

const PlayerEpisodeElement: Component<playerEpisodeElementProps> = ({ episodes, animeTitle, currentEpisode, nextEpisode }) => {
    return (
        <div class="player-episode-element-background" style={{"background-image": `url(${episodes.img})` }}>
            <div class="player-episode-element-container" onClick={() => nextEpisode(episodes.ep)} >
                <span class="material-symbols-outlined player-episode-element-icon">{episodes.ep == currentEpisode ? "pause" : "play_arrow"}</span>
                <span class="player-episode-element-title">{animeTitle}</span>
                <span class="player-epsisode-element-end">Ep. {episodes.ep}</span>
            </div>
        </div>
    )
}

export default PlayerEpisodeElement
