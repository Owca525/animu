import "./css/nerdStats.css"

interface nerdStatsProps {
    video: HTMLVideoElement | undefined
    volume: number
    currentTime: number
}

export default function nerdStats(props: nerdStatsProps) {
    if (!props.video) return
    return (
        <div class="player-nerd-container">
            <div class="player-nerd-element">Frames: <span class="player-nerd-element">{props.video.getVideoPlaybackQuality().totalVideoFrames}</span></div>
            <div class="player-nerd-element">Dropped Frames: <span class="player-nerd-element">{props.video.getVideoPlaybackQuality().droppedVideoFrames}</span></div>
            <div class="player-nerd-element">Volume: <span class="player-nerd-element">{props.volume}%</span></div>
            <div class="player-nerd-element">CurrentTime: <span class="player-nerd-element">{props.currentTime}</span></div>
            <div class="player-nerd-element">Duration: <span class="player-nerd-element">{props.video.duration}</span></div>
        </div>
    )
}