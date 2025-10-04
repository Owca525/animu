import { lazy, RefObject, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"
import Hls from "hls.js"

// Components
import NerdStats from "./components/nerdStats"
const DeveloperStats = lazy(() => import('./components/developerStats'));

// css
import { cardData, ContextMenuProps, notificationProps, playerChapterList, playerData, playerSubtitlesFormat, SettingsConfig, Thumbnail } from "@renderer/utils/GlobalInterface"
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
import html2canvas from "html2canvas"

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
    const hideChapterButtonTimer = useRef<NodeJS.Timeout | null>(null)
    const screenshotWrapper = useRef<HTMLDivElement | null>(null)

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
    const [buttonSkipTime, setButtonSkipTime] = useState<number>(15)
    const [IsRunningButtonSkipTime, setIsRunningButtonSkipTime] = useState<boolean>(false)
    const [IsDisableButtonSkipTimerOpening, setIsDisableButtonSkipTimerOpening] = useState<boolean>(false)
    const [IsDisableButtonSkipTimerEnding, setIsDisableButtonSkipTimerEnding] = useState<boolean>(false)
    const [currentSkipButton, setcurrentSkipButton] = useState<{ text: string, onClick: () => void, type: "opening" | "ending" | "" }>({ text: "", onClick: () => "", type: "" })

    const buttonSkipLeft = useRef<NodeJS.Timeout | null>(null);
    const [isShowButtonSkipLeft, setShowButtonSkipLeft] = useState<boolean>(false)
    const buttonSkipRight = useRef<NodeJS.Timeout | null>(null);
    const [isShowButtonSkipRight, setShowButtonSkipRight] = useState<boolean>(false)

    // States
    const [isMuted, setMuted] = useState<boolean>(false)
    const [isVisible, setIsVisible] = useState<boolean>(true)
    const [isWaitingPlayer, setWaitingPlayer] = useState<boolean>(true)
    const [isPlaying, setIsPlaying] = useState<boolean>(config.Player.general.Autoplay)
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false)

    // Resolution
    const [ListResolution, setListResolution] = useState<{ res: string, url: string }[]>([])
    const [currentResolution, setCurrentResoltion] = useState<{ res: string, url: string } | undefined>(undefined)

    // Up Next
    const [timeNextEpisode, setTimeNextEpisode] = useState<number>(config.Player.upToNextEpisode.durationShow)
    const [isUpNextEpisode, setUpNextEpisode] = useState<boolean>(false)
    const [isHideUpNextEpisode, setHideUpNextEpisode] = useState<boolean>(false)
    const [currentPlayer, setPlayer] = useState<playerData | undefined>(undefined)

    // other
    const [currentSettings, setcurrentSettings] = useState<boolean>(false)
    const [showNerdStats, setshowNerdStats] = useState<boolean>(false)
    const [hls, setHls] = useState<Hls | undefined>(undefined);
    const [chapterList, setChapterList] = useState<{ left: number, width: number, name?: string, type: "opening" | "ending" | "other" }[]>([])

    // Subtitles
    const [vttUrl, setVttUrl] = useState<string | undefined>(undefined);
    const [ListSubtitles, setListSubtitles] = useState<playerSubtitlesFormat[]>([])
    const [lastSubtitles, setlastSubtitles] = useState<playerSubtitlesFormat | undefined>(undefined)
    const [currentASSubtitles, setASSubtitles] = useState<ASS | undefined>(undefined)
    const [currentSubtitles, setSubtitles] = useState<playerSubtitlesFormat | undefined>(undefined)
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

    function setNewResolution(data: { res: string, url: string; defaultSubtitles?: boolean; } | undefined) {
        if (!data) return
        if (!videoRef.current) return
        const time = videoRef.current.currentTime
        if (data.defaultSubtitles) setDefaultSubtitles(ListSubtitles)
        else setNewSubtitles(ListSubtitles[0])

        if (hls && data.url == "") {
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
        if (!videoRef.current) return
        const time = videoRef.current.currentTime
        if (data.subtitles) setListSubtitles(() => [{ url: "", format: "", lang: "", label: "Off" }, ...data.subtitles as playerSubtitlesFormat[]])
        if (data.storyboardVTT) setThumbnail(await VTTstoryBoardParser(data.storyboardVTT))
        if (data.resolution[0].defaultSubtitles && data.subtitles) setDefaultSubtitles(data.subtitles)
        if (data.hls) {
            setPlayer(() => data)
            await runHLS(data.resolution[0].url, data.hostname)
            return
        }
        if (hls) hls.destroy()
        setCurrentResoltion(data.resolution[0])
        setListResolution(() => data.resolution)
        setPlayer(() => data)
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
                            // TODO: Update this, may make bug
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
        setTimeoutForElement(volumeTimeout, setShowVolume)
    }

    function setTimeoutForElement(element: RefObject<NodeJS.Timeout | null>, func: (initialState: boolean) => void) {
        if (element.current) clearTimeout(element.current)
        func(true)
        volumeTimeout.current = setTimeout(() => {
            func(false)
        }, 500);
    }

    function togglePlay() {
        const video = videoRef.current
        if (!video) return

        setIsPlaying(prev => {
            if (prev) {
                video.pause()
                return false
            }
            video.play()
            return true
        })

        if (playAnimationTimeout.current) clearTimeout(playAnimationTimeout.current)
        setShowPlay(() => true)
        playAnimationTimeout.current = setTimeout(() => {
            setShowPlay(() => false)
        }, 300);
    }

    function setMutedToPlayer() {
        setMuted((prev) => !prev)
        handleVolume(volume)
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

    function startChapterSkipTime() {
        if (IsRunningButtonSkipTime) return

        setIsRunningButtonSkipTime(() => true)

        hideChapterButtonTimer.current = setInterval(() => {
            setButtonSkipTime((prev) => {
                if (prev <= 1 || IsRunningButtonSkipTime) {
                    clearChapterSkipTime()
                    return 15;
                }
                return prev - 1;
            });
        }, 1000);
    };

    function clearChapterSkipTime() {
        if (!hideChapterButtonTimer.current) return
        clearInterval(hideChapterButtonTimer.current)
        setButtonSkipTime(15)
        setIsRunningButtonSkipTime(() => false)
    }

    function updateProgress() {
        if (!videoRef.current) return
        saveContinueProgress()
        setcurrentTime(videoRef.current.currentTime)
        checkUpNext()
        handleProgress()

        if (currentPlayer && currentPlayer.listChapters) {
            currentPlayer.listChapters.forEach(element => {
                if (!videoRef.current) return
                let currentTime = videoRef.current.currentTime
                if (currentTime >= element.start && currentTime <= element.end && element.type == "opening") {
                    if (config.Player.general.autoSkipOpenings) change_time(element.end)
                    if (!IsDisableButtonSkipTimerOpening && !config.Player.general.autoSkipOpenings) {
                        setcurrentSkipButton(() => { return { text: "Skip Opening", onClick: () => { clearChapterSkipTime(); change_time(element.end) }, type: "opening" } })
                        startChapterSkipTime()
                        setIsDisableButtonSkipTimerOpening(() => true)
                    }
                }
                if (currentTime >= element.start && currentTime <= element.end && element.type == "ending") {
                    if (config.Player.general.autoSkipEndings) change_time(element.end)
                    if (!IsDisableButtonSkipTimerEnding) {
                        setcurrentSkipButton(() => { return { text: "Skip Ending", onClick: () => { clearChapterSkipTime(); change_time(element.end) }, type: "ending" } })
                        startChapterSkipTime()
                        setIsDisableButtonSkipTimerEnding(() => true)
                    }
                }
            });
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
        if (!currentPlayer) return
        const duration = videoRef.current.duration
        const currentTime = videoRef.current.currentTime

        if (duration <= config.Player.upToNextEpisode.durationShow * 60) return

        let showUpToNext: boolean = false
        let timeDelete: number = ((parseInt(duration.toFixed(0)) - parseInt(config.History.continue.MaximizeTimeSave.toString())) - parseInt(currentTime.toFixed(0))) + parseInt(config.Player.upToNextEpisode.interval.toString())
        if (currentPlayer.listChapters) {
            for (let index = 0; index < currentPlayer.listChapters.length; index++) {
                const element = currentPlayer.listChapters[index];
                if (currentTime >= element.start && currentTime <= element.end && element.type == "ending") {
                    showUpToNext = true
                    timeDelete = ((parseInt(duration.toFixed(0)) - (parseInt(duration.toFixed(0)) - element.start)) - parseInt(currentTime.toFixed(0))) + parseInt(config.Player.upToNextEpisode.interval.toString())
                }
            }
        } else {
            showUpToNext = currentTime > duration - parseInt(config.History.continue.MaximizeTimeSave.toString())
        }

        if (isHideUpNextEpisode == false && temp.episodes[temp.episodes.findIndex((item) => temp.episode == item.ep) + 1] != null && showUpToNext) {
            setUpNextEpisode(true)
            setTimeNextEpisode(timeDelete)
        } else {
            setTimeNextEpisode(parseInt(config.Player.upToNextEpisode.interval.toString()))
            setUpNextEpisode(false)
        }

        if (isHideUpNextEpisode == false && timeNextEpisode <= 0) setEpisode("next")
    }

    function videoErrorHandler(event: React.SyntheticEvent<HTMLVideoElement, Event>) {
        const Error = event.currentTarget.error
        var message: string
        if (!Error) return
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

        if (!currentPlayer) return
        let index = player_data.findIndex((element) => element.hostname == currentPlayer.hostname)
        if (player_data[index + 1]) checkUrl(player_data[index + 1])
    }

    function setTimeVideo(value: number) {
        if (!videoRef.current) return
        videoRef.current.currentTime = value
        setcurrentTime(() => value)
        if (!isNaN(value) && config && value > videoRef.current.duration - parseInt(config.History.continue.MaximizeTimeSave.toString())) {
            setHideUpNextEpisode(true)
        }

        if (currentPlayer && currentPlayer.listChapters) {
            currentPlayer.listChapters.forEach(element => {
                if (!(value >= element.start && value <= element.end) && element.type == "opening" && currentSkipButton.type == "opening") {
                    clearChapterSkipTime()
                }
                if (!(value >= element.start && value <= element.end) && element.type == "ending" && currentSkipButton.type == 'ending') {
                    clearChapterSkipTime()
                }
            })
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
        console.log(player_data, temp)
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

    function keybinds(event: string) {
        if (videoRef.current) {
            var time_now = videoRef.current.currentTime
            switch (event.toLowerCase()) {
                case convertKeybinds(config.Player.keybinds.Pause.toLowerCase()).toLowerCase():
                    togglePlay()
                    break
                case convertKeybinds(config.Player.keybinds.TimeSkipRight.toLowerCase()).toLowerCase():
                    change_time((time_now += parseInt(config.Player.general.TimeSkipRight.toString())))
                    setTimeoutForElement(buttonSkipRight, setShowButtonSkipRight)
                    updateProgress()
                    break
                case convertKeybinds(config.Player.keybinds.TimeSkipLeft.toLowerCase()).toLowerCase():
                    change_time((time_now -= parseInt(config.Player.general.TimeSkipLeft.toString())))
                    setTimeoutForElement(buttonSkipLeft, setShowButtonSkipLeft)
                    updateProgress()
                    break
                case convertKeybinds(config.Player.keybinds.LongTimeSkipForward.toLowerCase()).toLowerCase():
                    change_time((time_now += parseInt(config.Player.general.LongTimeSkipForward.toString())))
                    setTimeoutForElement(buttonSkipRight, setShowButtonSkipRight)
                    updateProgress()
                    break
                case convertKeybinds(config.Player.keybinds.LongTimeSkipBack.toLowerCase()).toLowerCase():
                    change_time((time_now -= parseInt(config.Player.general.LongTimeSkipBack.toString())))
                    setTimeoutForElement(buttonSkipLeft, setShowButtonSkipLeft)
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
                    if (currentSkipButton.type == "ending") setHideUpNextEpisode(true)
                    currentSkipButton.onClick()
                    break
            }
        }
    }

    function toggleSubtitles(): any {
        if (ListSubtitles.length <= 0) return
        if (currentSubtitles && currentSubtitles.label != "Off") {
            setlastSubtitles(() => currentSubtitles)
            setNewSubtitles(ListSubtitles[0])
            return
        }
        if (lastSubtitles) setNewSubtitles(lastSubtitles)
    }

    async function takeScreenshot() {
        if (!screenshotWrapper.current) return
        if (config == null) return

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

        const canvas = await html2canvas(screenshotWrapper.current);
        const screenshot = canvas.toDataURL("image/png");

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
        if (!config.Player.general.showBrokenBuffer && !hls) return
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
        hidden: { opacity: 0, display: "none" },
        visible: { opacity: 1, display: "" },
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

    function generateOpeningEnding(data: playerChapterList) {
        if (!videoRef.current) return
        let tmp: { left: number, width: number, name?: string, type: "opening" | "ending" | "other" }[] = []
        for (let index = 0; index < data.length; index++) {
            const element = data[index];
            tmp.push({ left: (element.start / videoRef.current.duration) * 100, width: ((element.end - element.start) / videoRef.current.duration) * 100, name: element.name, type: element.type })
        }
        setChapterList(() => tmp)
    }

    function getcurrentChapter(): string | undefined {
        if (!currentPlayer) return undefined
        if (!currentPlayer.listChapters) return undefined
        if (!videoRef.current) return undefined

        for (let index = 0; index < currentPlayer.listChapters.length; index++) {
            const element = currentPlayer.listChapters[index];
            if (videoRef.current.currentTime >= element.start && videoRef.current.currentTime <= element.end && element.name) return element.name
        }
        return undefined
    }

    function getCurrentImage(): string | undefined {
        for (let index = 0; index < temp.episodes.length; index++) {
            const element = temp.episodes[index];
            if (element.ep == temp.episode && element.img) return element.img
        }
        return undefined
    }

    const uptoNextVariants = {
        hidden: { opacity: 0, x: 400, display: "none" },
        visible: { opacity: 1, x: 0, display: "" },
    }

    function checkUptoNext() {
        if (config.Player.upToNextEpisode.variants == "old" && isUpNextEpisode == false) return false
        return true
    }

    return (
        <div className={isVisible ? "player-video-container" : "player-video-container player-hide-cursor"} ref={containerRef} onMouseMove={handleMouseMove} onContextMenu={(event) => OpenContextMenu(CreateContextMenuOptions(undefined, centerContextMenu), event)}>
            <div ref={screenshotWrapper} className={isVisible ? "player-video-container" : "player-video-container player-hide-cursor"} >
                <video
                    ref={videoRef}
                    className="video-player"
                    onTimeUpdate={updateProgress}
                    onProgress={updateProgress}
                    onSeeked={updateProgress}
                    onClick={() => { togglePlay(); setcurrentSettings(() => false); setShowSelectEpisode(() => false) }}
                    autoPlay={isPlaying}
                    onWaiting={() => { setWaitingPlayer(() => true) }}
                    onCanPlay={() => { setWaitingPlayer(() => false) }}
                    onError={(error) => videoErrorHandler(error)}
                    onLoadedMetadata={() => {
                        updateProgress()
                        if (currentPlayer && currentPlayer.listChapters) {
                            generateOpeningEnding(currentPlayer.listChapters)
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
            </div>
            {isVisible &&
                <>
                    <div className="player-mask top"></div>
                    <div className="player-mask bottom"></div>
                </>
            }

            <div className="video-overlay">
                <div className={checkUptoNext() ? isVisible ? 'video-top' : 'video-top player-hidden' : 'video-top'}>
                    <Button icon='arrow_back' ButtonClass='player-buttons' onClick={async () => await exitPlayer()} />
                    <div className="player-title ">{detectTitle({ title: anime_data.AnimeData.title, ep: temp.episode, format: anime_data.AnimeData.format })}</div>
                </div>
                <div className="video-center"> {/* video-center-container */}
                    {!config.Player.ui.DisableSkipAnimation &&
                        <>
                            <motion.div
                                variants={hiddenVariants}
                                animate={isShowButtonSkipLeft ? "visible" : "hidden"}
                                initial="hidden"
                                transition={{ duration: 0.4 }}
                                className="player-loading-animation-container player-fast-rewind-ui"
                            >
                                <div className="material-symbols-outlined player-icon-ui">fast_rewind</div>
                            </motion.div>
                            <motion.div
                                variants={hiddenVariants}
                                animate={isShowButtonSkipRight ? "visible" : "hidden"}
                                initial="hidden"
                                transition={{ duration: 0.4 }}
                                className="player-loading-animation-container player-fast-forward-ui"
                            >
                                <div className="material-symbols-outlined player-icon-ui">fast_forward</div>
                            </motion.div>
                        </>
                    }

                    {!config.Player.ui.DisableLoadingAnimation &&
                        <motion.div className="player-loading-animation-container player-buffering-animation"
                            variants={hiddenVariants}
                            animate={isWaitingPlayer ? "visible" : "hidden"}
                            initial="hidden"
                            transition={{ duration: 0.4 }}
                        >
                            <div className="player-waiting material-symbols-outlined">progress_activity</div>
                        </motion.div>
                    }
                    {!config.Player.ui.DisableSpaceAnimation &&
                        <motion.div className="player-loading-animation-container"
                            variants={hiddenVariants}
                            animate={isShowPlay && isWaitingPlayer == false ? "visible" : "hidden"}
                            initial="hidden"
                            transition={{ duration: 0.2 }}
                        >
                            <div className="player-icon-ui material-symbols-outlined">{isPlaying ? "pause" : "play_arrow"}</div>
                        </motion.div>
                    }
                </div>
                <div className={isVisible && checkUptoNext() ? 'video-bottom' : 'video-bottom player-hidden'}>
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
                                {t("player.episodeEndsOn", { time: addTime(videoRef.current?.duration ? (videoRef.current.duration - currentTime) : 0) })}
                            </div>
                        </div>
                        <div className="player-right">
                            {getcurrentChapter() && <span>{t("player.chapter", { name: getcurrentChapter() })}</span>}
                            <PlayerButton icon={isMuted ? 'volume_off' : 'volume_up'} title={isMuted ? t("player.unmute") : t("player.mute")} ButtonClass="player-buttons volume-button" onClick={setMutedToPlayer} />
                            <div className="player-volume-seek">
                                <SeekBar currentValue={volume} maxValue={100} onSeek={value => handleVolume(value)} classes={{ container: "player-seekbar" }} />
                            </div>
                            <PlayerButton icon={"picture_in_picture"} onClick={handlePictureInPicture} title={detectDisableTooltips("Picture In Picture")} ButtonClass="player-buttons" />
                            <PlayerButton icon={"video_library"} title={detectDisableTooltips("Select Episode")} ButtonClass="player-buttons" onClick={() => { setShowSelectEpisode((prev) => !prev); setcurrentSettings(() => false) }} />
                            <motion.div
                                initial={{ opacity: 0, display: "none" }} animate={isShowSelectEpisode ? { opacity: 1, display: "" } : { opacity: 0, display: "none" }} transition={{ duration: 0.2 }}
                                className="player-select-episode-container"
                            >
                                <div className="player-select-episode-title">{t("player.changeEpisode")}</div>
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
                            </motion.div>
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
                                    currentHost: currentPlayer ? currentPlayer.hostname : t("player.other.unknown"),
                                    currentResolution: currentResolution ? currentResolution.res : t("player.other.unknown"),
                                    currentSpeed: videoRef.current?.playbackRate ? videoRef.current?.playbackRate : 1,
                                    currentSub: currentSubtitles ? currentSubtitles.label : t("player.other.off"),
                                    currentTrack: currentAudioTrack ? currentAudioTrack.label : t("player.other.default")
                                }}
                            />
                            <PlayerButton icon="settings" ButtonClass="player-buttons" title={detectDisableTooltips(t('global.settings'))} onClick={() => { setcurrentSettings((prev) => !prev); setShowSelectEpisode(() => false) }} />
                            <PlayerButton icon={isFullscreen ? 'fullscreen_exit' : 'fullscreen'} ButtonClass="player-buttons" title={detectDisableTooltips(t('player.fullscreen'))} onClick={async () => await enterFullscreen()} />
                        </div>
                    </div>
                </div>
            </div>
            <motion.button onClick={_event => { if (currentSkipButton.type == "ending") setHideUpNextEpisode(true); currentSkipButton.onClick() }} variants={hiddenVariants} initial="hidden" animate={IsRunningButtonSkipTime ? "visible" : "hidden"} className="player-skip-chapters-button">{currentSkipButton.text}, {`${buttonSkipTime}s`}</motion.button>
            {config.Player.upToNextEpisode.variants == "old" && (
                <motion.div variants={uptoNextVariants} transition={{ duration: 0.2 }} animate={isUpNextEpisode ? "visible" : "hidden"} initial={"hidden"} className="player-up-Next-container old">
                    <div className="player-up-Next-Title old">{t("player.upNext.title", { sec: parseInt(timeNextEpisode.toString()) })}</div>
                    <div className="player-up-Next-Anime old">{t("player.upNext.titleAnime", { ep: temp.episodes[temp.episodes.findIndex((item) => temp.episode == item.ep) + 1].ep, title: anime_data.AnimeData.title.romaji })}</div>
                    <div className="player-up-Next-Buttons old">
                        <Button content={t("player.upNext.nextEp")} ButtonClass='player-up-Next-Button old' onClick={() => setEpisode("next")} />
                        <Button content={t("player.upNext.hide")} ButtonClass='player-up-Next-Button old' onClick={() => { setHideUpNextEpisode(true); setUpNextEpisode(false) }} />
                    </div>
                </motion.div>
            )}
            {config.Player.upToNextEpisode.variants == "var2" &&
                <motion.div
                    variants={uptoNextVariants}
                    transition={{ duration: 0.2 }}
                    animate={isUpNextEpisode ? "visible" : "hidden"}
                    initial={"hidden"}
                    className="player-up-Next-background"
                    style={{ backgroundImage: `url(${getCurrentImage()})` }}
                    onClick={() => setEpisode("next")}
                >
                    <div className="player-up-Next-container-var2 ">
                        <span className="material-symbols-outlined player-up-Next-icon">skip_next</span>
                        <div className="player-up-Next-content var2">
                            <div className="player-up-Next-title">{anime_data.AnimeData.title.romaji}</div>
                            <div className="player-up-Next-episode">{t("player.upNext.nextEpisode", { episode: temp.episode })}</div>
                            <div className="player-up-Next-text">{t("player.upNext.nextPlaying", { time: parseInt(timeNextEpisode.toString()) })}</div>
                        </div>
                    </div>
                    <button className="material-symbols-outlined player-up-Next-button-close" onClick={(event) => {
                        event.stopPropagation();
                        setHideUpNextEpisode(true);
                        setUpNextEpisode(false)
                    }
                    }>close</button>
                </motion.div>
            }
            {config.Player.upToNextEpisode.variants == "var1" &&
                <motion.div
                    variants={uptoNextVariants}
                    transition={{ duration: 0.2 }}
                    animate={isUpNextEpisode ? "visible" : "hidden"}
                    initial={"hidden"}
                    className="player-up-Next-container"
                    onClick={() => setEpisode("next")}
                >
                    <img src={getCurrentImage()} className="player-up-Next-image" />
                    <span className="material-symbols-outlined player-up-Next-icon">skip_next</span>
                    <div className="player-up-Next-content">
                        <div className="player-up-Next-title">{anime_data.AnimeData.title.romaji}</div>
                        <div className="player-up-Next-episode">{t("player.upNext.nextEpisode", { episode: temp.episode })}</div>
                        <div className="player-up-Next-text">{t("player.upNext.nextPlaying", { time: parseInt(timeNextEpisode.toString()) })}</div>
                    </div>
                    <button className="material-symbols-outlined player-up-Next-button-close" onClick={(event) => {
                        event.stopPropagation();
                        setHideUpNextEpisode(true);
                        setUpNextEpisode(false)
                    }
                    }>close</button>
                </motion.div>
            }
            {!config.Player.ui.DisableVolumeAnimation &&
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
                    currentHost={currentPlayer ? currentPlayer.hostname : "Unknown"}
                    currentResolution={currentResolution ? currentResolution.res : "Unknown"}
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