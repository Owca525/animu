import { lazy, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"

// utils
import { closeDialog } from "@renderer/utils/context/DialogContext"

// Components
import NerdStats from "./components/nerdStats"
const DeveloperStats = lazy(() => import('./components/developerStats'));

// css
import { cardData, ContextMenuProps, notificationProps, playerData, SettingsConfig } from "@renderer/utils/GlobalInterface"
import { useSelector } from "react-redux"
import { convertKeybinds, CreateContextMenuOptions, detectTitle, formatTime, refetchHistory } from "@renderer/utils/functions"
import Button from "@renderer/components/buttons"
import SeekBar from "@renderer/components/seekBar"
import { DeleteFromContinue, SaveContinue } from "@renderer/utils/history/continueWatch"
import useKeyPress from "@renderer/utils/hooks/useKeyPress"
import { OpenContextMenu } from "@renderer/utils/context/ContextMenu"
import PlayerSettings from "./components/PlayerSettings"
import PlayerButton from "./components/PlayerButton"

const speed: Array<string> = ["0.25", "0.5", "0.75", "1", "1.25", "1.50", "1.75", "2"]

interface VideoPlayerProps {
    player_data: playerData[]
    anime_data: cardData
    temp: { episode: string, type: string, episodes: Array<string> }
    functions: {
        prevButton: (value: "prev") => void
        nextButton: (value: "next") => void
    }
    volumeCacheFunc: (value: number) => void
    PlayerVolume: number
    time: number
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ player_data, anime_data, temp, functions, volumeCacheFunc, PlayerVolume, time }) => {
    const navigate = useNavigate()
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
    // const [duration, setduration] = useState<number>(0)
    const [currentTime, setcurrentTime] = useState<number>(0)

    // States
    const [isMuted, setMuted] = useState<boolean>(false)
    const [isVisible, setIsVisible] = useState<boolean>(true)
    const [isWaitingPlayer, setWaitingPlayer] = useState<boolean>(true)
    const [isPlaying, setIsPlaying] = useState<boolean>(config.Player.general.Autoplay)
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false)

    // Resolution
    const [ListResolution, setListResolution] = useState<number[]>([])
    const [currentResolution, setResolution] = useState<string | number>("")

    // url
    const [currentHost, setHost] = useState<string>("")

    // Up Next
    const [timeNextEpisode, setTimeNextEpisode] = useState<number>(30)
    const [isUpNextEpisode, setUpNextEpisode] = useState<boolean>(false)
    const [isHideUpNextEpisode, setHideUpNextEpisode] = useState<boolean>(false)

    // other
    const [currentSettings, setcurrentSettings] = useState<boolean>(false)
    const [showNerdStats, setshowNerdStats] = useState<boolean>(false)
    const [hls, setHls] = useState<any>(null);

    function handleMouseMove() {
        setIsVisible(true)
        if (hideTimer.current) {
            clearTimeout(hideTimer.current)
        }
        if (currentSettings == false) {
            hideTimer.current = setTimeout(() => setIsVisible(false), 2000)
        }
    }

    useEffect(() => {
        // import("../../utils/filesMange/history").then(({ SaveHistory }) => SaveHistory({ id: id, img: img, title: title, text: t('general.LastWatch', { episode: episode.ep }) }))
        checkUrl(player_data[0])
        handleVolume(PlayerVolume)
        handleMouseMove()
        if (config.Player.general.AutoFullscreen) {
            window.BrowserWindow.setFullscreen(true)
            setIsFullscreen(true)
        }
        if (videoRef.current) videoRef.current.currentTime = time
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

    function setRes(res: number | undefined) {
        if (res && hls) {
            setResolution(res)
            hls.currentLevel = hls.levels.findIndex(level => level.height === res);
        }
    }

    function setNewUrl(host: string) {
        if (player_data.length <= 1) return
        const value = player_data.findIndex((value) => value.hostname == host)
        if (value < 0) return
        if (player_data[value + 1] == undefined) return
        checkUrl(player_data[value + 1])
    }

    async function checkUrl(data: playerData) {
        if (!videoRef.current) return
        const time = videoRef.current.currentTime
        if (data.hls) {
            setHost(() => data.hostname)
            await runHLS(data.resolution[0].url, data.hostname)
            return
        }
        if (hls) hls.destroy()

        setResolution(data.resolution[0].res)
        setListResolution(() => [parseInt(data.resolution[0].res)])
        setHost(data.hostname)
        videoRef.current.src = data.resolution[0].url
        videoRef.current.currentTime = time
    }

    async function runHLS(url: string, host: string) {
        const hlsModule = (await import('hls.js')).default;

        const hls = new hlsModule({
            maxBufferLength: 30,
        });

        if (hlsModule.isSupported() && videoRef.current) {
            const time = videoRef.current.currentTime
            hls.loadSource(url);
            hls.attachMedia(videoRef.current);

            videoRef.current.currentTime = time

            setHls(hls)

            hls.on(hlsModule.Events.MANIFEST_PARSED, (_, data) => {
                const resolutions = data.levels.map((level) => level.height);
                setListResolution(resolutions)
                resolutions.reverse()
                setRes(resolutions[0])
                setResolution(resolutions[0])
            });

            hls.on(hlsModule.Events.ERROR, (_event, data) => {
                if (data.fatal) {
                    let message: string
                    switch (data.type) {
                        case hlsModule.ErrorTypes.NETWORK_ERROR:
                            message = t('player.errors.MEDIA_ERR_NETWORK')
                            hls.destroy()
                            setNewUrl(host)
                            // hls.startLoad();
                            break;
                        case hlsModule.ErrorTypes.MEDIA_ERROR:
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

    function handleVolume(value: number) {
        if (!videoRef.current) return
        videoRef.current.volume = value / 100
        setVolume(() => value)
        volumeCacheFunc(value)
    }

    function togglePlay() {
        const video = videoRef.current
        if (!video) return
        setIsPlaying((prevIsPlaying: boolean) => {
            if (prevIsPlaying) {
                video.pause()
                return false
            } else {
                video.play()
                return true
            }
        })
    }

    function setMutedToPlayer() {
        if (isMuted) setMuted(false)
        else setMuted(true)
    }

    async function exitPlayer() {
        closeDialog()
        if (config && config.General.Window.AutoFullscreen) {
            navigate('/')
            return
        }
        window.BrowserWindow.setFullscreen(false)
        navigate('/')
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
                    pluginName: "",
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

    function updateProgress() {
        if (!videoRef.current) return
        saveContinueProgress()
        setcurrentTime(videoRef.current.currentTime)
        checkUpNext()

        // Update RPC
        window.api.rpc.setActivity(t("discordrpc.player", { title: anime_data.AnimeData.title.romaji, ep: temp.episode }), `${formatTime(videoRef.current.currentTime)} / ${formatTime(videoRef.current.duration)}`)
        if (config.Player.general.AutoSkipEpisode && videoRef.current.duration == videoRef.current.currentTime) functions.nextButton("next")
    }

    function checkUpNext() {
        // checking to show Up next communicat
        if (!config) return
        if (!videoRef.current) return
        const duration = videoRef.current.duration
        const currentTime = videoRef.current.currentTime

        if (duration != 0 && currentTime != 0 && isHideUpNextEpisode == false && temp.episodes[temp.episodes.indexOf(temp.episode) + 1] != null && currentTime > duration - parseInt(config.History.continue.MaximizeTimeSave.toString())) {
            setUpNextEpisode(true)
            setTimeNextEpisode(((parseInt(duration.toFixed(0)) - parseInt(config.History.continue.MaximizeTimeSave.toString())) - parseInt(currentTime.toFixed(0))) + 30)
        } else {
            setTimeNextEpisode(30)
            setUpNextEpisode(false)
        }

        if (duration != 0 && currentTime != 0 && (isHideUpNextEpisode == false && timeNextEpisode <= 0)) functions.nextButton("next")
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

        if (isPlaying) {
            togglePlay()
            videoRef.current.currentTime = time
            togglePlay()
        } else videoRef.current.currentTime = time
    }

    useKeyPress((keys: string) => {
        if (keys == "CTRL+SHIFT+D") {
            setshowNerdStats((prev) => !prev)
        }
        keybinds(keys)
    })
    async function keybinds(event: string) {
        if (videoRef.current) {
            var time_now = videoRef.current.currentTime
            switch (event.toLowerCase()) {
                case convertKeybinds(config.Player.keybinds.Pause.toLowerCase()).toLowerCase():
                    togglePlay()
                    break
                case convertKeybinds(config.Player.keybinds.TimeSkipRight.toLowerCase()).toLowerCase():
                    change_time((time_now += parseInt(config.Player.general.TimeSkipRight.toString())))
                    break
                case convertKeybinds(config.Player.keybinds.TimeSkipLeft.toLowerCase()).toLowerCase():
                    change_time((time_now -= parseInt(config.Player.general.TimeSkipLeft.toString())))
                    break
                case convertKeybinds(config.Player.keybinds.LongTimeSkipForward.toLowerCase()).toLowerCase():
                    change_time((time_now += parseInt(config.Player.general.LongTimeSkipForward.toString())))
                    break
                case convertKeybinds(config.Player.keybinds.LongTimeSkipBack.toLowerCase()).toLowerCase():
                    change_time((time_now -= parseInt(config.Player.general.LongTimeSkipBack.toString())))
                    break
                case convertKeybinds(config.Player.keybinds.Fullscreen.toLowerCase()).toLowerCase():
                    await enterFullscreen()
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
                    functions.nextButton("next")
                    break
                case convertKeybinds(config.Player.keybinds.PrevEpisode.toLowerCase()).toLowerCase():
                    functions.prevButton("prev")
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

    return (
        <div className={isVisible ? "player-video-container" : "player-video-container player-hide-cursor"} ref={containerRef} onMouseMove={handleMouseMove} onContextMenu={(event) => OpenContextMenu(CreateContextMenuOptions(undefined, centerContextMenu), event)}>
            <video
                ref={videoRef}
                className={isVisible ? 'video-player player-mask' : 'video-player'}
                onTimeUpdate={updateProgress}
                onClick={() => { togglePlay(); setcurrentSettings(() => false) }}
                autoPlay={isPlaying}
                onWaiting={() => { setWaitingPlayer(() => true) }}
                onCanPlay={() => { setWaitingPlayer(() => false) }}
                onError={(error) => videoErrorHandler(error)}
                preload={config?.Player.general.playerLoadType}
                muted={isMuted}
            />

            <div className="video-overlay">
                <div className={isUpNextEpisode == false ? isVisible ? 'video-top' : 'video-top player-hidden' : 'video-top'}>
                    <Button icon='arrow_back' ButtonClass='player-buttons' onClick={async () => await exitPlayer()} />
                    <div className="player-title ">{detectTitle({
                        ...anime_data, ...anime_data.saveData, saveData: {
                            episode: temp.episode,
                            pluginName: "",
                            last_Time: 0,
                            type: ""
                        }
                    })}</div>
                </div>
                <div
                    className={
                        "video-center " + (isWaitingPlayer ? '' : 'player-hidden')
                    }>
                    <div className="player-loading-animation-container">
                        <div className="player-waiting material-symbols-outlined">progress_activity</div>
                    </div>
                </div>
                <div className={isVisible && isUpNextEpisode == false ? 'video-bottom' : 'video-bottom player-hidden'}>
                    <SeekBar currentValue={currentTime} maxValue={videoRef.current?.duration} onSeek={value => setTimeVideo(value)} type="time" classes={{ container: "player-seekbar" }} screen={true} />
                    <div className="player-bottom-section">
                        <div className="player-left">
                            {temp.episodes[temp.episodes.indexOf(temp.episode) - 1] !== undefined &&
                                <PlayerButton title={t('player.previous', { ep: temp.episodes[temp.episodes.indexOf(temp.episode) - 1] })} icon='skip_previous'
                                    onClick={() => functions.prevButton("prev")}
                                    ButtonClass="player-buttons" />
                            }
                            <PlayerButton icon={isPlaying ? "pause" : "play_arrow"} title={isPlaying ? t('player.Pause') : t('player.play')} ButtonClass="player-buttons" onClick={togglePlay} />
                            {temp.episodes[temp.episodes.indexOf(temp.episode) + 1] !== undefined &&
                                <PlayerButton icon='skip_next' ButtonClass='material-symbols-outlined player-buttons' title={t('player.next', { ep: temp.episodes[temp.episodes.indexOf(temp.episode) + 1] })} onClick={() => functions.nextButton("next")} />
                            }
                            <div className="player-time-display">
                                {formatTime(currentTime)} / {formatTime(videoRef.current?.duration)}
                            </div>
                        </div>
                        <div className="player-right">
                            <PlayerButton icon={isMuted ? 'volume_off' : 'volume_up'} title={t('player.Volume')} ButtonClass="player-buttons volume-button" onClick={setMutedToPlayer} />
                            <div className="player-volume-seek">
                                {volume && (
                                    <SeekBar currentValue={volume} maxValue={100} onSeek={value => handleVolume(value)} classes={{ container: "player-seekbar" }} />
                                )}
                            </div>
                            <PlayerButton icon={"video_library"} title={currentSettings == false ? "Select Episode" : undefined} ButtonClass="player-buttons" />
                            {currentSettings &&
                                <PlayerSettings
                                    sources={
                                        player_data.map((val) => { return { name: val.hostname, change: () => checkUrl(player_data[player_data.findIndex((item) => item.hostname === val.hostname)]) } })
                                    }
                                    resolution={
                                        ListResolution.map((val) => { return { res: val, change: () => setRes(val) } })
                                    }
                                    speed={speed.map((val) => { return { speed: parseFloat(val), change: () => setSpeed(val) } })}
                                    disableSettings={function (): void {
                                        throw new Error("Function not implemented.")
                                    }} current={{
                                        currentHost: currentHost,
                                        currentResolution: currentResolution,
                                        currentSpeed: videoRef.current?.playbackRate ? videoRef.current?.playbackRate : 1
                                    }}
                                />
                            }
                            <PlayerButton icon="settings" ButtonClass="player-buttons" title={currentSettings == false ? t('global.settings') : undefined} onClick={() => setcurrentSettings((prev) => !prev)} />
                            <PlayerButton icon={isFullscreen ? 'fullscreen_exit' : 'fullscreen'} ButtonClass="player-buttons" title={currentSettings == false ? t('player.fullscreen') : undefined} onClick={async () => await enterFullscreen()} />
                        </div>
                    </div>
                </div>
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            {isUpNextEpisode ? (
                <div className="player-up-Next-container">
                    <div className="player-up-Next-Title">{t("player.upNext.title", { sec: parseInt(timeNextEpisode.toString()) })}</div>
                    <div className="player-up-Next-Anime">{t("player.upNext.titleAnime", { ep: temp.episodes[temp.episodes.indexOf(temp.episode) + 1], title: anime_data.AnimeData.title.romaji })}</div>
                    <div className="player-up-Next-Buttons">
                        <Button content={t("player.upNext.nextEp")} ButtonClass='player-up-Next-Button' onClick={() => functions.nextButton("next")} />
                        <Button content={t("player.upNext.hide")} ButtonClass='player-up-Next-Button' onClick={() => { setHideUpNextEpisode(true); setUpNextEpisode(false) }} />
                    </div>
                </div>
            ) : ""}
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
                    ListResolution={ListResolution}
                    currentHost={currentHost}
                    currentResolution={currentResolution}
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