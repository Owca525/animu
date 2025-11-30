import Hls from "hls.js"

import { AnimeData, ContextMenuProps, indentityPlayer, playerChapterList, playerData, playerSubtitlesFormat, resolutionFormat, SettingsConfig, Thumbnail } from "@renderer/utils/types"
import { convertKeybinds, CreateContextMenuOptions, detectTitle, formatTime, refetchHistory, request, toggleFullscreen, toSeconds, updateObjectConfig } from "@renderer/utils/functions"
import Button from "@renderer/components/buttons"
import SeekBar from "@renderer/components/seekBar"
import { OpenContextMenu } from "@renderer/utils/context/ContextMenu"
import PlayerSettings from "./components/PlayerSettings"
import PlayerButton from "./components/PlayerButton"
import PlayerEpisodeElement from "./components/playerEpisodeElement"
import { convert } from "subtitle-converter";
import i18n from "@renderer/utils/i18n"
import html2canvas from "html2canvas"
import JASSUB from "jassub";

import workerUrl from "jassub/dist/jassub-worker.js?url";
import wasmUrl from "jassub/dist/jassub-worker.wasm?url";
import { saveConfig } from "@renderer/utils/FilesManager/config"
import { SaveHistory } from "@renderer/utils/FilesManager/history"
import { Component, createSignal, For, onCleanup, onMount, Show } from "solid-js"
import { getConfig } from "@renderer/utils/stores/config"
import { t } from "i18next"
import { useKeyPress } from "@renderer/utils/hooks/useKeyPress"
import DeveloperStats from "./components/developerStats"
import NerdStats from "./components/nerdStats"
import { unwrap } from "solid-js/store"
import { toast } from "@renderer/utils/context/ToastNotification"

function addTime(durration: number): string {
    const now = new Date();
    let [sec, min, hour] = formatTime(durration).split(":").reverse()

    if (hour) now.setMinutes(now.getHours() + parseInt(hour));
    if (min) now.setMinutes(now.getMinutes() + parseInt(min));
    if (sec) {
        let tmp = parseInt(sec)
        if (tmp <= 59) now.setSeconds(now.getSeconds() + (tmp - 1))
        if (tmp <= 0) now.setSeconds(now.getSeconds() + (tmp + 2))
    };

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    return `${hours}:${minutes}`;
}

async function fetchData(tmpData: { episode: string, id?: string, type: string, playerData: playerData }, func: (episode: string, type: string, playerData: playerData, id?: string) => Promise<playerData | undefined>): Promise<{ succes: boolean, data: playerData | undefined }> {
    try {
        (tmpData)
        let data = await func(tmpData.episode, tmpData.type, tmpData.playerData, tmpData.id)
        return {
            succes: true,
            data: data
        }
    } catch (error) {
        console.error(error, "fetchData player")
        return {
            succes: false,
            data: undefined
        }
    }
}

const speed: Array<string> = ["0.25", "0.5", "0.75", "1", "1.25", "1.50", "1.75", "2"]

interface VideoPlayerProps {
    player_data: playerData[]
    anime_data: {
        AnimeData: AnimeData,
        saveData: indentityPlayer
    }
    temp: { episode: string, type: string, episodes: { ep: string, img?: string, title?: string }[] }
    setNextEpisode: (value: string) => void
    volumeCacheFunc: (value: number) => void
    PlayerVolume: number
    time: number
    exitFromPlayer: () => void
}

