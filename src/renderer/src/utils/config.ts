import ini from "ini";
import { SettingsConfig } from "./GlobalInterface";
import { convertPath } from "./functions";

export const defaultConfig: SettingsConfig = {
    firstStart: true,
    General: {
        HoverSidebar: true,
        HideSidebar: false,
        language: "en",
        theme: "DarkAnimu",
        Window: {
            AutoMaximize: false,
            AutoFullscreen: false,
            Zoom: 100,
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
            RemovingSpaceAnimation: false,
            DisableVolumeAnimation: false,
            PlayerBehavior: "information",
            autoSkipOpenings: false,
            autoSkipEndings: false
        },
        screenShot: {
            alwaysAsk: true,
            saveType: "File",
            path: await checkPictureFolder(),
        },
        external: {
            enable: false,
            type: "Mpv",
            movianIP: "localhost:42000",
            mpvPath: await window.api.os.getPathProgram("mpv"),
            vlcPath: await window.api.os.getPathProgram("vlc")
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
            toggleSubtitles: "C"
        },
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
        lastTime: "0",
        type: "On Start",
        enable: true
    },
    plugins: {
        // information: "AnilistApi",
        player: "Allmanga"
    }
};

const appConfigDirPath = window.api.os.getPath("userData");

export async function checkPictureFolder(): Promise<string> {
    const path = await window.api.os.getPath("pictures");
    const picturePath = await convertPath(`${path}/animu`)
    if (await window.api.os.exists(picturePath)) return picturePath;
    window.api.os.mkdir(picturePath);
    return picturePath;
}

function deepMerge(target: any, source: any): any {
    for (const key in source) {
        if (source[key] && typeof source[key] === "object") {
            if (!target[key]) {
                target[key] = {};
            }
            deepMerge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}

export async function readConfig(): Promise<SettingsConfig> {
    try {
        if (await checkConfig() == false) return defaultConfig
        const content = await window.api.os.read(await appConfigDirPath + "/config.ini");
        const loadedConfig = ini.parse(content) as SettingsConfig;
        return deepMerge(defaultConfig, loadedConfig);
    } catch (error) {
        console.log(error)
        return defaultConfig
    }
}

export async function saveConfig(content: SettingsConfig): Promise<boolean> {
    try {
        const data = ini.stringify(content);
        window.api.os.write(await appConfigDirPath + "/config.ini", data);
        return true
    } catch (Error) {
        console.error(`Error in saveConfig`);
        return false
    }
}

async function createConfig() {
    try {
        const content = ini.stringify(defaultConfig);
        await window.api.os.write(await appConfigDirPath + "/config.ini", content)
    } catch (Error) {
        console.error(`${Error} in createConfig`);
    }
}

export async function checkConfig(): Promise<boolean> {
    try {
        if (await window.api.os.exists(await appConfigDirPath)) return true;
        else await window.api.os.mkdir(await appConfigDirPath);

        if (await window.api.os.exists(await appConfigDirPath + "/config.ini") == false)
            await createConfig();
        return true
    } catch (Error) {
        console.error(`${Error} in checkConfig`);
        return false
    }
}
