import { cardData, globalDataFormat } from "../types";
import { createStore } from "solid-js/store";

export const [globalState, setGlobalState] = createStore({
    incognito: false,
    history: { continue: [], history: [] }
} as globalDataFormat);

export const getGlobalCache = () => globalState;
export const setIncognitoMode = (tmp: boolean) => setGlobalState((prev) => ({...prev, incognito: tmp}));
export const setGlobalHistory = (tmp: { continue: cardData[], history: cardData[] }) => setGlobalState((prev) => ({...prev, history: { ...prev.history, ...tmp }}));