const VideoPlayer: Component<VideoPlayerProps> = ({ player_data, anime_data, temp, setNextEpisode, volumeCacheFunc, PlayerVolume = 0, time, exitFromPlayer }) => {
    const config: SettingsConfig = getConfig();

    // ref for html object
    let videoRef: HTMLVideoElement | undefined
    let containerRef: HTMLDivElement | undefined
    let hideTimer: NodeJS.Timeout | undefined
    let hideChapterButtonTimer: NodeJS.Timeout | undefined
    let screenshotWrapper: HTMLDivElement | undefined
    let volumeTimeout: NodeJS.Timeout | undefined
    let playAnimationTimeout: NodeJS.Timeout | undefined
    let buttonSkipLeft: NodeJS.Timeout | undefined
    let buttonSkipRight: NodeJS.Timeout | undefined
    let assSubContainer: HTMLDivElement | undefined
    let vttSubRef: HTMLTrackElement | undefined

    // Variable
    const [volume, setVolume] = createSignal<number>(PlayerVolume)
    const [currentTime, setcurrentTime] = createSignal<number>(0)
    const [durrationTime, setdurrationTime] = createSignal<number>(0)
    const [currentBuffer, setBuffered] = createSignal<{ position: number, width: number }[]>([])

    // UI
    const [isVolume, setShowVolume] = createSignal<boolean>(false)
    const [isShowPlay, setShowPlay] = createSignal<boolean>(false)
    const [isShowSelectEpisode, setShowSelectEpisode] = createSignal<boolean>(false)
    const [buttonSkipTime, setButtonSkipTime] = createSignal<number>(15)
    const [minusTimeState, setminusTimeState] = createSignal<boolean>(config.Player.general.minusTime)
    const [IsRunningButtonSkipTime, setIsRunningButtonSkipTime] = createSignal<boolean>(false)
    const [IsDisableButtonSkipTimerOpening, setIsDisableButtonSkipTimerOpening] = createSignal<boolean>(false)
    const [IsDisableButtonSkipTimerEnding, setIsDisableButtonSkipTimerEnding] = createSignal<boolean>(false)
    const [currentSkipButton, setcurrentSkipButton] = createSignal<{ text: string, type: "opening" | "ending" | "", time: number }>({ text: "", type: "", time: 0 })

    const [isShowButtonSkipLeft, setShowButtonSkipLeft] = createSignal<boolean>(false)
    const [isShowButtonSkipRight, setShowButtonSkipRight] = createSignal<boolean>(false)

    // States
    const [isMuted, setMuted] = createSignal<boolean>(false)
    const [isVisible, setIsVisible] = createSignal<boolean>(true)
    const [isWaitingPlayer, setWaitingPlayer] = createSignal<boolean>(true)
    const [isPlaying, setIsPlaying] = createSignal<boolean>(config.Player.general.Autoplay)
    const [isFullscreen, setIsFullscreen] = createSignal<boolean>(false)
    const [isCleanup, setCleanup] = createSignal<boolean>(false)

    // Resolution
    const [ListResolution, setListResolution] = createSignal<resolutionFormat[]>([])
    const [currentResolution, setCurrentResoltion] = createSignal<resolutionFormat | undefined>(undefined)

    // Up Next
    const [timeNextEpisode, setTimeNextEpisode] = createSignal<number>(config.Player.upToNextEpisode.durationShow)
    const [isUpNextEpisode, setUpNextEpisode] = createSignal<boolean>(false)
    const [isHideUpNextEpisode, setHideUpNextEpisode] = createSignal<boolean>(false)
    const [currentPlayer, setPlayer] = createSignal<playerData | undefined>(undefined)

    // other
    const [currentSettings, setcurrentSettings] = createSignal<boolean>(false)
    const [showNerdStats, setshowNerdStats] = createSignal<boolean>(false)
    const [resolutionNotFound, setResError] = createSignal<boolean>(false)
    const [hls, setHls] = createSignal<Hls | undefined>(undefined);
    const [chapterList, setChapterList] = createSignal<{ left: number, width: number, name?: string, type: "opening" | "ending" | "other" }[]>([])

    // Subtitles
    const [vttUrl, setVttUrl] = createSignal<string | undefined>(undefined);
    const [ListSubtitles, setListSubtitles] = createSignal<playerSubtitlesFormat[]>([])
    const [lastSubtitles, setlastSubtitles] = createSignal<playerSubtitlesFormat | undefined>(undefined)
    const [currentASSubtitles, setASSubtitles] = createSignal<JASSUB | undefined>(undefined)
    const [currentSubtitles, setSubtitles] = createSignal<playerSubtitlesFormat | undefined>(undefined)
    const [currentCue, setCue] = createSignal<string | undefined>(undefined);

    // Audio Tracks
    const [audioTrackList, setAudioTrackList] = createSignal<{ id: number, lang?: string, label: string }[]>([]);
    const [currentAudioTrack, setCurrentAudioTrack] = createSignal<{ id: number, lang?: string, label: string } | undefined>();

    // Thumbnail
    const [thumbnails, setThumbnail] = createSignal<Thumbnail | undefined>(undefined);

    function handleMouseMove() {
        setIsVisible(true)
        if (hideTimer) {
            clearTimeout(hideTimer)
        }
        if (currentSettings() == false && isShowSelectEpisode() == false) {
            hideTimer = setTimeout(() => setIsVisible(false), 2000)
        }
    }

    onMount(() => {
        let defaulthost = player_data[0]
        for (let index = 0; index < player_data.length; index++) {
            const element = player_data[index];
            if (element.defaultHost) defaulthost = element
        }
        checkUrl(defaulthost)
        handleVolume(PlayerVolume, true)
        handleMouseMove()
        if (config.Player.general.AutoFullscreen) {
            toggleFullscreen(true)
            setIsFullscreen(true)
        }
        if (videoRef) {
            videoRef.currentTime = time
            setcurrentTime(() => time)
        }
        if ("mediaSession" in navigator) {
            navigator.mediaSession.setActionHandler("play", () => togglePlay());
            navigator.mediaSession.setActionHandler("pause", () => togglePlay());
            navigator.mediaSession.setActionHandler("previoustrack", () => setEpisode("prev"));
            navigator.mediaSession.setActionHandler("nexttrack", () => setEpisode("next"));
            navigator.mediaSession.setActionHandler("stop", () => togglePlay());
        }
    })

    onCleanup(() => {
        setCleanup(true)
        if (hls()) hls()?.destroy()
        if (currentASSubtitles()) currentASSubtitles()?.destroy()
        if (videoRef) videoRef.src = ""
        videoRef = undefined
    })

    // player Functions
    async function enterFullscreen() {
        if (window.api && await window.BrowserWindow.isFullscreen()) {
            toggleFullscreen(false)
            setIsFullscreen(false)
        } else if (document.fullscreenElement) {
            toggleFullscreen(false)
            setIsFullscreen(false)
        } else {
            toggleFullscreen(true)
            setIsFullscreen(true)
        }
    }

    function setSpeed(speed: string) {
        if (!videoRef) return
        videoRef.playbackRate = parseFloat(speed)
    }

    function setNewResolution(data: resolutionFormat | undefined) {
        if (!data) return
        if (!videoRef) return
        const time = videoRef.currentTime
        if (data.defaultSubtitles) setDefaultSubtitles(ListSubtitles())
        else setNewSubtitles(ListSubtitles[0])
        setCurrentResoltion(data)

        if (hls() && data.hls) {
            if (data.url == "") hls()!.currentLevel = hls()!.levels.findIndex(level => level.height === parseInt(data.res));
            else runHLS(data, currentPlayer()?.splitHLS)
            return
        }

        if (data.doNotUseBackend) {
            videoRef.src = data.url
        } else {
            videoRef.src = `http://localhost:3001/video?url=${btoa(JSON.stringify(
                { url: data.url, header: data.reqHeader }
            ))}`
        }
        videoRef.currentTime = time
    }

    // function setNewUrl(host: string) {
    //     if (player_data.length <= 1) return
    //     const value = player_data.findIndex((value) => value.hostname == host)
    //     if (value < 0) return
    //     if (player_data[value + 1] == undefined) return
    //     checkUrl(player_data[value + 1])
    // }

    async function setDefaultSubtitles(data: playerSubtitlesFormat[]) {
        if (data.length <= 0) return
        for (let index = 0; index < data.length; index++) {
            const element = data[index];
            if (element.lang == i18n.language && !element.label.includes("Forced")) {
                setNewSubtitles(element)
                return
            }
        }
        setNewSubtitles(data[0])
    }

    async function checkUrl(data: playerData) {
        if (!videoRef) return
        let currentplayer = data
        if (currentplayer.extractResolution) {
            let tmp = await fetchData({
                episode: temp.episode,
                id: anime_data.AnimeData.player_ID,
                type: "",
                playerData: currentplayer
            }, currentplayer.extractResolution)
            if (tmp.succes && tmp.data) currentplayer = tmp.data
        }

        if (currentplayer.resolution.length <= 0) {
            toast(t("player.errors.missingResoltions"), { type: "error" })
            setResError(() => true)
            return
        }
        const time = videoRef.currentTime
        if (currentplayer.subtitles) setListSubtitles(() => [{ url: "", format: "", lang: "", label: "Off" }, ...currentplayer.subtitles as playerSubtitlesFormat[]])
        if (currentplayer.storyboardVTT) setThumbnail(await VTTstoryBoardParser(currentplayer.storyboardVTT))
        if (currentplayer.resolution[0].defaultSubtitles && currentplayer.subtitles) setDefaultSubtitles(currentplayer.subtitles)
        if (currentplayer.resolution[0].hls && currentplayer.splitHLS) {
            setListResolution(currentplayer.resolution)
            setCurrentResoltion(currentplayer.resolution[0])
        }
        if (currentplayer.resolution[0].hls) {
            setPlayer(() => currentplayer)
            await runHLS(currentplayer.resolution[0], currentplayer.splitHLS)
            return
        }
        if (hls()) hls()!.destroy()
        setCurrentResoltion(currentplayer.resolution[0])
        setListResolution(() => currentplayer.resolution)
        setPlayer(() => currentplayer)

        // TODO: Fix this can be work using fetch
        if (currentplayer.resolution[0].doNotUseBackend) {
            videoRef.src = currentplayer.resolution[0].url
        } else {
            videoRef.src = `http://localhost:3001/video?url=${btoa(JSON.stringify(
                { url: currentplayer.resolution[0].url, header: currentplayer.resolution[0].reqHeader }
            ))}`
        }
        videoRef.currentTime = time
    }

    function changeAudioTrack(data: { id: number, lang?: string, label: string }) {
        if (!hls()) return
        try {
            hls()!.audioTrack = data.id
            setCurrentAudioTrack(() => data)
        } catch (error) {
            toast("Failed Changing audio", { type: "error" })
        }
    }

    async function runHLS(resolution: resolutionFormat, splitHls: boolean = false) {
        const hls = new Hls({
            maxBufferLength: 120,
            autoStartLoad: true,
            startLevel: 2,
            loader: class extends Hls.DefaultConfig.loader {
                load(context: any, config: any, callbacks: any) {
                    request(context.url, { method: "GET", headers: resolution.reqHeader }).then((data) => {
                        let currentData: any = data.text
                        if (!data.success) {
                            callbacks.onError({ type: 'network', details: "Failed Requestc", fatal: true }, context)
                            return
                        }
                        if (context.responseType == "arraybuffer") currentData = data.buffer
                        callbacks.onSuccess({ data: currentData, url: context.url }, {
                            loaded: data.buffer.byteLength,
                            total: data.buffer.byteLength,
                            abort: true,
                            retry: config.maxRetry,
                            chunkCount: 0,
                            bwEstimate: 0,
                            loading: { start: 0, first: 0, end: 0 },
                            parsing: { start: 0, end: 0 },
                            buffering: { start: 0, first: 0, end: 0 }
                        }, context);
                    });
                }
            },
        });

        setHls(() => hls)

        if (Hls.isSupported() && videoRef) {
            const time = videoRef.currentTime
            hls.loadSource(resolution.url);
            hls.attachMedia(videoRef);

            videoRef.currentTime = time

            hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
                if (!splitHls) {
                    const resolutions = data.levels.map((level) => level.height);
                    resolutions.reverse()
                    setListResolution(resolutions.map((val) => { return { res: val.toString(), url: "" } }))
                    setCurrentResoltion({ res: resolutions[0].toString(), url: "" })
                    hls.currentLevel = hls.levels.length - 1;
                }
                data.levels.forEach(level => {
                    // I added Ignore because this give me a error "Cannot assign to 'audioCodec' because it is a read-only property." but i can assign then is good
                    // @ts-ignore
                    if (!level.audioCodec) level.audioCodec = "mp4a.40.5"
                    // @ts-ignore
                    else level.audioCodec = level.audioCodec.replaceAll('mp4a.40.2', 'mp4a.40.5')
                });
                if (data.audioTracks.length > 1) {
                    for (let index = 0; index < data.audioTracks.length; index++) {
                        const element = data.audioTracks[index];
                        if (element.default) setCurrentAudioTrack(() => { return { id: element.id, label: element.name, lang: element.lang } })
                    }
                    setAudioTrackList(data.audioTracks.map((element) => { return { id: element.id, label: element.name, lang: element.lang } }))
                }
            });

            hls.on(Hls.Events.ERROR, (_event, data) => {
                console.error("HLS", _event, data)
                hls.currentLevel = hls.levels.length - 1;
                if (data.fatal) {
                    let message: string | undefined
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            // message = t('player.errors.MEDIA_ERR_NETWORK')
                            // hls.destroy()
                            // TODO: Update this, may make bug
                            // setNewUrl(host.hostname)
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            message = t('player.errors.MEDIA_ERR_DECODE')
                            // hls.recoverMediaError()
                            hls.destroy();
                            return
                        default:
                            message = t('player.errors.default')
                            hls.destroy();
                            break;
                    }
                    if (message && !isCleanup()) toast(message, { type: "error" });
                }
            });
        }
    }

    function handleVolume(value: number, dontShow: boolean = false) {
        if (!videoRef) return
        videoRef.volume = value / 100
        setVolume(() => value)
        volumeCacheFunc(value)
        if (dontShow) return
        setTimeoutForElement(volumeTimeout, setShowVolume)
    }

    function setTimeoutForElement(element: NodeJS.Timeout | undefined, func: (initialState: boolean) => void) {
        if (element) clearTimeout(element)
        func(true)
        volumeTimeout = setTimeout(() => {
            func(false)
        }, 500);
    }

    function togglePlay() {
        const video = videoRef
        if (!video) return

        setIsPlaying(prev => {
            if (prev) {
                video.pause()
                return false
            }
            video.play()
            return true
        })

        if (playAnimationTimeout) clearTimeout(playAnimationTimeout)
        setShowPlay(() => true)
        playAnimationTimeout = setTimeout(() => {
            setShowPlay(() => false)
        }, 300);
    }

    function setMutedToPlayer() {
        setMuted((prev) => !prev)
        handleVolume(volume())
    }

    async function exitPlayer() {
        if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
        }
        toggleFullscreen(false)
        exitFromPlayer()
    }

    function saveContinueProgress(event: Event & { currentTarget: HTMLVideoElement; target: Element; }) {
        // Checking to save history
        if (!config) return
        if (currentTime() <= parseInt(config.History.continue.MinimalTimeSave.toString())) return
        if (isCleanup()) return
        let futureHistory = {
            AnimeData: { ...anime_data.AnimeData, nextAiringEpisode: undefined },
            saveData: {
                pluginName: anime_data.saveData.pluginName,
                last_Time: event.currentTarget.currentTime,
                episode: temp.episode,
                type: temp.type,
                isStarted: false,
            }
        }
        if (
            event.currentTarget.currentTime >= parseInt(config.History.continue.MinimalTimeSave.toString()) &&
            event.currentTarget.currentTime <= event.currentTarget.duration - parseInt(config.History.continue.MaximizeTimeSave.toString())
        ) {
            SaveHistory(unwrap(futureHistory))
        } else {
            SaveHistory(unwrap({
                AnimeData: { ...anime_data.AnimeData, nextAiringEpisode: undefined },
                saveData: {
                    pluginName: anime_data.saveData.pluginName,
                    last_Time: 0,
                    episode: temp.episode,
                    type: temp.type,
                    isStarted: false,
                }
            }
            ))
        }
        refetchHistory()
    }

    async function handlePictureInPicture() {
        const video = videoRef;

        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();

            } else {
                if (video) {
                    await video.requestPictureInPicture();
                }
            }
        } catch (error) {
            console.error('Error PiP:', error);
            toast("Failed open Picture in Picture Mode", { type: "error" })
        }
    };

    function startChapterSkipTime() {
        if (IsRunningButtonSkipTime()) return

        setIsRunningButtonSkipTime(() => true)

        hideChapterButtonTimer = setInterval(() => {
            setButtonSkipTime((prev) => {
                console.log(prev)
                if (prev <= 1) {
                    clearChapterSkipTime()
                    return 15;
                }
                return prev - 1;
            });
        }, 1000);
    };

    function clearChapterSkipTime() {
        if (!hideChapterButtonTimer) return
        clearInterval(hideChapterButtonTimer)
        setButtonSkipTime(15)
        setIsRunningButtonSkipTime(() => false)
    }

    function updateProgress(event: Event & { currentTarget: HTMLVideoElement; target: Element; }) {
        setcurrentTime(event.currentTarget.currentTime)
        saveContinueProgress(event)
        checkUpNext(event)
        handleProgress(event)

        // Update RPC
        if (config.General.discordRPC && window.api) window.api.rpc.setActivity(t("discordrpc.player", { title: anime_data.AnimeData.title.romaji, ep: temp.episode }), `${formatTime(event.currentTarget.currentTime)} / ${formatTime(event.currentTarget.duration)}`)
        if (config.Player.general.AutoSkipEpisode && event.currentTarget.duration == event.currentTarget.currentTime) setEpisode("next")
        // TODO: ADD SECURITY FOR CHAPTERS IF THEY HAD START AND END TIME 0

        if (!currentPlayer() && !currentPlayer()!.listChapters) return
        currentPlayer()!.listChapters!.forEach(element => {
            let currentTime = event.currentTarget.currentTime
            if (!(currentTime >= element.start && currentTime <= element.end)) return
            if (config.Player.general.autoSkipOpenings || config.Player.general.autoSkipEndings) return change_time(element.end)

            if (element.type == "opening" && !IsDisableButtonSkipTimerOpening()) {
                setcurrentSkipButton(() => { return { text: "Skip Opening", time: element.end, type: "opening" } })
                setIsDisableButtonSkipTimerOpening(() => true)
            }
            if (element.type == "ending" && !IsDisableButtonSkipTimerEnding()) {
                setcurrentSkipButton(() => { return { text: "Skip Ending", time: element.end, type: "ending" } })
                setIsDisableButtonSkipTimerEnding(() => true)
            }
            startChapterSkipTime()
        });
    }

    function checkUpNext(event: Event & { currentTarget: HTMLVideoElement; target: Element; }) {
        // checking to show Up next communicat
        if (!config) return
        if (!config.Player.upToNextEpisode.enable) return
        if (!currentPlayer()) return
        const duration = event.currentTarget.duration
        const currentTime = event.currentTarget.currentTime

        if (duration <= config.Player.upToNextEpisode.durationShow * 60) return

        let showUpToNext: boolean = false
        let timeDelete: number = ((parseInt(duration.toFixed(0)) - parseInt(config.History.continue.MaximizeTimeSave.toString())) - parseInt(currentTime.toFixed(0))) + parseInt(config.Player.upToNextEpisode.interval.toString())
        if (currentPlayer()!.listChapters) {
            for (let index = 0; index < currentPlayer()!.listChapters!.length; index++) {
                const element = currentPlayer()!.listChapters![index];
                if (currentTime >= element.start && currentTime <= element.end && element.type == "ending") {
                    showUpToNext = true
                    timeDelete = ((parseInt(duration.toFixed(0)) - (parseInt(duration.toFixed(0)) - element.start)) - parseInt(currentTime.toFixed(0))) + parseInt(config.Player.upToNextEpisode.interval.toString())
                }
            }
        } else {
            showUpToNext = currentTime > duration - parseInt(config.History.continue.MaximizeTimeSave.toString())
        }

        if (isHideUpNextEpisode() == false && temp.episodes[temp.episodes.findIndex((item) => temp.episode == item.ep) + 1] != null && showUpToNext) {
            setUpNextEpisode(true)
            setTimeNextEpisode(timeDelete)
        } else {
            setTimeNextEpisode(parseInt(config.Player.upToNextEpisode.interval.toString()))
            setUpNextEpisode(false)
        }

        if (isHideUpNextEpisode() == false && timeNextEpisode() <= 0) setEpisode("next")
    }

    function videoErrorHandler(event) {
        const Error = event.currentTarget.error
        var message: string
        if (!Error) return
        if (isCleanup()) return
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
        toast(message, { type: "error" });

        // if (!currentPlayer) return
        // let index = player_data.findIndex((element) => element.hostname == currentPlayer.hostname)
        // if (player_data[index + 1]) checkUrl(player_data[index + 1])
    }

    function setTimeVideo(value: number) {
        if (!videoRef) return
        videoRef.currentTime = value
        setcurrentTime(() => value)
        if (!isNaN(value) && config && value > videoRef.duration - parseInt(config.History.continue.MaximizeTimeSave.toString())) {
            setHideUpNextEpisode(true)
        }

        if (currentPlayer() && currentPlayer()!.listChapters) {
            currentPlayer()!.listChapters!.forEach(element => {
                if (!(value >= element.start && value <= element.end) && element.type == "opening" && currentSkipButton().type == "opening") {
                    clearChapterSkipTime()
                }
                if (!(value >= element.start && value <= element.end) && element.type == "ending" && currentSkipButton().type == 'ending') {
                    clearChapterSkipTime()
                }
            })
        }
    }

    function change_time(time: number) {
        if (!videoRef) return
        videoRef.currentTime = time
    }

    useKeyPress((keys: string) => {
        if (keys == "CTRL+SHIFT+D") {
            setshowNerdStats((prev) => !prev)
        }
        keybinds(keys)
    })

    function setEpisode(type: "next" | "prev") {
        let ep = temp.episodes.findIndex((item) => item.ep === temp.episode)
        if (ep < 0) return
        if (type == 'prev') ep = ep - 1
        if (type == 'next') ep = ep + 1
        if (temp.episodes[ep].ep === undefined) return
        setNextEpisode(temp.episodes[ep].ep)
    }

    function onChangeTrackText(event: Event) {
        if (!event.currentTarget) return
        let track = event.currentTarget as unknown as TextTrack
        if (!track.activeCues) return
        let activeCue = track.activeCues[0] as VTTCue

        try {
            if (activeCue.text) {
                setCue(activeCue.text)
            }
            else setCue(undefined)
        } catch (error) {
            setCue(undefined)
        }
    }

    async function setNewSubtitles(sub: playerSubtitlesFormat) {
        if (!videoRef) return

        // This clear subtitles but this dosen't work on dev Because react second render
        if (currentASSubtitles()) {
            // currentASSubtitles.hide()
            currentASSubtitles()!.destroy()
            currentASSubtitles()!._canvas.remove()
            setASSubtitles(() => undefined)
        }

        if (window.electronAPI.process.env.NODE_ENV == "development" && currentASSubtitles() && assSubContainer) {
            assSubContainer.innerHTML = ""
        }

        if (vttUrl()) {
            setVttUrl(() => undefined)
            setCue(() => undefined)
        }

        if (sub.label == "Off" && sub.format == "", sub.lang == "", sub.url == "") {
            setSubtitles({ url: "", format: "", lang: "", label: "Off" })
            return
        }

        if (sub.format == "ass") {
            const renderer = new JASSUB({
                video: videoRef,
                subUrl: sub.url,
                workerUrl,
                wasmUrl,
            });
            setASSubtitles(renderer)
            setSubtitles(() => sub)
            return
        }

        let data = await request(sub.url)
        if (!data.success) return

        const vtt = await convert(data.text, ".vtt", { removeTextFormatting: true });
        const blob = new Blob([vtt.subtitle], { type: "text/vtt" });
        setVttUrl(URL.createObjectURL(blob));
        setSubtitles(() => sub)
        let track = videoRef.textTracks[0]
        track.mode = "hidden"
        track.oncuechange = onChangeTrackText;
    }

    function keybinds(event: string) {
        if (videoRef) {
            var time_now = videoRef.currentTime
            switch (event.toLowerCase()) {
                case convertKeybinds(config.Player.keybinds.Pause.toLowerCase()).toLowerCase():
                    togglePlay()
                    break
                case convertKeybinds(config.Player.keybinds.TimeSkipRight.toLowerCase()).toLowerCase():
                    change_time((time_now += parseInt(config.Player.general.TimeSkipRight.toString())))
                    setTimeoutForElement(buttonSkipRight, setShowButtonSkipRight)
                    break
                case convertKeybinds(config.Player.keybinds.TimeSkipLeft.toLowerCase()).toLowerCase():
                    change_time((time_now -= parseInt(config.Player.general.TimeSkipLeft.toString())))
                    setTimeoutForElement(buttonSkipLeft, setShowButtonSkipLeft)
                    break
                case convertKeybinds(config.Player.keybinds.LongTimeSkipForward.toLowerCase()).toLowerCase():
                    change_time((time_now += parseInt(config.Player.general.LongTimeSkipForward.toString())))
                    setTimeoutForElement(buttonSkipRight, setShowButtonSkipRight)
                    break
                case convertKeybinds(config.Player.keybinds.LongTimeSkipBack.toLowerCase()).toLowerCase():
                    change_time((time_now -= parseInt(config.Player.general.LongTimeSkipBack.toString())))
                    setTimeoutForElement(buttonSkipLeft, setShowButtonSkipLeft)
                    break
                case convertKeybinds(config.Player.keybinds.Fullscreen.toLowerCase()).toLowerCase():
                    enterFullscreen()
                    break
                case convertKeybinds(config.Player.keybinds.ExitPlayer.toLowerCase()).toLowerCase():
                    exitPlayer()
                    break
                case convertKeybinds(config.Player.keybinds.FrameSkipForward.toLowerCase()).toLowerCase():
                    change_time((time_now += 0.0416))
                    break
                case convertKeybinds(config.Player.keybinds.FrameSkipBack.toLowerCase()).toLowerCase():
                    change_time((time_now -= 0.0416))
                    break
                case convertKeybinds(config.Player.keybinds.VolumeDown.toLowerCase()).toLowerCase():
                    handleVolume((videoRef.volume * 100) - 1)
                    break
                case convertKeybinds(config.Player.keybinds.VolumeUp.toLowerCase()).toLowerCase():
                    handleVolume((videoRef.volume * 100) + 1)
                    break
                case convertKeybinds(config.Player.keybinds.ScreenShot.toLowerCase()).toLowerCase():
                    takeScreenshot()
                    break
                case convertKeybinds(config.Player.keybinds.VolumeMute.toLowerCase()).toLowerCase():
                    setMutedToPlayer()
                    break
                case convertKeybinds(config.Player.keybinds.NextEpisode.toLowerCase()).toLowerCase():
                    setEpisode("next")
                    break
                case convertKeybinds(config.Player.keybinds.PrevEpisode.toLowerCase()).toLowerCase():
                    setEpisode("prev")
                    break
                case convertKeybinds(config.Player.keybinds.PictureInPicture.toLowerCase()).toLowerCase():
                    handlePictureInPicture()
                    break
                case convertKeybinds(config.Player.keybinds.toggleSubtitles.toLowerCase()).toLowerCase():
                    toggleSubtitles()
                    break
                case convertKeybinds(config.Player.keybinds.skipOpeningEnding.toLowerCase()).toLowerCase():
                    if (currentSkipButton().time <= 0) return
                    if (currentSkipButton().type == "ending") setHideUpNextEpisode(true)
                    change_time(currentSkipButton().time)
                    break
            }
        }
    }

    function toggleSubtitles(): any {
        if (ListSubtitles().length <= 0) return
        if (currentSubtitles() && currentSubtitles()!.label != "Off") {
            setlastSubtitles(() => currentSubtitles())
            setNewSubtitles(ListSubtitles()[0])
            return
        }
        if (lastSubtitles()) setNewSubtitles(lastSubtitles()!)
    }

    async function takeScreenshot() {
        if (!screenshotWrapper) return
        if (config == null) return
        if (!videoRef) return

        const currentDate: Date = new Date();
        const [year, month, day, hour, minute, second] = [
            currentDate.getFullYear(),
            currentDate.getMonth() + 1,
            currentDate.getDate(),
            currentDate.getHours(),
            currentDate.getMinutes(),
            currentDate.getSeconds(),
        ].map(v => String(v).padStart(2, "0"));

        const formatedDate = `-${year}-${month}-${day}-${hour}-${minute}-${second}`;

        let screenshot: string = "data:,"

        if (currentASSubtitles()) {
            const outputCanvas = document.createElement("canvas");
            const ctx = outputCanvas.getContext("2d");
            if (!ctx) {
                toast(t("player.toastscreenshot.failed"), { type: "error" });
                return
            };
            outputCanvas.width = videoRef.videoWidth;
            outputCanvas.height = videoRef.videoHeight;
            ctx.drawImage(videoRef, 0, 0, videoRef.videoWidth, videoRef.videoHeight);
            ctx.drawImage(currentASSubtitles()!._canvas, 0, 0, videoRef.videoWidth, videoRef.videoHeight);
            screenshot = outputCanvas.toDataURL("image/png");
        } else {
            const canvas = await html2canvas(screenshotWrapper);
            screenshot = canvas.toDataURL("image/png");
        }

        if (screenshot == "data:,") {
            toast(t("player.toastscreenshot.failed"), { type: "error" });
            return
        }
        if (config.Player.screenShot.saveType == "Clipboard" || config.Player.screenShot.saveType == "Both") {
            const blob = await (await fetch(screenshot)).blob();
            await navigator.clipboard.write([
                new ClipboardItem({
                    'image/png': blob,
                }),
            ]);
            toast(t("player.toastscreenshot.doneclip"), { type: "success" });
            if (config.Player.screenShot.saveType == "Clipboard") return
        }

        if (!window.api) return

        if (config.Player.screenShot.alwaysAsk) var resp = await window.api.os.saveDialog(`${config.Player.screenShot.path}/screenshot${formatedDate}.png`, screenshot.replace(/^data:image\/png;base64,/, ''), `screenshot${formatedDate}.png`, "png", ["PNG"], "base64")
        else var resp = await window.api.os.write(`${config.Player.screenShot.path}/screenshot${formatedDate}.png`, screenshot.replace(/^data:image\/png;base64,/, ''), "base64")
        if (resp) {
            toast(t("player.toastscreenshot.donefile", { path: config.Player.screenShot.path }), { type: "success" });
            return;
        }
        toast(t("player.toastscreenshot.failed"), { type: "error" });
        return;
    };

    const centerContextMenu: ContextMenuProps = [
        { option: t("contextMenu.nerdstats"), onClick: () => setshowNerdStats((prev) => !prev) }
    ]

    function handleProgress(event: Event & { currentTarget: HTMLVideoElement; target: Element; }) {
        if (!config.Player.general.showBrokenBuffer && !hls()) return
        const video = event.currentTarget;
        if (video && video.duration > 0 && video.buffered.length > 0) {
            let timestamps: { position: number, width: number }[] = []
            for (let index = 0; index < video.buffered.length; index++) {
                const startX = (video.buffered.start(index) / video.duration) * 100;
                const endX = (video.buffered.end(index) / video.duration) * 100;
                const width = endX - startX;
                timestamps.push({ position: startX, width: width })
            }
            setBuffered(() => timestamps);
        }
    };

    function detectDisableTooltips(text: string): string | undefined {
        if (isShowSelectEpisode()) return undefined
        if (currentSettings()) return undefined
        return text
    }

    function countImages(data: { ep: string, img?: string, title?: string }[]): boolean {
        let counter: number = 0
        for (let index = 0; index < data.length; index++) {
            const element = data[index];
            if (element.img) counter += 1
        }
        if (data.length <= counter) return true
        return false
    }

    async function VTTstoryBoardParser(url: string) {
        let data = await request(url)
        if (!data.success) return
        const lines = data.text.split("\n").map((l: string) => l.trim());
        let thumbnails: Thumbnail = { src: "", metadata: [] };
        const src: string = url.slice(0, url.lastIndexOf("/") + 1)
        let metadata: { start: number; end: number; imgX: number; imgY: number; }[] = []

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes("-->")) {
                const [start, end] = lines[i].split(" --> ");
                const next = lines[i + 1];
                if (!next) continue;

                const [file, fragment] = next.split("#");
                let x = 0,
                    y = 0

                if (fragment?.startsWith("xywh=")) {
                    const [xx, yy] = fragment.replace("xywh=", "").split(",").map(Number);
                    x = xx;
                    y = yy;
                }

                const finnalSrc: string = `${src}${file}`
                thumbnails = { ...thumbnails, src: finnalSrc }
                metadata.push({
                    start: toSeconds(start),
                    end: toSeconds(end),
                    imgX: x,
                    imgY: y,
                });
            }
        }

        return { ...thumbnails, metadata: metadata };
    }

    function generateOpeningEnding(data: playerChapterList[]) {
        if (!videoRef) return
        let tmp: { left: number, width: number, name?: string, type: "opening" | "ending" | "other" }[] = []
        for (let index = 0; index < data.length; index++) {
            const element = data[index];
            tmp.push({ left: (element.start / videoRef.duration) * 100, width: ((element.end - element.start) / videoRef.duration) * 100, name: element.name, type: element.type })
        }
        setChapterList(() => tmp)
    }

    function getcurrentChapter(): string | undefined {
        if (!currentPlayer()) return undefined
        if (!currentPlayer()!.listChapters) return undefined
        if (!videoRef) return undefined

        for (let index = 0; index < currentPlayer()!.listChapters!.length; index++) {
            const element = currentPlayer()!.listChapters![index];
            if (videoRef.currentTime >= element.start && videoRef.currentTime <= element.end && element.name) return element.name
        }
        return undefined
    }

    function getCurrentImage(): string | undefined {
        const episode = getEpisode("next")
        if (!episode) return undefined
        for (let index = 0; index < temp.episodes.length; index++) {
            const element = temp.episodes[index];
            if (element.ep == episode.ep && element.img) return element.img
        }
        return undefined


    }

    function checkUptoNext() {
        if (config.Player.upToNextEpisode.variants == "old" && isUpNextEpisode() == false) return false
        return true
    }

    function getEpisode(type: "next" | "prev"): { ep: string; img?: string; title?: string; } | undefined {
        if (type == "next") return temp.episodes[temp.episodes.findIndex((item) => temp.episode == item.ep) + 1]
        if (type == "prev") return temp.episodes[temp.episodes.findIndex((item) => temp.episode == item.ep) - 1]
        return undefined
    }

    function calculateChaptersTime(): string | undefined {
        if (!currentPlayer() || !currentPlayer()!.listChapters) return
        if (currentPlayer()!.listChapters!.length <= 0) return
        if (!videoRef) return
        let newTime = videoRef.duration
        for (let index = 0; index < currentPlayer()!.listChapters!.length; index++) {
            const element = currentPlayer()!.listChapters![index];
            if (element.type == "opening") {
                newTime = newTime - (element.end - element.start)
            }
            if (element.type == "ending") {
                newTime = newTime - (element.end - element.start)
            }
        }
        return formatTime(newTime)
    }

    return (
        <div class={isVisible() ? "player-video-container" : "player-video-container player-hide-cursor"} ref={containerRef} onMouseMove={handleMouseMove} onContextMenu={(event) => OpenContextMenu(CreateContextMenuOptions(undefined, centerContextMenu), event)}>
            <div ref={screenshotWrapper} class={isVisible() ? "player-video-container" : "player-video-container player-hide-cursor"} >
                <video
                    ref={videoRef}
                    class="video-player"
                    onTimeUpdate={updateProgress}
                    onProgress={updateProgress}
                    onSeeked={updateProgress}
                    onClick={() => { togglePlay(); setcurrentSettings(() => false); setShowSelectEpisode(() => false) }}
                    autoplay={isPlaying()}
                    onWaiting={() => { setWaitingPlayer(() => true) }}
                    onCanPlay={() => { setWaitingPlayer(() => false) }}
                    onError={(error) => videoErrorHandler(error)}
                    onLoadedMetadata={(event) => {
                        updateProgress(event)
                        setdurrationTime(event.currentTarget.duration)
                        if (currentPlayer() && currentPlayer()!.listChapters) {
                            generateOpeningEnding(currentPlayer()!.listChapters!)
                        }
                    }}
                    preload="auto"
                    muted={isMuted()}
                    style={config.Player.general.VideoStreching ? { "object-fit": "cover" } : {}}
                >
                    <track
                        src={vttUrl()}
                        kind="subtitles"
                        default
                        ref={vttSubRef}
                    />
                </video>
                <Show when={currentCue()}>
                    <div class={`player-subtitle-container ${isVisible() ? "up" : "down"}`}>
                        <For each={currentCue()!.split("\n")}>
                            {(text) => (
                                <span class="player-subtitle-content">{text}</span>
                            )}
                        </For>
                    </div>
                </Show>
                <div ref={assSubContainer} style={{ position: "absolute", top: "0", left: "0" }}></div>
            </div>
            <Show when={isVisible()}>
                <>
                    <div class="player-mask top"></div>
                    <div class="player-mask bottom"></div>
                </>
            </Show>

            <div class="video-overlay">
                <div class={checkUptoNext() ? isVisible() ? 'video-top' : 'video-top player-hidden' : 'video-top'}>
                    <Button icon='arrow_back' ButtonClass='player-buttons' iconClassName="player-button-icons" onClick={async () => await exitPlayer()} />
                    <div class="player-title ">{detectTitle({ title: anime_data.AnimeData.title, ep: temp.episode, format: anime_data.AnimeData.format })}</div>
                </div>
                <div class="video-center"> {/* video-center-container */}
                    <Show when={!config.Player.ui.DisableSkipAnimation}>
                        <>
                            <Show when={isShowButtonSkipLeft()}>
                                <div class="player-loading-animation-container player-fast-rewind-ui">
                                    <div class="material-symbols-outlined player-icon-ui">fast_rewind</div>
                                </div>
                            </Show>
                            <Show when={isShowButtonSkipRight()}>
                                <div class="player-loading-animation-container player-fast-forward-ui">
                                    <div class="material-symbols-outlined player-icon-ui">fast_forward</div>
                                </div>
                            </Show>
                        </>
                    </Show>

                    <Show when={resolutionNotFound()}>
                        <div class="player-loading-animation-container player-buffering-animation">
                            <div class="player-icon-ui material-symbols-outlined">error</div>
                        </div>
                    </Show>

                    <Show when={!config.Player.ui.DisableLoadingAnimation && !resolutionNotFound() && isWaitingPlayer()}>
                        <div class="player-loading-animation-container player-buffering-animation">
                            <div class="material-symbols-outlined player-waiting">progress_activity</div>
                        </div>
                    </Show>
                    <Show when={!config.Player.ui.DisableSpaceAnimation && isShowPlay() && isWaitingPlayer() == false}>
                        <div class="player-loading-animation-container">
                            <div class="player-icon-ui material-symbols-outlined">{isPlaying() ? "pause" : "play_arrow"}</div>
                        </div>
                    </Show>
                </div>
                <div class={isVisible() && checkUptoNext() ? 'video-bottom' : 'video-bottom player-hidden'}>
                    <SeekBar chapterList={chapterList()} thumbnail={thumbnails()} secondBarValues={currentBuffer()} currentValue={currentTime()} maxValue={videoRef?.duration} onSeek={value => { setTimeVideo(value) }} type="time" classes={{ container: "player-seekbar" }} screen={true} />
                    <div class="player-bottom-section">
                        <div class="player-left">
                            <Show when={getEpisode("prev") !== undefined}>
                                <PlayerButton title={t('player.previous', { ep: getEpisode("prev")?.ep })} icon='skip_previous'
                                    onClick={() => setEpisode("prev")}
                                    ButtonClass="player-buttons" />
                            </Show>
                            <PlayerButton icon={isPlaying() ? "pause" : "play_arrow"} title={isPlaying() ? t('player.Pause') : t('player.play')} ButtonClass="player-buttons" onClick={togglePlay} />

                            <Show when={getEpisode("next") !== undefined}>
                                <PlayerButton icon='skip_next' ButtonClass='player-buttons' title={t('player.next', { ep: getEpisode("next")?.ep })} onClick={() => setEpisode("next")} />
                            </Show>
                            <div class="player-time-display"
                                onClick={() => { saveConfig(updateObjectConfig("Player.general.minusTime", !minusTimeState, config)); setminusTimeState((prev) => !prev) }}
                            >
                                <div class="player-time-display-current">
                                    <Show when={minusTimeState()} fallback={formatTime(currentTime())}>
                                        {`-${formatTime(videoRef ? videoRef.duration - currentTime() : 0)}`}
                                    </Show>
                                </div>
                                /
                                <div class="player-time-display-durration">{formatTime(durrationTime())}</div>
                                <Show when={calculateChaptersTime()}>
                                    <div class="player-time-display-chaptersTime">
                                        ({calculateChaptersTime()})
                                    </div>
                                </Show>
                            </div>
                            <div class="player-end-time-display">
                                {t("player.episodeEndsOn", { time: addTime(videoRef?.duration ? (videoRef.duration - currentTime()) : 0) })}
                            </div>
                        </div>
                        <div class="player-right">
                            <Show when={getcurrentChapter()}>
                                <span>{t("player.chapter", { name: getcurrentChapter() })}</span>
                            </Show>

                            <PlayerButton icon={isMuted() ? 'volume_off' : 'volume_up'} title={isMuted() ? t("player.unmute") : t("player.mute")} ButtonClass="player-buttons volume-button" onClick={setMutedToPlayer} />

                            <div class="player-volume-seek">
                                <SeekBar currentValue={volume()} maxValue={100} onSeek={value => handleVolume(value)} classes={{ "container": "player-seekbar" }} type="procent" />
                            </div>

                            {/* TODO: Improve picture in picture */}
                            {/* <PlayerButton icon={"picture_in_picture"} onClick={handlePictureInPicture} title={detectDisableTooltips("Picture In Picture")} ButtonClass="player-buttons" /> */}

                            <Show when={temp.episodes.length >= 2}>
                                <PlayerButton icon={"video_library"} title={detectDisableTooltips("Select Episode")} ButtonClass="player-buttons" onClick={() => { setShowSelectEpisode((prev) => !prev); setcurrentSettings(() => false) }} />
                            </Show>
                            <Show when={isShowSelectEpisode()}>
                                <div class="player-select-episode-container" >
                                    <div class="player-select-episode-title">{t("player.changeEpisode")}</div>
                                    <Show when={!countImages(temp.episodes)}
                                        fallback={
                                            <div class="player-select-episode-content-list">
                                                <For each={temp.episodes}>
                                                    {(element) => (
                                                        <PlayerEpisodeElement nextEpisode={setNextEpisode} animeTitle={anime_data.AnimeData.title.romaji} episodes={element} currentEpisode={temp.episode} />
                                                    )}
                                                </For>
                                            </div>
                                        }
                                    >
                                        <div class="player-select-episode-content">
                                            <For each={temp.episodes}>
                                                {(element) => (
                                                    <div class={`information-episode-button ${parseInt(element.ep) < parseInt(temp.episode) ? "watched" : ""} ${parseInt(element.ep) == parseInt(temp.episode) ? "current" : ""}`}
                                                        onClick={() => setNextEpisode(element.ep)}
                                                    >
                                                        {element.ep}
                                                    </div>
                                                )}
                                            </For>
                                        </div>
                                    </Show>
                                </div>
                            </Show>
                            <PlayerSettings
                                state={currentSettings()}
                                sources={
                                    player_data.map((val) => { return { name: val.hostname, change: () => checkUrl(player_data[player_data.findIndex((item) => item.hostname === val.hostname)]) } })
                                }
                                resolution={
                                    ListResolution().map((val) => { return { res: val.res, change: () => setNewResolution(val as any) } })
                                }
                                speed={speed.map((val) => { return { speed: parseFloat(val), change: () => setSpeed(val) } })}
                                subtitles={
                                    ListSubtitles().map((val) => { return { sub: val.label, change: () => setNewSubtitles(val) } })
                                }
                                audioTrack={
                                    audioTrackList().map((val) => { return { track: val.label, change: () => changeAudioTrack(val) } })
                                }
                                disableSettings={() => setcurrentSettings(() => false)}
                                current={{
                                    currentHost: currentPlayer() ? currentPlayer()!.hostname : t("player.other.unknown"),
                                    currentResolution: currentResolution() ? currentResolution()!.res : t("player.other.unknown"),
                                    currentSpeed: videoRef?.playbackRate ? videoRef?.playbackRate : 1,
                                    currentSub: currentSubtitles() ? currentSubtitles()!.label : t("player.other.off"),
                                    currentTrack: currentAudioTrack() ? currentAudioTrack()!.label : t("player.other.default")
                                }}
                            />
                            <PlayerButton icon="settings" ButtonClass="player-buttons" title={detectDisableTooltips(t('global.settings'))} onClick={() => { setcurrentSettings((prev) => !prev); setShowSelectEpisode(() => false) }} />
                            <PlayerButton icon={isFullscreen() ? 'fullscreen_exit' : 'fullscreen'} ButtonClass="player-buttons" title={detectDisableTooltips(t('player.fullscreen'))} onClick={async () => await enterFullscreen()} />
                        </div>
                    </div>
                </div>
            </div>
            <Show when={IsRunningButtonSkipTime()}>
                <button onClick={() => {
                    if (currentSkipButton().type == "ending") setHideUpNextEpisode(true);
                    change_time(currentSkipButton().time)
                    clearChapterSkipTime()
                }} class="player-skip-chapters-button">
                    {currentSkipButton().text}, {`${buttonSkipTime()}s`}
                </button>
            </Show>
            <Show when={config.Player.upToNextEpisode.variants == "old" && isUpNextEpisode()}>
                <div class="player-up-Next-container old">
                    <div class="player-up-Next-Title old">{t("player.upNext.title", { sec: parseInt(timeNextEpisode().toString()) })}</div>
                    <div class="player-up-Next-Anime old">{t("player.upNext.titleAnime", { ep: getEpisode("next")?.ep, title: anime_data.AnimeData.title.romaji })}</div>
                    <div class="player-up-Next-Buttons old">
                        <Button content={t("player.upNext.nextEp")} ButtonClass='player-up-Next-Button old' onClick={() => setEpisode("next")} />
                        <Button content={t("player.upNext.hide")} ButtonClass='player-up-Next-Button old' onClick={() => { setHideUpNextEpisode(true); setUpNextEpisode(false) }} />
                    </div>
                </div>
            </Show>
            <Show when={config.Player.upToNextEpisode.variants == "var2" && isUpNextEpisode()}>
                <div class="player-up-Next-background" style={{ "background-image": `url(${getCurrentImage()})` }}
                    onClick={() => setEpisode("next")}>
                    <div class="player-up-Next-container-var2 ">
                        <span class="material-symbols-outlined player-up-Next-icon">skip_next</span>
                        <div class="player-up-Next-content var2">
                            <div class="player-up-Next-title">{anime_data.AnimeData.title.romaji}</div>
                            <div class="player-up-Next-episode">{t("player.upNext.nextEpisode", { episode: getEpisode("next")?.ep })}</div>
                            <div class="player-up-Next-text">{t("player.upNext.nextPlaying", { time: parseInt(timeNextEpisode().toString()) })}</div>
                        </div>
                    </div>
                    <button class="material-symbols-outlined player-up-Next-button-close" onClick={(event) => {
                        event.stopPropagation();
                        setHideUpNextEpisode(true);
                        setUpNextEpisode(false)
                    }
                    }>close</button>
                </div>
            </Show>
            <Show when={config.Player.upToNextEpisode.variants == "var1" && isUpNextEpisode()}>
                <div class="player-up-Next-container" onClick={() => setEpisode("next")}>
                    <img src={getCurrentImage()} class="player-up-Next-image" />
                    <span class="material-symbols-outlined player-up-Next-icon">skip_next</span>
                    <div class="player-up-Next-content">
                        <div class="player-up-Next-title">{anime_data.AnimeData.title.romaji}</div>
                        <div class="player-up-Next-episode">{t("player.upNext.nextEpisode", { episode: getEpisode("next")?.ep })}</div>
                        <div class="player-up-Next-text">{t("player.upNext.nextPlaying", { time: parseInt(timeNextEpisode().toString()) })}</div>
                    </div>
                    <button class="material-symbols-outlined player-up-Next-button-close" onClick={(event) => {
                        event.stopPropagation();
                        setHideUpNextEpisode(true);
                        setUpNextEpisode(false)
                    }
                    }>close</button>
                </div>
            </Show>
            <Show when={!config.Player.ui.DisableVolumeAnimation && isVolume()}>
                <div class="player-volume-ui-container">
                    <span class="player-volume-ui-icon material-symbols-outlined">{isMuted() ? 'volume_off' : 'volume_up'}</span>
                    <div class="player-volume-ui-bar-container">
                        <div class="player-volume-ui-bar-progress" style={{ "width": `${volume()}%` }}></div>
                    </div>
                    <span class="player-volume-ui-text">{parseInt(volume().toString())}%</span>
                </div>
            </Show>
            <Show when={showNerdStats()}>
                <NerdStats video={videoRef} volume={volume()} currentTime={currentTime()} />
            </Show>
            <Show when={config.Developer.playerDebug}>
                <DeveloperStats
                    isMuted={isMuted()}
                    isFullscreen={isFullscreen()}
                    isHideUpNextEpisode={isHideUpNextEpisode()}
                    isPlaying={isPlaying()}
                    isUpNextEpisode={isUpNextEpisode()}
                    isVisible={isVisible()}
                    isWaitingPlayer={isWaitingPlayer()}
                    ListResolution={ListResolution().map((val) => val.res)}
                    currentHost={currentPlayer() ? currentPlayer()?.hostname as string : "Unknown"}
                    currentResolution={currentResolution() ? currentResolution()?.res as string : "Unknown"}
                    currentSettings={currentSettings()}
                    time={time}
                    timeNextEpisode={timeNextEpisode()}
                    episode={{ ep: temp.episode, type: temp.type }}
                    episodes={temp.episodes}
                    episodesUrl={player_data}
                    showNerdStats={showNerdStats()}
                    PlayerVolume={PlayerVolume}
                />
            </Show>
        </div>
    )
}

export default VideoPlayer;