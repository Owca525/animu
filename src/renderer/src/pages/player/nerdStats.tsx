import { RefObject } from "react"

interface nerdStatsProps {
    video: RefObject<HTMLVideoElement | null>
    volume: number
    currentTime: number
}

const nerdStats: React.FC<nerdStatsProps> = ({ video, volume, currentTime }) => {
    if (!video.current) return
    return (
        <div className="player-dev-container">
            <div className="player-dev-element">Frames: <span className="player-dev-element">{video.current.getVideoPlaybackQuality().totalVideoFrames}</span></div>
            <div className="player-dev-element">Dropped Frames: <span className="player-dev-element">{video.current.getVideoPlaybackQuality().droppedVideoFrames}</span></div>
            <div className="player-dev-element">Volume: <span className="player-dev-element">{volume}%</span></div>
            <div className="player-dev-element">CurrentTime: <span className="player-dev-element">{currentTime}</span></div>
            <div className="player-dev-element">Duration: <span className="player-dev-element">{video.current.duration}</span></div>
        </div>
    )
}

export default nerdStats