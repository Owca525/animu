import { animeOpeningsFormat } from "@renderer/utils/types";
import "./css/openingPlayer.css";
import { createSignal, onMount } from "solid-js";
import shaka from "shaka-player";
import { formatTime } from "@renderer/utils/functions";

export default function OpeningPlayer(props: { music: animeOpeningsFormat }) {
    let audioRef: HTMLAudioElement | undefined
    const [isPlaying, setIsPlaying] = createSignal<boolean>(true)
    const [durration, setDurration] = createSignal<number>(0)
    const [currentTime, setCurrentTime] = createSignal<number>(0)

    function togglePlay() {
        const video = audioRef
        if (!video) return

        setIsPlaying(prev => {
            if (prev) {
                video.pause()
                return false
            }
            video.play().catch((reason) => {
                console.warn("Video Play Error Catch", reason)
            })
            return true
        })
    }

    onMount(() => {
        if (!audioRef) return
        audioRef.volume = 0.2

        const player = new shaka.Player(audioRef);
        try {
            player.load(props.music.videos[0].audio!)
        } catch (error) {
            console.error("Error in Opening Player", error)
        }
    })

    // TODO: improve this
    return (
        <main class="main-opening-player-container">
            <div class="opening-player-text">
                <span class="opening-player-name">{props.music.musicTitle}</span>
                <span class="opening-player-artist">{props.music.artist}</span>
            </div>
            <div class="opening-player-controls">
                <span class="opening-player-time">{formatTime(currentTime())} / {formatTime(durration())}</span>
                <span class="material-symbols-outlined opening-player-button-play" onClick={togglePlay}>{isPlaying() ? "pause" : "play_arrow"}</span>
            </div>
            <audio 
                ref={audioRef} 
                autoplay
                onTimeUpdate={(event) => {
                    setCurrentTime(event.currentTarget.currentTime)
                }}
                onLoadedMetadata={(event) => {
                    setDurration(event.currentTarget.duration)
                }}
            />
        </main>
    );
}