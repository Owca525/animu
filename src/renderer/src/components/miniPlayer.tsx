import Hls from 'hls.js';
import html2canvas from 'html2canvas';
import JASSUB from 'jassub';
import NerdStats from '@renderer/pages/player/components/nerdStats';
import PlayerButton from '@renderer/pages/player/components/PlayerButton';
import PlayerSettings from '@renderer/pages/player/components/PlayerSettings';
import SeekBar from '@renderer/components/seekBar';
import shaka from 'shaka-player/dist/shaka-player.compiled.js';
import {
    AnimeData,
    ContextMenuProps,
    indentityPlayer,
    playerChapterList,
    playerData,
    playerSubtitlesFormat,
    resolutionFormat,
    SettingsConfig,
    Thumbnail
} from '@renderer/utils/types';
import {
    createSignal,
    For,
    onCleanup,
    onMount,
    Show
} from 'solid-js';
import { convert } from 'subtitle-converter';
import {
    convertKeybinds,
    CreateContextMenuOptions,
    formatTime,
    openUrlFolder,
    request,
    toggleFullscreen,
    updateObject
} from '@renderer/utils/functions';
import { VTTstoryBoardParser } from '@renderer/pages/player/playerUtils';
import { getConfig } from '@renderer/utils/stores/config';
import { getSocket, getSocketRoom } from '@renderer/utils/stores/global';
import { OpenContextMenu } from '@renderer/utils/context/ContextMenu';
import { removeToast, toast } from '@renderer/utils/context/ToastNotification';
import { saveConfig } from '@renderer/utils/FilesManager/config';
import { unwrap } from 'solid-js/store';
import { useI18n } from '@renderer/utils/i18n';
import { useKeyPress } from '@renderer/utils/hooks/useKeyPress';

import workerUrl from "jassub/dist/jassub-worker.js?url";
import wasmUrl from "jassub/dist/jassub-worker.wasm?url";
import fallbackFontJASSUB from "jassub/dist/default.woff2?url";
// import modernWasmUrl from 'jassub/dist/jassub-worker-modern.wasm?url'

const speed: Array<string> = ["0.25", "0.5", "0.75", "1", "1.25", "1.50", "1.75", "2"]

export interface MiniPlayerProps {
    title?: string
    hostname: string
    resolution: resolutionFormat[]
    dubResolution?: resolutionFormat[]
    splitHLS?: boolean
    storyboardVTT?: string
    listChapters?: playerChapterList[]
    subtitles?: playerSubtitlesFormat[]
}

export interface socketPlayerInit {
    anime: AnimeData,
    saveData: indentityPlayer,
    temp: { episode: string, type: string, episodes: { ep: string, img?: string, title?: string }[] }
}

export type resoltionFormatExtended = resolutionFormat & {
    track?: shaka.extern.Track
}

