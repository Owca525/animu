import { lazy, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"
import Hls from "hls.js"

// Components
import NerdStats from "./components/nerdStats"
const DeveloperStats = lazy(() => import('./components/developerStats'));

// css
import { cardData, ContextMenuProps, notificationProps, playerData, SettingsConfig, Thumbnail } from "@renderer/utils/GlobalInterface"
import { useSelector } from "react-redux"
import { convertKeybinds, CreateContextMenuOptions, detectTitle, formatTime, refetchHistory, toSeconds } from "@renderer/utils/functions"
import Button from "@renderer/components/buttons"
import SeekBar from "@renderer/components/seekBar"
import { DeleteFromContinue, SaveContinue } from "@renderer/utils/history/continueWatch"
import useKeyPress from "@renderer/utils/hooks/useKeyPress"
import { OpenContextMenu } from "@renderer/utils/context/ContextMenu"
import PlayerSettings from "./components/PlayerSettings"
import PlayerButton from "./components/PlayerButton"
import { motion } from "framer-motion"
import PlayerEpisodeElement from "./components/playerEpisodeElement"
import { convert } from "subtitle-converter";
import { useHotkeys } from "react-hotkeys-hook"
import i18n from "@renderer/utils/i18n"
import ASS from "assjs"
import store from "@renderer/utils/store"

function addTime(durration: number): string {
    const now = new Date();
    let hour: number | undefined = undefined
    let min: number | undefined = undefined
    let sec: number | undefined = undefined

    if (formatTime(durration).split(":").length == 2) {
        min = parseInt(formatTime(durration).split(":")[0])
        sec = parseInt(formatTime(durration).split(":")[1])
    } else if (formatTime(durration).split(":").length == 2) {
        hour = parseInt(formatTime(durration).split(":")[0])
        min = parseInt(formatTime(durration).split(":")[1])
        sec = parseInt(formatTime(durration).split(":")[2])
    }

    if (hour) now.setMinutes(now.getHours() + hour);
    if (min) now.setMinutes(now.getMinutes() + min);
    if (sec) now.setSeconds(now.getSeconds() + sec);

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    return `${hours}:${minutes}`;
}

const speed: Array<string> = ["0.25", "0.5", "0.75", "1", "1.25", "1.50", "1.75", "2"]

interface VideoPlayerProps {
    player_data: playerData[]
    anime_data: cardData
    temp: { episode: string, type: string, episodes: { ep: string, img?: string, title?: string }[] }
    setNextEpisode: (value: string) => void
    volumeCacheFunc: (value: number) => void
    PlayerVolume: number
    time: number
    exitFromPlayer: () => void
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ player_data, anime_data, temp, setNextEpisode, volumeCacheFunc, PlayerVolume = 0, time, exitFromPlayer }) => {
    // Translation 
    const { t } = useTranslation()
    const config: SettingsConfig = useSelector((data: any) => data.config);

    // ref for html object
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const hideTimer = useRef<NodeJS.Timeout | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    // Variable
    const [volume, setVolume] = useState<number>(PlayerVolume)
    const [currentTime, setcurrentTime] = useState<number>(0)
    const [currentBuffer, setBuffered] = useState<{ position: number, width: number }[]>([])

    // UI
    const [isVolume, setShowVolume] = useState<boolean>(false)
    const volumeTimeout = useRef<NodeJS.Timeout | null>(null);
    const [isShowPlay, setShowPlay] = useState<boolean>(false)
    const playAnimationTimeout = useRef<NodeJS.Timeout | null>(null);
    const [isShowSelectEpisode, setShowSelectEpisode] = useState<boolean>(false)

    // States
    const [isMuted, setMuted] = useState<boolean>(false)
    const [isVisible, setIsVisible] = useState<boolean>(true)
    const [isWaitingPlayer, setWaitingPlayer] = useState<boolean>(true)
    const [isPlaying, setIsPlaying] = useState<boolean>(config.Player.general.Autoplay)
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false)

    // Resolution
    const [ListResolution, setListResolution] = useState<{ res: string, url: string }[]>([])
    const [currentResolution, setCurrentResoltion] = useState<{ res: string, url: string } | undefined>(undefined)

    // url
    const [currentHost, setHost] = useState<string>("")

    // Up Next
    const [timeNextEpisode, setTimeNextEpisode] = useState<number>(30)
    const [isUpNextEpisode, setUpNextEpisode] = useState<boolean>(false)
    const [isHideUpNextEpisode, setHideUpNextEpisode] = useState<boolean>(false)

    // other
    const [currentSettings, setcurrentSettings] = useState<boolean>(false)
    const [showNerdStats, setshowNerdStats] = useState<boolean>(false)
    const [hls, setHls] = useState<Hls | undefined>(undefined);
    const [chapterList, setChapterList] = useState<{ left: number, width: number }[]>([])

    // Subtitles
    const [vttUrl, setVttUrl] = useState<string | undefined>(undefined);
    const [ListSubtitles, setListSubtitles] = useState<{ url: string, lang: string, label: string, format: string }[]>([])
    const [currentASSubtitles, setASSubtitles] = useState<ASS | undefined>(undefined)
    const [currentSubtitles, setSubtitles] = useState<{ url: string, lang: string, label: string, format: string } | undefined>(undefined)
    const assSubContainer = useRef<HTMLDivElement | null>(null);
    const vttSubRef = useRef<HTMLTrackElement | null>(null);
    const [currentCue, setCue] = useState<string | undefined>(undefined);

    // Audio Tracks
    const [audioTrackList, setAudioTrackList] = useState<{ id: number, lang?: string, label: string }[]>([]);
    const [currentAudioTrack, setCurrentAudioTrack] = useState<{ id: number, lang?: string, label: string } | undefined>();

    // Thumbnail
    const [thumbnails, setThumbnail] = useState<Thumbnail | undefined>(undefined);

    function handleMouseMove() {
        setIsVisible(true)
        if (hideTimer.current) {
            clearTimeout(hideTimer.current)
        }
        if (currentSettings == false && isShowSelectEpisode == false) {
            hideTimer.current = setTimeout(() => setIsVisible(false), 2000)
        }
    }

    useEffect(() => {
        // import("../../utils/filesMange/history").then(({ SaveHistory }) => SaveHistory({ id: id, img: img, title: title, text: t('general.LastWatch', { episode: episode.ep }) }))
        checkUrl(player_data[0])
        handleVolume(PlayerVolume, true)
        handleMouseMove()
        if (config.Player.general.AutoFullscreen) {
            window.BrowserWindow.setFullscreen(true)
            setIsFullscreen(true)
        }
        if (videoRef.current) {
            videoRef.current.currentTime = time
            setcurrentTime(() => time)
        }
    }, [])

    // player Functions
    async function enterFullscreen() {
        if (await window.BrowserWindow.isFullscreen()) {
            window.BrowserWindow.setFullscreen(false)
            setIsFullscreen(false)
        } else {
            window.BrowserWindow.setFullscreen(true)
            setIsFullscreen(true)
        }
    }

    function setSpeed(speed: string) {
        if (!videoRef.current) return
        videoRef.current.playbackRate = parseFloat(speed)
    }

    function setNewResolution(data: { res: string, url: string } | undefined) {
        if (!data) return
        if (!videoRef.current) return
        const time = videoRef.current.currentTime
        if (hls && data.url == "") {
            console.log(data)
            setCurrentResoltion(data)
            hls.currentLevel = hls.levels.findIndex(level => level.height === parseInt(data.res));
            return
        }
        setCurrentResoltion(data)
        videoRef.current.src = data.url
        videoRef.current.currentTime = time
    }

    function setNewUrl(host: string) {
        if (player_data.length <= 1) return
        const value = player_data.findIndex((value) => value.hostname == host)
        if (value < 0) return
        if (player_data[value + 1] == undefined) return
        checkUrl(player_data[value + 1])
    }

    async function setDefaultSubtitles(data: { url: string, lang: string, label: string, format: string }[], defSub: boolean = true) {
        if (data.length <= 0) return
        setListSubtitles(() => [{ url: "", format: "", lang: "", label: "Off" }, ...data])
        for (let index = 0; index < data.length; index++) {
            const element = data[index];
            if (defSub == false) return setNewSubtitles({ url: "", format: "", lang: "", label: "Off" })
            if (element.lang == i18n.language && !element.label.includes("Forced")) {
                await setNewSubtitles(element)
                return
            }
        }
        setNewSubtitles(data[0])
    }

    async function checkUrl(data: playerData) {
        if (!videoRef.current) return
        const time = videoRef.current.currentTime
        if (data.subtitles) await setDefaultSubtitles(data.subtitles, data.defaultSubttiles)
        if (data.storyboardVTT) setThumbnail(await VTTstoryBoardParser(data.storyboardVTT))
        if (data.hls) {
            console.log(data)
            setHost(() => data.hostname)
            await runHLS(data.resolution[0].url, data.hostname)
            return
        }
        if (hls) hls.destroy()
        setCurrentResoltion(data.resolution[0])
        setListResolution(() => data.resolution.reverse())
        setHost(data.hostname)
        videoRef.current.src = data.resolution[0].url
        videoRef.current.currentTime = time
    }

    function changeAudioTrack(data: { id: number, lang?: string, label: string }) {
        try {
            if (hls) {
                hls.audioTrack = data.id
                setCurrentAudioTrack(() => data)
            }
        } catch (error) {
            toast.error("Failed Changing audio", notificationProps)
        }
    }

    async function runHLS(url: string, host: string) {
        const hls = new Hls({
            maxBufferLength: 60,
            autoStartLoad: true,
        });

        setHls(() => hls)

        if (Hls.isSupported() && videoRef.current) {
            const time = videoRef.current.currentTime
            hls.loadSource(url);
            hls.attachMedia(videoRef.current);

            videoRef.current.currentTime = time

            hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
                const resolutions = data.levels.map((level) => level.height);
                if (data.audioTracks.length > 0) {
                    for (let index = 0; index < data.audioTracks.length; index++) {
                        const element = data.audioTracks[index];
                        if (element.default) setCurrentAudioTrack(() => { return { id: element.id, label: element.name, lang: element.lang } })
                    }
                    setAudioTrackList(data.audioTracks.map((element) => { return { id: element.id, label: element.name, lang: element.lang } }))
                }
                resolutions.reverse()
                setListResolution(resolutions.map((val) => { return { res: val.toString(), url: "" } }))
                hls.currentLevel = hls.levels.findIndex(level => level.height === resolutions[0]);
                setCurrentResoltion({ res: resolutions[0].toString(), url: "" })
            });

            hls.on(Hls.Events.ERROR, (_event, data) => {
                if (data.fatal) {
                    let message: string
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            message = t('player.errors.MEDIA_ERR_NETWORK')
                            hls.destroy()
                            setNewUrl(host)
                            // hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            message = t('player.errors.MEDIA_ERR_DECODE')
                            hls.recoverMediaError();
                            break;
                        default:
                            message = t('player.errors.default')
                            hls.destroy();
                            break;
                    }
                    toast.error(message, notificationProps);
                }
            });
        }
    }

    function handleVolume(value: number, dontShow: boolean = false) {
        if (!videoRef.current) return
        videoRef.current.volume = value / 100
        setVolume(() => value)
        volumeCacheFunc(value)
        if (dontShow) return
        if (volumeTimeout.current) clearTimeout(volumeTimeout.current)
        setShowVolume(() => true)
        volumeTimeout.current = setTimeout(() => {
            setShowVolume(() => false)
        }, 1000);
    }

    function togglePlay() {
        const video = videoRef.current
        if (!video) return

        // https://developer.chrome.com/blog/play-request-was-interrupted
        let playPromise = video.play()
        if (playPromise !== undefined && isPlaying) {
            playPromise.then(_ => {
                video.pause();
                setIsPlaying(() => false)
            }).catch(error => { console.error(error) });
        } else {
            setIsPlaying(() => true)
        }

        if (playAnimationTimeout.current) clearTimeout(playAnimationTimeout.current)
        setShowPlay(() => true)
        playAnimationTimeout.current = setTimeout(() => {
            setShowPlay(() => false)
        }, 300);
    }

    function setMutedToPlayer() {
        if (isMuted) setMuted(false)
        else setMuted(true)
    }

    async function exitPlayer() {
        if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
        }
        window.BrowserWindow.setFullscreen(false)
        exitFromPlayer()
    }

    function saveContinueProgress() {
        // Checking to save history
        if (!config) return
        if (!videoRef.current) return

        if (
            videoRef.current.currentTime >= parseInt(config.History.continue.MinimalTimeSave.toString()) &&
            videoRef.current.currentTime <= videoRef.current.duration - parseInt(config.History.continue.MaximizeTimeSave.toString())
        ) {
            SaveContinue({
                AnimeData: { ...anime_data.AnimeData, nextAiringEpisode: undefined },
                saveData: {
                    pluginName: store.getState().plugin.playerPlugin.name,
                    last_Time: videoRef.current.currentTime,
                    episode: temp.episode,
                    type: temp.type
                }
            })
        } else {
            DeleteFromContinue({
                AnimeData: { ...anime_data.AnimeData },
                saveData: {
                    pluginName: "",
                    last_Time: 0,
                    episode: temp.episode,
                    type: temp.type
                }
            })
        }
        refetchHistory()
    }

    async function handlePictureInPicture() {
        const video = videoRef.current;

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
            toast.error("Failed open Picture in Picture Mode")
        }
    };

    function updateProgress() {
        if (!videoRef.current) return
        saveContinueProgress()
        setcurrentTime(videoRef.current.currentTime)
        checkUpNext()
        handleProgress()

        if (config.Player.general.autoSkipOpenings) {
            for (let index = 0; index < player_data.length; index++) {
                const element = player_data[index];
                if (element.hostname == currentHost && element.listChapters) {
                    element.listChapters.forEach(element => {
                        if (!videoRef.current) return
                        if (videoRef.current.currentTime >= element.start && videoRef.current.currentTime <= element.end) change_time(element.end)
                    });
                }
            }
        }

        // Update RPC
        if (config.General.discordRPC) window.api.rpc.setActivity(t("discordrpc.player", { title: anime_data.AnimeData.title.romaji, ep: temp.episode }), `${formatTime(videoRef.current.currentTime)} / ${formatTime(videoRef.current.duration)}`)
        if (config.Player.general.AutoSkipEpisode && videoRef.current.duration == videoRef.current.currentTime) setEpisode("next")
    }

    function checkUpNext() {
        // checking to show Up next communicat
        if (!config) return
        if (!videoRef.current) return
        if (!config.Player.upToNextEpisode.enable) return
        const duration = videoRef.current.duration
        const currentTime = videoRef.current.currentTime

        if (duration <= config.Player.upToNextEpisode.durationShow * 60) return

        if (duration != 0 && currentTime != 0 && isHideUpNextEpisode == false && temp.episodes[temp.episodes.findIndex((item) => temp.episode == item.ep) + 1] != null && currentTime > duration - parseInt(config.History.continue.MaximizeTimeSave.toString())) {
            setUpNextEpisode(true)
            setTimeNextEpisode(((parseInt(duration.toFixed(0)) - parseInt(config.History.continue.MaximizeTimeSave.toString())) - parseInt(currentTime.toFixed(0))) + 30)
        } else {
            setTimeNextEpisode(config.Player.upToNextEpisode.interval)
            setUpNextEpisode(false)
        }

        if (duration != 0 && currentTime != 0 && (isHideUpNextEpisode == false && timeNextEpisode <= 0)) setEpisode("next")
    }

    function videoErrorHandler(event: React.SyntheticEvent<HTMLVideoElement, Event>) {
        const Error = event.currentTarget.error
        var message: string

        if (Error) {
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
            toast.error(message, notificationProps);
        }
    }

    function setTimeVideo(value: number) {
        if (!videoRef.current) return
        videoRef.current.currentTime = value
        setcurrentTime(() => value)
        if (!isNaN(value) && config && value > videoRef.current.duration - parseInt(config.History.continue.MaximizeTimeSave.toString())) {
            setHideUpNextEpisode(true)
        }
    }

    function change_time(time: number) {
        if (!videoRef.current) return
        videoRef.current.currentTime = time
    }

    useKeyPress((keys: string) => {
        if (keys == "CTRL+SHIFT+D") {
            setshowNerdStats((prev) => !prev)
        }
        keybinds(keys)
    })

    useHotkeys("d", () => {
        console.log(player_data)
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
                console.log([activeCue.text])
            }
            else setCue(undefined)
        } catch (error) {
            setCue(undefined)
        }
    }

    async function setNewSubtitles(sub: { url: string, lang: string, label: string, format: string }) {
        if (!videoRef.current) return

        // This clear subtitles but this dosen't work on dev Because react second render
        if (currentASSubtitles) {
            currentASSubtitles.hide()
            currentASSubtitles.destroy()
            setASSubtitles(() => undefined)
        }

        if (window.electronAPI.process.env.NODE_ENV == "development" && currentASSubtitles && assSubContainer.current) {
            assSubContainer.current.innerHTML = ""
        }

        if (vttUrl) {
            setVttUrl(() => undefined)
            setCue(() => undefined)
        }

        if (sub.label == "Off" && sub.format == "", sub.lang == "", sub.url == "") {
            setSubtitles({ url: "", format: "", lang: "", label: "Off" })
            return
        }

        let data = await window.api.request.get(sub.url, { "User-Agent": navigator.userAgent }, "text")
        if (!data.success) return
        if (sub.format == "ass") {
            if (!assSubContainer.current) return
            const ass = new ASS(data.data, videoRef.current, {
                container: assSubContainer.current,
            });
            ass.show();
            setASSubtitles(ass)
            setSubtitles(() => sub)
            if (isPlaying) {
                videoRef.current.pause()
                videoRef.current.play()
            }
            return
        }

        const vtt = await convert(data.data, ".vtt", { removeTextFormatting: true });
        const blob = new Blob([vtt.subtitle], { type: "text/vtt" });
        setVttUrl(URL.createObjectURL(blob));
        setSubtitles(() => sub)
        let track = videoRef.current.textTracks[0]
        track.mode = "hidden"
        track.oncuechange = onChangeTrackText;
    }

    useHotkeys("x", async () => {
        console.log(player_data)
    })

    function keybinds(event: string) {
        if (videoRef.current) {
            var time_now = videoRef.current.currentTime
            switch (event.toLowerCase()) {
                case convertKeybinds(config.Player.keybinds.Pause.toLowerCase()).toLowerCase():
                    togglePlay()
                    break
                case convertKeybinds(config.Player.keybinds.TimeSkipRight.toLowerCase()).toLowerCase():
                    change_time((time_now += parseInt(config.Player.general.TimeSkipRight.toString())))
                    updateProgress()
                    break
                case convertKeybinds(config.Player.keybinds.TimeSkipLeft.toLowerCase()).toLowerCase():
                    change_time((time_now -= parseInt(config.Player.general.TimeSkipLeft.toString())))
                    updateProgress()
                    break
                case convertKeybinds(config.Player.keybinds.LongTimeSkipForward.toLowerCase()).toLowerCase():
                    change_time((time_now += parseInt(config.Player.general.LongTimeSkipForward.toString())))
                    updateProgress()
                    break
                case convertKeybinds(config.Player.keybinds.LongTimeSkipBack.toLowerCase()).toLowerCase():
                    change_time((time_now -= parseInt(config.Player.general.LongTimeSkipBack.toString())))
                    updateProgress()
                    break
                case convertKeybinds(config.Player.keybinds.Fullscreen.toLowerCase()).toLowerCase():
                    enterFullscreen()
                    break
                case convertKeybinds(config.Player.keybinds.ExitPlayer.toLowerCase()).toLowerCase():
                    exitPlayer()
                    break
                case convertKeybinds(config.Player.keybinds.FrameSkipForward.toLowerCase()).toLowerCase():
                    change_time((time_now += 0.0416))
                    updateProgress()
                    break
                case convertKeybinds(config.Player.keybinds.FrameSkipBack.toLowerCase()).toLowerCase():
                    change_time((time_now -= 0.0416))
                    updateProgress()
                    break
                case convertKeybinds(config.Player.keybinds.VolumeDown.toLowerCase()).toLowerCase():
                    handleVolume((videoRef.current.volume * 100) - 1)
                    break
                case convertKeybinds(config.Player.keybinds.VolumeUp.toLowerCase()).toLowerCase():
                    handleVolume((videoRef.current.volume * 100) + 1)
                    break
                case convertKeybinds(config.Player.keybinds.ScreenShot.toLowerCase()).toLowerCase():
                    takeScreenshot()
                    break
                case convertKeybinds(config.Player.keybinds.VolumeMute.toLowerCase()).toLowerCase():
                    setMuted(prev => !prev)
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
            }
        }
    }

    async function takeScreenshot() {
        if (videoRef.current == null) return
        if (canvasRef.current == null) return
        if (config == null) return

        const currentDate: Date = new Date();
        const year: number = currentDate.getFullYear();
        const month: number = currentDate.getMonth() + 1;
        const day: number = currentDate.getDate();
        const hour: number = currentDate.getHours();
        const minutes: number = currentDate.getMinutes();
        const seconds: number = currentDate.getSeconds();

        const formatedDate = `-${year}-${month}-${day}-${hour}-${minutes}-${seconds}`
        const context = canvasRef.current.getContext('2d');

        if (context == null) {
            toast.error(t("player.toastscreenshot.failed"), notificationProps);
            return
        }

        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const screenshot = canvasRef.current.toDataURL('image/png');

        if (screenshot == "data:,") {
            toast.error(t("player.toastscreenshot.failed"), notificationProps);
            return
        }
        if (config.Player.screenShot.saveType == "Clipboard" || config.Player.screenShot.saveType == "Both") {
            const blob = await (await fetch(screenshot)).blob();
            await navigator.clipboard.write([
                new ClipboardItem({
                    'image/png': blob,
                }),
            ]);
            toast.success(t("player.toastscreenshot.doneclip"), notificationProps);
            if (config.Player.screenShot.saveType == "Clipboard") return
        }

        if (config.Player.screenShot.alwaysAsk) var resp = await window.api.os.saveDialog(`${config.Player.screenShot.path}/screenshot${formatedDate}.png`, screenshot.replace(/^data:image\/png;base64,/, ''), `screenshot${formatedDate}.png`, "png", ["PNG"], "base64")
        else var resp = await window.api.os.write(`${config.Player.screenShot.path}/screenshot${formatedDate}.png`, screenshot.replace(/^data:image\/png;base64,/, ''), "base64")
        if (resp) {
            toast.success(t("player.toastscreenshot.donefile", { path: config.Player.screenShot.path }), notificationProps);
            return;
        }
        toast.error(t("player.toastscreenshot.failed"), notificationProps);
        return;
    };

    const centerContextMenu: ContextMenuProps = [
        { option: t("contextMenu.nerdstats"), onClick: () => setshowNerdStats((prev) => !prev) }
    ]

    const handleProgress = () => {
        const video = videoRef.current;
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

    const hiddenVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
    }

    function detectDisableTooltips(text: string): string | undefined {
        if (isShowSelectEpisode) return undefined
        if (currentSettings) return undefined
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
        let data = await window.api.request.get(url, { "User-Agent": navigator.userAgent }, "text")
        if (!data.success) return
        const lines = data.data.split("\n").map((l: string) => l.trim());
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

    function generateOpeningEnding(data: { start: number, end: number, type: "opening" | "ending" | "other" }[]) {
        if (!videoRef.current) return
        let tmp: { left: number, width: number }[] = []
        for (let index = 0; index < data.length; index++) {
            const element = data[index];
            if (element.type == "ending" || element.type == "opening") {
                console.log((element.start / videoRef.current.duration))
                tmp.push({ left: (element.start / videoRef.current.duration) * 100, width: ((element.end - element.start) / videoRef.current.duration) * 100 })
            }
        }
        setChapterList(() => tmp)
    }

    return (
        <div className={isVisible ? "player-video-container" : "player-video-container player-hide-cursor"} ref={containerRef} onMouseMove={handleMouseMove} onContextMenu={(event) => OpenContextMenu(CreateContextMenuOptions(undefined, centerContextMenu), event)}>
            <video
                ref={videoRef}
                className="video-player"
                onTimeUpdate={updateProgress}
                onProgress={handleProgress}
                onSeeked={handleProgress}
                onClick={() => { togglePlay(); setcurrentSettings(() => false); setShowSelectEpisode(() => false) }}
                autoPlay={isPlaying}
                onWaiting={() => { setWaitingPlayer(() => true) }}
                onCanPlay={() => { setWaitingPlayer(() => false) }}
                onError={(error) => videoErrorHandler(error)}
                onLoadedMetadata={() => {
                    updateProgress()
                    for (let index = 0; index < player_data.length; index++) {
                        const element = player_data[index];
                        if (element.hostname == currentHost && element.listChapters) {
                            generateOpeningEnding(element.listChapters)
                            return
                        }
                    }
                }}
                preload="auto"
                muted={isMuted}
                style={config.Player.general.VideoStreching ? { objectFit: "cover" } : {}}
            >
                <track
                    src={vttUrl}
                    kind="subtitles"
                    default
                    ref={vttSubRef}
                />
            </video>
            {currentCue && (
                <div className={`player-subtitle-container ${isVisible ? "up" : "down"}`}>
                    {currentCue.split("\n").map((text) => (
                        <span className="player-subtitle-content">{text}</span>
                    ))}
                </div>
            )}
            <div ref={assSubContainer} style={{ position: "absolute", top: "0", left: "0" }}></div>
            {isVisible &&
                <>
                    <div className="player-mask top"></div>
                    <div className="player-mask bottom"></div>
                </>
            }

            <div className="video-overlay">
                <div className={isUpNextEpisode == false ? isVisible ? 'video-top' : 'video-top player-hidden' : 'video-top'}>
                    <Button icon='arrow_back' ButtonClass='player-buttons' onClick={async () => await exitPlayer()} />
                    <div className="player-title ">{detectTitle({ title: anime_data.AnimeData.title, ep: temp.episode, format: anime_data.AnimeData.format })}</div>
                </div>
                <div className="video-center"> {/* video-center-container */}
                    {/* <div className="player-loading-animation-container player-fast-rewind-ui">
                        <div className="player-icon-ui material-symbols-outlined">fast_rewind</div>
                    </div> */}
                    {/* <div className="video-center">
                        <div ref={playerLoadingRef} className={`player-loading-animation-container ${isWaitingPlayer ? "player-loading-ui-in" : "player-loading-ui-out"}`}>
                            <div className="player-waiting material-symbols-outlined">progress_activity</div>
                        </div> */}
                    {/* <div className={`player-loading-animation-container ${isShowPlay && isWaitingPlayer == false ? "player-loading-ui-in" : "player-loading-ui-out"}`}>
                            <div className="player-icon-ui material-symbols-outlined">{isPlaying ? "pause" : "play_arrow"}</div>
                        </div>
                    </div> */}
                    {/* <div className="player-loading-animation-container player-fast-forward-ui">
                        <div className="player-icon-ui material-symbols-outlined">fast_forward</div>
                    </div> */}

                    <motion.div className="player-loading-animation-container player-buffering-animation"
                        variants={hiddenVariants}
                        animate={isWaitingPlayer ? "visible" : "hidden"}
                        initial="hidden"
                        transition={{ duration: 0.8 }}
                    >
                        <div className="player-waiting material-symbols-outlined">progress_activity</div>
                    </motion.div>
                    {!config.Player.general.RemovingSpaceAnimation &&
                        <motion.div className="player-loading-animation-container"
                            variants={hiddenVariants}
                            animate={isShowPlay && isWaitingPlayer == false ? "visible" : "hidden"}
                            initial="hidden"
                            transition={{ duration: 0.65 }}
                        >
                            <div className="player-icon-ui material-symbols-outlined">{isPlaying ? "pause" : "play_arrow"}</div>
                        </motion.div>
                    }
                </div>
                <div className={isVisible && isUpNextEpisode == false ? 'video-bottom' : 'video-bottom player-hidden'}>
                    <SeekBar chapterList={chapterList} thumbnail={thumbnails} secondBarValues={currentBuffer} currentValue={currentTime} maxValue={videoRef.current?.duration} onSeek={value => { setTimeVideo(value) }} type="time" classes={{ container: "player-seekbar" }} screen={true} />
                    <div className="player-bottom-section">
                        <div className="player-left">
                            {temp.episodes[temp.episodes.findIndex((item) => temp.episode == item.ep) - 1] !== undefined &&
                                <PlayerButton title={t('player.previous', { ep: temp.episodes[temp.episodes.findIndex((item) => temp.episode == item.ep) - 1].ep })} icon='skip_previous'
                                    onClick={() => setEpisode("prev")}
                                    ButtonClass="player-buttons" />
                            }
                            <PlayerButton icon={isPlaying ? "pause" : "play_arrow"} title={isPlaying ? t('player.Pause') : t('player.play')} ButtonClass="player-buttons" onClick={togglePlay} />
                            {temp.episodes[temp.episodes.findIndex((item) => temp.episode == item.ep) + 1] !== undefined &&
                                <PlayerButton icon='skip_next' ButtonClass='material-symbols-outlined player-buttons' title={t('player.next', { ep: temp.episodes[temp.episodes.findIndex((item) => temp.episode == item.ep) + 1].ep })} onClick={() => setEpisode("next")} />
                            }
                            <div className="player-time-display">
                                {formatTime(currentTime)} / {formatTime(videoRef.current?.duration)}
                            </div>
                            <div className="player-end-time-display">
                                Episode Ends on {addTime(videoRef.current?.duration ? (videoRef.current.duration - currentTime) : 0)}
                            </div>
                        </div>
                        <div className="player-right">
                            <PlayerButton icon={isMuted ? 'volume_off' : 'volume_up'} title={isMuted ? "Unmute" : "Mute"} ButtonClass="player-buttons volume-button" onClick={setMutedToPlayer} />
                            <div className="player-volume-seek">
                                <SeekBar currentValue={volume} maxValue={100} onSeek={value => handleVolume(value)} classes={{ container: "player-seekbar" }} />
                            </div>
                            <PlayerButton icon={"picture_in_picture"} onClick={handlePictureInPicture} title={detectDisableTooltips("Picture In Picture")} ButtonClass="player-buttons" />
                            <PlayerButton icon={"video_library"} title={detectDisableTooltips("Select Episode")} ButtonClass="player-buttons" onClick={() => { setShowSelectEpisode((prev) => !prev); setcurrentSettings(() => false) }} />
                            {isShowSelectEpisode &&
                                <div className="player-select-episode-container">
                                    <div className="player-select-episode-title">Change Episode</div>
                                    {!countImages(temp.episodes) &&
                                        <div className="player-select-episode-content">
                                            {temp.episodes.map((element) => (
                                                <div className={`information-episode-button ${parseInt(element.ep) < parseInt(temp.episode) ? "watched" : ""} ${parseInt(element.ep) == parseInt(temp.episode) ? "current" : ""}`} onClick={() => setNextEpisode(element.ep)}>{element.ep}</div>
                                            ))}
                                        </div>
                                    }
                                    {countImages(temp.episodes) &&
                                        <div className="player-select-episode-content-list">
                                            {temp.episodes.map((element) => (
                                                <PlayerEpisodeElement nextEpisode={setNextEpisode} animeTitle={anime_data.AnimeData.title.romaji} episodes={element} currentEpisode={temp.episode} />
                                            ))}
                                        </div>
                                    }
                                </div>
                            }
                            <PlayerSettings
                                state={currentSettings}
                                sources={
                                    player_data.map((val) => { return { name: val.hostname, change: () => checkUrl(player_data[player_data.findIndex((item) => item.hostname === val.hostname)]) } })
                                }
                                resolution={
                                    ListResolution.map((val) => { return { res: val.res, change: () => setNewResolution(val) } })
                                }
                                speed={speed.map((val) => { return { speed: parseFloat(val), change: () => setSpeed(val) } })}
                                subtitles={
                                    ListSubtitles.map((val) => { return { sub: val.label, change: () => setNewSubtitles(val) } })
                                }
                                audioTrack={
                                    audioTrackList.map((val) => { return { track: val.label, change: () => changeAudioTrack(val) } })
                                }
                                disableSettings={() => setcurrentSettings(() => false)}
                                current={{
                                    currentHost: currentHost,
                                    currentResolution: currentResolution ? currentResolution.res : "Uknown",
                                    currentSpeed: videoRef.current?.playbackRate ? videoRef.current?.playbackRate : 1,
                                    currentSub: currentSubtitles ? currentSubtitles.label : "Off",
                                    currentTrack: currentAudioTrack ? currentAudioTrack.label : "Default"
                                }}
                            />
                            <PlayerButton icon="settings" ButtonClass="player-buttons" title={detectDisableTooltips(t('global.settings'))} onClick={() => { setcurrentSettings((prev) => !prev); setShowSelectEpisode(() => false) }} />
                            <PlayerButton icon={isFullscreen ? 'fullscreen_exit' : 'fullscreen'} ButtonClass="player-buttons" title={detectDisableTooltips(t('player.fullscreen'))} onClick={async () => await enterFullscreen()} />
                        </div>
                    </div>
                </div>
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            {isUpNextEpisode ? (
                <div className="player-up-Next-container">
                    <div className="player-up-Next-Title">{t("player.upNext.title", { sec: parseInt(timeNextEpisode.toString()) })}</div>
                    <div className="player-up-Next-Anime">{t("player.upNext.titleAnime", { ep: temp.episodes[temp.episodes.findIndex((item) => temp.episode == item.ep) + 1].ep, title: anime_data.AnimeData.title.romaji })}</div>
                    <div className="player-up-Next-Buttons">
                        <Button content={t("player.upNext.nextEp")} ButtonClass='player-up-Next-Button' onClick={() => setEpisode("next")} />
                        <Button content={t("player.upNext.hide")} ButtonClass='player-up-Next-Button' onClick={() => { setHideUpNextEpisode(true); setUpNextEpisode(false) }} />
                    </div>
                </div>
            ) : ""}
            {!config.Player.general.DisableVolumeAnimation &&
                <motion.div className="player-volume-ui-container"
                    variants={{
                        hidden: { x: 400 },
                        visible: { x: 0 },
                    }}
                    animate={isVolume ? "visible" : "hidden"}
                    initial="hidden"
                    transition={{ duration: 0.2 }}
                >
                    <span className="player-volume-ui-icon material-symbols-outlined">{isMuted ? 'volume_off' : 'volume_up'}</span>
                    <div className="player-volume-ui-bar-container">
                        <div className="player-volume-ui-bar-progress" style={{ width: `${volume}%` }}></div>
                    </div>
                    <span className="player-volume-ui-text">{parseInt(volume.toString())}%</span>
                </motion.div>
            }
            {showNerdStats && (
                <NerdStats video={videoRef} volume={volume} currentTime={currentTime} />
            )}
            {config.Developer.playerDebug && (
                <DeveloperStats
                    isMuted={isMuted}
                    isFullscreen={isFullscreen}
                    isHideUpNextEpisode={isHideUpNextEpisode}
                    isPlaying={isPlaying}
                    isUpNextEpisode={isUpNextEpisode}
                    isVisible={isVisible}
                    isWaitingPlayer={isWaitingPlayer}
                    ListResolution={ListResolution.map((val) => val.res)}
                    currentHost={currentHost}
                    currentResolution={currentResolution ? currentResolution.res : "Uknown"}
                    currentSettings={currentSettings}
                    hls={hls}
                    time={time}
                    timeNextEpisode={timeNextEpisode}
                    episode={{ ep: temp.episode, type: temp.type }}
                    episodes={temp.episodes}
                    episodesUrl={player_data}
                    showNerdStats={showNerdStats}
                    PlayerVolume={PlayerVolume}
                />
            )}
        </div>
    )
}

export default VideoPlayer;