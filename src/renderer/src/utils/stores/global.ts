import { animeOpeningsFormat, cardData, deeplinkFormat, globalDataFormat, NotificationProps, NotificationPropsExpanded, serviceFormat, themeMetadata } from "../types";
import { createStore } from "solid-js/store";
import { Socket } from "socket.io-client";

export const [globalState, setGlobalState] = createStore<globalDataFormat>({
    incognito: false,
    history: [],
    deeplinkRunned: false,
    loadedTheme: [],
    activeThemes: new Map(),
    token: undefined,
    animuList: [],
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
export const getSocket = () => globalState.socket?.instance;
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
export const setGlobalHistory = (tmp: cardData[]) => setGlobalState((prev) => ({ ...prev, history: [...tmp] }));
export const setGlobalToken = (tmp: string | undefined) => setGlobalState((prev) => ({ ...prev, token: tmp }));
export const setAnimulistData = (tmp: globalDataFormat["animuList"]) => setGlobalState((prev) => ({ ...prev, animuList: tmp }));
export const setDeepLink = (tmp: deeplinkFormat) => setGlobalState((prev) => ({ ...prev, deepLinks: [...prev.deepLinks, tmp] }));
export const addNotification = (tmp: NotificationProps) => setGlobalState((prev) => ({ ...prev, notifications: [...prev.notifications, { ...tmp, id: crypto.randomUUID() }] }));
export const modifyNotification = (tmp: NotificationPropsExpanded) => setGlobalState((prev) => ({ ...prev, notifications: prev.notifications.map((v) => v["id"] == tmp["id"] ? tmp : v) }));

export const removeDeepLink = (name: string) => setGlobalState((prev) => ({ ...prev, deepLinks: prev.deepLinks.filter((item) => item.name != name) }));
export const setServiuceList = (tmp: serviceFormat[]) => setGlobalState((prev) => ({ ...prev, service: tmp }));

export const setAnilistUserData = (tmp: { [key: string]: any; } | undefined) => setGlobalState((prev) => ({ ...prev, anilist_user_data: tmp }));

window.addEventListener("focus", () => {
    setGlobalState((prev) => ({ ...prev, isAnimuFocus: true }))
});

window.addEventListener("blur", () => {
    setGlobalState((prev) => ({ ...prev, isAnimuFocus: false }))
});