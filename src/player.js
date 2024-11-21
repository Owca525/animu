let hideTimer;

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
        currentTimeDisplay.textContent = formatTime(video.currentTime);
        seekBar.value = (video.currentTime / video.duration) * 100;
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
    
    seekBar.addEventListener('input', function() {
        const value = seekBar.value * video.duration / 100;
        console.log(value)
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
        durationDisplay.textContent = formatTime(video.duration);
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
    
    function showElement() {
        document.querySelector(".controls").classList.remove('hidden');
        document.querySelector(".fade-effect").classList.remove('hidden');
        document.querySelector(".episode-range").classList.remove('hidden');
        document.querySelector(".title").classList.remove('hidden');
    }
    
    function hideElement() {
        document.querySelector(".controls").classList.add('hidden');
        document.querySelector(".fade-effect").classList.add('hidden');
        document.querySelector(".episode-range").classList.add('hidden');
        document.querySelector(".title").classList.add('hidden');
    }
    
    container.addEventListener('mousemove', function() {
        showElement();
        clearTimeout(hideTimer);
        hideTimer = setTimeout(hideElement, 500);
    });
    hideTimer = setTimeout(hideElement, 500);
    
}
function createVideoPlayer(element, src, video_title) {
    const video = document.createElement('video');
    video.id = 'video';
    video.src = src;

    const episodeRange = document.createElement('div');
    episodeRange.className = 'episode-range';

    const currentTime = document.createElement('span');
    currentTime.id = 'current-time';
    currentTime.textContent = '0:00';

    const seekBar = document.createElement('input');
    seekBar.type = 'range';
    seekBar.id = 'seek-bar';
    seekBar.value = '0';
    seekBar.step = '1';

    const duration = document.createElement('span');
    duration.id = 'duration';
    duration.textContent = '0:00';

    episodeRange.appendChild(currentTime);
    episodeRange.appendChild(seekBar);
    episodeRange.appendChild(duration);

    const controls = document.createElement('div');
    controls.className = 'controls';

    const videoControls = document.createElement('div');
    videoControls.className = 'video-controls';

    const skipPrevious = document.createElement('span');
    skipPrevious.className = 'material-symbols-outlined control';
    skipPrevious.textContent = 'skip_previous';

    const playPause = document.createElement('span');
    playPause.id = 'play-pause';
    playPause.className = 'material-symbols-outlined control';
    playPause.textContent = 'play_arrow';

    const skipNext = document.createElement('span');
    skipNext.className = 'material-symbols-outlined control';
    skipNext.textContent = 'skip_next';

    videoControls.appendChild(skipPrevious);
    videoControls.appendChild(playPause);
    videoControls.appendChild(skipNext);

    const volumeControls = document.createElement('div');
    volumeControls.className = 'volume-controls';

    const mute = document.createElement('span');
    mute.id = 'mute';
    mute.className = 'material-symbols-outlined control';
    mute.textContent = 'volume_up';

    const volumeSlider = document.createElement('input');
    volumeSlider.type = 'range';
    volumeSlider.id = 'volume-slider';
    volumeSlider.value = '25';
    volumeSlider.step = '1';
    volumeSlider.min = '0';
    volumeSlider.max = '100';

    const fullscreen = document.createElement('span');
    fullscreen.id = 'fullscreen';
    fullscreen.className = 'material-symbols-outlined control';
    fullscreen.textContent = 'crop_free';

    volumeControls.appendChild(mute);
    volumeControls.appendChild(volumeSlider);
    volumeControls.appendChild(fullscreen);

    controls.appendChild(videoControls);
    controls.appendChild(volumeControls);

    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = video_title;

    const fadeEffect = document.createElement('div');
    fadeEffect.className = 'fade-effect';

    document.querySelector(element).appendChild(video);
    document.querySelector(element).appendChild(episodeRange);
    document.querySelector(element).appendChild(controls);
    document.querySelector(element).appendChild(title);
    document.querySelector(element).appendChild(fadeEffect);
    run_events()
}