function MiniPlayer(props: { props: MiniPlayerProps[] }) {
    const config: SettingsConfig = getConfig();
    const { t, currentLang } = useI18n()

    // ref for html object
    let videoRef: HTMLVideoElement | undefined
    let shakaPlayer: shaka.Player | undefined
    let containerRef: HTMLDivElement | undefined
    let hideTimer: NodeJS.Timeout | undefined
    let screenshotWrapper: HTMLDivElement | undefined
    let volumeTimeout: NodeJS.Timeout | undefined
    let playAnimationTimeout: NodeJS.Timeout | undefined
    let buttonSkipLeft: NodeJS.Timeout | undefined
    let buttonSkipRight: NodeJS.Timeout | undefined
    let assSubContainer: HTMLDivElement | undefined
    let vttSubRef: HTMLTrackElement | undefined
    let screenShotContainer: HTMLDivElement | undefined
    let refreashUpdateSocket: NodeJS.Timeout | undefined
    let hls: Hls | undefined
    let currentASSubtitles: JASSUB | undefined

    // Variable
    const [volume, setVolume] = createSignal<number>(config.Player.general.Volume)
    const [currentTime, setcurrentTime] = createSignal<number>(0)
    const [durrationTime, setdurrationTime] = createSignal<number>(0)
    const [currentBuffer, setBuffered] = createSignal<{ position: number, width: number }[]>([])
    const [playerData] = createSignal<MiniPlayerProps[]>(props.props)
    const [currentExtractionRes] = createSignal<{ id: string, toast: string }>({ id: "", toast: "" })

    // UI
    const [isVolume, setShowVolume] = createSignal<boolean>(false)
    const [isShowPlay, setShowPlay] = createSignal<boolean>(false)
    const [isShowSelectEpisode, setShowSelectEpisode] = createSignal<boolean>(false)
    const [minusTimeState, setminusTimeState] = createSignal<boolean>(config.Player.general.minusTime)

    const [isShowButtonSkipLeft, setShowButtonSkipLeft] = createSignal<boolean>(false)
    const [isShowButtonSkipRight, setShowButtonSkipRight] = createSignal<boolean>(false)

    // States
    const [isMuted, setMuted] = createSignal<boolean>(false)
    const [isVisible, setIsVisible] = createSignal<boolean>(true)
    const [isWaitingPlayer, setWaitingPlayer] = createSignal<boolean>(true)
    const [isPlaying, setIsPlaying] = createSignal<boolean>(config.Player.general.Autoplay)
    const [isFullscreen, setIsFullscreen] = createSignal<boolean>(false)
    const [isCleanup, setCleanup] = createSignal<boolean>(false)
    const [playerHeadersTMP, setPLayerHeaderTMP] = createSignal<Map<string, string>>(new Map())

    // Resolution
    const [ListResolution, setListResolution] = createSignal<resoltionFormatExtended[]>([])
    const [currentResolution, setCurrentResoltion] = createSignal<resoltionFormatExtended | undefined>(undefined)

    const [currentPlayer, setPlayer] = createSignal<MiniPlayerProps | undefined>(undefined)

    // other
    const [currentSettings, setcurrentSettings] = createSignal<boolean>(false)
    const [showNerdStats, setshowNerdStats] = createSignal<boolean>(false)
    const [fatalError, setFatalError] = createSignal<boolean>(false)
    const [chapterList, setChapterList] = createSignal<{ left: number, width: number, name?: string, type: "opening" | "ending" | "other" }[]>([])
    const [videoFrames, setVideoFrames] = createSignal<{ totalVideoFrames: number, droppedVideoFrames: number }>({ totalVideoFrames: 0, droppedVideoFrames: 0 })

    // Subtitles
    const [vttUrl, setVttUrl] = createSignal<string | undefined>(undefined);
    const [ListSubtitles, setListSubtitles] = createSignal<playerSubtitlesFormat[]>([])
    const [lastSubtitles, setlastSubtitles] = createSignal<playerSubtitlesFormat | undefined>(undefined)
    const [currentSubtitles, setSubtitles] = createSignal<playerSubtitlesFormat | undefined>(undefined)
    const [currentCue, setCue] = createSignal<string | undefined>(undefined);

    // Audio Tracks
    const [audioTrackList, setAudioTrackList] = createSignal<{ id: number, lang?: string, label: string }[]>([]);
    const [currentAudioTrack, setCurrentAudioTrack] = createSignal<{ id: number, lang?: string, label: string } | undefined>();

    // Thumbnail
    const [thumbnails, setThumbnail] = createSignal<Thumbnail | undefined>(undefined);

    // ScreenShot
    const [screenShot, setScreenShot] = createSignal<{ active: boolean, image: string, click: string }>({ active: false, image: "", click: "" });

    // const gamepad = useGamepad(0, gamepadControler);
    if (getSocket()) {
        const socket = getSocket()
        socket?.on("player:update", (update: { time: number, pause: boolean }) => {
            console.log(update)
            if (update.pause != isPlaying()) togglePlay(true)
            console.log(unwrap(currentTime()) - update.time > 3, unwrap(currentTime()), unwrap(currentTime()) - update.time)
            if (unwrap(currentTime()) - update.time > 3 || unwrap(currentTime()) - update.time < -3) {
                setTimeVideo(update.time)
                clearInterval(refreashUpdateSocket)
            }
        })
    }

    function handleMouseMove() {
        setIsVisible(true)
        if (hideTimer) clearTimeout(hideTimer)

        if (currentSettings() == false && isShowSelectEpisode() == false) {
            hideTimer = setTimeout(() => {
                setIsVisible(false)
            }, 2000)
        }
    }

    onMount(() => {
        let defaulthost = playerData()[0]

        shaka.net.NetworkingEngine.registerScheme("https", (type, requests) => {
            const controller = new AbortController();

            const promise = (async () => {
                let tmp: any = {}
                if (currentResolution() && currentResolution()?.reqHeader) tmp = currentResolution()?.reqHeader
                const resp = await request(type, {
                    method: requests.method as any,
                    headers: { ...requests.headers, ...tmp, ...playerHeadersTMP() },
                    body: requests.body,
                });

                if (!resp.success) console.warn("Shaka Player Failed Request", tmp.resp)

                const headersObj: { [key: string]: string } = {};
                resp.responseHeader.forEach((value, key) => {
                    headersObj[key] = value;
                });
                setPLayerHeaderTMP(resp.responseHeader)

                return {
                    data: resp.buffer,
                    headers: headersObj,
                    uri: type,
                    originalUri: type,
                    originalRequest: requests,
                };
            })();

            return new shaka.util.AbortableOperation(promise, async () => controller.abort());
        });

        shakaPlayer = new shaka.Player();
        shakaPlayer.configure({
            streaming: {
                bufferingGoal: 3 * 60,
                rebufferingGoal: 15,
                bufferBehind: 3 * 60,
            }
        })
        if (videoRef) {
            setEventInPlayer("timeupdate", updateProgress)
            setEventInPlayer("progress", updateProgress)
            setEventInPlayer("seeked", updateProgress)
            setEventInPlayer("loadedmetadata", updateProgress)

            setEventInPlayer("error", videoErrorHandler)
            setEventInPlayer("canplay", () => { setWaitingPlayer(() => false) })
            setEventInPlayer("waiting", () => { setWaitingPlayer(() => true) })
            setEventInPlayer("click", () => { togglePlay(); setcurrentSettings(() => false); setShowSelectEpisode(() => false) })
        }
        if (videoRef) shakaPlayer.attach(videoRef)

        runNewPlayer(defaulthost)
        handleVolume(config.Player.general.Volume, true)
        handleMouseMove()
    })

    function setEventInPlayer(type: any, handler: (event: Event & { currentTarget: HTMLVideoElement; target: Element; }) => void) {
        if (!videoRef) return
        videoRef.addEventListener(type, handler);

        onCleanup(() => {
            if (videoRef) videoRef.removeEventListener(type, handler);
        });
    }

    onCleanup(async () => {
        if (document.pictureInPictureElement) await document.exitPictureInPicture();


        setCleanup(true)
        removeToast(currentExtractionRes().toast)

        if (screenshotWrapper) screenshotWrapper.remove()
        if (containerRef) {
            containerRef.innerHTML = ""
            containerRef.remove()
        }
        if (hideTimer) clearInterval(hideTimer)
        if (volumeTimeout) clearInterval(volumeTimeout)
        if (playAnimationTimeout) clearInterval(playAnimationTimeout)
        if (buttonSkipLeft) clearInterval(buttonSkipLeft)
        if (buttonSkipRight) clearInterval(buttonSkipRight)
        if (assSubContainer) assSubContainer.remove()
        if (vttSubRef) vttSubRef.remove()
        if (screenShotContainer) screenShotContainer.remove()
        if (refreashUpdateSocket) clearInterval(refreashUpdateSocket)

        if (hls) hls.destroy()
        console.log(hls)
        if (currentASSubtitles) currentASSubtitles.destroy()
        if (videoRef) {
            videoRef.pause();
            videoRef.removeAttribute("src");
            videoRef.load();
            videoRef.remove()
        }
        videoRef = undefined
        if (shakaPlayer) shakaPlayer.destroy()

        if (getSocket()) {
            const socket = getSocket()
            socket?.off("player:update")
        }
    })

    // player Functions
    async function enterFullscreen() {
        if (!containerRef) return

        /* IFDEF DEBUG|PROD */
        if (await window.BrowserWindow.isFullscreen()) {
            toggleFullscreen(false)
            setIsFullscreen(false)
            document.exitFullscreen();
        } else {
            toggleFullscreen(true)
            setIsFullscreen(true)
            containerRef?.requestFullscreen()
        }
        /* ENDIF */

        /* IFDEF WEB */
        if (document.fullscreenElement) {
            toggleFullscreen(false)
            setIsFullscreen(false)
        } else {
            toggleFullscreen(true)
            setIsFullscreen(true)
        }
        /* ENDIF */
    }

    function setSpeed(speed: string) {
        if (!videoRef) return
        videoRef.playbackRate = parseFloat(speed)
    }

    async function setNewResolution(data: resolutionFormat | undefined) {
        if (!data) return
        if (!videoRef) return
        if (!shakaPlayer) return
        setPLayerHeaderTMP(new Map())
        setFatalError(false)
        const time = videoRef.currentTime
        if (data.defaultSubtitles) setDefaultSubtitles(ListSubtitles())
        else setNewSubtitles(ListSubtitles[0])
        setCurrentResoltion(data)

        if (hls && data.hls) {
            if (data.url == "") hls.currentLevel = hls.levels.findIndex(level => level.height === parseInt(data.res));
            else runHLS(data, currentPlayer()?.splitHLS)
            return
        }

        try {
            await shakaPlayer.load(data.url, time)
        } catch (error) { shakaPlayerErrorParser(error) }
    }

    async function setDefaultSubtitles(data: playerSubtitlesFormat[]) {
        if (data.length <= 0) return
        for (let index = 0; index < data.length; index++) {
            const element = data[index];
            if (element.lang == currentLang() && !element.label.includes("Forced")) {
                setNewSubtitles(element)
                return
            }
        }
        setNewSubtitles(data[0])
    }

    async function runNewPlayer(data: playerData) {
        if (!videoRef) return
        if (!shakaPlayer) return
        setPLayerHeaderTMP(new Map())
        setFatalError(false)

        let currentplayer = data
        setPlayer(() => currentplayer)

        if (currentplayer.resolution.length <= 0) {
            toast(t("player.errors.missingResoltions"), { type: "error" })
            setFatalError(() => true)
            return
        }

        if (currentplayer.subtitles) setListSubtitles(() => [{ url: "", format: "", lang: "", label: t("player.other.off") }, ...currentplayer.subtitles as playerSubtitlesFormat[]])
        if (currentplayer.storyboardVTT) setThumbnail(await VTTstoryBoardParser(currentplayer.storyboardVTT))
        const currentRes = currentplayer.resolution[0]

        if (currentRes.defaultSubtitles && currentplayer.subtitles) setDefaultSubtitles(currentplayer.subtitles)
        if (currentRes.hls && currentplayer.splitHLS) {
            setListResolution(currentplayer.resolution)
            setCurrentResoltion(currentRes)
        }
        if (currentRes.hls) {
            await runHLS(currentRes, currentplayer.splitHLS)
            return
        }
        if (hls) hls.destroy()

        setListResolution(() => currentplayer.resolution)
        setCurrentResoltion(currentRes)
        try {
            await shakaPlayer.load(currentRes.url, 0)
        } catch (error) { shakaPlayerErrorParser(error) }
    }

    function shakaPlayerErrorParser(error: any): any {
        console.error("Shaka Player Error:", error)
        if (!("category" in error)) return setFatalError(true)
        if (error.category == 4 && videoRef && currentResolution()) {
            setFatalError(false)
            videoRef.src = currentResolution()!.url
            videoRef.currentTime = currentTime()
            return
        }

        setFatalError(true)
    }

    function changeAudioTrack(data: { id: number, lang?: string, label: string }) {
        if (!hls) return
        try {
            hls.audioTrack = data.id
            setCurrentAudioTrack(() => data)
        } catch (error) {
            toast(t("notification.failedchangeaudio"), { type: "error" })
        }
    }

    async function runHLS(resolution: resolutionFormat, splitHls: boolean = false) {
        const tmpHls = new Hls({
            maxBufferLength: 140,
            autoStartLoad: true,
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 90,
            loader: class extends Hls.DefaultConfig.loader {
                load(context: any, config: any, callbacks: any) {
                    request(context.url, { method: "GET", headers: resolution.reqHeader }).then((data) => {
                        let currentData: any = data.text
                        if (!data.success) {
                            console.warn("Context:", context, "Data:", data)
                            callbacks.onError({ type: 'network', details: "Failed Request", fatal: true }, context)
                            return
                        }
                        const now = performance.now()
                        if (context.responseType == "arraybuffer") currentData = data.buffer
                        callbacks.onSuccess({ data: currentData, url: context.url }, {
                            loaded: data.buffer.byteLength,
                            total: data.buffer.byteLength,
                            abort: false,
                            retry: config.maxRetry,
                            chunkCount: 0,
                            bwEstimate: 0,
                            loading: { start: now - 10, first: now - 5, end: now },
                            parsing: { start: now, end: now },
                            buffering: { start: now, first: now, end: now }
                        }, context);
                    });
                }
            },
        });

        hls = tmpHls

        if (Hls.isSupported() && videoRef) {
            const time = videoRef.currentTime
            tmpHls.loadSource(resolution.url);
            tmpHls.attachMedia(videoRef);
            setTimeVideo(time)

            tmpHls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
                setFatalError(false)
                if (!splitHls) {
                    const resolutions = data.levels.map((level) => level.height);
                    resolutions.reverse()
                    setListResolution(resolutions.map((val) => { return { res: val.toString(), url: "" } }))
                    setCurrentResoltion({ res: resolutions[0].toString(), url: "" })
                    tmpHls.currentLevel = tmpHls.levels.length - 1;
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

            tmpHls.on(Hls.Events.ERROR, (_event, data) => {
                console.error("HLS", _event, data)
                const curTime = unwrap(currentTime())
                tmpHls.currentLevel = tmpHls.levels.length - 1;
                if (data.details == "bufferStalledError") tmpHls.startLoad(curTime)
                if (data.fatal) {
                    let message: string | undefined
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            tmpHls.startLoad(curTime);
                            setFatalError(false)
                            message = t('player.errors.MEDIA_ERR_NETWORK')
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            message = t('player.errors.MEDIA_ERR_DECODE')
                            // tmpHls.recoverMediaError()
                            tmpHls.destroy();
                            return
                        default:
                            message = t('player.errors.default')
                            tmpHls.destroy();
                            break;
                    }
                    setFatalError(true)
                    if (message && !isCleanup()) toast(message, { type: "error" });
                }
            });
        }
    }

    function handleVolume(value: number, dontShow: boolean = false) {
        if (!videoRef) return
        if (!dontShow) setTimeoutForElement(volumeTimeout, setShowVolume)
        if (value > 100 || value < 0) return
        videoRef.volume = parseFloat((value / 100).toFixed(2))
        setVolume(() => value)
    }

    function setTimeoutForElement(element: NodeJS.Timeout | undefined, func: (initialState: boolean) => void) {
        if (element) clearTimeout(element)
        func(true)
        volumeTimeout = setTimeout(() => {
            func(false)
        }, 500);
    }

    function togglePlay(noScoket: boolean = false) {
        const video = videoRef
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

        if (!noScoket && getSocket()) {
            const socket = getSocket()
            socket?.emit("player:update", {
                roomName: unwrap(getSocketRoom()), player: {
                    time: unwrap(currentTime()),
                    pause: unwrap(isPlaying())
                }
            })
        }

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
    }

    async function handlePictureInPicture() {
        const video = videoRef;
        if (!video) return

        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else {
                await video.requestPictureInPicture();
            }
        } catch (error) {
            console.error('Error PiP:', error);
            toast(t("notification.failedpip"), { type: "error" })
        }
    };

    function updateProgress(event: Event & { currentTarget: HTMLVideoElement; target: Element; }) {
        setcurrentTime(event.currentTarget.currentTime)
        handleProgress(event)

        setdurrationTime(event.currentTarget.duration)
        if (currentPlayer() && currentPlayer()!.listChapters && chapterList().length <= 0) {
            generateOpeningEnding(currentPlayer()!.listChapters!)
        }

        if (getSocket()) {
            if (!refreashUpdateSocket) {
                refreashUpdateSocket = setInterval(() => {
                    const socket = getSocket()
                    socket?.emit("player:update", {
                        roomName: unwrap(getSocketRoom()), player: {
                            time: unwrap(currentTime()),
                            pause: unwrap(isPlaying())
                        }
                    })
                }, 3000);
            }
        }

        setVideoFrames({ totalVideoFrames: event.currentTarget.getVideoPlaybackQuality().totalVideoFrames, droppedVideoFrames: event.currentTarget.getVideoPlaybackQuality().droppedVideoFrames })
    }

    function videoErrorHandler(event) {
        const Error = event.currentTarget.error
        var message: string
        if (!Error) return
        if (isCleanup()) return
        console.warn("Error Video Element in Animu", Error)
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
        setFatalError(true)
        toast(message, { type: "error" });
    }

    function setTimeVideo(value: number) {
        if (!videoRef) return
        videoRef.currentTime = value
        setcurrentTime(() => value)
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

    async function setNewSubtitles(sub: playerSubtitlesFormat | undefined) {
        if (!sub) return
        if (!videoRef) return

        // This clear subtitles but this dosen't work on dev Because react second render
        if (currentASSubtitles) {
            // currentASSubtitles.hide()
            currentASSubtitles._canvas.remove()
            currentASSubtitles.destroy()
            currentASSubtitles = undefined
        }

        if (window.api && window.electronAPI.process.env.NODE_ENV == "development" && currentASSubtitles && assSubContainer) {
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
                availableFonts: {
                    "default": fallbackFontJASSUB
                },
                defaultFont: "default"
                // modernWasmUrl
            } as any);
            currentASSubtitles = renderer
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

    useKeyPress((keys: string) => {
        if (keys == "CTRL+SHIFT+D") setshowNerdStats((prev) => !prev)
        if (keys == "SHIFT+R" && currentPlayer()) runNewPlayer(currentPlayer()!)
        keybinds(keys)
    })

    function keybinds(event: string) {
        if (!videoRef) return
        let time_now = videoRef.currentTime
        switch (event.toLowerCase()) {
            case convertKeybinds(config.Player.keybinds.Pause.toLowerCase()).toLowerCase():
                togglePlay()
                break
            case convertKeybinds(config.Player.keybinds.TimeSkipRight.toLowerCase()).toLowerCase():
                setTimeVideo((time_now += parseInt(config.Player.general.TimeSkipRight.toString())))
                setTimeoutForElement(buttonSkipRight, setShowButtonSkipRight)
                break
            case convertKeybinds(config.Player.keybinds.TimeSkipLeft.toLowerCase()).toLowerCase():
                setTimeVideo((time_now -= parseInt(config.Player.general.TimeSkipLeft.toString())))
                setTimeoutForElement(buttonSkipLeft, setShowButtonSkipLeft)
                break
            case convertKeybinds(config.Player.keybinds.LongTimeSkipForward.toLowerCase()).toLowerCase():
                setTimeVideo((time_now += parseInt(config.Player.general.LongTimeSkipForward.toString())))
                setTimeoutForElement(buttonSkipRight, setShowButtonSkipRight)
                break
            case convertKeybinds(config.Player.keybinds.LongTimeSkipBack.toLowerCase()).toLowerCase():
                setTimeVideo((time_now -= parseInt(config.Player.general.LongTimeSkipBack.toString())))
                setTimeoutForElement(buttonSkipLeft, setShowButtonSkipLeft)
                break
            case convertKeybinds(config.Player.keybinds.Fullscreen.toLowerCase()).toLowerCase():
                enterFullscreen()
                break
            case convertKeybinds(config.Player.keybinds.ExitPlayer.toLowerCase()).toLowerCase():
                exitPlayer()
                break
            case convertKeybinds(config.Player.keybinds.FrameSkipForward.toLowerCase()).toLowerCase():
                setTimeVideo((time_now += 0.0416))
                break
            case convertKeybinds(config.Player.keybinds.FrameSkipBack.toLowerCase()).toLowerCase():
                setTimeVideo((time_now -= 0.0416))
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
            case convertKeybinds(config.Player.keybinds.noSubbtitlesreenshot.toLowerCase()).toLowerCase():
                takeScreenshot(true)
                break
            case convertKeybinds(config.Player.keybinds.VolumeMute.toLowerCase()).toLowerCase():
                setMutedToPlayer()
                break
            case convertKeybinds(config.Player.keybinds.PictureInPicture.toLowerCase()).toLowerCase():
                handlePictureInPicture()
                break
            case convertKeybinds(config.Player.keybinds.toggleSubtitles.toLowerCase()).toLowerCase():
                toggleSubtitles()
                break
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

    function showScreenShotSuccess(image: string, click: string) {
        setScreenShot({ active: true, image: image, click: click })
        let interval = setInterval(() => {
            clearInterval(interval)
            setScreenShot({ active: false, image: image, click: click })
        }, 3000)
    }

    async function takeScreenshot(noSubbtitles: boolean = false) {
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

        if (currentASSubtitles && !noSubbtitles) {
            const outputCanvas = document.createElement("canvas");
            const ctx = outputCanvas.getContext("2d");
            if (!ctx) {
                toast(t("player.toastscreenshot.failed"), { type: "error" });
                return
            };
            outputCanvas.width = videoRef.videoWidth;
            outputCanvas.height = videoRef.videoHeight;
            ctx.drawImage(videoRef, 0, 0, videoRef.videoWidth, videoRef.videoHeight);
            ctx.drawImage(currentASSubtitles._canvas, 0, 0, videoRef.videoWidth, videoRef.videoHeight);
            screenshot = outputCanvas.toDataURL("image/png");
        } else {
            const canvas = await html2canvas(screenshotWrapper);
            screenshot = canvas.toDataURL("image/png");
        }

        if (screenshot == "data:,") {
            toast(t("player.toastscreenshot.failed"), { type: "error" });
            return
        }
        const blob = await (await fetch(screenshot)).blob();
        const url = URL.createObjectURL(blob);
        if (config.Player.screenShot.saveType == "Clipboard" || config.Player.screenShot.saveType == "Both") {
            setScreenShot({ active: true, image: url, click: "" })
            await navigator.clipboard.write([
                new ClipboardItem({
                    'image/png': blob,
                }),
            ]);
            if (config.Player.screenShot.saveType == "Clipboard") return showScreenShotSuccess(url, "")
        }

        /* IFDEF DEBUG|PROD */
        let resp: boolean = false

        if (config.Player.screenShot.alwaysAsk) resp = await window.api.os.saveDialog(
            `${config.Player.screenShot.path}/screenshot${formatedDate}.png`,
            screenshot.replace(/^data:image\/png;base64,/, ''),
            `screenshot${formatedDate}.png`, "png", ["PNG"], "base64"
        )
        else resp = await window.api.os.write(
            `${config.Player.screenShot.path}/screenshot${formatedDate}.png`,
            screenshot.replace(/^data:image\/png;base64,/, ''),
            "base64"
        )

        if (resp) showScreenShotSuccess(url, `${config.Player.screenShot.path}/screenshot${formatedDate}.png`)
        else toast(t("player.toastscreenshot.failed"), { type: "error" });
        /* ENDIF */
    };

    const centerContextMenu: ContextMenuProps = [
        { option: t("contextMenu.nerdstats"), onClick: () => setshowNerdStats((prev) => !prev) },
    ]

    function handleProgress(event: Event & { currentTarget: HTMLVideoElement; target: Element; }) {
        // if (!config.Player.general.showBrokenBuffer && !hls()) return
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

    function generateOpeningEnding(data: playerChapterList[]) {
        if (!videoRef) return
        let tmp: { left: number, width: number, name?: string, type: "opening" | "ending" | "other" }[] = []
        for (let index = 0; index < data.length; index++) {
            const element = data[index];
            tmp.push({ left: (element.start / videoRef.duration) * 100, width: ((element.end - element.start) / videoRef.duration) * 100, name: element.name, type: element.type })
        }
        setChapterList(() => tmp)
    }

    function calculateChaptersTime(): string | undefined {
        if (!currentPlayer() || !currentPlayer()!.listChapters) return
        if (currentPlayer()!.listChapters!.length <= 0) return
        if (!videoRef) return
        let newTime = durrationTime()
        for (let index = 0; index < currentPlayer()!.listChapters!.length; index++) {
            const element = currentPlayer()!.listChapters![index];
            if (element.end == 0 && element.start == 0) continue
            if (element.type == "opening" || element.type == "ending") {
                newTime = newTime - (element.end - element.start)
            }
        }
        if (newTime == durrationTime()) return undefined
        if (newTime <= 0) return undefined
        return formatTime(newTime)
    }

    return (
        <div class={isVisible() ? "player-video-container miniplayer" : "player-video-container miniplayer player-hide-cursor"} ref={containerRef} onMouseMove={handleMouseMove} onContextMenu={(event) => OpenContextMenu(CreateContextMenuOptions(undefined, centerContextMenu), event)}>
            <div ref={screenshotWrapper} class={isVisible() ? "player-video-container" : "player-video-container player-hide-cursor"} >
                <video
                    ref={videoRef}
                    class="video-player"
                    preload="auto"
                    autoplay={isPlaying()}
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
                <div class="player-mask top"></div>
                <div class="player-mask bottom"></div>
            </Show>

            <div class="video-overlay">
                <div class={isVisible() ? 'video-top' : 'video-top player-hidden'}>
                    <div class="player-title ">{currentPlayer()?.title}</div>
                </div>
                <div class="video-center"> {/* video-center-container */}
                    <Show when={!config.Player.ui.DisableSkipAnimation}>
                        <div class={`player-loading-animation-container player-fast-rewind-ui ${isShowButtonSkipLeft() ? "show" : "hidden"}`}>
                            <div class="material-symbols-outlined player-icon-ui">fast_rewind</div>
                        </div>
                        <div class={`player-loading-animation-container player-fast-forward-ui ${isShowButtonSkipRight() ? "show" : "hidden"}`}>
                            <div class="material-symbols-outlined player-icon-ui">fast_forward</div>
                        </div>
                    </Show>

                    <div class={`player-loading-animation-container player-buffering-animation ${fatalError() ? "show" : "hidden"}`}>
                        <div class="player-icon-ui material-symbols-outlined">error</div>
                    </div>

                    <Show when={!config.Player.ui.DisableLoadingAnimation}>
                        <div class={`player-loading-animation-container player-buffering-animation ${!fatalError() && isWaitingPlayer() ? "show" : "hidden"}`}>
                            <div class="material-symbols-outlined player-waiting">progress_activity</div>
                        </div>
                    </Show>
                    <Show when={!config.Player.ui.DisableSpaceAnimation}>
                        <div class={`player-loading-animation-container ${isShowPlay() && !isWaitingPlayer() ? "show" : "hidden"}`}>
                            <div class="player-icon-ui material-symbols-outlined">{isPlaying() ? "pause" : "play_arrow"}</div>
                        </div>
                    </Show>
                </div>
                <div class={isVisible() ? 'video-bottom' : 'video-bottom player-hidden'}>
                    <SeekBar chapterList={chapterList()} thumbnail={thumbnails()} secondBarValues={currentBuffer()} currentValue={currentTime()} maxValue={videoRef?.duration} onSeek={value => { setTimeVideo(value) }} type="time" classes={{ container: "player-seekbar" }} screen={true} />
                    <div class="player-bottom-section">
                        <div class="player-left">
                            <PlayerButton icon={isPlaying() ? "pause" : "play_arrow"} title={isPlaying() ? t('player.Pause') : t('player.play')} ButtonClass="player-buttons" onClick={togglePlay} />

                            <div class="player-time-display"
                                onClick={() => { saveConfig(updateObject("Player.general.minusTime", !minusTimeState(), unwrap(config))); setminusTimeState((prev) => !prev) }}
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
                        </div>
                        <div class="player-right">
                            <PlayerButton icon={isMuted() ? 'volume_off' : 'volume_up'} title={isMuted() ? t("player.unmute") : t("player.mute")} ButtonClass="player-buttons volume-button" onClick={setMutedToPlayer} />

                            <div class="player-volume-seek">
                                <SeekBar currentValue={volume()} maxValue={100} onSeek={value => handleVolume(value)} classes={{ "container": "player-seekbar" }} type="procent" />
                            </div>

                            <Show when={currentASSubtitles == undefined}>
                                <PlayerButton icon={"picture_in_picture"} onClick={handlePictureInPicture} title={detectDisableTooltips(t("settings.player.keybinds.pip"))} ButtonClass="player-buttons" />
                            </Show>

                            <PlayerSettings
                                isDubbingOn={false}
                                state={currentSettings()}
                                turnDubbing={() => ""}
                                resDubbing={false}
                                sources={
                                    playerData().map((val) => { return { name: val.hostname, change: () => runNewPlayer(playerData()[playerData().findIndex((item) => item.hostname === val.hostname)]) } })
                                }
                                resolution={
                                    ListResolution().map((val) => { return { res: val.res, change: () => setNewResolution(val) } })
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
            <div ref={screenShotContainer} class={`player-screenshot-container ${screenShot().active ? "show" : "hidden"}`}
                classList={{ click: screenShot().click != "" }}
                onclick={() => screenShot().click != "" ? openUrlFolder(screenShot().click) : ""}
            >
                <img src={screenShot().image} class="player-screenshot-image" />
                <span class="player-screenshot-text">
                    {t("player.toastscreenshot.done")}
                </span>
            </div>
            <Show when={!config.Player.ui.DisableVolumeAnimation}>
                <div class={`player-volume-ui-container ${isVolume() ? "show" : "hidden"}`}>
                    <span class="player-volume-ui-icon material-symbols-outlined">{isMuted() ? 'volume_off' : 'volume_up'}</span>
                    <div class="player-volume-ui-bar-container">
                        <div class="player-volume-ui-bar-progress" style={{ "width": `${volume()}%` }}></div>
                    </div>
                    <span class="player-volume-ui-text">{parseInt(volume().toString())}%</span>
                </div>
            </Show>
            <Show when={showNerdStats()}>
                <NerdStats duration={durrationTime()} frames={videoFrames()} volume={volume()} currentTime={currentTime()} />
            </Show>
        </div>
    )
}

export default MiniPlayer;