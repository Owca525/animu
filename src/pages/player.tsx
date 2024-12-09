import { useEffect, useRef, useState } from "react";
import "../css/pages/player.css";
import { useLocation, useNavigate } from "react-router-dom";
import { get_player_anime } from "../utils/backend";
import Dialog from "../components/elements/dialog";
// import Dialog from "../components/elements/dialog";

export const Player = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id, title, episodes, ep } = location.state;

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const seekbar = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<NodeJS.Timeout | null>(null);
  const [volume, setVolume] = useState<number>(0.25);
  const [episode, setEpisode] = useState(ep);
  const [isLoadingPlayer, setLoadingPlayer] = useState(true);
  const [playerUrl, setPlayerUrl] = useState("");
  const [isVisible, setIsVisible] = useState(true);
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
        information: "failed get data from allmanga",
      });
    } finally {
      setLoadingPlayer(false);
    }
  };

  useEffect(() => {
    console.log(ep);
    if (episode != ep) {
      console.log(isLoadingPlayer);
      setLoadingPlayer(true);
      set_player();
      setEpisode(ep);
    } else {
      setLoadingPlayer(true);
      set_player();
    }

    const video = videoRef.current;
    console.log(video)
    if (video) {
      const handleError = () => {
        console.error("Video playback error occurred.");
        video.load();
      };

      const handleMouseMove = () => {
        showElement();
        if (hideTimer.current) {
          clearTimeout(hideTimer.current);
        }
        hideTimer.current = setTimeout(hideElement, 1000);
      };

      window.addEventListener("mousemove", handleMouseMove);
      hideTimer.current = setTimeout(hideElement, 1000);

      // TODO: FIX THIS SHIT :CCCCC (idk why this events can't work properly, sometime work or not)
      video.addEventListener("timeupdate", updateProgress);
      video.addEventListener("loadedmetadata", handleLoadedMetadata);
      video.addEventListener("error", handleError);
      window.addEventListener("keydown", keybinds);
      return () => {
        video.removeEventListener("error", handleError);
        video.removeEventListener("timeupdate", updateProgress);
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
        window.removeEventListener("keydown", keybinds);
        window.removeEventListener("mousemove", handleMouseMove);
        if (hideTimer.current) {
          clearTimeout(hideTimer.current);
        }
      };
    }
  }, []);

  const updateProgress = () => {
    if (videoRef.current) {
      const percent = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setCurrentTime(videoRef.current.currentTime);

      if (progressRef.current) {
        progressRef.current.style.width = `${percent}%`;
      }
      if(thumbRef.current) {
        thumbRef.current.style.left = `${percent}%`
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

  const togglePlay = () => {
    // TODO: Fix why space don't stop video in function togglePlay and keybinds
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch((error) => {
          console.error("Play error:", error);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const enterFullscreen = () => {
    if (containerRef.current) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else if ((containerRef.current as any).webkitRequestFullscreen) {
        (containerRef.current as any).webkitRequestFullscreen();
        setIsFullscreen(true);
      } else if ((containerRef.current as any).msRequestFullscreen) {
        (containerRef.current as any).msRequestFullscreen();
        setIsFullscreen(true);
      }
      if (isFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
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

  const keybinds = (event: KeyboardEvent) => {
    if (videoRef.current) {
      var time_now = videoRef.current.currentTime;
      switch (event.key.toLowerCase()) {
        case " ":
          togglePlay();
          break;
        case "arrowright":
          change_time((time_now += 5));
          break;
        case "arrowleft":
          change_time((time_now -= 5));
          break;
        case "arrowup":
          change_time((time_now += 80));
          break;
        case "arrowdown":
          change_time((time_now -= 80));
          break;
        case "f":
          enterFullscreen();
      }
    }
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
      video.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  return (
    <div className="video-container" ref={containerRef}>
      <video
        ref={videoRef}
        // src="https://myanime.sharepoint.com/sites/chartlousty/_layouts/15/download.aspx?share=EVZlwR4K-rxAjiIfQl8LlqABTqXsPyuX0-1oALcfV_62lQ"
        src={playerUrl}
        className={isVisible ? "video-player mask" : "video-player"}
        onTimeUpdate={updateProgress}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={togglePlay}
      />

      <div className={isVisible ? "video-overlay" : "video-overlay hidden"}>
        <div className="video-top">
          <button
            className="material-symbols-outlined player-buttons"
            onClick={() => navigate("/")}
          >
            arrow_back
          </button>
          <div className="player-title ">
            {"Episode: " + ep + " of " + title}
          </div>
        </div>
        <div className="video-center"></div>
        <div className="video-bottom">
          <div className="seek-bar" ref={seekbar} onClick={handleSeekBarClick}>
            <div className="progress" ref={progressRef}></div>
            <div className="thumb" ref={thumbRef}/>
            <div className="show-time"></div>
          </div>
          <div className="bottom-section">
            <div className="left">
              <button
                className="material-symbols-outlined player-buttons"
                // TODO: Adding protection to the episode
                title={
                  "Previous: " + episodes[episodes.indexOf(ep) - 1] + " Episode"
                }
                onClick={setPreviusEpisode}
              >
                skip_previous
              </button>
              <button
                onClick={togglePlay}
                className="material-symbols-outlined player-buttons"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? "pause" : "play_arrow"}
              </button>
              <button
                className="material-symbols-outlined player-buttons"
                title={
                  "Next: " + episodes[episodes.indexOf(ep) + 1] + " Episode"
                }
                onClick={setNextEpisode}
              >
                skip_next
              </button>
              <div className="time-display">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
            <div className="right">
              <button
                className="material-symbols-outlined player-buttons"
                title="Volume"
              >
                volume_up
              </button>
              <input
                id="volume"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                style={{ pointerEvents: "all" }}
                onChange={handleVolumeChange}
              />
              <button
                className="material-symbols-outlined player-buttons"
                title="Settings"
              >
                settings
              </button>
              <button
                onClick={enterFullscreen}
                className="material-symbols-outlined player-buttons"
                title="Fullscreen"
              >
                {isFullscreen ? "fullscreen_exit" : "fullscreen"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
