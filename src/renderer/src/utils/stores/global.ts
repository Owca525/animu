import { cardData, globalDataFormat } from "../types";
import { createStore } from "solid-js/store";

export const [globalState, setGlobalState] = createStore({
    incognito: false,
    history: [],
    deeplinkRunned: false
} as globalDataFormat);

export const getGlobalCache = () => globalState;
export const setIncognitoMode = (tmp: boolean) => setGlobalState((prev) => ({...prev, incognito: tmp}));
export const setDeeplinkRunned = (tmp: boolean) => setGlobalState((prev) => ({...prev, deeplinkRunned: tmp}));
export const setGlobalHistory = (tmp: cardData[]) => setGlobalState((prev) => ({...prev, history: [...tmp]}));

