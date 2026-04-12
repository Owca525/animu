import Hls, { HlsConfig } from "hls.js"

import { AnimeData, animulistProps, ContextMenuProps, indentityPlayer, playerChapterList, playerData, playerSubtitlesFormat, resolutionFormat, SettingsConfig, Thumbnail } from "@renderer/utils/types"
import { convertKeybinds, convertSecondsToHoursFormat, CreateContextMenuOptions, dateToUnix, decodeHtmlEntities, detectTitle, detectTitleConfig, formatTime, openUrlFolder, refetchHistory, request, SaveToClipboard, toggleFullscreen, updateObject } from "@renderer/utils/functions"
import Button from "@renderer/components/buttons"
import SeekBar from "@renderer/components/seekBar"
import { OpenContextMenu } from "@renderer/utils/context/ContextMenu"
import PlayerSettings from "./components/PlayerSettings"
import PlayerButton from "./components/PlayerButton"
import PlayerEpisodeElement from "./components/playerEpisodeElement"
import { convert } from "subtitle-converter";
import html2canvas from "html2canvas"
import JASSUB from "jassub";

import workerUrl from "jassub/dist/jassub-worker.js?url";
import wasmUrl from "jassub/dist/jassub-worker.wasm?url";
import fallbackFontJASSUB from "jassub/dist/default.woff2?url";
// import modernWasmUrl from 'jassub/dist/jassub-worker-modern.wasm?url'
import { saveConfig } from "@renderer/utils/FilesManager/config"
import { SaveHistory } from "@renderer/utils/FilesManager/history"
import { Component, createSignal, For, onCleanup, onMount, Show } from "solid-js"
import { getConfig } from "@renderer/utils/stores/config"
import DeveloperStats from "./components/developerStats"
import NerdStats from "./components/nerdStats"
import { unwrap } from "solid-js/store"
import { removeToast, toast, updateToast } from "@renderer/utils/context/ToastNotification"
import { useI18n } from "@renderer/utils/i18n"
import { addTime, countImages, fetchResolutions, VTTstoryBoardParser } from "./playerUtils"
import { v4 as uuidv4 } from 'uuid';
import { updateDataInAnimulist } from "@renderer/utils/FilesManager/animulist"
import { getAudioOutput, getSocket, getSocketRoom } from "@renderer/utils/stores/global"

import videojs from "video.js";
// import "@videojs/http-streaming" 
import Player from "video.js/dist/types/player"
import { useKeyPress } from "@renderer/utils/hooks/useKeyPress"

const speed: Array<string> = ["0.25", "0.5", "0.75", "1", "1.25", "1.50", "1.75", "2"]

interface VideoPlayerProps {
    player_data: playerData[]
    anime_data: {
        AnimeData: AnimeData,
        saveData: indentityPlayer,
        animulist?: animulistProps
    }
    temp: { episode: string, type: string, episodes: { ep: string, img?: string, title?: string }[] }
    setNextEpisode: (value: string) => void
    volumeCacheFunc: (value: number) => void
    PlayerVolume: number
    time: number
    exitFromPlayer: () => void
}
export interface socketPlayerInit {
    anime: AnimeData,
    saveData: indentityPlayer,
    temp: { episode: string, type: string, episodes: { ep: string, img?: string, title?: string }[] }
}

