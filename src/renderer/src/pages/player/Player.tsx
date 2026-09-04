import Button from "@renderer/components/buttons"
import VolumeNotification from "@renderer/pages/player/components/VolumeNotification"
import { OpenContextMenu } from "@renderer/utils/context/ContextMenu"
import { CheckNumber, convertKeybinds, createElement, CreateSHA256, dateToUnix, detectTitleConfig, formatTime, openUrlFolder, request, toggleFullscreen } from "@renderer/utils/functions"
import { getConfig } from "@renderer/utils/stores/config"
import { AnimeData, animulistProps, episodeMetadata, indentityPlayer, player_script_injector, playerChapterList, playerData, playerSubtitlesFormat, resolutionFormat, Thumbnail } from "@renderer/utils/types"
import Hls, { HlsConfig } from "hls.js"
import HLSWorker from "hls.js/dist/hls.worker.js?url"
import JASSUB from "jassub"
import shaka from "shaka-player"
import { Component, For, onCleanup, onMount, Show } from "solid-js"
import { createStore, unwrap } from "solid-js/store"
import PlayerButton from "./components/PlayerButton"
import SeekBar from "@renderer/components/seekBar"
import { i18n, t } from "@renderer/utils/i18n"
import PlayerSettings from "./components/PlayerSettings"
import { removeToast, toast } from "@renderer/utils/context/ToastNotification"
import { addTime, DownloadVideo, EpisodeAvaible, GenerateOpeningEnding, generateShareURL, VTTstoryBoardParser } from "./playerUtils"
import { UpdateConfig } from "@renderer/utils/FilesManager/config"
import { CovnertToASS } from "@renderer/utils/subtitleConverter"

import workerUrl from "jassub/dist/jassub-worker.js?url";
import modernWasmUrl from 'jassub/dist/jassub-worker-modern.wasm?url'
// import wasmUrl from "jassub/dist/jassub-worker.wasm?url";
import fallbackFontJASSUB from "jassub/dist/default.woff2?url";
import { useKeyPress } from "@renderer/utils/hooks/useKeyPress"
import { getSocket, getSocketRoom, informationCache } from "@renderer/utils/stores/global"
import MoreInformation from "./components/MoreInformation"
import { updateDataInAnimulist } from "@renderer/utils/FilesManager/animulist"
import { SaveHistory } from "@renderer/utils/FilesManager/history"
import { Run_hls_manifest_script } from "@renderer/utils/worker"

shaka.polyfill.installAll()

const speed = ["0.25", "0.5", "0.75", "1", "1.25", "1.50", "1.75", "2"]

interface PlayerProps {
    type: "embed" | "player"

    playerTitle?: string,

    anime?: {
        AnimeData: AnimeData,
        saveData: indentityPlayer,
        animulist?: animulistProps
    }

    metadata: playerData[],
    ep_metadata?: {
        current: episodeMetadata,
        list: episodeMetadata[],
        type: string
    }
    setTime?: number

    onChangeEpisode?: (ep: string) => void
    onExitPlayer?: () => void
    onKeybind?: (keys: string) => void
    onTimeUpdate?: (time: number) => void
}

class PlayerGlobalCacheInstance {
    playerVolume = 0
    isMuted = false
    autoplay = true
    isFullscreen = true
    speed = 1

    currentTime = 0

    activeEvents: { type: any, handler: (event: Event & { currentTarget: HTMLVideoElement; target: Element; }) => void }[] = []

    userInteractWithSubtitles = false

    constructor() {
        const config = getConfig()

        this.playerVolume = config["Player"]["general"]["Volume"]
        this.autoplay = config["Player"]["general"]["Autoplay"]
        this.isFullscreen = config["Player"]["general"]["AutoFullscreen"]
    }
}

class ExtractorManagerInstance {
    private cache: Map<string, any> = new Map()
    private active: undefined | string = undefined

    request = async (content: { func: (arg: any) => any, args: any, loadingMessage: string, errorMessage: string }): Promise<any> => {
        this.cancelPrevius()

        let id: string = ""
        try {
            const hash = await CreateSHA256(JSON.stringify(content))
            if (this.cache.has(hash)) return this.cache.get(hash)

            id = toast(content["loadingMessage"], { type: "loading", timer: true })
            this.active = id

            const resp = await content.func(content.args)

            if (this.active != id) return undefined

            removeToast(this.active)

            this.cache.set(hash, resp)

            return resp
        } catch (error) {
            console.error("Error in ExtractorManagerInstance", error)

            if (id == this.active) toast(content["errorMessage"], { type: "error" })

            if (this.active && id == this.active) removeToast(this.active)
            return undefined
        }
    }

    cancelPrevius = () => {
        if (this.active) removeToast(this.active)
    }

    clear = () => {
        this.cache.clear()
        if (this.active) removeToast(this.active)
        this.active = undefined
    }
}

