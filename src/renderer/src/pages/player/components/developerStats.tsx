import { episodeMetadata, playerData } from "@renderer/utils/types"
import "./css/developerStats.css"

interface developerStatsProps {
    isMuted: boolean
    isVisible: boolean
    isWaitingPlayer: boolean
    isPlaying: boolean
    isFullscreen: boolean
    ListResolution: string[]
    currentResolution: string | number
    timeNextEpisode: number
    isUpNextEpisode: boolean
    isHideUpNextEpisode: boolean
    episodes: episodeMetadata[]
    episode: {
        type: string;
        ep: string;
    }
    PlayerVolume: number
    episodesUrl: playerData[]
    currentHost: string
    currentSettings: boolean
    showNerdStats: boolean
}

export default function developerStats(props: developerStatsProps) {
    return (
        <div class="player-dev-container">
            <div class="player-dev-header">States</div>
            <div class="player-dev-text">isMuted: <span class="player-dev-text">{props.isMuted.toString()}</span></div>
            <div class="player-dev-text">isVisible: <span class="player-dev-text">{props.isVisible.toString()}</span></div>
            <div class="player-dev-text">isWaitingPlayer: <span class="player-dev-text">{props.isWaitingPlayer.toString()}</span></div>
            <div class="player-dev-text">isPlaying: <span class="player-dev-text">{props.isPlaying.toString()}</span></div>
            <div class="player-dev-text">isFullscreen: <span class="player-dev-text">{props.isFullscreen.toString()}</span></div>
            <div class="player-dev-header">Resolution</div>
            <div class="player-dev-text">ListResolution: <span class="player-dev-text">{props.ListResolution.toString()}</span></div>
            <div class="player-dev-text">currentResolution: <span class="player-dev-text">{props.currentResolution.toString()}</span></div>
            <div class="player-dev-header">Up Next</div>
            <div class="player-dev-text">timeNextEpisode: <span class="player-dev-text">{props.timeNextEpisode.toString()}</span></div>
            <div class="player-dev-text">isUpNextEpisode: <span class="player-dev-text">{props.isUpNextEpisode.toString()}</span></div>
            <div class="player-dev-text">isHideUpNextEpisode: <span class="player-dev-text">{props.isHideUpNextEpisode.toString()}</span></div>
            <div class="player-dev-header">Data</div>
            <div class="player-dev-text">episodes: <span class="player-dev-text">{props.episodes.length}</span></div>
            <div class="player-dev-text">episode: <span class="player-dev-text">{props.episode.ep}, {props.episode.type}</span></div>
            <div class="player-dev-text">PlayerVolume: <span class="player-dev-text">{props.PlayerVolume.toString()}</span></div>
            <div class="player-dev-text">episodesUrl: <span class="player-dev-text">{props.episodesUrl.length}</span></div>
            <div class="player-dev-header">Other</div>
            <div class="player-dev-text">currentHost: <span class="player-dev-text">{props.currentHost.toString()}</span></div>
            <div class="player-dev-text">currentSettings: <span class="player-dev-text">{props.currentSettings.toString()}</span></div>
            <div class="player-dev-text">showNerdStats: <span class="player-dev-text">{props.showNerdStats.toString()}</span></div>
        </div>
    )
}