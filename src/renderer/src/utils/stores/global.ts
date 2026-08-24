import { animeOpeningsFormat, cardData, deeplinkFormat, globalDataFormat, informationTmpProps, NotificationExpanded, PlayerTmpProps, serviceFormat, themeMetadata } from "../types";
import { createStore, unwrap } from "solid-js/store";
import { Socket } from "socket.io-client";

export const [globalState, setGlobalState] = createStore<globalDataFormat>({
    incognito: false,
    history: new Map(),
    deeplinkRunned: false,
    loadedTheme: [],
    activeThemes: new Map(),
    token: undefined,
    animuList: new Map(),
    socket: undefined,
    service: [],
    deepLinks: [],
    anilist_user_data: undefined,
    isAnimuFocus: true,
    notifications: [],
    todayAnimeAnilist: [],
    animeOpeningsCache: {},
    audioOutput: undefined,
    pluginSearchMode: false,
    yt_dlp: {
        ver: "",
        listVer: []
    }
} as globalDataFormat);

export const getGlobalCache = () => globalState;
export const loadedTheme = () => globalState.loadedTheme;
export const activeThemes = () => globalState.activeThemes;
export const animulistData = () => globalState.animuList;
export const getSocket = () => globalState.socket?.instance as any;
export const getSocketRoom = () => globalState.socket?.currentRoom;
export const getServices = () => globalState.service;
export const getDeeplinks = () => globalState.deepLinks;
export const getAnilistUserData = () => globalState.anilist_user_data;
export const isAnimuFocus = () => globalState.isAnimuFocus;
export const getNotificationList = () => globalState.notifications;
export const todayAnimeInAnilist = () => globalState.todayAnimeAnilist;
export const animeOpeningsCache = () => globalState.animeOpeningsCache;
export const getAudioOutput = () => globalState.audioOutput;
export const isPluginSearchMode = () => globalState.pluginSearchMode;
export const getAnimuHistory = () => globalState.history;
export const getCurrentYT_DLPVer = () => globalState.yt_dlp["ver"];
export const getListOfVerYT_DLP = () => globalState.yt_dlp["listVer"];

export const setYT_DLPVersion = (tmp: globalDataFormat["yt_dlp"]) => setGlobalState((prev) => ({ ...prev, yt_dlp: tmp }));
export const setPluginSearchMode = (tmp: boolean) => setGlobalState((prev) => ({ ...prev, pluginSearchMode: tmp }));
export const addOpeningCache = (id: number, op: animeOpeningsFormat[]) => setGlobalState((prev) => ({ ...prev, animeOpeningsCache: { ...prev.animeOpeningsCache, [id]: op } }));
export const setTodayAnimeInAnilist = (tmp: cardData[]) => setGlobalState((prev) => ({ ...prev, todayAnimeAnilist: tmp }));
export const setAudioOutput = (tmp: MediaDeviceInfo) => setGlobalState((prev) => ({ ...prev, audioOutput: tmp }));
export const setSocket = (tmp: Socket) => setGlobalState((prev) => ({ ...prev, socket: { ...prev.socket as any, instance: tmp } }));
export const setSocketRoom = (tmp: string) => setGlobalState((prev) => ({ ...prev, socket: { ...prev.socket as any, currentRoom: tmp } }));
export const setActiveThemes = (tmp: Map<number, themeMetadata>) => setGlobalState((prev) => ({ ...prev, activeThemes: tmp }));
export const setGlobalTheme = (tmp: themeMetadata[]) => setGlobalState((prev) => ({ ...prev, loadedTheme: tmp }));
export const setIncognitoMode = (tmp: boolean) => setGlobalState((prev) => ({ ...prev, incognito: tmp }));
export const setDeeplinkRunned = (tmp: boolean) => setGlobalState((prev) => ({ ...prev, deeplinkRunned: tmp }));
export const setGlobalHistory = (tmp: Map<string, cardData>) => setGlobalState((prev) => ({ ...prev, history: tmp }));
export const setGlobalToken = (tmp: string | undefined) => setGlobalState((prev) => ({ ...prev, token: tmp }));
export const setAnimulistData = (tmp: globalDataFormat["animuList"]) => setGlobalState((prev) => ({ ...prev, animuList: tmp }));
export const setDeepLink = (tmp: deeplinkFormat) => setGlobalState((prev) => ({ ...prev, deepLinks: [...prev.deepLinks, tmp] }));

export const setNotificationList = (tmp: NotificationExpanded[]) => setGlobalState((prev) => ({ ...prev, notifications: tmp }));

export const removeDeepLink = (name: string) => setGlobalState((prev) => ({ ...prev, deepLinks: prev.deepLinks.filter((item) => item.name != name) }));
export const setServiuceList = (tmp: serviceFormat[]) => setGlobalState((prev) => ({ ...prev, service: tmp }));

export const setAnilistUserData = (tmp: { [key: string]: any; } | undefined) => setGlobalState((prev) => ({ ...prev, anilist_user_data: tmp }));

window.addEventListener("focus", () => {
    console.log("FOCUS")
    setGlobalState((prev) => ({ ...prev, isAnimuFocus: true }))
});

window.addEventListener("blur", () => {
    console.log("BLUR")
    setGlobalState((prev) => ({ ...prev, isAnimuFocus: false }))
});

class InformationCacheInstance {
    anime: informationTmpProps = {
        anime: {
            title: {
                native: "Information Cache Instance",
                romaji: "Information Cache Instance"
            },
            id: ""
        }
    }

    constructor() {
        const cache = localStorage.getItem("informationCache")
        if (!cache) return
        try {
            this.anime = JSON.parse(cache)
        } catch (error) {
            console.error("Failed Load Information Cache")
        }
    }

    update = (anime: informationTmpProps | undefined) => {
        if (anime == undefined) return
        this.anime = unwrap(anime)
        localStorage.setItem("informationCache", JSON.stringify(anime))
    }
}

class PlayerCacheInstance {
    player: PlayerTmpProps = {
        anime: {
            title: {
                native: "Player Cache Instance",
                romaji: "Player Cache Instance"
            },
            id: ""
        },
        saveData: {
            pluginName: "",
            last_Time: 0,
            episode: "",
            type: ""
        },
        continewatch: false,
        episodelist: []
    }

    constructor() {
        const cache = localStorage.getItem("playerCache")
        if (!cache) return
        try {
            this.player = JSON.parse(cache)
        } catch (error) {
            console.error("Failed Load Player Cache")
        }
    }

    update = (player: PlayerTmpProps | undefined) => {
        if (player == undefined) return
        this.player = unwrap(player)
        localStorage.setItem("playerCache", JSON.stringify(player))
    }
}

if (!window["PlayerCache"]) {
    window["PlayerCache"] = new PlayerCacheInstance()
}
if (!window["informationCache"]) {
    window["informationCache"] = new InformationCacheInstance()
}

export const informationCache: InformationCacheInstance = window["informationCache"]
export const PlayerCache: PlayerCacheInstance = window["PlayerCache"]