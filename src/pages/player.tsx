import { useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { info, error } from '@tauri-apps/plugin-log';
import { useTranslation } from "react-i18next";

// utils
import { DeleteFromcontinue, SaveContinue } from "../utils/continueWatch";
import { configContext } from "../utils/context";
import { get_player_anime } from "../utils/backend";

// Components
import Dialog from "../components/dialogs/dialog";
import ContextMenu from "../components/elements/context-menu";

import "../css/pages/player.css";
import { SaveHistory } from "../utils/history";

const Player = () => {
  const Currentlocation = useLocation();
  const navigate = useNavigate();

  const { id, title, episodes, ep, time, img } = Currentlocation.state;

  const {t} = useTranslation();

  // Loading Config from context
  const config = useContext(configContext);

  // ref for html object
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const seekbar = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const thumbRef = useRef<HTMLDivElement | null>(null);
  const showtimeRef = useRef<HTMLDivElement | null>(null);
  const hideTimer = useRef<NodeJS.Timeout | null>(null);

  // Variable
  const [volume, setVolume] = useState<number>(0.1);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  const [isMuted, setMuted] = useState<boolean>(false);
  const [isShowTime, setShowTime] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isWaitingPlayer, setWaitingPlayer] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const [playerUrl, setPlayerUrl] = useState<string | undefined>(undefined);
  const [isError, setErrorDialog] = useState({ error: false, information: "" });

  const menuItems = [
    { label: t("contextMenu.reload"), onClick: () => location.reload() }
  ];

  const setDataPlayer = async () => {
    try {
      const recentData = await get_player_anime(id, ep);
      setPlayerUrl(recentData["players"][0]);
      info(`Player url: ${recentData["players"][0]}`)
    } catch (Error) {
      error("Extraction Urls: " + Error)
      setErrorDialog({
        error: true,
        information: t("errors.extractionError", { error: Error }),
      });
    } finally {}
  };

  useEffect(() => {
    setDataPlayer();
  }, [ep])

  // Saving history
  useEffect(() => {
    setWaitingPlayer(false)
    if (config && videoRef.current && currentTime >= parseInt(config.History.continue.MinimalTimeSave.toString()) && currentTime <= (duration - parseInt(config.History.continue.MaximizeTimeSave.toString()))) {
      SaveContinue({ id: id, title: title, img: img, player: { episodes: episodes, episode: ep, time: currentTime } })
    } else {
      DeleteFromcontinue({ id: id, title: title, img: img, player: { episodes: episodes, episode: ep, time: currentTime } })
    }
  }, [currentTime])

  // Checking config and player if load then set config to player and add event
  useEffect(() => {
    if (config && videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time)

      setIsPlaying(config.Player.general.Autoplay)
      videoRef.current.autoplay = config.Player.general.Autoplay;
      videoRef.current.volume = parseInt(config.Player.general.Volume.toString()) / 100
      setVolume(parseInt(config.Player.general.Volume.toString()) / 100)
      getCurrentWindow().setFullscreen(config.Player.general.AutoFullscreen)
    }

    // set event to detect keyboard
    window.addEventListener("keydown", keybinds);
    return () => {
      window.removeEventListener("keydown", keybinds);
    };
  }, [config, videoRef.current])

  useEffect(() => {
    SaveHistory({ id: id, img: img, title: title })
  }, [])

  const showElement = () => {
    setIsVisible(true);
  };

  const hideElement = () => {
    setIsVisible(false);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const exitPlayer = async () => {
    if (config && config.General.Window.AutoFullscreen) {
      navigate("/");
      return
    }
    await getCurrentWindow().setFullscreen(false);
    navigate("/");
  }

  const updateProgress = () => {
    if (videoRef.current) {
      const percent = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setCurrentTime(videoRef.current.currentTime);

      if (progressRef.current && thumbRef.current && isShowTime == false) {
        progressRef.current.style.width = `${percent}%`;
        thumbRef.current.style.left = `${percent}%`;
      }
    }
  };

  const setMutedToPlayer = () => {
    if (isMuted) {
      setMuted(false)
    } else {
      setMuted(true)
    }
  }

  const togglePlay = () => {
    const video = videoRef.current;
    if (video) {
      setIsPlaying((prevIsPlaying: boolean) => {
        if (prevIsPlaying) {
          video.pause();
          return false;
        } else {
          video.play().catch((Error) => error("Error with playing video: " + Error));
          return true;
        }
      });
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);

    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handleMouseMove = () => {
    showElement();
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }
    hideTimer.current = setTimeout(hideElement, 2000);
  };

  const clearPlayer = () => {
    if (videoRef.current && progressRef.current && thumbRef.current){
      progressRef.current.style.width = `0%`;
      thumbRef.current.style.left = `0%`;
      setPlayerUrl(undefined)
      videoRef.current.pause()
      setWaitingPlayer(true)
      setDuration(0)
      setCurrentTime(0)
      updateProgress()
    }
  }

  const setNewEpisode = (type: string) => {
    var episode = episodes.indexOf(ep)
    // console.log("before", episode, episodes[episode])
    if (type == "prev") {
      episode = episode - 1
    }
    if (type == "next") {
      episode = episode + 1
    }
    // console.log("after", episode, episodes[episode])
    // console.log("before", playerUrl, duration, currentTime)
    clearPlayer()
    // console.log("after", playerUrl, duration, currentTime)
    navigate("/player", {
      state: {
        id: id,
        title: title,
        episodes: episodes,
        ep: episodes[episode],
      },
    });
    setDataPlayer();
  };

  const handleSeekBarMouseLeave = () => {
    setShowTime(false);
    if (videoRef.current && progressRef.current && thumbRef.current) {
      const percent = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      progressRef.current.style.width = `${percent}%`;
      thumbRef.current.style.left = `${percent}%`;
    }
  };

  const enterFullscreen = async () => {
    if (await getCurrentWindow().isFullscreen()) {
      await getCurrentWindow().setFullscreen(false);
      setIsFullscreen(false);
    } else {
      await getCurrentWindow().setFullscreen(true);
      setIsFullscreen(true);
    }
  };


  const change_time = (time: number) => {
    if (videoRef.current) {
      if (isPlaying) {
        togglePlay();
        videoRef.current.currentTime = time;
        togglePlay();
      } else {
        videoRef.current.currentTime = time;
      }
    }
  };

  const videoErrorHandler = (event: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const Error = event.currentTarget.error;
    var message: string;

    if (Error) {
      switch (Error.code) {
        case Error.MEDIA_ERR_ABORTED:
          message = t("player.errors.MEDIA_ERR_ABORTED");
          break;
        case Error.MEDIA_ERR_NETWORK:
          message = t("player.errors.MEDIA_ERR_NETWORK");
          break;
        case Error.MEDIA_ERR_DECODE:
          message = t("player.errors.MEDIA_ERR_DECODE");
          break;
        case Error.MEDIA_ERR_SRC_NOT_SUPPORTED:
          message = t("player.errors.MEDIA_ERR_SRC_NOT_SUPPORTED");
          break;
        default:
          message = t("player.errors.default");
      }
      error("Error player: " + message)
      setErrorDialog({ error: true, information: message });
    }
  };

  const handleSeekBarClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const seekBar = seekbar.current;
    const video = videoRef.current;
    if (seekBar && video) {
      const rect = seekBar.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const totalWidth = rect.width;
      const percent = offsetX / totalWidth;
      const newTime = percent * video.duration;
      if (!isNaN(newTime)) {
        video.currentTime = newTime;
        setCurrentTime(newTime);
      }
    }
  };

  const handleSeekBarMouseMove = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const seekBar = seekbar.current;
    const video = videoRef.current;
    const showtime = showtimeRef.current;
    if (seekBar && video && showtime && progressRef.current && thumbRef.current) {
      const rect = seekBar.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const totalWidth = rect.width;
      const percent = offsetX / totalWidth;
      const newTime = percent * video.duration;
      if (!isNaN(newTime) && newTime > 0) {
        setShowTime(true);
        showtime.innerHTML = formatTime(newTime);
        showtime.style.left = `${percent * 96.5}%`;
        progressRef.current.style.width = `${percent * 100}%`;
        thumbRef.current.style.left = `${percent * 100}%`;
      }
    }
  };

  const keybinds = async (event: KeyboardEvent) => {
    if (videoRef.current && config) {
      var time_now = videoRef.current.currentTime;
      switch (event.key.toLowerCase()) {
        case config.Player.keybinds.Pause.toLowerCase():
          togglePlay();
          break;
        case config.Player.keybinds.TimeSkipRight.toLowerCase():
          console.log(config.Player.keybinds.TimeSkipRight, config.Player.general.TimeSkipRight)
          change_time(time_now += parseInt(config.Player.general.TimeSkipRight.toString()));
          break;
        case config.Player.keybinds.TimeSkipLeft.toLowerCase():
          console.log(config.Player.keybinds.TimeSkipLeft, config.Player.general.TimeSkipLeft)
          change_time(time_now -= parseInt(config.Player.general.TimeSkipLeft.toString()));
          break;
        case config.Player.keybinds.LongTimeSkipForward.toLowerCase():
          console.log(config.Player.keybinds.LongTimeSkipForward, config.Player.general.LongTimeSkipForward)
          change_time(time_now += parseInt(config.Player.general.LongTimeSkipForward.toString()));
          break;
        case config.Player.keybinds.LongTimeSkipBack.toLowerCase():
          console.log(config.Player.keybinds.LongTimeSkipBack, config.Player.general.LongTimeSkipBack)
          change_time(time_now -= parseInt(config.Player.general.LongTimeSkipBack.toString()));
          break;
        case config.Player.keybinds.Fullscreen.toLowerCase():
          await enterFullscreen()
          break;
        case config.Player.keybinds.ExitPlayer.toLowerCase():
          exitPlayer();
          break;
      }
    }
  };

  return (
    <div className="video-container" ref={containerRef} onMouseMove={handleMouseMove}>
      <ContextMenu items={menuItems} />
      {isError.error ? (
        <Dialog
          header_text="Error with player"
          text={isError.information}
          buttons={[{ title: t("general.ok"), onClick: () => exitPlayer() }]}
        />
      ) : ("")}

      <video
        ref={videoRef}
        src={playerUrl}
        className={isVisible ? "video-player mask" : "video-player"}
        onTimeUpdate={updateProgress}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={togglePlay}
        autoPlay={isPlaying}
        onError={(error) => videoErrorHandler(error)}
        preload="metadata"
        muted={isMuted}
        onLoad={() => setWaitingPlayer(true)}
        onWaiting={() => setWaitingPlayer(true)}
      />

      <div className="video-overlay">
        <div className={isVisible ? "video-top" : "video-top hidden"}>
          <button className="material-symbols-outlined player-buttons" onClick={async () => await exitPlayer()}>
            arrow_back
          </button>
          <div className="player-title ">{t("player.TitleEpisode", { ep: ep, name: title })}</div>
        </div>
        <div
          className={
            (isVisible ? "video-center " : "video-center player-waiting-max ") +
            (isWaitingPlayer ? "" : "hidden")
          }
        >
          <div className="player-waiting material-symbols-outlined">
            progress_activity
          </div>
        </div>
        <div className={isVisible ? "video-bottom" : "video-bottom hidden"}>
          <div className={isShowTime ? "show-time" : "show-time hidden"} ref={showtimeRef}></div>
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
          <div className="bottom-section">
            <div className="left">
              <button
                className={
                  episodes[episodes.indexOf(ep) - 1] == undefined ? "material-symbols-outlined player-buttons disabled" : "material-symbols-outlined player-buttons"
                }
                title={
                  episodes[episodes.indexOf(ep) - 1] == undefined ? "" : t("player.previous", { ep: episodes[episodes.indexOf(ep) - 1] })
                }
                onClick={() => setNewEpisode("prev")}>
                skip_previous
              </button>
              <button onClick={togglePlay} className="material-symbols-outlined player-buttons" title={isPlaying ? t("player.Pause") : t("player.play")}>
                {isPlaying ? "pause" : "play_arrow"}
              </button>
              <button
                className={
                  episodes[episodes.indexOf(ep) + 1] == undefined ? "material-symbols-outlined player-buttons disabled" : "material-symbols-outlined player-buttons"
                }
                title={
                  episodes[episodes.indexOf(ep) + 1] == undefined ? "" : t("player.next", { ep: episodes[episodes.indexOf(ep) + 1] })
                } 
                onClick={() => setNewEpisode("next")}>
                skip_next
              </button>
              <div className="volume-container">
                <button className="material-symbols-outlined player-buttons volume-button" title={t("player.Volume")} onClick={setMutedToPlayer}>{isMuted ? "volume_off" : "volume_up"}</button>
                <input className="volume-bar" id="volume" type="range" min="0" max="1" step="0.01" value={volume} style={{ pointerEvents: "all" }} onChange={handleVolumeChange} />
              </div>
              <div className="time-display">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
            <div className="right">
              <button className="material-symbols-outlined player-buttons" title={t("sidebar.settings")}>settings</button>
              <button onClick={async () => await enterFullscreen()} className="material-symbols-outlined player-buttons" title={t("settings.player.Fullscreen")}>
                {isFullscreen ? "fullscreen_exit" : "fullscreen"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Player;