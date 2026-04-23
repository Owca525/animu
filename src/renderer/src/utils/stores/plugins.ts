import { playerPluginFormatList, playerPluginInstanceFormat, playerPluginManagerFormat, pluginRepoExpanded } from "../types";
import { createStore } from "solid-js/store";
import { informationPluginManager, PlayerPluginManager } from "../pluginManager";

const initialState = {
    loadedPlugins: [] as playerPluginManagerFormat["pluginList"],
    informationPlugin: new informationPluginManager(),
    pluginManager: new PlayerPluginManager(),
    playerPlugin: undefined as playerPluginInstanceFormat | undefined,
    pluginRepo: [] as pluginRepoExpanded[]
};

export const [globalState, setGlobalState] = createStore(initialState);

export const getPluginList = () => globalState.loadedPlugins;
export const getInformationPlugin = () => globalState.informationPlugin;
export const getPlayerPLugin = () => globalState.playerPlugin;
export const pluginManager = () => globalState.pluginManager;
export const getPluginRepo = () => globalState.pluginRepo;
export const setPluginRepo = (data: pluginRepoExpanded[]) => setGlobalState((prev) => ({ ...prev, pluginRepo: data }));
export const setPlayerPlugin = (plugin: playerPluginInstanceFormat | undefined) => setGlobalState((prev) => ({...prev, playerPlugin: plugin}));
export const setPluginPlayerList = (plugins: playerPluginFormatList[]) => setGlobalState((prev) => ({...prev, loadedPlugins: plugins}));

