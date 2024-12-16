import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { get_player_anime } from "../utils/backend";
import Dialog from "../components/dialogs/dialog";
import "../css/pages/player.css";
import { SettingsConfig } from "../utils/interface";
import { readConfig } from "../utils/config";

export const Player = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id, title, episodes, ep } = location.state;
  const [config, setConfig] = useState<SettingsConfig | undefined>(undefined);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const seekbar = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const showtimeRef = useRef<HTMLDivElement | null>(null);
  const hideTimer = useRef<NodeJS.Timeout | null>(null);
  const [volume, setVolume] = useState<number>(0.25);
  const [isVolumeSet, setisVolumeSet] = useState<boolean>(false);
  const [isVolumeVideoSet, setisVolumeVideoSet] = useState<boolean>(false);
  const [episode, setEpisode] = useState(ep);
  const [isLoadingPlayer, setLoadingPlayer] = useState(true);
  const [playerUrl, setPlayerUrl] = useState("");
  const [isShowTime, setShowTime] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isWaitingPlayer, setWaitingPlayer] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isError, setErrorDialog] = useState({ error: false, information: "" });

  const set_player = async () => {
    try {
      const recentData = await get_player_anime(id, ep);
      setPlayerUrl(recentData["players"][0]);
    } catch (error) {
      setErrorDialog({
        error: true,
        information: "Failed get data from allmanga",
      });
    } finally {
      setLoadingPlayer(false);
      const cfg = await readConfig();
      if (cfg && cfg.Player.general.Autoplay) {
        setIsPlaying(true);
      }
    }
  };

  const handleMouseMove = () => {
    showElement();
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }
    hideTimer.current = setTimeout(hideElement, 2000);
  };

  const remove_events = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
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

  // Temporaly 
  var currentisFullscreen = false;
  const enterFullscreenKeybinds = async () => {
    if (currentisFullscreen) {
      await getCurrentWindow().setFullscreen(false);
      currentisFullscreen = false;
      return false
    } else {
      await getCurrentWindow().setFullscreen(true);
      currentisFullscreen = true;
      return true
    }
  };
  const enterFullscreen = async () => {
    if (isFullscreen) {
      await getCurrentWindow().setFullscreen(false);
      return false
    } else {
      await getCurrentWindow().setFullscreen(true);
      return true
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
          change_time((time_now += config.Player.general.TimeSkipRight));
          break;
        case config.Player.keybinds.TimeSkipLeft.toLowerCase():
          change_time((time_now -= config.Player.general.TimeSkipLeft));
          break;
        case config.Player.keybinds.LongTimeSkipForward.toLowerCase():
          change_time((time_now += config.Player.general.LongTimeSkipForward));
          break;
        case config.Player.keybinds.LongTimeSkipBack.toLowerCase():
          change_time((time_now -= config.Player.general.LongTimeSkipBack));
          break;
        case config.Player.keybinds.Fullscreen.toLowerCase():
          setIsFullscreen(await enterFullscreenKeybinds());
          break;
        case config.Player.keybinds.ExitPlayer.toLowerCase():
          exitPlayer();
          break;
      }
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (video) {
      setIsPlaying((prevIsPlaying: boolean) => {
        if (prevIsPlaying) {
          video.pause();
          return false;
        } else {
          video.play();
          return true;
        }
      });
    }
  };

  useEffect(() => {
    readConfig().then((tmpConfig) => {
      setConfig(tmpConfig);
    });

    if (episode != ep) {
      remove_events();
      setLoadingPlayer(true);
      set_player();
      setEpisode(ep);
    } else {
      setLoadingPlayer(true);
      set_player();
    }

    if (videoRef) {
      document.addEventListener("keydown", keybinds);
    } else document.removeEventListener("keydown", keybinds);
  }, [episode, ep, videoRef]);

  useEffect(() => {
    console.log(config)
    if (isVolumeSet == false) {
      setVolumeConfig()
    }
  }, [config]);

  const setVolumeConfig = () => {
    if (config) {
      setVolume(() => {
        setisVolumeSet(true)
        return config.Player.general.Volume / 100
      })
    }
  }

  const updateProgress = () => {
    if (videoRef.current) {
      const percent =
        (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setCurrentTime(videoRef.current.currentTime);

      if (progressRef.current && thumbRef.current && isShowTime == false) {
        progressRef.current.style.width = `${percent}%`;
        thumbRef.current.style.left = `${percent}%`;
      }
    }
  };

  const setPreviusEpisode = () => {
    setLoadingPlayer(true);
    navigate("/player", {
      state: {
        id: id,
        title: title,
        episodes: episodes,
        ep: episodes[episodes.indexOf(ep) - 1],
      },
    });
    set_player();
  };

  const setNextEpisode = () => {
    setLoadingPlayer(true);
    navigate("/player", {
      state: {
        id: id,
        title: title,
        episodes: episodes,
        ep: episodes[episodes.indexOf(ep) + 1],
      },
    });
    set_player();
  };

  if (isLoadingPlayer) {
    return (
      <div className="video-container">
        {isError.error ? (
          <Dialog
            type="error"
            header_text="Error with player"
            text={isError.information}
            onClick={() => navigate("/")}
          />
        ) : (
          ""
        )}
        <div className="loading-player material-symbols-outlined">
          progress_activity
        </div>
      </div>
    );
  }

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);

    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const showElement = () => {
    setIsVisible(true);
  };

  const hideElement = () => {
    setIsVisible(false);
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

  const handleSeekBarMouseMove = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    const seekBar = seekbar.current;
    const video = videoRef.current;
    const showtime = showtimeRef.current;
    if (
      seekBar &&
      video &&
      showtime &&
      progressRef.current &&
      thumbRef.current
    ) {
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

  const handleSeekBarMouseLeave = () => {
    setShowTime(false);
    if (videoRef.current && progressRef.current && thumbRef.current) {
      const percent =
        (videoRef.current.currentTime / videoRef.current.duration) * 100;
      progressRef.current.style.width = `${percent}%`;
      thumbRef.current.style.left = `${percent}%`;
    }
  };

  const videoErrorHandler = (
    event: React.SyntheticEvent<HTMLVideoElement, Event>
  ) => {
    const error = event.currentTarget.error;
    var message: string;

    if (error) {
      switch (error.code) {
        case error.MEDIA_ERR_ABORTED:
          message = "The playback was aborted.";
          break;
        case error.MEDIA_ERR_NETWORK:
          message = "A network error occurred while fetching the video.";
          break;
        case error.MEDIA_ERR_DECODE:
          message = "An error occurred while decoding the video.";
          break;
        case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
          message = "The video format or source is not supported.";
          break;
        default:
          message = "An unknown error occurred.";
      }
      setErrorDialog({ error: true, information: message });
    }
  };

  if (config && videoRef.current && isVolumeVideoSet == false) {
    videoRef.current.volume = config.Player.general.Volume / 100
    setisVolumeVideoSet(true)
  }

  const exitPlayer = async () => {
    await getCurrentWindow().setFullscreen(false);
    navigate("/");
  }

  return (
    <div
      className="video-container"
      ref={containerRef}
      onMouseMove={handleMouseMove}
    >
      {isError.error ? (
        <Dialog
          type="error"
          header_text="Error with player"
          text={isError.information}
          onClick={() => navigate("/")}
        />
      ) : (
        ""
      )}
      <video
        ref={videoRef}
        // src="https://myanime.sharepoint.com/sites/chartlousty/_layouts/15/download.aspx?share=EVZlwR4K-rxAjiIfQl8LlqABTqXsPyuX0-1oALcfV_62lQ"
        src={playerUrl}
        className={isVisible ? "video-player mask" : "video-player"}
        onTimeUpdate={updateProgress}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={togglePlay}
        autoPlay={isPlaying}
        onError={(error) => videoErrorHandler(error)}
        preload="metadata"
        onLoadStart={() => setWaitingPlayer(true)}
        onCanPlay={() => setWaitingPlayer(false)}
        onWaiting={() => setWaitingPlayer(true)}
      />

      <div className="video-overlay">
        <div className={isVisible ? "video-top" : "video-top hidden"}>
          <button className="material-symbols-outlined player-buttons" onClick={async () => await exitPlayer()}>
            arrow_back
          </button>
          <div className="player-title ">{`Episode: ${ep} of ${title}`}</div>
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
                  episodes[episodes.indexOf(ep) - 1] == undefined ? "" : `Previous: ${episodes[episodes.indexOf(ep) - 1]} Episode`
                }
                onClick={setPreviusEpisode}>
                skip_previous
              </button>
              <button onClick={togglePlay} className="material-symbols-outlined player-buttons" title={isPlaying ? "Pause" : "Play"}>
                {isPlaying ? "pause" : "play_arrow"}
              </button>
              <button
                className={episodes[episodes.indexOf(ep) + 1] == undefined ? "material-symbols-outlined player-buttons disabled" : "material-symbols-outlined player-buttons"}
                title={episodes[episodes.indexOf(ep) + 1] == undefined ? "" : `Next: ${episodes[episodes.indexOf(ep) + 1]} Episode`}onClick={setNextEpisode}>
                skip_next
              </button>
              <div className="time-display">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
            <div className="right">
              <button className="material-symbols-outlined player-buttons" title="Volume">volume_up</button>
              <input id="volume" type="range" min="0" max="1" step="0.01" value={volume} style={{ pointerEvents: "all" }} onChange={handleVolumeChange}/>
              <button className="material-symbols-outlined player-buttons" title="Settings">settings</button>
              <button onClick={async () => setIsFullscreen(await enterFullscreen())} className="material-symbols-outlined player-buttons" title="Fullscreen">
                {isFullscreen ? "fullscreen_exit" : "fullscreen"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
