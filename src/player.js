let hideTimer;
let settings_on;
let player_mode = false;

function reset_player() {
    const progress = document.getElementById('progress');
    const currentTimeDisplay = document.querySelector('#current-time');
    const durationDisplay = document.querySelector('#duration');
    const video = document.querySelector('#video');
    const title = document.querySelector('.title');
    video.pause();
    progress.style.width = "0%";
    currentTimeDisplay.innerHTML = "0:00";
    durationDisplay.innerHTML = "0:00";
    thumb.style.left = '0%';
    title.innerHTML = "";
}

function run_events() {
    const video = document.querySelector('#video');
    const playPauseButton = document.querySelector('#play-pause');
    const seekBar = document.querySelector('#seek-bar');
    const muteButton = document.querySelector('#mute');
    const fullscreenButton = document.querySelector('#fullscreen');
    const container = document.querySelector('#video-container');
    const currentTimeDisplay = document.querySelector('#current-time');
    const durationDisplay = document.querySelector('#duration');
    const volumeSlider = document.querySelector('#volume-slider');
    const progress = document.getElementById('progress');
    const thumb = document.getElementById('thumb');
    const show = document.querySelector(".show-time");
    const loader = document.querySelector('.loader');
    const menu = document.querySelector(".settings-player");
    const settings_container = document.querySelector(".settings-container")
    const menu_resolution = document.querySelector(".resolution");
    const menu_url = document.querySelector(".url");

    document.querySelector(".set-back").addEventListener("click", function () {
        document.querySelector(".container").style.display = "";
        document.querySelector(".player-container").style.display = "none";
        window.removeEventListener("keypress", function(event) {})
        document.querySelector(".information-container").style.display = "none";
        document.querySelector(".title").innerHTML = "";
        video.pause();
        video.src = "";
    });

    menu_url.addEventListener("click", function(event) {
        document.querySelector(".main-settings").style.display = "none";
        document.querySelector(".urls").style.display = "";
    });

    menu_resolution.addEventListener("click", function(event) {
        document.querySelector(".main-settings").style.display = "none";
        document.querySelector(".res").style.display = "";
    });
    
    container.addEventListener("click", function() {
        settings_on = false;
        document.querySelector(".main-settings").style.display = "none";
        document.querySelector(".urls").style.display = "none";
        document.querySelector(".res").style.display = "none";
    });

    settings_container.addEventListener("click", function(event) {
        event.stopPropagation();
    });

    menu.addEventListener("click", function(event) {
        event.stopPropagation();
        if (document.querySelector(".main-settings").style.display == "none") {
            document.querySelector(".main-settings").style.display = "";
            settings_on = true;
        } else {
            document.querySelector(".main-settings").style.display = "none";
            document.querySelector(".urls").style.display = "none";
            document.querySelector(".res").style.display = "none";
            settings_on = false;
        };
    });

    playPauseButton.addEventListener('click', function() {
        if (video.paused) {
            video.play();
            playPauseButton.textContent = 'Pause';
        } else {
            video.pause();
            playPauseButton.textContent = 'play_arrow';
        }
    });
    
    volumeSlider.addEventListener('input', function() {
        video.volume = volumeSlider.value / 100; 
    });
    
    video.addEventListener('timeupdate', function() {
        const percent = (video.currentTime / video.duration) * 100;
        currentTimeDisplay.innerHTML = formatTime(video.currentTime)
        progress.style.width = percent + '%';
        thumb.style.left = percent + '%';
    });

    video.addEventListener("click", function() {
        if (video.paused) {
            video.play();
            playPauseButton.textContent = 'Pause';
        } else {
            video.pause();
            playPauseButton.textContent = 'play_arrow';
        }
    })

    video.addEventListener('loadstart', () => {
        loader.style.display = 'block';
    });
    
    video.addEventListener('loadeddata', () => {
        loader.style.display = 'none';
    });

    video.addEventListener('waiting', () => {
        loader.style.display = 'none';
    });
    
    video.addEventListener('playing', () => {
        loader.style.display = 'none';
    });
    
    seekBar.addEventListener('input', function() {
        const value = seekBar.value * video.duration / 100;
        video.currentTime = value;
    });
    
    muteButton.addEventListener('click', function() {
        video.muted = !video.muted;
        muteButton.textContent = video.muted ? 'volume_mute' : 'volume_up';
    });
    
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }
    
    video.addEventListener('loadedmetadata', function() {
        reset_player();
        durationDisplay.textContent = formatTime(video.duration);
        // video.play();
        // if (video.paused) {
        //     playPauseButton.textContent = 'Pause';
        // } else {
        //     playPauseButton.textContent = 'play_arrow';
        // }
    });
    
    fullscreenButton.addEventListener('click', function() {
        const videoContainer = document.getElementById('video-container');
        document.querySelector(".title").style.bottom = "95%";
        document.querySelector(".title").style.left = "1%";
        fullscreenButton.textContent = "fullscreen_exit";
        if (!document.fullscreenElement) {
            videoContainer.requestFullscreen().catch(err => {
                console.error(`${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
            document.querySelector(".title").style.bottom = "90%";
            document.querySelector(".title").style.left = "2%";
            fullscreenButton.textContent = "crop_free";
        }
    });

    seekBar.addEventListener('click', (event) => {
        const rect = seekBar.getBoundingClientRect();
        const offsetX = event.clientX - rect.left;
        const totalWidth = rect.width;
        const percent = offsetX / totalWidth;
        const newTime = percent * video.duration;
        video.currentTime = newTime;
    });
    
    seekBar.addEventListener('mousemove', (event) => {
        const rect = seekBar.getBoundingClientRect();
        const offsetX = event.clientX - rect.left;
        const totalWidth = rect.width;
        const percent = offsetX / totalWidth;
        const newTime = percent * video.duration;
        if (!isNaN(newTime)) {
            show.style.display = "";
            show.style.left = ((percent * 100) - 1.2) + "%";
            show.innerHTML = formatTime(newTime);
        }
        thumb.style.display = 'block';
    });
    
    seekBar.addEventListener('mouseleave', () => {
        show.style.display = 'none';
    });
    
    function showElement() {
        document.querySelector(".controls").classList.remove('hidden');
        document.querySelector(".fade-effect").classList.remove('hidden');
        document.querySelector(".title").classList.remove('hidden');
        document.querySelector(".set-back").classList.remove('hidden');
        document.querySelector(".seek-bar-container").classList.remove('hidden');
    }
    
    function hideElement() {
        document.querySelector(".controls").classList.add('hidden');
        document.querySelector(".fade-effect").classList.add('hidden');
        document.querySelector(".title").classList.add('hidden');
        document.querySelector(".set-back").classList.add('hidden');
        document.querySelector(".seek-bar-container").classList.add('hidden');
    }
    
    container.addEventListener('mousemove', function() {
        showElement();
        if (settings_on != true) {
            clearTimeout(hideTimer);
            hideTimer = setTimeout(hideElement, 500);
        }
    });
    hideTimer = setTimeout(hideElement, 500);
    
}