import { createStore } from "solid-js/store";
import { SettingsConfig } from "../types";

export const [globalState, setGlobalState] = createStore<SettingsConfig>(undefined as any);

export const getConfig = () => globalState;
export const setConfig = (config: SettingsConfig) => setGlobalState(config);
