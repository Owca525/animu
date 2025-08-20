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

const PlayerEpisodeElement: React.FC<playerEpisodeElementProps> = ({ episodes, animeTitle, currentEpisode, nextEpisode }) => {
    return (
        <div className="player-episode-element-background" style={{ backgroundImage: `url(${episodes.img})` }}>
            <div className="player-episode-element-container" onClick={() => nextEpisode(episodes.ep)} >
                <span className="material-symbols-outlined player-episode-element-icon">{episodes.ep == currentEpisode ? "pause" : "play_arrow"}</span>
                <span className="player-episode-element-title">{animeTitle}</span>
                <span className="player-epsisode-element-end">Ep. {episodes.ep}</span>
            </div>
        </div>
    )
}

export default PlayerEpisodeElement
