import "./css/nerdStats.css"

interface nerdStatsProps {
    frames: { totalVideoFrames: number, droppedVideoFrames: number }
    duration: number
    volume: number
    currentTime: number
}

export default function nerdStats(props: nerdStatsProps) {
    return (
        <div class="player-nerd-container">
            <div class="player-nerd-element">Frames: <span class="player-nerd-element">{props.frames.totalVideoFrames}</span></div>
            <div class="player-nerd-element">Dropped Frames: <span class="player-nerd-element">{props.frames.droppedVideoFrames}</span></div>
            <div class="player-nerd-element">Volume: <span class="player-nerd-element">{props.volume}%</span></div>
            <div class="player-nerd-element">CurrentTime: <span class="player-nerd-element">{props.currentTime.toFixed(2)}</span></div>
            <div class="player-nerd-element">Duration: <span class="player-nerd-element">{props.duration.toFixed(2)}</span></div>
        </div>
    )
}