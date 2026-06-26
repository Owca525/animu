export default function VolumeNotification(props: { isActive: boolean, volume: number, isMuted: boolean }) {
    return (
        <div class={`player-volume-ui-container ${props.isActive ? "show" : "hidden"}`}>
            <span class="player-volume-ui-icon material-symbols-outlined">{props.isMuted ? 'volume_off' : 'volume_up'}</span>
            <div class="player-volume-ui-bar-container">
                <div class="player-volume-ui-bar-progress" style={{ "width": `${props.volume}%` }}></div>
            </div>
            <span class="player-volume-ui-text">{props.volume}%</span>
        </div>
    )
}