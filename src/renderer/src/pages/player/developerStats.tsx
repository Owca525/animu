import { playerData } from "@renderer/utils/GlobalInterface"


interface developerStatsProps {
    isMuted: boolean
    isVisible: boolean
    isWaitingPlayer: boolean
    isPlaying: boolean
    isFullscreen: boolean
    ListResolution: number[]
    currentResolution: string | number
    timeNextEpisode: number
    isUpNextEpisode: boolean
    isHideUpNextEpisode: boolean
    episodes: string[]
    episode: {
        type: string;
        ep: string;
    }
    PlayerVolume: number
    time: number
    episodesUrl: playerData[]
    currentHost: string
    currentSettings: string
    showNerdStats: boolean
    hls: any
}

const developerStats: React.FC<developerStatsProps> = ({ isMuted, isVisible, isWaitingPlayer, isPlaying, isFullscreen, ListResolution,
    currentResolution, timeNextEpisode, isHideUpNextEpisode, isUpNextEpisode, episodes, episode, PlayerVolume, time, episodesUrl, currentHost,
    currentSettings, showNerdStats, hls
 }) => {
    return (
        <div className="player-dev-container">
            <div className="player-dev-header">States</div>
            <div className="player-dev-text">isMuted: <span className="player-dev-text">{isMuted.toString()}</span></div>
            <div className="player-dev-text">isVisible: <span className="player-dev-text">{isVisible.toString()}</span></div>
            <div className="player-dev-text">isWaitingPlayer: <span className="player-dev-text">{isWaitingPlayer.toString()}</span></div>
            <div className="player-dev-text">isPlaying: <span className="player-dev-text">{isPlaying.toString()}</span></div>
            <div className="player-dev-text">isFullscreen: <span className="player-dev-text">{isFullscreen.toString()}</span></div>
            <div className="player-dev-header">Resolution</div>
            <div className="player-dev-text">ListResolution: <span className="player-dev-text">{ListResolution.toString()}</span></div>
            <div className="player-dev-text">currentResolution: <span className="player-dev-text">{currentResolution.toString()}</span></div>
            <div className="player-dev-header">Up Next</div>
            <div className="player-dev-text">timeNextEpisode: <span className="player-dev-text">{timeNextEpisode.toString()}</span></div>
            <div className="player-dev-text">isUpNextEpisode: <span className="player-dev-text">{isUpNextEpisode.toString()}</span></div>
            <div className="player-dev-text">isHideUpNextEpisode: <span className="player-dev-text">{isHideUpNextEpisode.toString()}</span></div>
            <div className="player-dev-header">Data</div>
            <div className="player-dev-text">episodes: <span className="player-dev-text">{episodes.toString()}</span></div>
            <div className="player-dev-text">episode: <span className="player-dev-text">{episode.ep}, {episode.type}</span></div>
            <div className="player-dev-text">PlayerVolume: <span className="player-dev-text">{PlayerVolume.toString()}</span></div>
            <div className="player-dev-text">time: <span className="player-dev-text">{time.toString()}</span></div>
            <div className="player-dev-text">episodesUrl: <span className="player-dev-text">{episodesUrl.length}</span></div>
            <div className="player-dev-header">Other</div>
            <div className="player-dev-text">currentHost: <span className="player-dev-text">{currentHost.toString()}</span></div>
            <div className="player-dev-text">currentSettings: <span className="player-dev-text">{currentSettings.toString()}</span></div>
            <div className="player-dev-text">showNerdStats: <span className="player-dev-text">{showNerdStats.toString()}</span></div>
            <div className="player-dev-text">hls: <span className="player-dev-text">{hls ? hls.toString() : "null"}</span></div>
        </div>
    )
}

export default developerStats