import { UUIDTypes } from "uuid";
import { cardData, globalDataFormat, themeMetadata } from "../types";
import { createStore } from "solid-js/store";

export const [globalState, setGlobalState] = createStore({
    incognito: false,
    history: [],
    deeplinkRunned: false,
    loadedTheme: [],
    activeThemes: new Map(),
    token: undefined,
    animuList: []
} as globalDataFormat);

export const getGlobalCache = () => globalState;
export const loadedTheme = () => globalState.loadedTheme;
export const activeThemes = () => globalState.activeThemes;
export const animulistData = () => globalState.animuList;
export const setActiveThemes = (tmp: Map<number, themeMetadata>) => setGlobalState((prev) => ({...prev, activeThemes: tmp}));
export const setGlobalTheme = (tmp: themeMetadata[]) => setGlobalState((prev) => ({...prev, loadedTheme: tmp}));
export const setIncognitoMode = (tmp: boolean) => setGlobalState((prev) => ({...prev, incognito: tmp}));
export const setDeeplinkRunned = (tmp: boolean) => setGlobalState((prev) => ({...prev, deeplinkRunned: tmp}));
export const setGlobalHistory = (tmp: cardData[]) => setGlobalState((prev) => ({...prev, history: [...tmp]}));
export const setGlobalToken = (tmp: UUIDTypes | undefined) => setGlobalState((prev) => ({...prev, token: tmp}));
export const setAnimulistData = (tmp: globalDataFormat["animuList"]) => setGlobalState((prev) => ({...prev, animuList: tmp}));