const VideoPlayer: Component<VideoPlayerProps> = ({ player_data, anime_data, temp, setNextEpisode, volumeCacheFunc, PlayerVolume = 0, time, exitFromPlayer }) => {
    const config: SettingsConfig = getConfig();
    const { t, currentLang } = useI18n()

    // ref for html object
    let videoRef: HTMLVideoElement | undefined
    let videoJS: Player | undefined
    let containerRef: HTMLDivElement | undefined
    let hideTimer: NodeJS.Timeout | undefined
    let hideChapterButtonTimer: NodeJS.Timeout | undefined
    let screenshotWrapper: HTMLDivElement | undefined
    let volumeTimeout: NodeJS.Timeout | undefined
    let playAnimationTimeout: NodeJS.Timeout | undefined
    let buttonSkipLeft: NodeJS.Timeout | undefined
    let moreInformationTimer: NodeJS.Timeout | undefined
    let buttonSkipRight: NodeJS.Timeout | undefined
    let assSubContainer: HTMLDivElement | undefined
    let vttSubRef: HTMLTrackElement | undefined
    let screenShotContainer: HTMLDivElement | undefined
    let refreashUpdateSocket: NodeJS.Timeout | undefined
    let hls: Hls | undefined
    let currentASSubtitles: JASSUB | undefined

    // Variable
    const [volume, setVolume] = createSignal<number>(PlayerVolume)
    const [currentTime, setcurrentTime] = createSignal<number>(0)
    const [durrationTime, setdurrationTime] = createSignal<number>(0)
    const [currentBuffer, setBuffered] = createSignal<{ position: number, width: number }[]>([])
    const [playerData, updatePlayerData] = createSignal<playerData[]>(player_data)
    const [currentExtractionRes, setCurrentExtractionRes] = createSignal<{ id: string, toast: string }>({ id: "", toast: "" })

    // UI
    const [isVolume, setShowVolume] = createSignal<boolean>(false)
    const [isShowPlay, setShowPlay] = createSignal<boolean>(false)
    const [isShowSelectEpisode, setShowSelectEpisode] = createSignal<boolean>(false)
    const [buttonSkipTime, setButtonSkipTime] = createSignal<number>(15)
    const [minusTimeState, setminusTimeState] = createSignal<boolean>(config.Player.general.minusTime)
    const [IsRunningButtonSkipTime, setIsRunningButtonSkipTime] = createSignal<boolean>(false)
    const [IsDisableButtonSkipTimerOpening, setIsDisableButtonSkipTimerOpening] = createSignal<boolean>(false)
    const [IsDisableButtonSkipTimerEnding, setIsDisableButtonSkipTimerEnding] = createSignal<boolean>(false)
    const [currentSkipButton, setcurrentSkipButton] = createSignal<{ type: "opening" | "ending" | "", time: number }>({ type: "", time: 0 })
    const [isShowingMoreInformation, setShowingMoreInformation] = createSignal<boolean>(false)

    const [isShowButtonSkipLeft, setShowButtonSkipLeft] = createSignal<boolean>(false)
    const [isShowButtonSkipRight, setShowButtonSkipRight] = createSignal<boolean>(false)

    // States
    const [isMuted, setMuted] = createSignal<boolean>(false)
    const [isVisible, setIsVisible] = createSignal<boolean>(true)
    const [isWaitingPlayer, setWaitingPlayer] = createSignal<boolean>(true)
    const [isPlaying, setIsPlaying] = createSignal<boolean>(config.Player.general.Autoplay)
    const [isFullscreen, setIsFullscreen] = createSignal<boolean>(false)
    const [isCleanup, setCleanup] = createSignal<boolean>(false)
    // const [playerHeadersTMP, setPLayerHeaderTMP] = createSignal<Map<string, string>>(new Map())
    const [isDubbingOn, setIsDubbingOn] = createSignal<boolean>(false)

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

    // Clip Notitication
    const [clipToastID, setClipToastID] = createSignal<string | undefined>(undefined);

    // const gamepad = useGamepad(0, gamepadControler);
    if (getSocket()) {
        const socket = getSocket()
        socket?.on("player:update", (update: { time: number, pause: boolean }) => {
            console.log(update)
            if (update.pause != isPlaying()) togglePlay(true)
            console.log(unwrap(currentTime()) - update.time > 2, unwrap(currentTime()), unwrap(currentTime()) - update.time)
            if (unwrap(currentTime()) - update.time > 2 || unwrap(currentTime()) - update.time < -2) {
                setTimeVideo(update.time)
                clearInterval(refreashUpdateSocket)
            }
        })
    }

    let mediaRecorderInstance: MediaRecorder | undefined;
    let videoChunks: Blob[] = [];

    function startRecordClip() {
        if (!videoRef) return
        if (!videoRef["captureStream"]) return
        if (mediaRecorderInstance) return

        const stream = (videoRef as any).captureStream();
        setClipToastID(toast("Clip Is Recording", { type: "loading", click: true, timer: true }))

        mediaRecorderInstance = new MediaRecorder(stream);

        mediaRecorderInstance.ondataavailable = (event) => videoChunks.push(event.data);

        mediaRecorderInstance.onstop = () => {
            const blob = new Blob(videoChunks, { type: "video/webm" });
            const url = URL.createObjectURL(blob);

            removeToast(clipToastID()!)

            if (isPlaying()) togglePlay(true)

            const currentDate = new Date()

            const [year, month, day, hour, minute, second] = [
                currentDate.getFullYear(),
                currentDate.getMonth() + 1,
                currentDate.getDate(),
                currentDate.getHours(),
                currentDate.getMinutes(),
                currentDate.getSeconds(),
            ].map(v => String(v).padStart(2, "0"));

            const formatedDate = `-${year}-${month}-${day}-${hour}-${minute}-${second}`;

            const a = document.createElement("a");
            a.href = url;
            a.download = `clip${formatedDate}.webm`;
            a.click();
        };

        if (isPlaying() == false) togglePlay(true)
        mediaRecorderInstance.start();
    }

    function stopRecordClip() {
        if (!mediaRecorderInstance) return
        mediaRecorderInstance.stop();
    }

    function pauseClip() {
        if (!mediaRecorderInstance) return
        if (mediaRecorderInstance.state == "recording") {
            mediaRecorderInstance.pause();
            updateToast(clipToastID()!, "Clip is Paused", { type: "warning", timer: true, click: true })
        } else if (mediaRecorderInstance.state == "paused") {
            mediaRecorderInstance.resume();
            updateToast(clipToastID()!, "Clip Is Recording", { type: "loading", click: true, timer: true })
        }
    }

    function handleMouseMove() {
        setIsVisible(true)
        setShowingMoreInformation(false)
        clearTimeout(moreInformationTimer)
        if (hideTimer) clearTimeout(hideTimer)

        if (currentSettings() == false && isShowSelectEpisode() == false) {
            hideTimer = setTimeout(() => {
                setIsVisible(false)
                if (!isPlaying()) moreInformationTimer = setTimeout(() => {
                    setShowingMoreInformation(true)
                }, 4000)
            }, 2000)
        }
    }

    onMount(() => {
        let defaulthost = playerData()[0]
        for (let index = 0; index < playerData().length; index++) {
            const element = playerData()[index];
            if (element.defaultHost) defaulthost = element
        }

        if (videoRef) {
            // TODO: If you have time check why videojs first put m3u8 to video element after that put to HLS plugin
            // const ajsdbfgkljsadfbjkln = Object.assign(
            //     function (options: any, callback: any) {
            //         const controller = new AbortController();

            //         request(options.uri, {
            //             method: options.method || "GET",
            //             headers: {
            //                 ...options.headers,
            //                 ...currentResolution() && currentResolution()!["reqHeader"] ? currentResolution()!["reqHeader"] : {}
            //             },
            //         })
            //             .then(async (res) => {
            //                 console.log(res)
            //                 if (!res.success) throw new Error("Fetch failed: " + res.status);
            //                 callback(null, { 
            //                     body: res.json ? res.json : res.text,
            //                     statusCode: res.status,
            //                     method: options.method,
            //                     headers: res.responseHeader,
            //                     url: options.uri,
            //                     rawRequest: {
            //                         readyState: 1,
            //                         response: res.buffer,
            //                         responseText: res.text,
            //                         responseType: res.json ? "json" : res.text ? "text" : "arraybuffer", //"" | "text" | "arraybuffer" | "blob" | "document" | "json"
            //                         responseURL: options.uri,
            //                         status: res.status,
            //                         statusText: res.statusText,
            //                         timeout: 100,
            //                         withCredentials: false,
            //                     }
            //                  });
            //             })
            //             .catch((err) => callback(err, null));

            //         return { abort: () => controller.abort() };
            //     },
            // )
            // videojs.xhr = ajsdbfgkljsadfbjkln
            // if (videojs["Vhs"]) (videojs as any).Vhs.xhr = ajsdbfgkljsadfbjkln;

            videoJS = videojs(videoRef, {
                controls: false,
                autoplay: true,
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
            });
            if (getAudioOutput()) videoRef.setSinkId(getAudioOutput()!.deviceId)

            videoJS.children_.forEach((v) => {
                if (v["nodeName"] == "VIDEO") (v as HTMLVideoElement).classList.add("video-player")
            })

            const div = document.getElementById(videoJS.id_);
            if (div) {
                for (let i = div.children.length - 1; i >= 0; i--) {
                    const child = div.children[i];
                    if (child.tagName.toLowerCase() !== 'video') {
                        div.removeChild(child);
                    }
                }
            }
        }

        runNewPlayer(defaulthost, time)
        handleVolume(PlayerVolume, true)
        handleMouseMove()

        if (videoRef) {
            setEventInPlayer("timeupdate", updateProgress)
            setEventInPlayer("progress", updateProgress)
            setEventInPlayer("seeked", updateProgress)
            setEventInPlayer("loadedmetadata", (event) => {
                updateProgress(event)
                setdurrationTime(event.currentTarget.duration)
                if (currentPlayer() && currentPlayer()!.listChapters) {
                    generateOpeningEnding(currentPlayer()!.listChapters!)
                }
            })

            setEventInPlayer("error", videoErrorHandler)
            setEventInPlayer("canplay", () => { setWaitingPlayer(() => false) })
            setEventInPlayer("waiting", () => { setWaitingPlayer(() => true) })
            setEventInPlayer("click", () => { togglePlay(); setcurrentSettings(() => false); setShowSelectEpisode(() => false) })
        }

        if (config.Player.general.AutoFullscreen) {
            toggleFullscreen(true)
            setIsFullscreen(true)
        }

        if ("mediaSession" in navigator) {
            const findedepisode = temp.episodes.findIndex((value) => value.ep == temp.episode)
            const cover = temp.episodes[findedepisode] ? temp.episodes[findedepisode].img : anime_data.AnimeData.coverImage
            navigator.mediaSession.metadata = new MediaMetadata({
                artist: anime_data.AnimeData.studios && anime_data.AnimeData.studios.length > 0 ? anime_data.AnimeData.studios.length[0] : "",
                title: detectTitleConfig(anime_data.AnimeData.title),
                artwork: [
                    { sizes: "512x512", src: cover ? cover : "" }
                ]
            })
            navigator.mediaSession.setActionHandler("play", () => togglePlay());
            navigator.mediaSession.setActionHandler("pause", () => togglePlay());
            navigator.mediaSession.setActionHandler("previoustrack", () => setEpisode("prev"));
            navigator.mediaSession.setActionHandler("nexttrack", () => setEpisode("next"));
            navigator.mediaSession.setActionHandler("stop", () => togglePlay());
            navigator.mediaSession.setActionHandler("seekto", (event) => {
                if (!event.seekTime) return
                setTimeVideo(event.seekTime)
            })
        }

        document.querySelectorAll('*').forEach((element: any) => {
            element.tabIndex = -1
        });
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

        if (containerRef) {
            containerRef.innerHTML = ""
            containerRef.remove()
        }
        if (hideTimer) clearInterval(hideTimer)
        if (hideChapterButtonTimer) clearInterval(hideChapterButtonTimer)
        if (screenshotWrapper) screenshotWrapper.remove()
        if (volumeTimeout) clearInterval(volumeTimeout)
        if (playAnimationTimeout) clearInterval(playAnimationTimeout)
        if (buttonSkipLeft) clearInterval(buttonSkipLeft)
        if (moreInformationTimer) clearInterval(moreInformationTimer)
        if (buttonSkipRight) clearInterval(buttonSkipRight)
        if (assSubContainer) assSubContainer.remove()
        if (vttSubRef) vttSubRef.remove()
        if (screenShotContainer) screenShotContainer.remove()
        if (refreashUpdateSocket) clearInterval(refreashUpdateSocket)

        /* IFDEF DEBUG|PROD */
        await window.backend.changeHeader(undefined)
        /* ENDIF */

        setCleanup(true)
        removeToast(currentExtractionRes().toast)
        if (hls) hls.destroy()
        if (currentASSubtitles) currentASSubtitles.destroy()
        if (videoRef) videoRef.src = ""
        videoRef = undefined
        if (videoJS) videoJS.dispose()

        if (getSocket()) {
            const socket = getSocket()
            socket?.off("player:update")
        }

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

    // player Functions
    async function enterFullscreen() {
        /* IFDEF DEBUG|PROD */
        if (await window.BrowserWindow.isFullscreen()) {
            toggleFullscreen(false)
            setIsFullscreen(false)
        } else {
            toggleFullscreen(true)
            setIsFullscreen(true)
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

        setFatalError(false)
        const time = videoRef.currentTime
        if (data.defaultSubtitles) setDefaultSubtitles(ListSubtitles())
        else setNewSubtitles(ListSubtitles[0])
        setCurrentResoltion(data)

        /* IFDEF DEBUG|PROD */
        await window.backend.changeHeader(data["reqHeader"])
        /* ENDIF */

        if (hls && data.hls) {
            if (data.url == "") hls.currentLevel = hls.levels.findIndex(level => level.height === parseInt(data.res));
            else runHLS(data, currentPlayer()?.splitHLS)
            return
        }

        if (videoJS) {
            videoJS.src({
                src: data.url,
                type: "video/mp4",
            })
            setTimeVideo(time)
        }
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

    async function runNewPlayer(data: playerData, tmpTime?: number) {
        if (!videoRef) return
        setFatalError(false)

        let currentplayer = data
        setPlayer(() => currentplayer)
        if (currentplayer.extractResolution) {
            if (currentExtractionRes().toast != "") removeToast(currentExtractionRes().toast)

            const tmpID = uuidv4()
            const idToast = toast(t("notification.fetchresolution"), { type: "loading", timer: true })
            setCurrentExtractionRes({ id: tmpID, toast: idToast })
            let tmp = await fetchResolutions({
                ...currentplayer,
                episode: {
                    currentEpisode: temp.episode,
                    episodeList: temp.episodes.map((ep) => ep.ep),
                    anime: anime_data.AnimeData,
                    animeID: anime_data.AnimeData.player_ID as string,
                    type: temp.type
                }
            }, currentplayer.extractResolution)

            removeToast(idToast)
            if (currentExtractionRes().id != tmpID) return
            setCurrentExtractionRes((prev) => ({ ...prev, toast: "" }))
            if (tmp.success && tmp.data) {
                currentplayer = tmp.data
                updatePlayerData((prev) => prev.map((player) => player.hostname == tmp.data?.hostname ? tmp.data : player))
            }
        } else if (currentExtractionRes().toast != "") {
            setCurrentExtractionRes((prev) => ({ ...prev, toast: "" }))
            removeToast(currentExtractionRes().id)
        }

        if (currentplayer.resolution.length <= 0) {
            toast(t("player.errors.missingResoltions"), { type: "error" })
            setFatalError(() => true)
            return
        }
        setPlayer(() => currentplayer)

        const time = tmpTime ? tmpTime : videoRef.currentTime
        if (currentplayer.subtitles) setListSubtitles(() => [{ url: "", format: "", lang: "", label: t("player.other.off") }, ...currentplayer.subtitles as playerSubtitlesFormat[]])
        if (currentplayer.storyboardVTT) setThumbnail(await VTTstoryBoardParser(currentplayer.storyboardVTT))
        const currentRes = currentplayer.resolution[0]

        if (currentRes.defaultSubtitles && currentplayer.subtitles) setDefaultSubtitles(currentplayer.subtitles)
        if (currentRes.hls && currentplayer.splitHLS) {
            setListResolution(currentplayer.resolution)
            setCurrentResoltion(currentRes)
        }

        /* IFDEF DEBUG|PROD */
        await window.backend.changeHeader(currentRes.reqHeader);
        /* ENDIF */

        if (currentRes.hls) {
            // videoJS?.src({
            //     src: currentRes.url,
            //     type: "application/x-mpegURL",
            // })
            await runHLS(currentRes, currentplayer.splitHLS, tmpTime ? tmpTime : undefined)
            return
        }
        if (hls) hls.destroy()

        setListResolution(() => currentplayer.resolution)
        setCurrentResoltion(currentRes)

        videoJS?.src({
            src: currentRes.url,
            type: "video/mp4",
        })
        setTimeVideo(time)
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

    async function runHLS(resolution: resolutionFormat, splitHls: boolean = false, initialTime?: number) {
        let configHLS: Partial<HlsConfig> = {
            maxBufferLength: 140,
            autoStartLoad: true,
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 90,
        }

        /* IFDEF WEB */
        class sheepLoader extends Hls.DefaultConfig.loader {
            load(context: any, config: any, callbacks: any) {
                request(context.url, { method: "GET" }).then((data) => {
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
        }

        configHLS = {
            ...configHLS,
            loader: sheepLoader,
        }
        /* ENDIF */

        const tmpHls = new Hls(configHLS);

        hls = tmpHls

        if (Hls.isSupported() && videoRef) {
            const time = initialTime ? initialTime : videoRef.currentTime
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
                setFatalError(data.fatal)
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
                    if (message && !isCleanup()) toast(message, { type: "error" });
                }
            });
        }
    }

    function handleVolume(value: number, dontShow: boolean = false) {
        if (!videoRef) return
        if (!dontShow) setTimeoutForElement(volumeTimeout, setShowVolume)
        if (value > 100 || value < 0) return
        if (videoJS) videoJS.volume(parseFloat((value / 100).toFixed(2)))
        videoRef.volume = parseFloat((value / 100).toFixed(2))
        volumeCacheFunc(value)
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
                moreInformationTimer = setTimeout(() => {
                    setShowingMoreInformation(true)
                }, 4000)
                pauseClip()
                return false
            }
            clearInterval(moreInformationTimer)
            setShowingMoreInformation(false)
            video.play().catch((reason) => {
                console.warn("Video Play Error Catch", reason)
            })
            pauseClip()
            return true
        })

        if (!noScoket && getSocket()) {
            clearInterval(refreashUpdateSocket)
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

    function saveContinueProgress(event: Event & { currentTarget: HTMLVideoElement; target: Element; }) {
        // Checking to save history
        if (isCleanup()) return
        if (!config) return

        if (durrationTime() > 10 && currentTime() > durrationTime() - parseInt(config.History.continue.MaximizeTimeSave.toString()) && anime_data.animulist) {
            if (anime_data.AnimeData.episodes != undefined && anime_data.animulist.status == "CURRENT" && temp.episode.toString() == anime_data.AnimeData.episodes.toString()) {
                updateDataInAnimulist(anime_data.AnimeData.id, {
                    AnimeData: {
                        ...anime_data.AnimeData,
                        recommendations: undefined,
                        nextAiringEpisode: undefined
                    },
                    animulist: {
                        ...anime_data.animulist,
                        status: "COMPLETED",
                        endWatch: anime_data.animulist.endWatch == 0 ? dateToUnix(new Date().toString()) : anime_data.animulist.endWatch,
                        lastUpdate: dateToUnix(new Date().toString()),
                        progress: anime_data.AnimeData.episodes ? anime_data.AnimeData.episodes : temp.episodes.length
                    }
                })
            }
        }

        if (currentTime() <= parseInt(config.History.continue.MinimalTimeSave.toString())) return
        let futureHistory = {
            AnimeData: {
                ...anime_data.AnimeData,
                nextAiringEpisode: undefined,
                recommendations: undefined
            },
            saveData: {
                ...anime_data.saveData,
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

    function startChapterSkipTime() {
        if (IsRunningButtonSkipTime()) return

        setIsRunningButtonSkipTime(() => true)

        hideChapterButtonTimer = setInterval(() => {
            setButtonSkipTime((prev) => {
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

        setShowingMoreInformation(false)

        setcurrentTime(event.currentTarget.currentTime)
        saveContinueProgress(event)
        checkUpNext(event)
        handleProgress(event)

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

        // Update RPC
        /* IFDEF DEBUG|PROD */
        if (config.General.discordRPC) window.api.rpc.setActivity({
            details: t("discordrpc.player", { title: detectTitleConfig(anime_data.AnimeData.title), ep: temp.episode }),
            state: `${formatTime(event.currentTarget.currentTime)} / ${formatTime(event.currentTarget.duration)}`,
            urlDetails: `https://anilist.co/anime/${anime_data.AnimeData.id}`
        })
        /* ENDIF */

        if (!fatalError() && config.Player.general.AutoSkipEpisode && event.currentTarget.duration == event.currentTarget.currentTime) setEpisode("next")

        let player = currentPlayer()

        if (!player || !player!.listChapters) return
        if (currentTime() <= 0 || durrationTime() <= 0) return
        player.listChapters.forEach(element => {
            let currentTime = event.currentTarget.currentTime
            if (element.start == 0 && element.end == 0) return
            if (!(currentTime >= element.start && currentTime <= element.end)) return
            if (config.Player.general.autoSkipOpenings || config.Player.general.autoSkipEndings) return setTimeVideo(element.end)

            if (element.type == "opening" && !IsDisableButtonSkipTimerOpening()) {
                setcurrentSkipButton(() => { return { time: element.end, type: "opening" } })
                setIsDisableButtonSkipTimerOpening(() => true)
                startChapterSkipTime()
            }
            if (element.type == "ending" && !IsDisableButtonSkipTimerEnding()) {
                setcurrentSkipButton(() => { return { time: element.end, type: "ending" } })
                setIsDisableButtonSkipTimerEnding(() => true)
                startChapterSkipTime()
            }
        });
    }

    function checkUpNext(event: Event & { currentTarget: HTMLVideoElement; target: Element; }) {
        // checking to show Up next communicat
        if (currentTime() <= 0 || durrationTime() <= 0) return
        if (!currentPlayer()) return
        if (!config) return
        if (!config.Player.upToNextEpisode.enable) return
        const duration = event.currentTarget.duration
        const currenttime = event.currentTarget.currentTime

        if (duration <= config.Player.upToNextEpisode.durationShow * 60 && !currentPlayer()!.listChapters) return

        let endingChupter: playerChapterList | undefined = undefined
        if (currentPlayer()!.listChapters) {
            endingChupter = currentPlayer()!.listChapters!.find((cha) => cha.type == "ending")
            if (endingChupter && endingChupter.end == 0 && endingChupter.start == 0) return
        }

        let showUpToNext: boolean = currenttime > duration - parseInt(config.History.continue.MaximizeTimeSave.toString())
        let timeDelete: number = ((parseInt(duration.toFixed(0)) - parseInt(config.History.continue.MaximizeTimeSave.toString())) - parseInt(currenttime.toFixed(0))) + parseInt(config.Player.upToNextEpisode.interval.toString())

        if (endingChupter) {
            showUpToNext = currenttime >= endingChupter.start
            timeDelete = ((parseInt(duration.toFixed(0)) - (parseInt(duration.toFixed(0)) - endingChupter.start)) - parseInt(currenttime.toFixed(0))) + parseInt(config.Player.upToNextEpisode.interval.toString())
        }

        if (parseInt(timeDelete.toFixed(0)) < 0) {
            setUpNextEpisode(false)
            return
        }

        if (isHideUpNextEpisode() == false && temp.episodes[temp.episodes.findIndex((item) => temp.episode == item.ep) + 1] != null && showUpToNext) {
            setUpNextEpisode(true)
            setTimeNextEpisode(parseInt(timeDelete.toFixed(0)))
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

        if (!currentPlayer()) return
        let index = playerData().findIndex((element) => element.hostname == currentPlayer()!.hostname)
        if (playerData()[index + 1]) runNewPlayer(playerData()[index + 1])
    }

    function setTimeVideo(value: number) {
        if (!videoRef) return
        videoRef.currentTime = value
        if (videoJS) videoJS.currentTime(value)
        setcurrentTime(() => value)

        if (getSocket()) {
            clearInterval(refreashUpdateSocket)
            const socket = getSocket()
            socket?.emit("player:update", {
                roomName: unwrap(getSocketRoom()), player: {
                    time: unwrap(currentTime()),
                    pause: unwrap(isPlaying())
                }
            })
        }

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

    async function setEpisode(type: "next" | "prev") {
        if (durrationTime() <= 0) return console.warn("Illegal Change Episode")
        let ep = temp.episodes.findIndex((item) => item.ep.toString() == temp.episode, toString())
        if (ep < 0) return
        if (type == 'prev') ep = ep - 1
        if (type == 'next') ep = ep + 1
        if (temp.episodes[ep].ep === undefined) return
        return setNextEpisode(temp.episodes[ep].ep)
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
            currentASSubtitles.destroy()
            currentASSubtitles._canvas.remove()
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

    // function gamepadControler(num: number, pressed: boolean) {
    //     if (!pressed) return
    //     if (!videoRef) return
    //     let time_now = videoRef.currentTime

    //     switch (num) {
    //         case 0:
    //             togglePlay()
    //             break

    //     }
    // }

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
                exitFromPlayer()
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
                if (!IsRunningButtonSkipTime()) return
                if (currentSkipButton().type == "ending") {
                    setHideUpNextEpisode(true)
                    setIsDisableButtonSkipTimerEnding(true)
                };
                if (currentSkipButton().type == "opening") setIsDisableButtonSkipTimerOpening(true)
                setTimeVideo(currentSkipButton().time)
                clearChapterSkipTime()
                break
            case convertKeybinds(config.Player.keybinds.startRecordClip.toLowerCase()).toLowerCase():
                startRecordClip()
                break
            case convertKeybinds(config.Player.keybinds.stopRecordClip.toLowerCase()).toLowerCase():
                stopRecordClip()
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

    function generateShareURL() {
        const deepStr = `${anime_data.AnimeData.id},${anime_data.saveData.pluginName},${temp.type},${anime_data.AnimeData.player_ID},${temp.episode},${currentTime()}`

        const config = unwrap(getConfig())
        SaveToClipboard("text", `${config.deepLinkURL}/?anime=${btoa(deepStr)}`)
    }

    const centerContextMenu: ContextMenuProps = [
        { option: t("contextMenu.nerdstats"), onClick: () => setshowNerdStats((prev) => !prev) },
        { option: t("player.shareanime"), onClick: () => generateShareURL() }
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

    function getcurrentChapter(): string | undefined {
        if (!currentPlayer()) return undefined
        if (!currentPlayer()!.listChapters) return undefined
        if (!videoRef) return undefined

        for (let index = 0; index < currentPlayer()!.listChapters!.length; index++) {
            const element = currentPlayer()!.listChapters![index];
            if (element.start == 0 && element.end == 0) continue
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
        if (config.Player.upToNextEpisode.variants == "old" && isUpNextEpisode()) return false
        return true
    }

    function getEpisode(type?: "next" | "prev"): { ep: string; img?: string; title?: string; } | undefined {
        if (type == "next") return temp.episodes[temp.episodes.findIndex((item) => temp.episode == item.ep) + 1]
        if (type == "prev") return temp.episodes[temp.episodes.findIndex((item) => temp.episode == item.ep) - 1]
        return temp.episodes[temp.episodes.findIndex((item) => temp.episode == item.ep)]
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

    async function changeToDubbing() {
        const player = currentPlayer()
        if (!player) return
        console.log(isDubbingOn())

        if (isDubbingOn() == false && player?.dubResolution) {
            setListResolution(player.dubResolution)
            setNewResolution(player.dubResolution[0])
            setIsDubbingOn(true)
        } else if (isDubbingOn() == false && player.isDubbing) {
            const idToast = toast(t("notification.fetchingdub"), { type: "loading", timer: true })
            const tmp = await fetchResolutions({
                ...player,
                episode: {
                    currentEpisode: temp.episode,
                    episodeList: temp.episodes.map((ep) => ep.ep),
                    anime: anime_data.AnimeData,
                    animeID: anime_data.AnimeData.player_ID as string,
                    type: temp.type
                }
            }, player.isDubbing)
            if (tmp.success && tmp.data) {
                removeToast(idToast)
                updatePlayerData((prev) => prev.map((prevplayer) => prevplayer.hostname == player.hostname ? { ...player, dubResolution: tmp.data } : player))
                setPlayer({ ...player, dubResolution: tmp.data })
                setListResolution(tmp.data)
                setNewResolution(tmp.data[0])
            } else updateToast(idToast, t("notification.faileddub"), { type: "error", timer: false })
            setIsDubbingOn(true)
        } else {
            setListResolution(player.resolution)
            setNewResolution(player.resolution[0])
            setIsDubbingOn(false)
        }
    }

    return (
        <div class={isVisible() ? "player-video-container" : "player-video-container player-hide-cursor"} ref={containerRef} onMouseMove={handleMouseMove} onContextMenu={(event) => OpenContextMenu(CreateContextMenuOptions(undefined, centerContextMenu), event)}>
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
                <div class={checkUptoNext() ? isVisible() ? 'video-top' : 'video-top player-hidden' : 'video-top'}>
                    <div class="video-top-top">
                        <Button icon='arrow_back' ButtonClass='player-buttons' iconClassName="player-button-icons" onClick={exitFromPlayer} />
                        <div class="player-title ">{detectTitle({ title: anime_data.AnimeData.title, ep: temp.episode, format: anime_data.AnimeData.format })}</div>
                    </div>
                    <Show when={getEpisode()?.title}>
                        <span class="video-episode-title">{getEpisode()?.title}</span>
                    </Show>
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
                            <div class="player-end-time-display">
                                {t("player.episodeEndsOn", { time: addTime(durrationTime() - currentTime()) })}
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

                            <Show when={currentASSubtitles == undefined}>
                                <PlayerButton icon={"picture_in_picture"} onClick={handlePictureInPicture} title={detectDisableTooltips(t("settings.player.keybinds.pip"))} ButtonClass="player-buttons" />
                            </Show>

                            <Show when={temp.episodes.length >= 2}>
                                <PlayerButton icon={"video_library"} title={detectDisableTooltips(t("player.selectepisode"))} ButtonClass="player-buttons" onClick={() => { setShowSelectEpisode((prev) => !prev); setcurrentSettings(() => false) }} />
                            </Show>
                            <div class={`player-select-episode-container ${isShowSelectEpisode() ? "show" : "hidden"}`} >
                                <div class="player-select-episode-title">{t("player.changeEpisode")}</div>
                                <Show when={!countImages(temp.episodes)}
                                    fallback={
                                        <div class="player-select-episode-content-list">
                                            <For each={temp.episodes}>
                                                {(element) => (
                                                    <PlayerEpisodeElement nextEpisode={setNextEpisode} animeTitle={detectTitleConfig(anime_data.AnimeData.title)} episodes={element} currentEpisode={temp.episode} />
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
                            <PlayerSettings
                                isDubbingOn={isDubbingOn()}
                                state={currentSettings()}
                                turnDubbing={changeToDubbing}
                                resDubbing={currentPlayer() && currentPlayer()?.isDubbing ? true : false}
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
            <Button content={t(`player.skiptimebutton.${currentSkipButton().type}`, { time: buttonSkipTime() })} ButtonClass={`player-skip-chapters-button ${IsRunningButtonSkipTime() ? "show" : "hidden"}`}
                onClick={() => {
                    if (currentSkipButton().type == "ending") {
                        setHideUpNextEpisode(true)
                        setIsDisableButtonSkipTimerEnding(true)
                    };
                    if (currentSkipButton().type == "opening") setIsDisableButtonSkipTimerOpening(true)
                    setTimeVideo(currentSkipButton().time)
                    clearChapterSkipTime()
                }}
            />
            <div ref={screenShotContainer} class={`player-screenshot-container ${screenShot().active ? "show" : "hidden"}`}
                classList={{ click: screenShot().click != "" }}
                onclick={() => screenShot().click != "" ? openUrlFolder(screenShot().click) : ""}
            >
                <img src={screenShot().image} class="player-screenshot-image" />
                <span class="player-screenshot-text">
                    {t("player.toastscreenshot.done")}
                </span>
            </div>
            <Show when={config.Player.upToNextEpisode.variants == "old"}>
                <div class={`player-up-Next-container old  ${isUpNextEpisode() ? "show" : "hidden"}`}>
                    <div class="player-up-Next-Title old">{t("player.upNext.title", { sec: parseInt(timeNextEpisode().toString()) })}</div>
                    <div class="player-up-Next-Anime old">{t("player.upNext.titleAnime", { ep: getEpisode("next")?.ep, title: detectTitleConfig(anime_data.AnimeData.title) })}</div>
                    <div class="player-up-Next-Buttons old">
                        <Button content={t("player.upNext.nextEp")} ButtonClass='player-up-Next-Button old' onClick={() => setEpisode("next")} />
                        <Button content={t("player.upNext.hide")} ButtonClass='player-up-Next-Button old' onClick={() => { setHideUpNextEpisode(true); setUpNextEpisode(false) }} />
                    </div>
                </div>
            </Show>
            <Show when={config.Player.upToNextEpisode.variants == "var2"}>
                <div class={`player-up-Next-background ${isUpNextEpisode() ? "show" : "hidden"}`} style={{ "background-image": `url(${getCurrentImage()})` }}
                    onClick={() => setEpisode("next")}>
                    <div class="player-up-Next-container-var2 ">
                        <span class="material-symbols-outlined player-up-Next-icon">skip_next</span>
                        <div class="player-up-Next-content var2">
                            <div class="player-up-Next-title">{detectTitleConfig(anime_data.AnimeData.title)}</div>
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
            <Show when={config.Player.upToNextEpisode.variants == "var1"}>
                <div class={`player-up-Next-container ${isUpNextEpisode() ? "show" : "hidden"}`} onClick={() => setEpisode("next")}>
                    <img src={getCurrentImage()} class="player-up-Next-image" />
                    <span class="material-symbols-outlined player-up-Next-icon">skip_next</span>
                    <div class="player-up-Next-content">
                        <div class="player-up-Next-title">{detectTitleConfig(anime_data.AnimeData.title)}</div>
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
                    timeNextEpisode={timeNextEpisode()}
                    episode={{ ep: temp.episode, type: temp.type }}
                    episodes={temp.episodes}
                    episodesUrl={playerData()}
                    showNerdStats={showNerdStats()}
                    PlayerVolume={PlayerVolume}
                />
            </Show>
            <Show when={isShowingMoreInformation() && !config.Player.general.disablemoreinformation}>
                <div class="player-more-information-background">
                    <div class="player-more-information-container">
                        <span class="player-more-information-top-text">Current Watching</span>
                        <img src={anime_data.AnimeData.coverImage} class="player-more-information-image" />
                        <span class="player-more-information-title">{detectTitleConfig(anime_data.AnimeData.title)}</span>
                        <div class="player-more-information-format-container">
                            <span class="player-more-information-season">{t(`anime_seasons.${anime_data.AnimeData.season}`)} {anime_data.AnimeData.seasonYear}</span>
                            &#8226;
                            <span class="player-more-information-format">{t(`anime_formats.${anime_data.AnimeData.format}`)}</span>
                            &#8226;
                            <span class="player-more-information-episode">Episode {temp.episode} / {temp.episodes.length}</span>
                        </div>
                        <span class="player-more-information-description">{decodeHtmlEntities(anime_data.AnimeData.description as any)}</span>
                        <div class="player-more-information-genres-container">
                            <For each={anime_data.AnimeData.genres}>
                                {(item) => (
                                    <div class="player-more-information-genres">{item as string}</div>
                                )}
                            </For>
                        </div>
                        <span class="player-more-information-durration">{anime_data.AnimeData.averageScore}% &#8226; {convertSecondsToHoursFormat(durrationTime())}</span>
                    </div>
                </div>
            </Show>
        </div>
    )
}

export default VideoPlayer;