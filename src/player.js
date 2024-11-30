let hideTimer;
let settings_on;
let player_mode = false;

function reset_player() {
  const progress = document.getElementById("progress");
  const currentTimeDisplay = document.querySelector("#current-time");
  const durationDisplay = document.querySelector("#duration");
  const video = document.querySelector("#video");
  video.pause();
  progress.style.width = "0%";
  currentTimeDisplay.innerHTML = "0:00";
  durationDisplay.innerHTML = "0:00";
  thumb.style.left = "0%";
}

function run_events() {
  const video = document.querySelector("#video");
  const playPauseButton = document.querySelector("#play-pause");
  const seekBar = document.querySelector("#seek-bar");
  const muteButton = document.querySelector("#mute");
  const fullscreenButton = document.querySelector("#fullscreen");
  const container = document.querySelector("#video-container");
  const currentTimeDisplay = document.querySelector("#current-time");
  const durationDisplay = document.querySelector("#duration");
  const volumeSlider = document.querySelector("#volume-slider");
  const progress = document.getElementById("progress");
  const thumb = document.getElementById("thumb");
  const show = document.querySelector(".show-time");
  const loader = document.querySelector(".loader");
  const menu = document.querySelector(".settings-player");
  const settings_container = document.querySelector(".settings-container");
  const menu_resolution = document.querySelector(".resolution");
  const menu_url = document.querySelector(".url");
  pause_control();

  document.addEventListener("keydown", function (event) {
    var vtime = 0;
    if (video.style.display != "none") {
      console.log(event.key);
      switch (event.key) {
        case " ":
          event.preventDefault();
          pause_control();
          break;
        case "ArrowRight":
          vtime = video.currentTime;
          change_time((vtime += 5));
          break;
        case "ArrowLeft":
          vtime = video.currentTime;
          change_time((vtime -= 5));
          break;
        case "ArrowUp":
          vtime = video.currentTime;
          change_time((vtime += 80));
          break;
        case "ArrowDown":
          vtime = video.currentTime;
          change_time((vtime -= 80));
          break;
        case "f":
          set_fullscreen();
          break;
        case "F":
          set_fullscreen();
          break;
      }
    }
  });

  function change_time(time) {
    if (video.paused) {
      video.currentTime = time;
      video.play();
    } else {
      video.pause();
      video.currentTime = time;
      video.play();
    }
  }

  function pause_control() {
    if (video.paused) {
      video.play();
      playPauseButton.textContent = "Pause";
    } else {
      video.pause();
      playPauseButton.textContent = "play_arrow";
    }
  }
  function set_fullscreen() {
    const videoContainer = document.getElementById("video-container");
    document.querySelector(".title").style.bottom = "95%";
    document.querySelector(".title").style.left = "1%";
    fullscreenButton.textContent = "fullscreen_exit";
    if (!document.fullscreenElement) {
      videoContainer.requestFullscreen().catch((err) => {
        console.error(`${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
      document.querySelector(".title").style.bottom = "90%";
      document.querySelector(".title").style.left = "2%";
      fullscreenButton.textContent = "crop_free";
    }
  }

  document.querySelector(".set-back").addEventListener("click", function () {
    document.querySelector(".container").style.display = "";
    document.querySelector(".player-container").style.display = "none";
    window.removeEventListener("keypress", function (event) {});
    document.querySelector(".information-container").style.display = "none";
    document.querySelector(".title").innerHTML = "";
    document.exitFullscreen();
    video.pause();
    video.src = "";
  });

  menu_url.addEventListener("click", function (event) {
    document.querySelector(".main-settings").style.display = "none";
    document.querySelector(".urls").style.display = "";
  });

  menu_resolution.addEventListener("click", function (event) {
    document.querySelector(".main-settings").style.display = "none";
    document.querySelector(".res").style.display = "";
  });

  container.addEventListener("click", function () {
    settings_on = false;
    document.querySelector(".main-settings").style.display = "none";
    document.querySelector(".urls").style.display = "none";
    document.querySelector(".res").style.display = "none";
  });

  settings_container.addEventListener("click", function (event) {
    event.stopPropagation();
  });

  menu.addEventListener("click", function (event) {
    event.stopPropagation();
    if (document.querySelector(".main-settings").style.display == "none") {
      document.querySelector(".main-settings").style.display = "";
      settings_on = true;
    } else {
      document.querySelector(".main-settings").style.display = "none";
      document.querySelector(".urls").style.display = "none";
      document.querySelector(".res").style.display = "none";
      settings_on = false;
    }
  });

  playPauseButton.addEventListener("click", function () {
    pause_control();
  });

  volumeSlider.addEventListener("input", function () {
    video.volume = volumeSlider.value / 100;
  });

  video.addEventListener("timeupdate", function () {
    const percent = (video.currentTime / video.duration) * 100;
    currentTimeDisplay.innerHTML = formatTime(video.currentTime);
    progress.style.width = percent + "%";
    thumb.style.left = percent + "%";
  });

  video.addEventListener("click", function () {
    pause_control();
  });

  video.addEventListener("loadstart", () => {
    loader.style.display = "block";
  });

  video.addEventListener("loadeddata", () => {
    loader.style.display = "none";
  });

  video.addEventListener("waiting", () => {
    loader.style.display = "none";
  });

  video.addEventListener("canplay", () => {
    loader.style.display = "none";
  });

  video.addEventListener("playing", () => {
    loader.style.display = "none";
  });

  video.addEventListener("ended", () => {
    loader.style.display = "none";
  });
  video.addEventListener("seeked", function () {
    if (!video.paused) {
      loader.style.display = "none";
    }
  });

  seekBar.addEventListener("input", function () {
    const value = (seekBar.value * video.duration) / 100;
    video.currentTime = value;
  });

  muteButton.addEventListener("click", function () {
    video.muted = !video.muted;
    muteButton.textContent = video.muted ? "volume_mute" : "volume_up";
  });

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  }

  video.addEventListener("loadedmetadata", function () {
    durationDisplay.textContent = formatTime(video.duration);
  });

  fullscreenButton.addEventListener("click", function () {
    set_fullscreen();
  });

  seekBar.addEventListener("click", (event) => {
    const rect = seekBar.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const totalWidth = rect.width;
    const percent = offsetX / totalWidth;
    const newTime = percent * video.duration;
    video.currentTime = newTime;
  });

  seekBar.addEventListener("mousemove", (event) => {
    const rect = seekBar.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const totalWidth = rect.width;
    const percent = offsetX / totalWidth;
    const newTime = percent * video.duration;
    if (!isNaN(newTime)) {
      show.style.display = "";
      show.style.left = percent * 100 - 1.2 + "%";
      show.innerHTML = formatTime(newTime);
    }
    thumb.style.display = "block";
  });

  seekBar.addEventListener("mouseleave", () => {
    show.style.display = "none";
  });

  function showElement() {
    document.querySelector(".controls").classList.remove("hidden");
    document.querySelector(".fade-effect").classList.remove("hidden");
    document.querySelector(".title").classList.remove("hidden");
    document.querySelector(".set-back").classList.remove("hidden");
    document.querySelector(".seek-bar-container").classList.remove("hidden");
  }

  function hideElement() {
    document.querySelector(".controls").classList.add("hidden");
    document.querySelector(".fade-effect").classList.add("hidden");
    document.querySelector(".title").classList.add("hidden");
    document.querySelector(".set-back").classList.add("hidden");
    document.querySelector(".seek-bar-container").classList.add("hidden");
  }

  container.addEventListener("mousemove", function () {
    showElement();
    if (settings_on != true) {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(hideElement, 1000);
    }
  });
  hideTimer = setTimeout(hideElement, 1000);
}

function recreate_player(url, title) {
  document.querySelector(".player-container").innerHTML = "";

  document.querySelector(".player-container").innerHTML = `
    <div class="loader"><span class="material-symbols-outlined spinner loader-spinner">progress_activity</span></div>
    <div id="video-container">
        <video id="video" src="${url}"></video>
        <div class="seek-bar-container">
          <div class="seek-bar" id="seek-bar">
            <div class="progress" id="progress"></div>
            <div class="thumb" id="thumb"></div>
            <div class="show-time"></div>
          </div>
        </div>
        <div class="controls">
          <div class="video-controls">
            <span class="material-symbols-outlined control previous">skip_previous</span>
            <span id="play-pause" class="material-symbols-outlined control">play_arrow</span>
            <span class="material-symbols-outlined control next">skip_next</span>
            <div class="timing">
              <span id="current-time">0:00</span> <span style="color: white;">/</span>
              <span id="duration">0:00</span>
            </div>
          </div>
          <div class="volume-controls">
            <span id="mute" class="material-symbols-outlined control">volume_up</span>
            <input type="range" id="volume-slider" value="25" step="1" min="0" max="100"/>
            <span class="material-symbols-outlined control settings-player">settings</span>
            <span id="fullscreen" class="material-symbols-outlined control">crop_free</span>
          </div>
        </div>
        <div class="settings-container main-settings" style="display: none;">
          <div class="resolution setting-button" style="display: none;">Resolution</div>
          <div class="url setting-button">Anime url</div>
        </div>
        <div class="settings-container res" style="display: none;">
          <div class="setting-button">1080p</div>
          <div class="setting-button">720p</div>
        </div>
        <div class="settings-container urls" style="display: none;"></div>
        <div class="player-text">
          <span class="material-symbols-outlined set-back">arrow_back</span>
          <div class="title">${title}</div>
        </div>
        <div class="fade-effect"></div>
    </div>
    `;
    run_events();
}