const Player: Component<PlayerProps> = ({ setTime = 0, type, metadata, ep_metadata = { current: { ep: "0" }, list: [], type: "sub" }, onChangeEpisode, anime, onExitPlayer, onKeybind, playerTitle = "" }) => {
    const ExtractorManager = new ExtractorManagerInstance()
    const animeTitle = anime ? detectTitleConfig(anime!.AnimeData.title) : "Sheeplayer"

    const config = getConfig()

    let SheePlayer: PlayerGlobalCacheInstance = window["SheePlayer"]
    if (!window["SheePlayer"]) {
        window["SheePlayer"] = new PlayerGlobalCacheInstance();
        SheePlayer = window["SheePlayer"]
    } else {
        SheePlayer = window["SheePlayer"]
    }

    const avaibleEpisode = EpisodeAvaible(ep_metadata["current"], ep_metadata["list"])

    // ref for html object
    let videoRef: HTMLVideoElement | undefined
    let Shaka: shaka.Player | undefined

    let AudioShaka: shaka.Player | undefined
    let AudioRef: HTMLAudioElement | undefined

    let HLS: Hls | undefined
    let currentASSubtitles: JASSUB | undefined

    let playerHideTimer: NodeJS.Timeout | undefined
    let hideChapterButtonTimer: NodeJS.Timeout | undefined
    let volumeTimeout: NodeJS.Timeout | undefined
    let playAnimationTimeout: NodeJS.Timeout | undefined
    let moreInformationTimer: NodeJS.Timeout | undefined

    let buttonSkipRight: NodeJS.Timeout | undefined
    let buttonSkipLeft: NodeJS.Timeout | undefined

    let refreashUpdateSocket: NodeJS.Timeout | undefined

    let refreashNerdStats: NodeJS.Timeout | undefined

    let assSubContainer: HTMLDivElement | undefined
    let screenShotContainer: HTMLDivElement | undefined
    let screenshotWrapper: HTMLDivElement | undefined
    let containerRef: HTMLDivElement | undefined

    let PlayerCleanup = false

    const [player, updatePlayer] = createStore({
        initialize: true,

        volume: SheePlayer.playerVolume,
        currentTime: setTime,
        muted: SheePlayer.isMuted,
        durration: 0,
        isPlaying: SheePlayer.autoplay,
        isFullscreen: SheePlayer.isFullscreen,
        isLoading: false,
        FatalError: false,

        speed: 1,

        isDubbing: false,

        HLSMode: false,

        buffer: [] as { position: number, width: number }[],
        subtitles: [{ url: "", format: "", lang: "", label: t("player.other.off") }] as playerSubtitlesFormat[],
        playerData: undefined as playerData | undefined,
        currentResolution: undefined as resolutionFormat | undefined,
        currentSubtitle: undefined as playerSubtitlesFormat | undefined,
        thumbnail: undefined as Thumbnail | undefined,
        chapterList: [] as { left: number, width: number, name?: string, type: "opening" | "ending" | "other" }[],
        resoltions: [] as resolutionFormat[],
        audioTrack: [] as { id: number, lang?: string, label: string }[],
        activeAudioTrack: undefined as undefined | { id: number, lang?: string, label: string }
    })

    const [ui, updateUI] = createStore({
        isVisible: true,
        isVolume: false,
        isShowPlay: false,
        isShowSelectEpisode: false,
        buttonSkipTime: 15,
        minusTimeState: config.Player.general.minusTime,

        IsRunningButtonSkipTime: false,
        IsDisableButtonSkipTimerOpening: false,
        IsDisableButtonSkipTimerEnding: false,

        isShowingMoreInformation: false,

        isShowButtonSkipLeft: false,
        isShowButtonSkipRight: false,

        TimerUILeft: "",
        TimerUIRight: "",

        ShowMoreInformation: false,

        activeMenu: undefined as undefined | string,

        minusTime: config["Player"]["general"]["minusTime"],

        screenshot: undefined as undefined | { url: string, click: string },

        upNextTimer: 0,
        upNextActive: false,
        upNextDisable: false,

        chapterSkipDisable: [] as string[],
        chapterSkipActive: false,
        chapterSkipType: undefined as string | undefined,
        chapterSkipEnd: 0,
        chapterSkipTimer: 15,

        playerContextMenu: [
            { option: t("contextMenu.nerdstats"), onClick: () => ToggleNerdStats() },
            { option: t("player.shareanime"), onClick: () => generateShareURL(anime, { type: "sub", current: ep_metadata["current"]["ep"] }, player.currentTime) },
        ],

        chapter: undefined as string | undefined,
        chapterTime: undefined as string | undefined,

        title: playerTitle
    })

    const [nerdStats, updateNerd] = createStore({
        active: false,

        player: {
            paused: player.isPlaying,
            ended: false,
            autoplay: player.isPlaying,
            muted: player.muted,
            volume: player.volume,
            playbackRate: 0,
            currentTime: player.currentTime,
            duration: player.durration,
            readyState: 0,
            networkState: 0,

            creationTime: 0,
            droppedVideoFrames: 0,
            totalVideoFrames: 0,
        }
    })

    if (getSocket()) {
        const socket = getSocket()
        socket?.on("player:update", (update: { time: number, pause: boolean }) => {
            console.log(update)
            if (update.pause != player.isPlaying) togglePlay(true)
            console.log(unwrap(player.currentTime) - update.time > 2, unwrap(player.currentTime), unwrap(player.currentTime) - update.time)
            if (unwrap(player.currentTime) - update.time > 2 || unwrap(player.currentTime) - update.time < -2) {
                setTimeVideo(update.time)
                clearInterval(refreashUpdateSocket)
            }
        })
    }

    onMount(() => {
        SheePlayer.currentTime = player.currentTime;

        if (!anime) updateUI({
            playerContextMenu: ui.playerContextMenu.filter((v) => v["option"] != t("player.shareanime"))
        })

        let defaultHost = metadata.find((v) => v["defaultHost"] == true)
        if (!defaultHost) defaultHost = metadata[0];

        // TODO: Add check if metadata is empty

        /* IFDEF DEBUG */
        (window as any).playerVideoRef = videoRef;
        (window as any).playerShaka = Shaka;
        (window as any).playerHLS = HLS;
        (window as any).playerMetadata = metadata;
        /* ENDIF */

        if (type != "embed") toggleFullscreen(SheePlayer.isFullscreen)

        if (type == "embed") {
            SheePlayer.currentTime = 0
            updatePlayer({ currentTime: 0 })
        }

        setNewPlayer(defaultHost)

        if ("mediaSession" in navigator) {
            const findedepisode = ep_metadata["current"]
            const coverImg = anime ? anime!.AnimeData.coverImage : undefined
            const cover = findedepisode["img"] ? findedepisode["img"] : coverImg

            navigator.mediaSession.metadata = new MediaMetadata({
                // artist: anime.AnimeData.studios && anime.AnimeData.studios.length > 0 ? anime.AnimeData.studios.length[0] : "",
                title: animeTitle,
                artwork: [
                    { sizes: "512x512", src: cover ? cover : "" }
                ]
            })
            navigator.mediaSession.setActionHandler("play", () => togglePlay());
            navigator.mediaSession.setActionHandler("pause", () => togglePlay());
            if (avaibleEpisode["nextEpisode"] && onChangeEpisode)
                navigator.mediaSession.setActionHandler("previoustrack", () => onChangeEpisode(avaibleEpisode["nextEpisode"]["ep"]));

            if (avaibleEpisode["prevEpisode"] && onChangeEpisode)
                navigator.mediaSession.setActionHandler("nexttrack", () => onChangeEpisode(avaibleEpisode["prevEpisode"]["ep"]));

            navigator.mediaSession.setActionHandler("stop", () => togglePlay());
            navigator.mediaSession.setActionHandler("seekto", (event) => {
                if (!event.seekTime) return
                setTimeVideo(event.seekTime)
            })
        }
    })

    onCleanup(() => {
        PlayerCleanup = true

        ExtractorManager.clear()

        clearInterval(playerHideTimer)
        clearInterval(hideChapterButtonTimer)
        clearInterval(volumeTimeout)
        clearInterval(playAnimationTimeout)
        clearInterval(moreInformationTimer)
        clearInterval(buttonSkipRight)
        clearInterval(buttonSkipLeft)
        clearInterval(refreashUpdateSocket)

        CleanuPlayer()

        SheePlayer.userInteractWithSubtitles = false

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

    /* Player */

    async function setNewPlayer(meta: playerData) {
        if (type != "embed") SheePlayer.currentTime = player.currentTime
        if (type == "embed" && meta["embedTitle"]) updateUI({ title: meta["embedTitle"] })

        createNewPlayer()

        updatePlayer({ playerData: meta, HLSMode: false, initialize: true })

        let extracted: playerData | undefined = undefined
        if (meta.extractResolution && anime) extracted = await ExtractorManager.request({
            func: meta.extractResolution,
            args: {
                ...meta,
                episode: {
                    currentEpisode: ep_metadata.current["ep"],
                    episodeList: ep_metadata.list,
                    anime: anime.AnimeData,
                    animeID: anime.AnimeData.player_ID as string,
                    type: ep_metadata.type
                }
            },
            loadingMessage: t("notification.fetchresolution"),
            errorMessage: "Failed Fetch Resolutions"
        })

        if (extracted) {
            meta = extracted

            metadata = metadata.map((v) => v["hostname"] == meta["hostname"] ? meta : v)
            updatePlayer({ playerData: meta })
        }

        if (meta.resolution.length <= 0) {
            toast(t("player.errors.missingResoltions"), { type: "error" })
            updatePlayer({ FatalError: true })
            return
        }

        const resolution = meta["resolution"][0]

        updatePlayer({
            subtitles: meta.subtitles ? [{ url: "", format: "", lang: "", label: t("player.other.off") }, ...meta.subtitles] : [{ url: "", format: "", lang: "", label: t("player.other.off") }],
            thumbnail: await VTTstoryBoardParser(meta.storyboardVTT),
            currentResolution: resolution,
            resoltions: meta["resolution"]
        })

        /* IFDEF DEBUG|PROD */
        await window.backend.changeHeader(unwrap(resolution.reqHeader));
        /* ENDIF */

        updateSubtitle()

        CheckDownloadContextMenu(resolution)

        if (resolution["audio"]) {
            createNewAudioPlayer()

            console.log("AUDIO PLAYER", AudioShaka)

            if (AudioShaka) AudioShaka.load(resolution["audio"]["url"])
        }

        if (resolution["hls"]) return ExecuteHLS()

        await Shaka!.load(resolution["url"])

        // setTimeVideo(SheePlayer.currentTime)
        ChangeSpeedPlayer(`${SheePlayer.speed}`)
    }

    async function setNewResolution(data: resolutionFormat | undefined) {
        if (!data) return
        if (!videoRef) return

        updatePlayer({
            FatalError: false,
            currentResolution: data,
            initialize: true
        })

        updateSubtitle()

        SheePlayer.currentTime = videoRef.currentTime

        /* IFDEF DEBUG|PROD */
        await window.backend.changeHeader(unwrap(data["reqHeader"]))
        /* ENDIF */

        CheckDownloadContextMenu(data)

        if (player.HLSMode && HLS) {
            HLS.currentLevel = HLS.levels.findIndex(level => level.height === parseInt(data.res))
            return
        }

        if (player.HLSMode && player.playerData!["splitHLS"] == true) {
            createNewPlayer()
            ExecuteHLS()
            return
        }

        createNewPlayer()

        if (data["audio"]) {
            createNewAudioPlayer()
            if (AudioShaka) AudioShaka.load(data["audio"]["url"])
        }

        Shaka?.load(data["url"])
        // setTimeVideo(SheePlayer.currentTime)
    }

    function updateSubtitle(): any {
        if (!player.currentResolution || !player.playerData) return

        if (!SheePlayer.userInteractWithSubtitles && !player.currentResolution["defaultSubtitles"]) {
            setNewSubtitles(player.subtitles[0])
        }

        if (!player.currentResolution["defaultSubtitles"]) return

        if (!player.playerData["subtitles"]) return

        const default_subtitle = player.playerData["subtitles"].find((v) => v["default"])
        if (default_subtitle) return setNewSubtitles(default_subtitle)

        const finded = player.playerData["subtitles"].find((v) => v["lang"] == i18n()!.currentLang())

        if (!finded) return setNewSubtitles(player.playerData["subtitles"][0])

        setNewSubtitles(finded)
    }

    function createNewAudioPlayer() {
        // TODO: Add Support For synchronize buffer etc
        if (!screenshotWrapper) return console.error("WTF Screenshot Wrapper dosen't exist, now i can't create new player")
        AudioRef = new Audio()
        AudioRef.autoplay = player.isPlaying
        AudioRef.muted = player.muted;

        AudioShaka = new shaka.Player();
        AudioShaka.attach(AudioRef)

        AudioRef.addEventListener("canplay", () => {
            console.log("AudioRef can play", AudioRef!.src)
        })

        AudioRef.addEventListener("waiting", () => {
            console.log("Fetching")
        })

        AudioRef.addEventListener("loadedmetadata", (event) => {
            console.log("AudioRef loadedmetadata", event)
        })

        ChangePlayerVolume(SheePlayer.playerVolume, true)
        setTimeVideo(SheePlayer.currentTime)
    }

    function createNewPlayer() {
        if (!screenshotWrapper) return console.error("WTF Screenshot Wrapper dosen't exist, now i can't create new player")

        CleanuPlayer()

        const videoElemenet = createElement("video", {
            className: "video-player",
            preload: "auto",
            muted: player.muted,
            autoplay: player.isPlaying
        })

        if (config.Player.general.VideoStreching) videoElemenet.style.objectFit = "cover"

        Shaka = new shaka.Player();
        Shaka.attach(videoElemenet)

        videoRef = videoElemenet

        ChangePlayerVolume(SheePlayer.playerVolume, true)
        // setTimeVideo(SheePlayer.currentTime)

        setPlayerCleanupEvent("timeupdate", updateProgress)
        setPlayerCleanupEvent("progress", updateProgress)
        setPlayerCleanupEvent("seeked", updateProgress)

        setPlayerCleanupEvent("loadedmetadata", (event) => {
            updateProgress(event)
            updatePlayer({ initialize: false })

            if (player.playerData)
                updatePlayer({
                    chapterList: GenerateOpeningEnding(player.playerData["listChapters"], event.currentTarget.duration)
                })
        })

        setPlayerCleanupEvent("error", videoErrorHandler)
        setPlayerCleanupEvent("canplay", () => { updatePlayer({ isLoading: false }) })
        setPlayerCleanupEvent("waiting", () => { updatePlayer({ isLoading: true }) })
        setPlayerCleanupEvent("click", () => { togglePlay(); ToggleMenu(undefined) })

        screenshotWrapper.append(videoRef)
        // if (player.isPlaying) togglePlay()
    }

    function videoErrorHandler(event) {
        const Error = event.currentTarget.error
        var message: string
        if (!Error) return
        if (PlayerCleanup) return
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
        updatePlayer({ FatalError: true })
        toast(message, { type: "error" });

        if (!player.playerData) return
        let index = metadata.findIndex((element) => element.hostname == player.playerData!.hostname)
        if (metadata[index + 1]) setNewPlayer(metadata[index + 1])
    }

    async function ExecuteHLS() {
        if (!player["currentResolution"]) return console.error("NO RESOLUTION FOUND")

        updatePlayer({ HLSMode: true })

        let configHLS: Partial<HlsConfig> = {
            enableWorker: config.Player.general.useHLSWorker,
            lowLatencyMode: true,
            workerPath: config.Player.general.useHLSWorker ? HLSWorker : undefined,
            autoStartLoad: true,
            backBufferLength: 40,
            manifestLoadingMaxRetry: 3,
            levelLoadingMaxRetry: 3,
            fragLoadingMaxRetry: 3,
            maxBufferLength: 140,
        }

        let manifest_script: player_script_injector[] = unwrap(player.playerData!["scripts"]) ?? []

        class sheepLoader extends Hls.DefaultConfig.loader {
            load(context: any, config: any, callbacks: any) {
                request(context.url, { method: "GET", headers: unwrap(player["currentResolution"]!["reqHeader"]) }).then(async (data) => {
                    let currentData: any = data.text
                    if (data["status"] == 429) HLS?.destroy()

                    // /* IFDEF DEBUG */
                    // console.warn("Player/HLS", data, context)
                    // /* ENDIF */

                    if (!data.success) {
                        /* IFDEF PROD */
                        console.warn("Player/HLS", context, data)
                        /* ENDIF */
                        callbacks.onError({ type: 'network', details: data["statusText"], fatal: true, code: data["status"] }, context)
                        return
                    }
                    const now = performance.now()

                    if (context.responseType == "arraybuffer") currentData = data.buffer

                    for (let index = 0; index < manifest_script.length; index++) {
                        const element = manifest_script[index];
                        switch (element["type"]) {
                            case "hls_manifest":
                                if (context["responseType"] != "text") break

                                currentData = await Run_hls_manifest_script(element["code"], data)
                                break
                            case "hls_arraybuffer":
                                if (context["responseType"] != "arraybuffer") break

                                currentData = await Run_hls_manifest_script(element["code"], data)
                                break
                        }
                    }

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

        const tmpHls = new Hls(configHLS);

        /* IFDEF DEBUG */
        console.warn("PLAYER HLS", tmpHls)
        /* ENDIF */

        HLS = tmpHls

        if (Hls.isSupported() && videoRef) {
            tmpHls.loadSource(player["currentResolution"]["url"]);
            tmpHls.attachMedia(videoRef);
            // setTimeVideo(SheePlayer.currentTime)

            tmpHls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
                updatePlayer({ FatalError: false })

                if (!player["playerData"]!["splitHLS"]) {
                    const resolutions = data.levels.map((level) => level.height);
                    resolutions.reverse()

                    updatePlayer({
                        resoltions: resolutions.map((val) => ({ ...player["currentResolution"]!, res: `${val == 0 ? 1080 : val}` })),
                        currentResolution: { ...player["currentResolution"]!, res: resolutions[0].toString() }
                    })

                    tmpHls.currentLevel = tmpHls.levels.length - 1;
                }

                data.levels.forEach(level => {
                    // I added Ignore because this give me a error "Cannot assign to 'audioCodec' because it is a read-only property." but i can assign then is good
                    // @ts-ignore
                    if (!level.audioCodec) level.audioCodec = "mp4a.40.5"
                    // @ts-ignore
                    else level.audioCodec = level.audioCodec.replaceAll('mp4a.40.2', 'mp4a.40.5')
                });

                if (data.audioTracks.length <= 0) return

                let DefaultAudio = data.audioTracks.find((v) => v["default"])
                if (!DefaultAudio) DefaultAudio = data.audioTracks[0]

                updatePlayer({
                    activeAudioTrack: { id: DefaultAudio.id, label: DefaultAudio.name, lang: DefaultAudio.lang },
                    audioTrack: data.audioTracks.map((element) => ({ id: element.id, label: element.name, lang: element.lang }))
                })
            });

            tmpHls.on(Hls.Events.ERROR, (_event, data) => {
                console.error("HLS", _event, data)

                SheePlayer.currentTime = player.currentTime

                tmpHls.currentLevel = tmpHls.levels.length - 1;

                updatePlayer({ FatalError: data.fatal })

                if (data.details == "bufferStalledError") tmpHls.startLoad(SheePlayer.currentTime)

                if (data.fatal) {
                    let message: string | undefined
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            if (data.response && [429, 403, 500, 404].includes(data.response["code"] ?? 0)) {
                                updatePlayer({ FatalError: true })
                            } else {
                                tmpHls.startLoad(SheePlayer.currentTime);
                                updatePlayer({ FatalError: false })
                            }
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

                    if (PlayerCleanup) return
                    if (!message) return

                    toast(message, { type: "error" })
                }
            });
        }
    }

    function setTimeoutForElement(element: NodeJS.Timeout | undefined, val: string) {
        clearTimeout(element)
        updateUI({ [val]: true })

        volumeTimeout = setTimeout(() => updateUI({ [val]: false }), 500);
    }

    function ChangePlayerVolume(value: number, animation: boolean = false) {
        if (value > 100 || value < 0) return
        if (!videoRef) return

        if (!animation && !config.Player.ui.DisableVolumeAnimation) setTimeoutForElement(volumeTimeout, "isVolume")

        videoRef.volume = parseFloat((value / 100).toFixed(2))
        if (AudioRef) AudioRef.volume = parseFloat((value / 100).toFixed(2))
        SheePlayer.playerVolume = value
        updatePlayer({ volume: value })
    }

    function CleanuPlayer() {
        if (Shaka) Shaka.destroy()
        if (HLS) HLS.destroy()
        if (currentASSubtitles) currentASSubtitles.destroy()

        if (AudioShaka) AudioShaka.destroy()

        SheePlayer.activeEvents.forEach((event) => {
            if (videoRef) videoRef.removeEventListener(event["type"], event["handler"])
        })

        if (videoRef) videoRef.remove()
        if (AudioRef) AudioRef.remove()
    }

    function setPlayerCleanupEvent(type: any, handler: (event: Event & { currentTarget: HTMLVideoElement; target: Element; }) => void) {
        if (!videoRef) return

        videoRef.addEventListener(type, handler);
        SheePlayer.activeEvents.push({ type: type, handler: handler })
    }

    shaka.net.NetworkingEngine.registerScheme("http", SheepCustomFetch);
    shaka.net.NetworkingEngine.registerScheme("https", SheepCustomFetch);

    const createAbortableOperation = (promise: Promise<shaka.extern.Response>, controller: AbortController): shaka.extern.IAbortableOperation<shaka.extern.Response> => ({
        promise,

        abort: () => {
            controller.abort();
            return Promise.resolve();
        },

        finally: (onFinal) => {
            return createAbortableOperation(
                promise.then(
                    (value) => {
                        onFinal(true);
                        return value;
                    },
                    (error) => {
                        onFinal(false);
                        throw error;
                    }
                ),
                controller
            );
        },
    });
    function SheepCustomFetch(
        uri: string,
        shakaRequest: shaka.extern.Request,
        _requestType: shaka.net.NetworkingEngine.RequestType,
        _progressUpdated?: shaka.extern.ProgressUpdated): shaka.extern.IAbortableOperation<shaka.extern.Response> {
        const header = player.currentResolution

        const promise = request(uri, {
            method: shakaRequest.method as any,
            headers: header && header["reqHeader"] ? header["reqHeader"] : shakaRequest.headers,
            body: shakaRequest.body as any,
        }).then(async (response) => {

            if (!response["success"]) {
                console.error("Shaka Player Failed Request", response, header)
            }

            return {
                uri,
                originalUri: uri,
                data: response["buffer"],
                headers: Object.fromEntries(response["responseHeader"]),
                originalRequest: shakaRequest,
            };
        });

        return createAbortableOperation(promise, new AbortController())
    }

    function setTimeVideo(value: number) {
        if (!videoRef) return
        videoRef.currentTime = value
        if (AudioRef) AudioRef.currentTime = value
        updatePlayer({ currentTime: value })

        if (getSocket()) {
            clearInterval(refreashUpdateSocket)
            const socket = getSocket()
            socket?.emit("player:update", {
                roomName: unwrap(getSocketRoom()), player: {
                    time: unwrap(player.currentTime),
                    pause: unwrap(player.isPlaying)
                }
            })
        }

        if (!isNaN(value) && config && value > videoRef.duration - CheckNumber(config.History.continue.MaximizeTimeSave)) {
            updateUI({ upNextDisable: true })
        }

        if (!player.playerData || !player.playerData.listChapters) return

        player.playerData.listChapters.forEach(element => {
            if (value >= element.start && value <= element.end) return
            if (element.type != ui.chapterSkipType) return

            clearChapterSkipTime(false)
        })
    }

    function updateProgress(event: Event & { currentTarget: HTMLVideoElement; target: Element; }) {
        clearInterval(moreInformationTimer)

        // IDK player just reset time even after i set url and loaded
        if (event.currentTarget.currentTime == 0 && type != "embed") {
            setTimeVideo(SheePlayer.currentTime)
            ActiveShowingUI()
        }

        updateUI({ ShowMoreInformation: false })

        updatePlayer({
            currentTime: event.currentTarget.currentTime,
            durration: event.currentTarget.duration
        })

        saveContinueProgress(event)
        checkUpNext(event)
        HandleBuffer(event)
        CalculateChapter()
        CalculateChapterTime()

        if (getSocket()) {
            if (!refreashUpdateSocket) {
                refreashUpdateSocket = setInterval(() => {
                    const socket = getSocket()
                    socket?.emit("player:update", {
                        roomName: unwrap(getSocketRoom()), player: {
                            time: unwrap(player.currentTime),
                            pause: unwrap(player.isPlaying)
                        }
                    })
                }, 3000);
            }
        }

        // Update RPC
        /* IFDEF DEBUG|PROD */
        if (config.General.discordRPC && anime) window.api.rpc.setActivity({
            details: t("discordrpc.player", { title: ui.title, ep: ep_metadata["current"]["ep"] }),
            state: `${formatTime(event.currentTarget.currentTime)} / ${formatTime(event.currentTarget.duration)}`,
            urlDetails: `https://anilist.co/anime/${anime.AnimeData.id}`
        })
        /* ENDIF */

        if (!player.FatalError && onChangeEpisode && avaibleEpisode["nextEpisode"] && config.Player.general.AutoSkipEpisode && event.currentTarget.ended)
            onChangeEpisode(avaibleEpisode["nextEpisode"]["ep"])

        if (!player.playerData || !player.playerData.listChapters) return
        if (player.currentTime <= 0 || player.durration <= 0) return

        player.playerData.listChapters.forEach(element => {
            let currentTime = event.currentTarget.currentTime

            if (element.start == 0 && element.end == 0) return

            if (!(currentTime >= element.start && currentTime <= element.end)) return

            if (config.Player.general.autoSkipOpenings || config.Player.general.autoSkipEndings) return setTimeVideo(element.end)

            if (element.type == "other") return

            if (ui.chapterSkipDisable.includes(element.type)) return

            startChapterSkipTime({
                type: element.type,
                time: element.end
            })
        });
    }

    function togglePlay(noScoket: boolean = false) {
        const video = videoRef
        if (!video) return

        const prev = !video.paused

        updatePlayer({ isPlaying: !prev })

        if (prev) {
            video.pause()
            if (AudioRef) AudioRef.pause()
            clearInterval(moreInformationTimer)

            moreInformationTimer = setTimeout(() => {
                updateUI({ ShowMoreInformation: true })
            }, 4000)

        } else {
            clearInterval(moreInformationTimer)
            updateUI({ ShowMoreInformation: false })

            if (AudioRef) AudioRef.play().catch((reason) => {
                console.warn("Audio Play Error Catch", reason)
            })
            video.play().catch((reason) => {
                console.warn("Video Play Error Catch", reason)
            })
        }


        if (!noScoket && getSocket()) {
            clearInterval(refreashUpdateSocket)
            const socket = getSocket()
            socket?.emit("player:update", {
                roomName: unwrap(getSocketRoom()), player: {
                    time: unwrap(player.currentTime),
                    pause: unwrap(player.isPlaying)
                }
            })
        }

        clearTimeout(playAnimationTimeout)

        updateUI({ isShowPlay: true })
        playAnimationTimeout = setTimeout(() => {
            updateUI({ isShowPlay: false })
        }, 300);
    }

    function setMutedToPlayer() {
        if (videoRef) videoRef.muted = !player.muted
        if (AudioRef) AudioRef.muted = !player.muted

        updatePlayer({ muted: !player.muted })

        ChangePlayerVolume(player.volume)
    }

    async function handlePictureInPicture() {
        if (!videoRef) return

        try {

            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else {
                await videoRef.requestPictureInPicture();
            }

        } catch (error) {
            console.error('Error PiP:', error);
            toast(t("notification.failedpip"), { type: "error" })
        }
    };

    function saveContinueProgress(event: Event & { currentTarget: HTMLVideoElement; target: Element; }) {
        // Checking to save history
        if (PlayerCleanup) return
        if (!config) return
        if (!anime) return
        if (type == "embed") return
        if (parseInt(player.currentTime.toFixed(0)) % 2 != 0) return

        const currentTime = player.currentTime
        const duration = player.durration

        if (duration > 10 && currentTime > duration - CheckNumber(config.History.continue.MaximizeTimeSave) && anime.animulist) {
            if (anime.AnimeData.episodes != undefined && anime.animulist.status == "CURRENT" && ep_metadata["current"]["ep"] == `${anime.AnimeData.episodes}`) {
                updateDataInAnimulist(anime.AnimeData.id, {
                    AnimeData: {
                        ...anime.AnimeData,
                        recommendations: undefined,
                        nextAiringEpisode: undefined
                    },
                    animulist: {
                        ...anime.animulist,
                        status: "COMPLETED",
                        endWatch: anime.animulist.endWatch == 0 ? dateToUnix(new Date().toString()) : anime.animulist.endWatch,
                        lastUpdate: dateToUnix(new Date().toString()),
                        progress: anime.AnimeData.episodes ? anime.AnimeData.episodes : ep_metadata.list.length
                    }
                })
            }
        }

        if (currentTime <= parseInt(config.History.continue.MinimalTimeSave.toString())) return

        let futureHistory = {
            AnimeData: {
                ...anime.AnimeData,
                nextAiringEpisode: undefined,
                recommendations: undefined
            },
            saveData: {
                ...anime.saveData,
                pluginName: anime.saveData.pluginName,
                last_Time: event.currentTarget.currentTime,
                episode: ep_metadata.current["ep"],
                type: ep_metadata.type,
                duration: duration,
                isStarted: false,
            }
        }

        if (currentTime <= duration - CheckNumber(config.History.continue.MaximizeTimeSave)) {
            SaveHistory(futureHistory)
        } else {
            SaveHistory({
                ...futureHistory,
                saveData: {
                    ...futureHistory["saveData"],
                    last_Time: 0
                }
            })
        }

        if (informationCache.anime["anime"]["id"] != futureHistory["AnimeData"]["id"]) return

        informationCache.update({
            ...informationCache["anime"],
            anime: futureHistory["AnimeData"],
            saveData: futureHistory["saveData"]
        })
    }

    async function enterFullscreen() {
        /* IFDEF DEBUG|PROD */
        if (await window.BrowserWindow.isFullscreen()) {
            toggleFullscreen(false)
            SheePlayer.isFullscreen = false
            document.exitFullscreen()
            updatePlayer({ isFullscreen: false })
        } else {
            toggleFullscreen(true)
            SheePlayer.isFullscreen = true

            containerRef?.requestFullscreen()

            updatePlayer({ isFullscreen: true })
        }
        /* ENDIF */

        /* IFDEF WEB */
        if (document.fullscreenElement) {
            toggleFullscreen(false)
            SheePlayer.isFullscreen = false
            updatePlayer({ isFullscreen: false })
        } else {
            toggleFullscreen(true)
            SheePlayer.isFullscreen = true
            updatePlayer({ isFullscreen: true })
        }
        /* ENDIF */
    }

    function ChangeSpeedPlayer(speed: string) {
        if (!videoRef) return
        videoRef.playbackRate = parseFloat(speed)
        SheePlayer.speed = parseFloat(speed)
    }

    async function setNewSubtitles(sub: playerSubtitlesFormat | undefined) {
        if (!sub) return
        if (!videoRef) return
        if (!player.currentResolution) return

        if (currentASSubtitles) {
            currentASSubtitles.destroy()
            currentASSubtitles._canvas.remove()
            currentASSubtitles = undefined
        }

        if (assSubContainer) assSubContainer.innerHTML = ""

        if (sub.label == "Off" && sub.format == "", sub.lang == "", sub.url == "")
            return updatePlayer({ currentSubtitle: { url: "", format: "", lang: "", label: "Off" } })

        const data = await request(sub.url, {
            headers: player.currentResolution["reqHeader"] ? unwrap(player.currentResolution["reqHeader"]) : window["animuHeader"]
        })

        if (!data["success"]) {
            console.error("Failed Load Subtitles", data, player.playerData, player.currentResolution)
            toast(t("Failed Fetch Subtitles"), { type: "error" })
            return
        }

        let assUrl = sub.url

        if (["ass", "ssa"].includes(sub.format.toLowerCase()) == false) {
            const content = CovnertToASS(data["text"])

            if (!content) {
                console.error("Player/Failed Subtitles Parse", data)
                return toast(t("Failed Fetch Subtitles"), { type: "error" })
            }

            const blob = new Blob([content], { type: "text/ass" });
            assUrl = URL.createObjectURL(blob);
        }

        const renderer = new JASSUB({
            video: videoRef,
            subUrl: assUrl,
            workerUrl,
            modernWasmUrl,
            dropAllAnimations: true,
            onDemandRender: true,
            asyncRender: true,
            availableFonts: {
                "default": fallbackFontJASSUB
            },
            defaultFont: "default"
            // modernWasmUrl
        } as any);

        currentASSubtitles = renderer
        updatePlayer({ currentSubtitle: sub })
    }

    function changeAudioTrack(data: { id: number, lang?: string, label: string }) {
        if (!HLS) return
        try {

            HLS.audioTrack = data.id
            updatePlayer({ activeAudioTrack: data })

        } catch (error) {
            toast(t("notification.failedchangeaudio"), { type: "error" })
        }
    }


    async function changeToDubbing(value: boolean): Promise<any> {
        if (!player.playerData) return

        updatePlayer({ isDubbing: value })

        let resoltuion = value ? player.playerData.dubResolution : player.playerData["resolution"]

        if (resoltuion) {
            updatePlayer({
                resoltions: resoltuion
            })
            setNewResolution(resoltuion[0])
            return
        }

        if (!player.playerData.isDubbing || !anime) return

        const resp: playerData | undefined = await ExtractorManager.request({
            func: player.playerData.isDubbing,
            args: {
                ...player.playerData,
                episode: {
                    currentEpisode: ep_metadata.current,
                    episodeList: ep_metadata.list,
                    anime: anime.AnimeData,
                    animeID: anime.AnimeData.player_ID as string,
                    type: ep_metadata.type
                }
            },
            errorMessage: t("notification.faileddub"),
            loadingMessage: t("notification.fetchingdub")
        })

        if (!resp || !resp["dubResolution"]) return updatePlayer({ isDubbing: false })

        updatePlayer({
            playerData: resp,
            resoltions: resp["dubResolution"],
        })
        metadata = metadata.map((v) => v["hostname"] == resp["hostname"] ? resp : v)

        setNewResolution(resp["dubResolution"][0])
    }

    useKeyPress((keys: string) => {
        if (keys == "CTRL+SHIFT+D") ToggleNerdStats()
        if (keys == "SHIFT+R" && player.playerData) setNewPlayer(player.playerData)

        if (onKeybind) onKeybind(keys)

        if (!videoRef) return
        let time_now = videoRef.currentTime
        switch (keys.toLowerCase()) {
            case convertKeybinds(config.Player.keybinds.Pause.toLowerCase()).toLowerCase():
                togglePlay()
                break
            case convertKeybinds(config.Player.keybinds.TimeSkipRight.toLowerCase()).toLowerCase():
                updateUI({ TimerUIRight: `${config.Player.general.TimeSkipRight}` })
                setTimeVideo((time_now += parseInt(config.Player.general.TimeSkipRight.toString())))
                setTimeoutForElement(buttonSkipLeft, "isShowButtonSkipRight")
                break
            case convertKeybinds(config.Player.keybinds.TimeSkipLeft.toLowerCase()).toLowerCase():
                updateUI({ TimerUILeft: `${config.Player.general.TimeSkipLeft}` })
                setTimeVideo((time_now -= parseInt(config.Player.general.TimeSkipLeft.toString())))
                setTimeoutForElement(buttonSkipRight, "isShowButtonSkipLeft")
                break

            case convertKeybinds(config.Player.keybinds.LongTimeSkipForward.toLowerCase()).toLowerCase():
                updateUI({ TimerUIRight: `${config.Player.general.LongTimeSkipForward}` })
                setTimeVideo((time_now += parseInt(config.Player.general.LongTimeSkipForward.toString())))
                setTimeoutForElement(buttonSkipRight, "isShowButtonSkipRight")
                break
            case convertKeybinds(config.Player.keybinds.LongTimeSkipBack.toLowerCase()).toLowerCase():
                updateUI({ TimerUILeft: `${config.Player.general.LongTimeSkipBack}` })
                setTimeVideo((time_now -= parseInt(config.Player.general.LongTimeSkipBack.toString())))
                setTimeoutForElement(buttonSkipLeft, "isShowButtonSkipLeft")
                break

            case convertKeybinds(config.Player.keybinds.Fullscreen.toLowerCase()).toLowerCase():
                enterFullscreen()
                break
            case convertKeybinds(config.Player.keybinds.ExitPlayer.toLowerCase()).toLowerCase():
                if (onExitPlayer) onExitPlayer()
                break
            case convertKeybinds(config.Player.keybinds.FrameSkipForward.toLowerCase()).toLowerCase():
                setTimeVideo((time_now += 0.0416))
                break
            case convertKeybinds(config.Player.keybinds.FrameSkipBack.toLowerCase()).toLowerCase():
                setTimeVideo((time_now -= 0.0416))
                break
            case convertKeybinds(config.Player.keybinds.VolumeDown.toLowerCase()).toLowerCase():
                ChangePlayerVolume((videoRef.volume * 100) - 1)
                break
            case convertKeybinds(config.Player.keybinds.VolumeUp.toLowerCase()).toLowerCase():
                ChangePlayerVolume((videoRef.volume * 100) + 1)
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
                if (onChangeEpisode && avaibleEpisode["nextEpisode"])
                    onChangeEpisode(avaibleEpisode["nextEpisode"]["ep"])
                break
            case convertKeybinds(config.Player.keybinds.PrevEpisode.toLowerCase()).toLowerCase():
                if (onChangeEpisode && avaibleEpisode["prevEpisode"])
                    onChangeEpisode(avaibleEpisode["prevEpisode"]["ep"])
                break
            case convertKeybinds(config.Player.keybinds.PictureInPicture.toLowerCase()).toLowerCase():
                handlePictureInPicture()
                break
            case convertKeybinds(config.Player.keybinds.toggleSubtitles.toLowerCase()).toLowerCase():
                // toggleSubtitles()
                break
            case convertKeybinds(config.Player.keybinds.skipOpeningEnding.toLowerCase()).toLowerCase():
                clearChapterSkipTime()
                break
        }
    })

    function HandleBuffer(event: Event & { currentTarget: HTMLVideoElement; target: Element; }) {
        const video = event.currentTarget;
        if (video.duration < 0 && video.buffered.length < 0) return

        let timestamps: { position: number, width: number }[] = []

        for (let index = 0; index < video.buffered.length; index++) {
            const startX = (video.buffered.start(index) / video.duration) * 100;
            const endX = (video.buffered.end(index) / video.duration) * 100;
            const width = endX - startX;

            timestamps.push({ position: startX, width: width })
        }
        updatePlayer({ buffer: timestamps })
    };

    /* END */

    /* Player_UI */

    function ActiveShowingUI() {
        updateUI({ isVisible: true, ShowMoreInformation: false })

        clearTimeout(moreInformationTimer)
        clearTimeout(playerHideTimer)

        if (ui.activeMenu) return

        playerHideTimer = setTimeout(() => {
            updateUI({ isVisible: false })

            if (config.Player.general.disablemoreinformation) return
            if (player.isPlaying) return
            if (type == "embed") return

            moreInformationTimer = setTimeout(() => {
                updateUI({ ShowMoreInformation: true })
            }, 4000)
        }, 2000)
    }

    function ToggleMenu(menu: string | undefined) {
        if (ui.activeMenu != menu) {
            updateUI({ isVisible: true, activeMenu: menu })
            clearTimeout(playerHideTimer)
            return
        }

        playerHideTimer = setTimeout(() => {
            updateUI({ isVisible: false })
        }, 2000)

        return updateUI({ activeMenu: undefined })
    }

    function HandleUIScreenshot(image: string, click: string) {
        updateUI({
            screenshot: {
                url: image,
                click: click
            }
        })
        let interval = setInterval(() => {
            clearInterval(interval)
            updateUI({ screenshot: undefined })
        }, 3000)
    }

    async function takeScreenshot(noSubtitles: boolean = false) {
        if (!screenshotWrapper) return
        if (!videoRef) return

        const date = new Date()
        const formatedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}-${date.toLocaleTimeString("en-EN", { hour12: false })}`;

        let screenshot: string = "data:,"

        const outputCanvas = document.createElement("canvas");
        const ctx = outputCanvas.getContext("2d");
        if (!ctx) {
            toast(t("player.toastscreenshot.failed"), { type: "error" });
            return
        };
        outputCanvas.width = videoRef.videoWidth;
        outputCanvas.height = videoRef.videoHeight;
        ctx.drawImage(videoRef, 0, 0, videoRef.videoWidth, videoRef.videoHeight);
        if (currentASSubtitles && !noSubtitles) ctx.drawImage(currentASSubtitles._canvas, 0, 0, videoRef.videoWidth, videoRef.videoHeight);
        screenshot = outputCanvas.toDataURL("image/png");

        if (screenshot == "data:,") {
            toast(t("player.toastscreenshot.failed"), { type: "error" });
            return
        }
        const blob = await (await fetch(screenshot)).blob();
        const url = URL.createObjectURL(blob);

        if (config.Player.screenShot.saveType == "Clipboard" || config.Player.screenShot.saveType == "Both") {

            navigator.clipboard.write([
                new ClipboardItem({
                    'image/png': blob,
                }),
            ]);
            if (config.Player.screenShot.saveType == "Clipboard") return HandleUIScreenshot(url, "")
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

        if (resp) HandleUIScreenshot(url, `${config.Player.screenShot.path}/screenshot${formatedDate}.png`)
        else toast(t("player.toastscreenshot.failed"), { type: "error" });
        /* ENDIF */
    };

    function startChapterSkipTime(ch: { type: string, time: number }) {
        if (ui.chapterSkipActive || !ch) return

        updateUI({ chapterSkipActive: true, chapterSkipType: ch["type"], chapterSkipEnd: ch["time"] })

        hideChapterButtonTimer = setInterval(() => {
            let prev = ui.chapterSkipTimer

            if (prev <= 1) {
                clearChapterSkipTime(config["Player"]["general"]["autoSkipOpeningEnding"])
                prev = 15
            } else {
                prev -= 1
            }

            updateUI({
                chapterSkipTimer: prev
            })
        }, 1000);
    };

    function clearChapterSkipTime(overwrite = true) {
        if (!hideChapterButtonTimer || !ui.chapterSkipType) return
        clearInterval(hideChapterButtonTimer)

        updateUI({
            chapterSkipDisable: [...ui.chapterSkipDisable, ui.chapterSkipType],
            chapterSkipActive: false,
            chapterSkipTimer: 15,
        })

        if (ui.chapterSkipEnd > 0 && overwrite) setTimeVideo(ui.chapterSkipEnd)
    }

    function checkUpNext(event: Event & { currentTarget: HTMLVideoElement; target: Element; }) {
        // checking to show Up next communicat
        if (!avaibleEpisode["nextEpisode"] || !onChangeEpisode || !player.playerData) return
        if (!config.Player.upToNextEpisode.enable) return
        if (ui.upNextDisable) return

        if (player.currentTime <= 0 || player.durration <= 0) return

        const duration = event.currentTarget.duration
        const currenttime = event.currentTarget.currentTime

        if (duration <= config.Player.upToNextEpisode.durationShow * 60 && !player.playerData!.listChapters) return

        let endingChupter: playerChapterList | undefined = undefined
        if (player.playerData!.listChapters) {
            endingChupter = player.playerData!.listChapters!.find((cha) => cha.type == "ending")
            if (endingChupter && endingChupter.end == 0 && endingChupter.start == 0) return
        }

        let showUpToNext: boolean = currenttime > duration - CheckNumber(config.History.continue.MaximizeTimeSave)
        let timeDelete: number = ((CheckNumber(duration.toFixed(0)) - CheckNumber(config.History.continue.MaximizeTimeSave)) - CheckNumber(currenttime.toFixed(0))) + CheckNumber(config.Player.upToNextEpisode.interval)

        if (endingChupter) {
            showUpToNext = currenttime >= endingChupter.start
            timeDelete = ((CheckNumber(duration.toFixed(0)) - (CheckNumber(duration.toFixed(0)) - endingChupter.start)) - CheckNumber(currenttime.toFixed(0))) + CheckNumber(config.Player.upToNextEpisode.interval)
        }

        if (CheckNumber(timeDelete.toFixed(0)) < 0) {
            updateUI({ upNextActive: false })
            return
        }

        updateUI({
            upNextActive: showUpToNext,
            upNextTimer: showUpToNext ? CheckNumber(timeDelete.toFixed(0)) : CheckNumber(config.Player.upToNextEpisode.interval)
        })

        if (ui.upNextTimer <= 0) onChangeEpisode("next")
    }

    function CheckDownloadContextMenu(res: resolutionFormat) {
        if (!res) return
        if (!res["canBeDownloaded"]) return
        if (res["hls"]) return

        let current = ui.playerContextMenu.filter((v) => v["option"] != t("settings.player.downloadvideo"))
        current.unshift({ option: t("settings.player.downloadvideo"), onClick: () => DownloadVideo(res.url) })

        updateUI({
            playerContextMenu: current
        })
    }

    function CalculateChapter() {
        updateUI({ chapter: undefined })

        if (!player.playerData) return
        if (!player.playerData!.listChapters) return

        player.playerData.listChapters.forEach((chapter) => {
            if (chapter.start == 0 && chapter.end == 0) return

            if (player.currentTime >= chapter.start && player.currentTime <= chapter.end && chapter.name)
                updateUI({ chapter: chapter.name })
        })
    }

    function CalculateChapterTime() {
        if (!player.playerData || !player.playerData.listChapters) return
        if (player.playerData.listChapters.length <= 0) return

        let newTime = player.durration
        for (let index = 0; index < player.playerData.listChapters.length; index++) {
            const element = player.playerData.listChapters[index];

            if (element.end <= 0 && element.start <= 0) continue
            if (element.type == "other") continue

            newTime = newTime - (element.end - element.start)
        }

        if (newTime == player.durration) return updateUI({ chapterTime: undefined })
        if (newTime <= 0) return updateUI({ chapterTime: undefined })
        updateUI({ chapterTime: formatTime(newTime) })
    }

    function ToggleNerdStats() {
        if (!videoRef) return

        if (nerdStats.active) {
            updateNerd({ active: false })

            clearInterval(refreashNerdStats)
            return
        }

        const entries = Object.entries(unwrap(nerdStats.player)).map((v) => v["0"])

        refreashNerdStats = setInterval(() => {
            let object = {}

            const quality = videoRef!.getVideoPlaybackQuality()

            entries.forEach((v) => {
                object = {
                    ...object,
                    [v]: videoRef![v]
                }
            })

            object = {
                ...object,
                creationTime: quality.creationTime,
                droppedVideoFrames: quality.droppedVideoFrames,
                totalVideoFrames: quality.totalVideoFrames,
            }

            updateNerd({ player: object as any })

        }, 500)

        updateNerd({ active: true })
    }

    /* END */

    return (
        <div class={`player-video-container ${type == "embed" ? "miniplayer" : ""} ${!ui.isVisible ? "player-hide-cursor" : ""}`}
            ref={containerRef}
            onMouseMove={ActiveShowingUI}
            style={type == "embed" ? { height: player.initialize ? "600px" : "auto" } : {}}
            onContextMenu={(event) => OpenContextMenu(event, { center: ui.playerContextMenu })}
        >

            <div ref={screenshotWrapper} class={ui.isVisible ? "player-video-container" : "player-video-container player-hide-cursor"} >
                <div ref={assSubContainer} style={{ position: "absolute", top: "0", left: "0" }}></div>
            </div>

            <Show when={ui.isVisible}>
                <div class="player-mask top"></div>
                <div class="player-mask bottom"></div>
            </Show>

            <div class="video-overlay">

                <div class={ui.isVisible ? 'video-top' : 'video-top player-hidden'}>
                    <div class="video-top-top">
                        <Show when={type == "player"}>
                            <Button icon='arrow_back' ButtonClass='player-buttons' iconClassName="player-button-icons" onClick={onExitPlayer} />
                        </Show>
                        <Show when={ui.title}>
                            <div class="player-title ">{ui.title}</div>
                        </Show>
                    </div>
                    <Show when={ep_metadata["current"]["title"]}>
                        <span class="video-episode-title">{ep_metadata["current"]["title"]}</span>
                    </Show>
                </div>

                <div class="video-center"> {/* video-center-container */}
                    <Show when={!config.Player.ui.DisableSkipAnimation}>
                        <div class={`player-loading-animation-container player-fast-rewind-ui time ${ui.isShowButtonSkipLeft ? "show" : "hidden"}`}>
                            -{ui.TimerUILeft}s
                        </div>
                        <div class={`player-loading-animation-container player-fast-rewind-ui ${ui.isShowButtonSkipLeft ? "show" : "hidden"}`}>
                            <div class="material-symbols-outlined player-icon-ui">fast_rewind</div>
                        </div>
                        <div class={`player-loading-animation-container player-fast-forward-ui ${ui.isShowButtonSkipRight ? "show" : "hidden"}`}>
                            <div class="material-symbols-outlined player-icon-ui">fast_forward</div>
                        </div>
                        <div class={`player-loading-animation-container player-fast-forward-ui time ${ui.isShowButtonSkipRight ? "show" : "hidden"}`}>
                            +{ui.TimerUIRight}s
                        </div>
                    </Show>

                    <div class={`player-loading-animation-container player-buffering-animation ${player.FatalError ? "show" : "hidden"}`}>
                        <div class="player-icon-ui material-symbols-outlined">error</div>
                    </div>

                    <Show when={!config.Player.ui.DisableLoadingAnimation}>
                        <div class={`player-loading-animation-container player-buffering-animation ${!player.FatalError && player.isLoading ? "show" : "hidden"}`}>
                            <div class="material-symbols-outlined player-waiting">progress_activity</div>
                        </div>
                    </Show>

                    <Show when={!config.Player.ui.DisableSpaceAnimation}>
                        <div class={`player-loading-animation-container ${ui.isShowPlay && !player.isLoading ? "show" : "hidden"}`}>
                            <div class="player-icon-ui material-symbols-outlined">{player.isPlaying ? "pause" : "play_arrow"}</div>
                        </div>
                    </Show>
                </div>

                <div class={ui.isVisible ? 'video-bottom' : 'video-bottom player-hidden'}>
                    <SeekBar
                        chapterList={player.chapterList}
                        thumbnail={player.thumbnail}
                        secondBarValues={player.buffer}
                        currentValue={player.currentTime}
                        maxValue={player.durration}
                        onSeek={value => { setTimeVideo(value) }}
                        type="time"
                        classes={{ container: "player-seekbar" }}
                        screen={true}
                    />

                    <div class="player-bottom-section">
                        <div class="player-left">

                            <Show when={avaibleEpisode.prevEpisode && onChangeEpisode}>
                                <PlayerButton title={t('player.previous', { ep: avaibleEpisode.prevEpisode!["ep"] })} icon='skip_previous'
                                    onClick={() => onChangeEpisode!(avaibleEpisode.prevEpisode!["ep"])}
                                    ButtonClass="player-buttons" />
                            </Show>

                            <PlayerButton
                                icon={player.isPlaying ? "pause" : "play_arrow"}
                                title={player.isPlaying ? t('player.Pause') : t('player.play')}
                                ButtonClass="player-buttons" onClick={togglePlay}
                            />

                            <Show when={avaibleEpisode.nextEpisode && onChangeEpisode}>
                                <PlayerButton
                                    icon='skip_next'
                                    ButtonClass='player-buttons'
                                    title={t('player.next', { ep: avaibleEpisode.nextEpisode!.ep })}
                                    onClick={() => onChangeEpisode!(avaibleEpisode.nextEpisode!["ep"])}
                                />
                            </Show>

                            <div class="player-time-display"
                                onClick={() => { UpdateConfig("Player.general.minusTime", !ui.minusTime); updateUI({ minusTime: !ui.minusTime }) }}
                            >
                                <div class="player-time-display-current">
                                    <Show when={ui.minusTime} fallback={formatTime(player.currentTime)}>
                                        {`-${formatTime(player.durration - player.currentTime)}`}
                                    </Show>
                                </div>
                                /
                                <div class="player-time-display-durration">{formatTime(player.durration)}</div>

                                <Show when={ui.chapterTime}>
                                    <div class="player-time-display-chaptersTime">
                                        ({ui.chapterTime})
                                    </div>
                                </Show>
                            </div>
                            <Show when={type == "player"}>
                                <div class="player-end-time-display">
                                    {t("player.episodeEndsOn", { time: addTime(player.durration - player.currentTime) })}
                                </div>
                            </Show>
                        </div>

                        <div class="player-right">
                            <Show when={ui.chapter}>
                                <span>{t("player.chapter", { name: ui.chapter ?? "" })}</span>
                            </Show>

                            <PlayerButton
                                icon={player.muted ? 'volume_off' : 'volume_up'}
                                title={player.muted ? t("player.unmute") : t("player.mute")}
                                ButtonClass="player-buttons volume-button"
                                onClick={setMutedToPlayer}
                            />

                            <div class="player-volume-seek">
                                <SeekBar
                                    currentValue={player.volume}
                                    maxValue={100}
                                    onSeek={value => ChangePlayerVolume(value)}
                                    classes={{ "container": "player-seekbar" }}
                                    type="procent"
                                />
                            </div>

                            <Show when={currentASSubtitles == undefined}>
                                <PlayerButton icon={"picture_in_picture"}
                                    onClick={handlePictureInPicture}
                                    title={t("settings.player.keybinds.pip")}
                                    ButtonClass="player-buttons"
                                />
                            </Show>

                            <Show when={ep_metadata.list.length >= 2 && onChangeEpisode}>
                                <PlayerButton
                                    icon={"video_library"}
                                    title={t("player.selectepisode")}
                                    ButtonClass="player-buttons"
                                    onClick={() => { ToggleMenu("episodes") }}
                                />
                            </Show>

                            <Show when={ui.activeMenu == "episodes" && onChangeEpisode}>
                                <div class="player-episodes-container">
                                    <div class="player-select-episode-title">{t("player.changeEpisode")}</div>
                                    <div class="player-container-episodes">
                                        <For each={ep_metadata.list}>
                                            {(episode) => (
                                                <div class={`player-episode-selector ${ep_metadata["current"]["ep"] == episode["ep"] ? "active" : ""}
                                                            ${parseInt(episode["ep"]) < parseInt(ep_metadata["current"]["ep"]) ? "before" : ""}`}
                                                    onClick={() => onChangeEpisode!(episode["ep"])}
                                                >
                                                    <sheep-img src={episode["img"]} class="player-episode-img" divClass="player-episode-img-placeholder" />
                                                    <div class="player-episode-container-text">
                                                        <span class="player-episode-title">
                                                            {episode["title"] ?
                                                                `E${episode["ep"]}: ${episode["title"]}` :
                                                                t("settings.player.episode", { ep: episode["ep"] })
                                                            }
                                                        </span>
                                                        <span class="player-episode-description">{t("information.descriptionnotfound")}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </For>
                                    </div>
                                </div>
                            </Show>

                            <PlayerSettings
                                isDubbingOn={player.isDubbing}
                                state={ui.activeMenu == "settings"}
                                turnDubbing={changeToDubbing}
                                resDubbing={player.playerData && player.playerData?.isDubbing ? true : false}

                                sources={
                                    metadata.map((val) => ({
                                        name: val.hostname,
                                        change: () => setNewPlayer(val)
                                    }))
                                }

                                resolution={
                                    player.resoltions.map((val) => ({
                                        res: val.res, change: () => setNewResolution(val)
                                    }))
                                }

                                speed={speed.map((val) => ({
                                    speed: parseFloat(val), change: () => ChangeSpeedPlayer(val)
                                }))}

                                subtitles={
                                    player.subtitles.map((val) => ({
                                        sub: val.label,
                                        change: () => {
                                            setNewSubtitles(val)
                                            SheePlayer.userInteractWithSubtitles = true
                                        }
                                    }))
                                }

                                audioTrack={
                                    player.audioTrack.map((val) => ({
                                        track: val.label,
                                        change: () => changeAudioTrack(val)
                                    }))
                                }

                                disableSettings={() => ToggleMenu(undefined)}
                                current={{
                                    currentHost: player.playerData ? player.playerData!.hostname : t("player.other.unknown"),
                                    currentResolution: player.currentResolution ? player.currentResolution!.res : t("player.other.unknown"),
                                    currentSpeed: videoRef?.playbackRate ? videoRef?.playbackRate : 1,
                                    currentSub: player.currentSubtitle ? player.currentSubtitle!.label : t("player.other.off"),
                                    currentTrack: player.activeAudioTrack ? player.activeAudioTrack!.label : t("player.other.default")
                                }}
                            />
                            <PlayerButton
                                icon="settings"
                                ButtonClass="player-buttons"
                                title={t('global.settings')}
                                onClick={() => ToggleMenu("settings")}
                            />

                            <PlayerButton
                                icon={player.isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
                                ButtonClass="player-buttons"
                                title={t('player.fullscreen')}
                                onClick={async () => await enterFullscreen()}
                            />
                        </div>
                    </div>
                </div>
            </div>


            <Button
                content={t(`player.skiptimebutton.${ui.chapterSkipType}`, { time: ui.chapterSkipTimer })}
                ButtonClass={`player-skip-chapters-button ${ui.chapterSkipActive ? "show" : "hidden"}`}
                onMouseDown={(v) => clearChapterSkipTime(v.button != 2)}
            />

            <div ref={screenShotContainer} class={`player-screenshot-container ${ui.screenshot ? "show" : "hidden"}`}
                classList={{ click: ui.screenshot ? ui.screenshot.click != "" : false }}
                onclick={() => ui.screenshot && ui.screenshot.click != "" ? openUrlFolder(ui.screenshot!.click) : ""}
                tabIndex={-1}
            >
                <Show when={ui.screenshot}>
                    <img src={ui.screenshot!.url} class="player-screenshot-image" tabIndex={-1} />
                </Show>
                <span class="player-screenshot-text">
                    {t("player.toastscreenshot.done")}
                </span>
            </div>

            <Show when={anime && avaibleEpisode["nextEpisode"] && onChangeEpisode}>

                <Show when={config.Player.upToNextEpisode.variants == "old"}>
                    <div class={`player-up-Next-container old  ${ui.upNextActive ? "show" : "hidden"}`} tabIndex={-1}>
                        <div class="player-up-Next-Title old">{t("player.upNext.title", { sec: ui.upNextTimer })}</div>
                        <div class="player-up-Next-Anime old">{t("player.upNext.titleAnime", {
                            ep: avaibleEpisode["nextEpisode"]!.ep,
                            title: animeTitle!
                        })}</div>

                        <div class="player-up-Next-Buttons old">
                            <Button content={t("player.upNext.nextEp")}
                                ButtonClass='player-up-Next-Button old'
                                onClick={() => onChangeEpisode!(avaibleEpisode["nextEpisode"]!["ep"])}
                            />

                            <Button content={t("player.upNext.hide")}
                                ButtonClass='player-up-Next-Button old'
                                onClick={() => { updateUI({ upNextActive: false, upNextDisable: true }) }}
                            />
                        </div>
                    </div>
                </Show>

                <Show when={config.Player.upToNextEpisode.variants == "var2"}>
                    <div tabIndex={-1} class={`player-up-Next-background ${ui.upNextActive ? "show" : "hidden"}`} style={{ "background-image": `url(${avaibleEpisode["nextEpisode"]!["img"]})` }}
                        onClick={() => onChangeEpisode!(avaibleEpisode["nextEpisode"]!["ep"])}>
                        <div class="player-up-Next-container-var2 ">
                            <span class="material-symbols-outlined player-up-Next-icon">skip_next</span>
                            <div class="player-up-Next-content var2">
                                <div class="player-up-Next-title">{detectTitleConfig(anime!.AnimeData.title)}</div>
                                <div class="player-up-Next-episode">{t("player.upNext.nextEpisode", { episode: avaibleEpisode["nextEpisode"]!["ep"] })}</div>
                                <div class="player-up-Next-text">{t("player.upNext.nextPlaying", { time: ui.upNextTimer })}</div>
                            </div>
                        </div>
                        <button tabIndex={-1} class="material-symbols-outlined player-up-Next-button-close" onClick={(event) => {
                            event.stopPropagation();
                            updateUI({ upNextActive: false, upNextDisable: true })
                        }
                        }>close</button>
                    </div>
                </Show>

                <Show when={config.Player.upToNextEpisode.variants == "var1"}>
                    <div tabIndex={-1} class={`player-up-Next-container ${ui.upNextActive ? "show" : "hidden"}`} onClick={() => onChangeEpisode!(avaibleEpisode["nextEpisode"]!["ep"])}>
                        <sheep-img src={avaibleEpisode["nextEpisode"]!["img"]} class="player-up-Next-image" />
                        <span class="material-symbols-outlined player-up-Next-icon">skip_next</span>
                        <div class="player-up-Next-content">
                            <div class="player-up-Next-title">{animeTitle}</div>
                            <div class="player-up-Next-episode">{t("player.upNext.nextEpisode", { episode: avaibleEpisode["nextEpisode"]!["ep"] })}</div>
                            <div class="player-up-Next-text">{t("player.upNext.nextPlaying", { time: ui.upNextTimer })}</div>
                        </div>
                        <button tabIndex={-1} class="material-symbols-outlined player-up-Next-button-close" onClick={(event) => {
                            event.stopPropagation();
                            updateUI({ upNextActive: false, upNextDisable: true })
                        }
                        }>close</button>
                    </div>
                </Show>

            </Show>


            <Show when={!config.Player.ui.DisableVolumeAnimation}>
                <VolumeNotification volume={player.volume} isActive={ui.isVolume} isMuted={player.muted} />
            </Show>

            <Show when={nerdStats.active}>
                <div class="player-nerdstats-container" tabIndex={-1}>
                    <For each={Object.entries(nerdStats["player"])}>
                        {([key, val]) => (
                            <span class="player-nerdstats-text">{key}: {JSON.stringify(val)}</span>
                        )}
                    </For>
                </div>
            </Show>

            <Show when={!config.Player.general.disablemoreinformation && anime}>
                <MoreInformation
                    isActive={ui.ShowMoreInformation}
                    anime={anime!.AnimeData}
                    durration={player.durration}
                    episode={ep_metadata.current["ep"]}
                    episodesLen={ep_metadata.list.length}
                />
            </Show>
        </div>
    )
}

export default Player;
