import { UUIDTypes } from "uuid";
import { cardData, deeplinkFormat, globalDataFormat, serviceFormat, themeMetadata } from "../types";
import { createStore } from "solid-js/store";
import { Socket } from "socket.io-client";

export const [globalState, setGlobalState] = createStore({
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
    anilist_user_data: undefined
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
export const setSocket = (tmp: Socket) => setGlobalState((prev) => ({...prev, socket: { ...prev.socket as any, instance: tmp }}));
export const setSocketRoom = (tmp: string) => setGlobalState((prev) => ({...prev, socket: { ...prev.socket as any, currentRoom: tmp }}));
export const setActiveThemes = (tmp: Map<number, themeMetadata>) => setGlobalState((prev) => ({...prev, activeThemes: tmp}));
export const setGlobalTheme = (tmp: themeMetadata[]) => setGlobalState((prev) => ({...prev, loadedTheme: tmp}));
export const setIncognitoMode = (tmp: boolean) => setGlobalState((prev) => ({...prev, incognito: tmp}));
export const setDeeplinkRunned = (tmp: boolean) => setGlobalState((prev) => ({...prev, deeplinkRunned: tmp}));
export const setGlobalHistory = (tmp: cardData[]) => setGlobalState((prev) => ({...prev, history: [...tmp]}));
export const setGlobalToken = (tmp: UUIDTypes | undefined) => setGlobalState((prev) => ({...prev, token: tmp}));
export const setAnimulistData = (tmp: globalDataFormat["animuList"]) => setGlobalState((prev) => ({...prev, animuList: tmp}));
export const setDeepLink = (tmp: deeplinkFormat) => setGlobalState((prev) => ({...prev, deepLinks: [...prev.deepLinks, tmp]}));
export const removeDeepLink = (name: string) => setGlobalState((prev) => ({...prev, deepLinks: prev.deepLinks.filter((item) => item.name != name)}));
export const ActiveService = (tmp: serviceFormat[]) => setGlobalState((prev) => ({...prev, service: tmp}));
export const FindService = (tmp: string) => globalState.service.find((item) => item.name == tmp);
export const DisableService = (tmp: serviceFormat) => setGlobalState((prev) => ({
    ...prev, 
    service: prev.service.map((v) => {
        if (v.uuid == tmp.uuid) {
            clearInterval(v.interval)
            return { ...v, interval: undefined }
        }
        return v
    }).filter((val) => val.uuid != tmp.uuid)
}));

export const setAnilistUserData = (tmp: { [key: string]: any; } | undefined) => setGlobalState((prev) => ({...prev, anilist_user_data: tmp}));