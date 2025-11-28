import { playerPluginFormat } from "../types";
import { createStore } from "solid-js/store";
import { informationPluginManager, PlayerPluginManager } from "../pluginManager";

const initialState = {
    loadedPlugins: [] as playerPluginFormat[],
    informationPlugin: new informationPluginManager(),
    pluginManager: new PlayerPluginManager(),
    playerPlugin: undefined as playerPluginFormat | undefined,
};

export const [globalState, setGlobalState] = createStore(initialState);

export const getPluginList = () => globalState.loadedPlugins;
export const getInformationPlugin = () => globalState.informationPlugin;
export const getPlayerPLugin = () => globalState.playerPlugin;
export const pluginManager = () => globalState.pluginManager;
export const setPlayerPlugin = (plugin: playerPluginFormat | undefined) => setGlobalState((prev) => ({...prev, playerPlugin: plugin}));
export const setPluginPlayerList = (plugins: playerPluginFormat[]) => setGlobalState((prev) => ({...prev, loadedPlugins: plugins}));

