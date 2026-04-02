import ini from "ini";
import { SettingsConfig } from "../types";
import { setConfig } from "../stores/config";

export async function saveConfig(content: SettingsConfig): Promise<boolean> {
    try {
        const data = ini.stringify(content);
        setConfig(content)
        /* IFDEF DEBUG|PROD */
        return await window.api.os.write("config.ini", data)
        /* ENDIF */

        /* IFDEF WEB */
        localStorage.setItem("config", JSON.stringify(content))
        /* ENDIF */
        return true
    } catch (Error) {
        console.error(`${Error} in saveConfig`);
        return false
    }
}

/* IFDEF WEB */
export const defaultConfigWeb: SettingsConfig = {
    firstStart: true,
    deepLinkURL: "https://owca525.github.io/",
    yt_dlp: "",
    General: {
        language: "en",
        theme: ["DarkerAnimu"],
        Window: {
            AutoMaximize: false,
            AutoFullscreen: false,
            Zoom: 100,
            trayIconClose: false
        },
        discordRPC: true
    },
    Player: {
        general: {
            Autoplay: true,
            AutoFullscreen: false,
            AutoSkipEpisode: true,
            Volume: 25,
            LongTimeSkipForward: 90,
            LongTimeSkipBack: 90,
            TimeSkipLeft: 5,
            TimeSkipRight: 5,
            VideoStreching: false,
            PlayerBehavior: "information",
            autoSkipOpenings: false,
            autoSkipEndings: false,
            showBrokenBuffer: false,
            minusTime: false,
            disablemoreinformation: false
        },
        screenShot: {
            alwaysAsk: true,
            saveType: "Clipboard",
            path: "",
        },
        external: {
            enable: false,
            type: "Mpv",
            movianIP: "localhost:42000",
            mpvPath: "",
            vlcPath: ""
        },
        upToNextEpisode: {
            enable: true,
            interval: 15,
            durationShow: 5,
            variants: "var1"
        },
        keybinds: {
            Pause: " ",
            LongTimeSkipForward: "ArrowUp",
            LongTimeSkipBack: "ArrowDown",
            TimeSkipLeft: "ArrowLeft",
            TimeSkipRight: "ArrowRight",
            Fullscreen: "F",
            ExitPlayer: "Escape",
            NextEpisode: "PageUp",
            PrevEpisode: "PageDown",
            FrameSkipBack: ",",
            FrameSkipForward: ".",
            VolumeDown: "9",
            VolumeUp: "0",
            VolumeMute: "m",
            ScreenShot: "f10",
            PictureInPicture: "P",
            toggleSubtitles: "C",
            skipOpeningEnding: "S",
            noSubbtitlesreenshot: "CTRL+f10"
        },
        ui: {
            DisableVolumeAnimation: false,
            DisableSpaceAnimation: false,
            DisableSkipAnimation: false,
            DisableLoadingAnimation: false
        }
    },
    History: {
        history: {
            LimitedHistory: false,
            maxSave: 50,
            AlwaysAsk: true
        },
        continue: {
            MinimalTimeSave: 20,
            MaximizeTimeSave: 100,
        },
    },
    Developer: {
        DeveloperMode: false,
        DevTools: false,
        DevToolsOnStart: false,
        playerDebug: false
    },
    update: {
        lastTime: 0,
        type: "On Start",
        enable: true
    },
    plugins: {
        player: "Allmanga",
        userPlugins: false,
        hiddenPlugins: [],
        repoURL: ["https://raw.githubusercontent.com/Owca525/animu-plugins/refs/heads/main"],
        pluginCheckType: "Every Day",
        lastTimeCheck: 0
    },
    backup: {
        enable: false,
        lastCheck: 0,
        check: "Every Day",
        maxBackups: 3
    },
    animulist: {
        historyConvert: true
    },
    anilist: {
        scoreFormat: "POINT_100",
        titleFormat: "ROMAJI",
        adultdefault: false,
        maxpagesize: 20
    },
    information: {
        openingininformation: false
    },
    socket: {
        useSocket: false,
        backend: ""
    }
};
/* ENDIF */