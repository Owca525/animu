import { AnimeData, animeOpeningsFormat } from "@renderer/utils/types";
import "./css/openingPlayer.css";
import { For, onCleanup, onMount, Show } from "solid-js";
import { convertKeybinds, createElement, formatTime, RandomObject } from "@renderer/utils/functions";
import SeekBar from "@renderer/components/seekBar";
import shaka from "shaka-player";
import { createStore } from "solid-js/store";
import Button from "@renderer/components/buttons";
import { getConfig } from "@renderer/utils/stores/config";
import { t } from "@renderer/utils/i18n";
import { toast } from "@renderer/utils/context/ToastNotification";
import { useKeyPress } from "@renderer/utils/hooks/useKeyPress";

export default function OpeningPlayer(props: { music: animeOpeningsFormat[], anime: AnimeData }) {
    let Shaka: shaka.Player | undefined
    let AudioRef: HTMLAudioElement | undefined
    let config = getConfig()

    let hiddingTimer: NodeJS.Timeout | undefined

    let activeEvents: { type: any, handler: (event: Event & { currentTarget: HTMLVideoElement; target: Element; }) => void }[] = []

    let PlayerCleanup = false

    const [player, updatePlayer] = createStore({
        initialize: true,

        volume: config.information.musicplayervolume,
        currentTime: 0,
        muted: false,
        durration: 0,
        isPlaying: true,
        isLoading: false,
        FatalError: false,

        // speed: 1,

        HLSMode: false,

        buffer: [] as { position: number, width: number }[],

        current: props["music"][0] as animeOpeningsFormat,

        repeat: false,
        shuffle: false,
    })

    const [ui, updateUI] = createStore({
        activeBar: false,
        hidden: false,
        musiclist: false
    })

    onMount(() => {
        const find = props["music"].find((v) => v["type"] == config.information.musicplayerfirstype)
        if (find) updatePlayer({ current: find })

        SetNewPlayer(player.current)
    })

    onCleanup(() => {
        PlayerCleanup = true

        CleanuPlayer()

        navigator.mediaSession.metadata = null
        const actions = [
            'play',
            'pause',
            'stop',
            'previoustrack',
            'nexttrack',
            'seekbackward',
            'seekforward',
            'seekto'
        ];

        actions.forEach(action => {
            navigator.mediaSession.setActionHandler(action as any, null);
        });
    })

    function SetNewPlayer(current: animeOpeningsFormat | undefined) {
        if (!current) return

        createNewPlayer()

        updatePlayer({ current: current })

        if (!AudioRef) return

        const findedAudio = current["videos"].find((v) => v["audio"])
        if (!findedAudio) return

        Shaka?.load(findedAudio["audio"]!)
        ChangePlayerVolume(player.volume)
    }

    function setTimeVideo(value: number) {
        if (!AudioRef) return
        AudioRef.currentTime = value
        updatePlayer({ currentTime: value })
    }

    function ChangePlayerVolume(value: number) {
        if (value > 100 || value < 0) return
        if (!AudioRef) return

        AudioRef.volume = parseFloat((value / 100).toFixed(2))

        updatePlayer({ volume: value })
    }

    function createNewPlayer() {
        CleanuPlayer()

        if (PlayerCleanup) return

        const AudioElement = createElement("audio", {
            preload: "auto",
            muted: player.muted,
            autoplay: player.isPlaying
        })

        Shaka = new shaka.Player();
        Shaka.attach(AudioElement)

        AudioRef = AudioElement

        ChangePlayerVolume(player.volume)

        setPlayerCleanupEvent("timeupdate", updateProgress)
        setPlayerCleanupEvent("progress", updateProgress)
        setPlayerCleanupEvent("seeked", updateProgress)

        setPlayerCleanupEvent("loadedmetadata", (event) => {
            updateProgress(event)
            if (player.initialize) {
                updateUI({ activeBar: true })
                ShowMusicBar()
            }
            updatePlayer({ initialize: false })
        })

        setPlayerCleanupEvent("error", AudioErrorHandler)
        setPlayerCleanupEvent("canplay", () => { updatePlayer({ isLoading: false }) })
        setPlayerCleanupEvent("waiting", () => {
            updatePlayer({ isLoading: true })
        })
    }

    function CleanuPlayer() {
        if (Shaka) Shaka.destroy()
        activeEvents.forEach((event) => {
            if (AudioRef) AudioRef.removeEventListener(event["type"], event["handler"])
        })

        if (AudioRef) AudioRef.remove()
    }

    function AudioErrorHandler(event) {
        const Error = event.currentTarget.error
        var message: string
        if (!Error) return
        if (PlayerCleanup) return
        console.warn("Error Audio Element in Animu", Error)
        switch (Error.code) {
            case Error.MEDIA_ERR_ABORTED:
                message = t('player.errors.MEDIA_ERR_ABORTED')
                break
            case Error.MEDIA_ERR_NETWORK:
                message = t('player.errors.MEDIA_ERR_NETWORK')
                break
            case Error.MEDIA_ERR_DECODE:
                message = t('player.errors.MEDIA_ERR_DECODE')
                break
            case Error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                message = t('player.errors.MEDIA_ERR_SRC_NOT_SUPPORTED')
                break
            default:
                message = t('player.errors.default')
        }
        updatePlayer({ FatalError: true })
        toast(message, { type: "error" });
    }

    function updateProgress(event: Event & { currentTarget: HTMLVideoElement; target: Element; }) {
        updatePlayer({
            currentTime: event.currentTarget.currentTime,
            durration: event.currentTarget.duration
        })

        if (event.currentTarget.currentTime >= event.currentTarget.duration) ChangeSong("next")
    }

    function setPlayerCleanupEvent(type: any, handler: (event: Event & { currentTarget: HTMLVideoElement; target: Element; }) => void) {
        if (!AudioRef) return

        AudioRef.addEventListener(type, handler);
        activeEvents.push({ type: type, handler: handler })
    }

    function togglePlay() {
        const Audio = AudioRef
        if (!Audio) return

        const prev = !Audio.paused

        updatePlayer({ isPlaying: !prev })

        if (prev) {
            Audio.pause()
            if (AudioRef) AudioRef.pause()
        } else {
            Audio.play().catch((reason) => {
                console.warn("Audio Play Error Catch", reason)
            })
        }
    }

    function ChangeSong(type: "next" | "prev") {
        if (player.shuffle) return SetNewPlayer(RandomObject(props.music))

        const index = props.music.indexOf(player.current)

        if (index < 0) return

        if (type == "next") {

            const tmp = props.music[index + 1]

            if (player.repeat && !tmp) return SetNewPlayer(props.music[0])
            
            if (!tmp) return

            SetNewPlayer(tmp)

        } else {

            if (index <= 0) return

            const tmp = props.music[index - 1]

            if (player.repeat && !tmp) return SetNewPlayer(props.music[props.music.length - 1])

            if (!tmp) return

            SetNewPlayer(tmp)

        }

    }

    function ShowMusicBar() {
        clearInterval(hiddingTimer)
        updateUI({ hidden: false })

        hiddingTimer = setTimeout(() => {
            updateUI({ hidden: true, musiclist: false })
        }, 5000)
    }

    useKeyPress((keys: string) => {
        if (!AudioRef) return
        let time_now = AudioRef.currentTime
        switch (keys.toLowerCase()) {
            case convertKeybinds(config.Player.keybinds.Pause.toLowerCase()).toLowerCase():
                togglePlay()
                break
            case convertKeybinds(config.Player.keybinds.TimeSkipRight.toLowerCase()).toLowerCase():
                setTimeVideo((time_now += parseInt(config.Player.general.TimeSkipRight.toString())))
                break
            case convertKeybinds(config.Player.keybinds.TimeSkipLeft.toLowerCase()).toLowerCase():
                setTimeVideo((time_now -= parseInt(config.Player.general.TimeSkipLeft.toString())))
                break

            case convertKeybinds(config.Player.keybinds.LongTimeSkipForward.toLowerCase()).toLowerCase():
                setTimeVideo((time_now += parseInt(config.Player.general.LongTimeSkipForward.toString())))
                break
            case convertKeybinds(config.Player.keybinds.LongTimeSkipBack.toLowerCase()).toLowerCase():
                setTimeVideo((time_now -= parseInt(config.Player.general.LongTimeSkipBack.toString())))
                break
            case convertKeybinds(config.Player.keybinds.FrameSkipForward.toLowerCase()).toLowerCase():
                setTimeVideo((time_now += 0.0416))
                break
            case convertKeybinds(config.Player.keybinds.FrameSkipBack.toLowerCase()).toLowerCase():
                setTimeVideo((time_now -= 0.0416))
                break
            case convertKeybinds(config.Player.keybinds.VolumeDown.toLowerCase()).toLowerCase():
                ChangePlayerVolume((AudioRef.volume * 100) - 1)
                break
            case convertKeybinds(config.Player.keybinds.VolumeUp.toLowerCase()).toLowerCase():
                ChangePlayerVolume((AudioRef.volume * 100) + 1)
                break
            case convertKeybinds(config.Player.keybinds.VolumeMute.toLowerCase()).toLowerCase():
                setMutedToPlayer()
                break
        }
    })

    function setMutedToPlayer() {
        if (AudioRef) AudioRef.muted = !player.muted

        updatePlayer({ muted: !player.muted })
    }

    function TurnOffPlayer() {
        PlayerCleanup = true
        CleanuPlayer()
        clearInterval(hiddingTimer)
        updateUI({ hidden: false, activeBar: false, musiclist: false })
    }

    return (
        <>
            <main class="opening-player-container" classList={{ active: ui.activeBar, hidden: ui.hidden }} onmouseenter={ShowMusicBar}>
                <Button icon="close" ButtonClass="opening-player-exit-button" iconClassName="opening-player-exit-button-icon" onClick={TurnOffPlayer} />

                <div class="opening-player-left">
                    <sheep-img src={props["anime"]["coverImage"]} class="opening-player-img" />

                    <span class="opening-player-texts">

                        <span class="opening-player-title">{player.current["title"]["romaji"]}</span>
                        {/* TRANSLATION */}
                        <span class="opening-player-artist">{player.current["artist"] ?? "uknown"}</span>

                    </span>

                </div>

                <div class="opening-player-center">

                    <div class="opening-player-controls">
                        <Button
                            icon="skip_previous"
                            ButtonClass="opening-player-buttons"
                            iconClassName={props.music[props.music.indexOf(player.current) - 1] == undefined && !player.repeat ? "icon-disable" : ""}
                            onClick={() => ChangeSong("prev")}
                        />

                        <Button
                            icon={player.isLoading ? "progress_activity" : player.isPlaying ? "pause" : "play_arrow"}
                            iconClassName={player.isLoading ? "audio-loading" : ""}
                            ButtonClass="opening-player-buttons"
                            onClick={togglePlay}
                        />

                        <Button
                            icon="skip_next"
                            ButtonClass="opening-player-buttons"
                            iconClassName={props.music[props.music.indexOf(player.current) + 1] == undefined && !player.repeat ? "icon-disable" : ""}
                            onClick={() => ChangeSong("next")}
                        />

                    </div>

                    <div class="opening-player-center-bottom">

                        <span class="opening-player-currentime">{formatTime(player.currentTime)}</span>
                        <SeekBar
                            secondBarValues={player.buffer}
                            currentValue={player.currentTime}
                            maxValue={player.durration}
                            onSeek={value => { setTimeVideo(value) }}
                            type="time"
                            classes={{ container: "opening-player-seekbar" }}
                            screen={true}
                        />
                        <span class="opening-player-durration">{formatTime(player.durration)}</span>

                    </div>

                </div>

                <div class="opening-player-right">
                    <SeekBar
                        currentValue={player.volume}
                        maxValue={100}
                        onSeek={value => ChangePlayerVolume(value)}
                        classes={{ "container": "opening-player-volume" }}
                        type="procent"
                    />
                    
                    <Button icon="format_list_bulleted" ButtonClass="opening-player-buttons" onClick={() => {
                        updateUI({ musiclist: !ui.musiclist })
                    }}/>

                    <Button 
                        icon="shuffle" 
                        ButtonClass="opening-player-buttons" 
                        iconClassName={player.shuffle ? "opening-icon-active" : ""}
                        onClick={() => updatePlayer({ shuffle: !player.shuffle })}
                    />

                    <Button 
                        icon="repeat" 
                        ButtonClass="opening-player-buttons"
                        iconClassName={player.repeat ? "opening-icon-active" : ""}
                        onClick={() => updatePlayer({ repeat: !player.repeat })}
                    />
                </div>

            </main>

            <PlayerMusicList 
                onChange={SetNewPlayer}
                current={player.current}
                list={props.music}
                show={ui.musiclist}
                onHover={ShowMusicBar}
            />
        </>
    )
}

function PlayerMusicList(props: { onHover: () => void, onChange: (v: animeOpeningsFormat) => void, current: animeOpeningsFormat, list: animeOpeningsFormat[], show: boolean }) {
    return (
        <div class="music-library-container" classList={{ active: props.show }} onmouseenter={props.onHover}>
            <span class="music-library-title">{t("Select Song")}</span>

            <div class="music-library-content">

                <For each={props.list}>
                    {(item) => (
                        <div class="music-library-item"
                                classList={{ active: item["title"]["romaji"] == props.current["title"]["romaji"] }}
                                onclick={() => props.onChange(item)}
                            >
                            <span class="music-library-text">{item["title"]["romaji"]}</span>
                            <Show when={item["title"]["romaji"] == props.current["title"]["romaji"]}>
                                <span class="material-symbols-outlined music-library-item-icon">equalizer</span>
                            </Show>
                        </div>
                    )}
                </For>

            </div>

        </div>
    )
}