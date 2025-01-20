import { useContext, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify';
import Hls from "hls.js";

// utils
import { DeleteFromcontinue, SaveContinue } from '../utils/continueWatch'
import { configContext } from '../utils/context/small'
import { get_player_anime } from '../utils/backend'
import { SaveHistory } from '../utils/history'
import { notificationProps } from '@renderer/utils/interface';

// Components
import ContextMenu from '../components/elements/context-menu'
import CustomSlider from '@renderer/components/ui/customSlider';
import Button from '@renderer/components/ui/button';

// Context
import { closeDialog, dialogIsOpen, showDialog } from '@renderer/utils/context/DialogContext';

// css
import '../css/pages/player.css'

const Player = () => {
  const navigate = useNavigate()

  // Taking Data from location
  const { id, title, episodes, episode, time, img } = useLocation().state

  // Translation 
  const { t } = useTranslation()

  // Taking Config from context
  const config = useContext(configContext)

  // ref for html object
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const seekbar = useRef<HTMLDivElement | null>(null)
  const progressRef = useRef<HTMLDivElement | null>(null)
  const thumbRef = useRef<HTMLDivElement | null>(null)
  const showtimeRef = useRef<HTMLDivElement | null>(null)
  const hideTimer = useRef<NodeJS.Timeout | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Variable
  const [volume, setVolume] = useState<number>(0)

  // States
  const [isMuted, setMuted] = useState<boolean>(false)
  const [isShowTime, setShowTime] = useState<boolean>(false)
  const [isVisible, setIsVisible] = useState<boolean>(true)
  const [isWaitingPlayer, setWaitingPlayer] = useState<boolean>(true)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const [isPlayerDisable, setPLayerDisable] = useState<boolean>(true)
  const [isConfigLoad, setConfigLoad] = useState<boolean>(false)
  const [isAlwaysDisable, setisAlwaysDisable] = useState<boolean>(false)

  // Url
  const [ListUrls, setListUrls] = useState<{ url: string, res: string, hostname: string, hls: boolean }[]>([])
  const [playerUrl, setPlayerUrl] = useState<string | undefined>(undefined)
  const [currentHost, setHost] = useState<string>("")

  // Resolution
  const [ListResolution, setListResolution] = useState<number[]>([])
  const [currentResolution, setResolution] = useState<string | number>("")
  const [currentSettings, setcurrentSettings] = useState<string>("")

  // Up Next
  const [timeNextEpisode, setTimeNextEpisode] = useState<number>(30)
  const [isUpNextEpisode, setUpNextEpisode] = useState<boolean>(false)
  const [isHideUpNextEpisode, setHideUpNextEpisode] = useState<boolean>(false)

  // Others
  const [hls, setHls] = useState<Hls | null>(null);

  const menuItems = [{ label: t('contextMenu.reload'), onClick: () => location.reload() }]
  const buttons = [{ title: t('general.ok'), onClick: () => exitPlayer() }, { title: t('general.reload'), onClick: async () => {await setDataPlayer(); closeDialog() }}]

  const setDataPlayer = async () => {
    try {
      let recentData = await get_player_anime(id, episode)
      console.log(recentData)

      if (recentData.length == 0) showDialog({ header_text: t("errors.playerHeaderError"), text: t("errors.playerCantFind"), buttons: buttons })
      if (dialogIsOpen()) return

      if (recentData.length != 0 && playerUrl == undefined) {
        setListUrls(recentData)
        checkUrl(recentData[0])
        return
      }
    } catch (Error) {
      showDialog({ header_text: t("errors.playerHeaderError"), text: t('errors.extractionError', { error: Error }), buttons: buttons })
    }
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
        id: id,
        title: title,
        img: img,
        player: { episodes: episodes, episode: episode, time: videoRef.current.currentTime },
        text: t('general.LastContinue', { episode: episode.ep })
      })
    } else {
      DeleteFromcontinue({
        id: id,
        title: title,
        img: img,
        player: { episodes: episodes, episode: episode, time: videoRef.current.currentTime }
      })
    }
  }

  function checkUpNext() {
    // checking to show Up next communicat
    if (!config) return
    if (!videoRef.current) return
    const duration = videoRef.current.duration
    const currentTime = videoRef.current.currentTime

    if (duration != 0 && currentTime != 0 && isHideUpNextEpisode == false && episodes[episodes.indexOf(episode.ep) + 1] != null && currentTime > duration - parseInt(config.History.continue.MaximizeTimeSave.toString())) {
      setUpNextEpisode(true)
      setTimeNextEpisode(((parseInt(duration.toFixed(0)) - parseInt(config.History.continue.MaximizeTimeSave.toString())) - parseInt(currentTime.toFixed(0))) + 30)
    } else {
      setTimeNextEpisode(30)
      setUpNextEpisode(false)
    }
    
    if (duration != 0 && currentTime != 0 && (isHideUpNextEpisode == false && timeNextEpisode <= 0)) {
      setNewEpisode("next")
    }
  }

  // Checking config and player if load then set config to player and add event
  useEffect(() => {
    if (config && videoRef.current && isConfigLoad == false) {
      videoRef.current.currentTime = time

      setIsPlaying(config.Player.general.Autoplay)
      videoRef.current.autoplay = config.Player.general.Autoplay

      handleVolumeChange(parseInt(config.Player.general.Volume.toString()))
      if (config.Player.general.AutoFullscreen) enterFullscreen()
      setConfigLoad(true)
    }

    // set event to detect keyboard
    window.addEventListener('keydown', keybinds)
    return () => {
      window.removeEventListener('keydown', keybinds)
    }
  }, [config, videoRef.current, isPlayerDisable])

  useEffect(() => {
    SaveHistory({ id: id, img: img, title: title, text: t('general.LastWatch', { episode: episode.ep }) })
    setPLayerDisable(false)
    handleMouseMove()
    setDataPlayer()
  }, [])

  const formatTime = (seconds: number | undefined): string => {
    if (!seconds) return "0:00"
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`
  }

  const checkUrl = (data: { url: string, res: string, hostname: string, hls: boolean }) => {
    setPLayerDisable(false)
    if (data.hls) {
      runHLS(data.url)
      setHost(data.hostname)
      return
    }
    if (videoRef.current) {
      setResolution(data.res)
      setHost(data.hostname)
      videoRef.current.src = data.url
    }
  }

  const runHLS = (url: string) => {
    const hls = new Hls({
      capLevelToPlayerSize: true,
      enableWorker: true,
      liveSyncDurationCount: 3,
      maxBufferLength: 30,
    });

    if (Hls.isSupported() && videoRef.current) {
      hls.loadSource(url);
      hls.attachMedia(videoRef.current);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        const resolutions = data.levels.map((level) => level.height);
        setListResolution(resolutions)
        resolutions.reverse()
        setResolution(resolutions[0].toString())
      });

      setHls(hls)

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          let message: string
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              message = t('player.errors.MEDIA_ERR_NETWORK')
              hls.startLoad();
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
          if (ListUrls.length <= 1) {
            showDialog({ header_text: t("errors.playerHeaderError"), text: message, buttons: buttons })
            return
          }
          toast.error(message, notificationProps);
        }
      });
    }
  }

  const exitPlayer = async () => {
    closeDialog()
    if (config && config.General.Window.AutoFullscreen) {
      navigate('/')
      return
    }
    window.BrowserWindow.setFullscreen(false)
    navigate('/')
  }

  const updateProgress = () => {
    if (!videoRef.current) return
    saveContinueProgress()
    checkUpNext()

    // Update RPC
    window.api.rpc.setActivity(`${title} Episode ${episode.ep}`, `${formatTime(videoRef.current.currentTime)} / ${formatTime(videoRef.current.duration)}`)

    if (progressRef.current && thumbRef.current && isShowTime == false) {
      const percent = (videoRef.current.currentTime / videoRef.current.duration) * 100
      progressRef.current.style.width = `${percent}%`
      thumbRef.current.style.left = `${percent}%`
    }
  }

  const setMutedToPlayer = () => {
    if (isMuted) setMuted(false)
    else setMuted(true)
  }

  const togglePlay = () => {
    const video = videoRef.current
    if (video) {
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
  }

  const takeScreenshot = async () => {
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
      toast.error(t("toast.screenshotFail"), notificationProps);
      return
    }

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);
    const screenshot = canvasRef.current.toDataURL('image/png');

    if (screenshot == "data:,") {
      toast.error(t("toast.screenshotFail"), notificationProps);
      return
    }

    if (config.Player.screenShot.alwaysAsk) {
      var resp = await window.api.os.saveDialog(`${config.Player.screenShot.path}/screenshot${formatedDate}.png`, screenshot.replace(/^data:image\/png;base64,/, ''), `screenshot${formatedDate}.png`, "png", ["PNG"], "base64")
    } else {
      var resp = await window.api.os.write(`${config.Player.screenShot.path}/screenshot${formatedDate}.png`, screenshot.replace(/^data:image\/png;base64,/, ''), "base64")
    }
    if (resp) {
      toast.success(t("toast.screenshot", { path: config.Player.screenShot.path }), notificationProps);
      return;
    }
    toast.error(t("toast.screenshotFail"), notificationProps);
    return;
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value)

    if (videoRef.current) {
      videoRef.current.volume = value / 100
    }
  }

  // this is only for timeout
  const hideElement = () => setIsVisible(false)

  const handleMouseMove = () => {
    setIsVisible(true)
    if (hideTimer.current) {
      clearTimeout(hideTimer.current)
    }
    if (currentSettings == "") {
      hideTimer.current = setTimeout(hideElement, 2000)
    }
  }

  const clearPlayer = async () => {
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
    setPLayerDisable(true)
    setPlayerUrl(() => undefined)
    setWaitingPlayer(() => true)
    setHideUpNextEpisode(() => false)
    setUpNextEpisode(() => false)
    setTimeNextEpisode(() => 30)
    updateProgress()
  }

  const setNewEpisode = async (type: string) => {
    let ep = episodes.indexOf(episode.ep)
    if (type == 'prev') ep = ep - 1
    if (type == 'next') ep = ep + 1
    await clearPlayer()
    navigate('/player', {
      state: {
        id: id,
        title: title,
        episodes: episodes,
        episode: { type: episode.type, ep: episodes[ep] },
        img: img,
        time: 0
      }
    })
    setPLayerDisable(false)
    setDataPlayer()
    SaveHistory({ id: id, img: img, title: title, text: t('general.LastWatch', { episode: episode.ep }) })
  }

  const handleSeekBarMouseLeave = () => {
    setShowTime(false)
    if (videoRef.current && progressRef.current && thumbRef.current) {
      const percent = (videoRef.current.currentTime / videoRef.current.duration) * 100
      progressRef.current.style.width = `${percent}%`
      thumbRef.current.style.left = `${percent}%`
    }
  }

  const enterFullscreen = async () => {
    if (await window.BrowserWindow.isFullscreen()) {
      window.BrowserWindow.setFullscreen(false)
      setIsFullscreen(false)
    } else {
      window.BrowserWindow.setFullscreen(true)
      setIsFullscreen(true)
    }
  }

  const change_time = (time: number) => {
    if (!videoRef.current) return

    if (isPlaying) {
      togglePlay()
      videoRef.current.currentTime = time
      togglePlay()
    } else videoRef.current.currentTime = time
  }

  const videoErrorHandler = (event: React.SyntheticEvent<HTMLVideoElement, Event>) => {
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
      if (ListUrls.length <= 1) {
        showDialog({ header_text: t("errors.playerHeaderError"), text: message, buttons: buttons })
        return
      }
      toast.error(message, notificationProps);
    }
  }

  const handleSeekBarClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setWaitingPlayer(true)
    const seekBar = seekbar.current
    const video = videoRef.current

    if (seekBar && video) {
      const rect = seekBar.getBoundingClientRect()
      const offsetX = event.clientX - rect.left
      const totalWidth = rect.width
      const percent = offsetX / totalWidth
      const newTime = percent * video.duration
      if (!isNaN(newTime) && config && newTime > video.duration - parseInt(config.History.continue.MaximizeTimeSave.toString())) {
        setHideUpNextEpisode(true)
      }

      if (!isNaN(newTime)) video.currentTime = newTime
    }
  }

  const changeVolume = (value: number) => {
    if (!videoRef.current) return

    if (value >= 0 && value <= 1) {
      videoRef.current.volume = value
      setVolume(value)
    }
  }

  const handleSeekBarMouseMove = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const seekBar = seekbar.current
    const video = videoRef.current
    const showtime = showtimeRef.current
    if (seekBar && video && showtime && progressRef.current && thumbRef.current) {
      const rect = seekBar.getBoundingClientRect()
      const offsetX = event.clientX - rect.left
      const totalWidth = rect.width
      const percent = offsetX / totalWidth
      const newTime = percent * video.duration
      if (!isNaN(newTime) && newTime > 0 && video.duration > newTime) {
        setShowTime(true)
        showtime.innerHTML = formatTime(newTime)
        showtime.style.left = `${percent * 96.5}%`
        progressRef.current.style.width = `${percent * 100}%`
        thumbRef.current.style.left = `${percent * 100}%`
      }
    }
  }

  const keybinds = async (event: KeyboardEvent) => {
    if (videoRef.current && config) {
      var time_now = videoRef.current.currentTime
      console.log(event.key.toLowerCase())
      switch (event.key.toLowerCase()) {
        case config.Player.keybinds.Pause.toLowerCase():
          togglePlay()
          break
        case config.Player.keybinds.TimeSkipRight.toLowerCase():
          change_time((time_now += parseInt(config.Player.general.TimeSkipRight.toString())))
          break
        case config.Player.keybinds.TimeSkipLeft.toLowerCase():
          change_time((time_now -= parseInt(config.Player.general.TimeSkipLeft.toString())))
          break
        case config.Player.keybinds.LongTimeSkipForward.toLowerCase():
          change_time((time_now += parseInt(config.Player.general.LongTimeSkipForward.toString())))
          break
        case config.Player.keybinds.LongTimeSkipBack.toLowerCase():
          change_time((time_now -= parseInt(config.Player.general.LongTimeSkipBack.toString())))
          break
        case config.Player.keybinds.Fullscreen.toLowerCase():
          await enterFullscreen()
          break
        case config.Player.keybinds.ExitPlayer.toLowerCase():
          exitPlayer()
          break
        case config.Player.keybinds.FrameSkipForward.toLowerCase():
          setisAlwaysDisable(true)
          change_time((time_now += 0.0416))
          setisAlwaysDisable(false)
          break
        case config.Player.keybinds.FrameSkipBack.toLowerCase():
          setisAlwaysDisable(true)
          change_time((time_now -= 0.0416))
          setisAlwaysDisable(false)
          break
        case config.Player.keybinds.VolumeDown.toLowerCase():
          changeVolume(videoRef.current.volume - 0.01)
          break
        case config.Player.keybinds.VolumeUp.toLowerCase():
          changeVolume(videoRef.current.volume + 0.01)
          break
        case config.Player.keybinds.ScreenShot.toLowerCase():
          takeScreenshot()
          break
        case config.Player.keybinds.VolumeMute.toLowerCase():
          break
      }
    }
  }

  // i made this shitty function because my friend has a problem making screen shot when change frame using keybind :(
  const setWaiting = (data: boolean) => {
    if (isAlwaysDisable) {
      setWaitingPlayer(false)
      return
    }
    setWaitingPlayer(data)
  }

  function setSettings(settings: string) {
    if (settings == currentSettings) {
      setcurrentSettings("")
      handleMouseMove()
      return
    }
    setcurrentSettings(settings)
    handleMouseMove()
  }

  function setSpeed(speed: string) {
    if (!videoRef.current) return
    videoRef.current.playbackRate = parseFloat(speed)
    setSettings("settings")
  }

  function setRes(res: number | undefined) {
    if (res && hls) {
      hls.currentLevel = hls.levels.findIndex(level => level.height === res);
      setResolution(res)
    }
  }

  return (
    <div className={isVisible ? "video-container" : "video-container player-hide-cursor"} ref={containerRef} onMouseMove={handleMouseMove}>
      <ContextMenu items={menuItems} />
      {isPlayerDisable ? (
        ''
      ) : (
        <video
          ref={videoRef}
          className={isVisible ? 'video-player mask' : 'video-player'}
          onTimeUpdate={updateProgress}
          onClick={() => { togglePlay(); setcurrentSettings("") }}
          autoPlay={isPlaying}
          onError={(error) => videoErrorHandler(error)}
          preload={config?.Player.general.playerLoadType}
          muted={isMuted}
          onCanPlay={() => setWaiting(false)}
          onWaiting={() => setWaiting(true)}
        />
      )}

      <div className="video-overlay">
        <div className={isUpNextEpisode == false ? isVisible ? 'video-top' : 'video-top player-hidden' : 'video-top'}>
          <Button value='arrow_back' className='material-symbols-outlined player-buttons' onClick={async () => await exitPlayer()} />
          <div className="player-title ">{t('player.TitleEpisode', { ep: episode.ep, name: title })}</div>
        </div>
        <div
          className={
            "video-center " + (isWaitingPlayer ? '' : 'player-hidden')
          }
        >
          <div className="player-waiting material-symbols-outlined">progress_activity</div>
        </div>
        <div className={isVisible && isUpNextEpisode == false ? 'video-bottom' : 'video-bottom player-hidden'}>
          <div className={isShowTime && isUpNextEpisode == false ? 'show-time' : 'show-time player-hidden'} ref={showtimeRef}></div>
          <div className="seek-bar-container">
            <div
              className="seek-bar"
              ref={seekbar}
              onClick={handleSeekBarClick}
              onMouseMove={(event) => handleSeekBarMouseMove(event)}
              onMouseLeave={() => handleSeekBarMouseLeave()}
            >
              <div className="progress" ref={progressRef}></div>
              <div className="thumb" ref={thumbRef} />
            </div>
          </div>
          <div className="bottom-section">
            <div className="left">
              {episodes[episodes.indexOf(episode.ep) - 1] == undefined
                ? "" :
                (
                  <Button value='skip_previous' title={
                    episodes[episodes.indexOf(episode.ep) - 1] == undefined
                      ? ''
                      : t('player.previous', { ep: episodes[episodes.indexOf(episode.ep) - 1] })
                  }
                    onClick={async () => await setNewEpisode('prev')}
                    className="material-symbols-outlined player-buttons" />
                )
              }
              {isPlaying ?
                <Button value='pause' title={t('player.Pause')} className="material-symbols-outlined player-buttons" onClick={togglePlay} /> :
                <Button value='play_arrow' title={t('player.play')} className="material-symbols-outlined player-buttons" onClick={togglePlay} />
              }
              {episodes[episodes.indexOf(episode.ep) + 1] == undefined
                ? "" :
                (
                  <Button value='skip_next' className='material-symbols-outlined player-buttons' title={episodes[episodes.indexOf(episode.ep) + 1] == undefined
                    ? ''
                    : t('player.next', { ep: episodes[episodes.indexOf(episode.ep) + 1] })
                  } onClick={async () => await setNewEpisode('next')} />
                )
              }
              <div className="time-display">
                {formatTime(videoRef.current?.currentTime)} / {formatTime(videoRef.current?.duration)}
              </div>
            </div>
            <div className="right">
              <button
                className="backlight material-symbols-outlined player-buttons volume-button"
                title={t('player.Volume')}
                onClick={setMutedToPlayer}
              >
                {isMuted ? 'volume_off' : 'volume_up'}
              </button>
              {isConfigLoad && (
                <CustomSlider min={0} max={100} step={1} current={volume} size={200} onValueChange={handleVolumeChange} />
              )}
              {currentSettings == "settings" && (
                <div className="player-settings-container">
                  {ListUrls.length <= 1 ? (
                    <div className="player-settings-button">
                      <span className='player-settings-button-text' style={{ color: "gray" }} >Urls</span> <span style={{ color: "gray" }}>{currentHost}</span>
                    </div>
                  ) : (
                    <div className="player-settings-button" onClick={() => setSettings("urls")}>
                      <span className='player-settings-button-text'>Urls</span> <span>{currentHost}</span>
                    </div>
                  )}
                  {ListResolution.length <= 1 ? (
                    <div className="player-settings-button">
                      <span className='player-settings-button-text' style={{ color: "gray" }}>Resolution</span> <span style={{ color: "gray" }}>{currentResolution.toString().length >= 1 ? currentResolution + "p" : ""}</span>
                    </div>
                  ) : (
                    <div className="player-settings-button" onClick={() => setSettings("resolution")}>
                      <span className='player-settings-button-text'>Resolution</span> <span>{currentResolution.toString().length >= 1 ? currentResolution + "p" : ""}</span>
                    </div>
                  )}
                  <div className="player-settings-button" onClick={() => setSettings("speed")}>
                    <span className='player-settings-button-text'>Speed</span> <span>{videoRef.current?.playbackRate}</span>
                  </div>
                </div>
              )}
              {currentSettings == "urls" && (
                <div className='player-settings-container'>
                  <div className="player-settings-button-back" onClick={() => setSettings("settings")}>
                    <span className="material-symbols-outlined">arrow_back</span><span>Urls</span>
                  </div>
                  {ListUrls.map((data) => (
                    <div className="player-settings-button" onClick={() => checkUrl(ListUrls[ListUrls.findIndex((item) => item.hostname === data.hostname)])}>
                      <span>{data.hostname}</span>
                    </div>
                  ))}
                </div>
              )}
              {currentSettings == "resolution" && (
                <div className='player-settings-container'>
                  <div className="player-settings-button-back" onClick={() => setSettings("settings")}>
                    <span className="material-symbols-outlined">arrow_back</span><span>Resolution</span>
                  </div>
                  {ListResolution.map((data) => (
                    <div className="player-settings-button" onClick={() => { setcurrentSettings(data.toLocaleString()); setRes(data) }}>
                      <span>{data.toString() + "p"}</span>
                    </div>
                  ))}
                </div>
              )}
              {currentSettings == "speed" && (
                <div className='player-settings-container'>
                  <div className="player-settings-button-back" onClick={() => setSettings("settings")}>
                    <span className="material-symbols-outlined">arrow_back</span><span>Speed</span>
                  </div>
                  <div className="player-settings-button" onClick={() => setSpeed("0.25")}>
                    <span>0.25</span>
                  </div>
                  <div className="player-settings-button" onClick={() => setSpeed("0.5")}>
                    <span>0.5</span>
                  </div>
                  <div className="player-settings-button" onClick={() => setSpeed("0.75")}>
                    <span>0.75</span>
                  </div>
                  <div className="player-settings-button" onClick={() => setSpeed("1")}>
                    <span>1</span>
                  </div>
                  <div className="player-settings-button" onClick={() => setSpeed("1.25")}>
                    <span>1.25</span>
                  </div>
                  <div className="player-settings-button" onClick={() => setSpeed("1.5")}>
                    <span>1.5</span>
                  </div>
                  <div className="player-settings-button" onClick={() => setSpeed("1.75")}>
                    <span>1.75</span>
                  </div>
                  <div className="player-settings-button" onClick={() => setSpeed("2")}>
                    <span>2</span>
                  </div>
                </div>
              )}
              <button
                className="backlight material-symbols-outlined player-buttons"
                title={t('sidebar.settings')}
                onClick={() => setSettings("settings")}>
                settings
              </button>
              <button
                onClick={async () => await enterFullscreen()}
                className="backlight material-symbols-outlined player-buttons"
                title={t('settings.player.Fullscreen')}
              >
                {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {isUpNextEpisode ? (
        <div className="up-Next-container">
          <div className="up-Next-Title">{t("player.upNext.title", { sec: parseInt(timeNextEpisode.toString()) })}</div>
          <div className="up-Next-Anime">{t("player.upNext.titleAnime", { ep: episodes[episodes.indexOf(episode.ep) + 1], title: title })}</div>
          <div className="up-Next-Buttons">
            <Button value={t("player.upNext.nextEp")} className='up-Next-Button' onClick={() => setNewEpisode("next")}/>
            <Button value={t("player.upNext.hide")} className='up-Next-Button' onClick={() => {setHideUpNextEpisode(true); setUpNextEpisode(false)}} />
          </div>
        </div>
      ) : ""}
    </div>
  )
}

export default Player
