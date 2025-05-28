import { RefObject } from "react"

interface nerdStatsProps {
    video: RefObject<HTMLVideoElement | null>
    volume: number
    currentTime: number
}

const nerdStats: React.FC<nerdStatsProps> = ({ video, volume, currentTime }) => {
    if (!video.current) return
    return (
        <div className="player-nerd-container">
            <div className="player-nerd-element">Frames: <span className="player-nerd-element">{video.current.getVideoPlaybackQuality().totalVideoFrames}</span></div>
            <div className="player-nerd-element">Dropped Frames: <span className="player-nerd-element">{video.current.getVideoPlaybackQuality().droppedVideoFrames}</span></div>
            <div className="player-nerd-element">Volume: <span className="player-nerd-element">{volume}%</span></div>
            <div className="player-nerd-element">CurrentTime: <span className="player-nerd-element">{currentTime}</span></div>
            <div className="player-nerd-element">Duration: <span className="player-nerd-element">{video.current.duration}</span></div>
        </div>
    )
}

export default nerdStats