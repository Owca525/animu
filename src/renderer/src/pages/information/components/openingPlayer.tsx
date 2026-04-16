import { animeOpeningsFormat } from "@renderer/utils/types";
import "./css/openingPlayer.css";
import { createSignal, onCleanup, onMount } from "solid-js";
import { formatTime } from "@renderer/utils/functions";
import videojs from "video.js";
import Player from "video.js/dist/types/player";
import { getAudioOutput } from "@renderer/utils/stores/global";
import SeekBar from "@renderer/components/seekBar";

export default function OpeningPlayer(props: { music: animeOpeningsFormat[] }) {
    let audioRef: HTMLAudioElement | undefined
    let videoJS: Player | undefined
    const [isPlaying, setIsPlaying] = createSignal<boolean>(true)
    const [durration, setDurration] = createSignal<number>(0)
    const [currentTime, setCurrentTime] = createSignal<number>(0)
    const [currentMusic, setMusic] = createSignal<animeOpeningsFormat>(props.music[0])

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
        videoJS = videojs(audioRef, {
            controls: false,
            autoplay: false,
            preload: "auto",
            bigPlayButton: false,
            loadingSpinner: false,
            posterImage: false,
            errorDisplay: false,
            html5: {
                vhs: {
                    withCredentials: false,
                    overrideNative: true,
                },
            },
        })
        if (getAudioOutput()) audioRef.setSinkId(getAudioOutput()!.deviceId)

        videoJS.children_.forEach((v) => {
            if (v["nodeName"] == "VIDEO") (v as HTMLVideoElement).classList.add("video-player")
        })

        const div = document.getElementById(videoJS.id_);
        if (div) {
            div.style.display = "none"
            for (let i = div.children.length - 1; i >= 0; i--) {
                const child = div.children[i];
                if (child.tagName.toLowerCase() !== 'video') {
                    div.removeChild(child);
                }
            }
        }

        videoJS.volume(0.25)

        videoJS?.src({
            src: currentMusic().videos[0].audio,
            type: "audio/mp3",
        })
    })

    onCleanup(() => {
        videoJS?.dispose()
    })

    function setAudioTime(value: number) {
        if (!audioRef) return
        audioRef.currentTime = value
        if (videoJS) videoJS.currentTime(value)
        setCurrentTime(() => value)
    }

    return (
        <main class="main-opening-player-container">
            <div class="opening-player-text">
                <span class="opening-player-name">{currentMusic().musicTitle}</span>
                <span class="opening-player-artist">{currentMusic().artist}</span>
            </div>
            <div class="opening-player-controls">
                <SeekBar 
                    minValue={0} 
                    maxValue={durration()} 
                    onSeek={setAudioTime} 
                    currentValue={currentTime()} type="time"
                    classes={{
                        container: "opening-seekbar"
                    }}
                />
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