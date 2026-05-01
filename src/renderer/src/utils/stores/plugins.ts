import { informationPluginInstanceFormat, playerPluginInstanceFormat, PluginLoadedFormat, pluginRepoExpanded, pluginsGlobalFormat } from "../types";
import { createStore } from "solid-js/store";
import { InformationPluginInstance, playerPluginInstance, PluginManager } from "../pluginManager";

const initialState: pluginsGlobalFormat = {
    informationPluginLoaded: [],
    playerPluginLoaded: [],

    informationPlugin: new InformationPluginInstance,
    playerPlugin: new playerPluginInstance,

    pluginManager: new PluginManager(),
    pluginRepo: [] as pluginRepoExpanded[]
};

export const [globalState, setGlobalState] = createStore<pluginsGlobalFormat>(initialState);

export const getPlayerPluginList = () => globalState.playerPluginLoaded;
export const getInformationPluginList = () => globalState.informationPluginLoaded;
export const getAllPluginList = () => [...globalState.playerPluginLoaded, ...globalState.informationPluginLoaded];

export const getInformationPlugin = () => globalState.informationPlugin;
export const getPlayerPLugin = () => globalState.playerPlugin;
export const pluginManager = () => globalState.pluginManager;
export const getPluginRepo = () => globalState.pluginRepo;

export const setPluginRepo = (data: pluginRepoExpanded[]) => setGlobalState((prev) => ({ ...prev, pluginRepo: data }));

export const setPlayerPlugin = (plugin: playerPluginInstanceFormat) => setGlobalState((prev) => ({...prev, playerPlugin: plugin}));
export const setInformationPlugin = (plugin: informationPluginInstanceFormat) => setGlobalState((prev: any) => ({...prev, informationPlugin: plugin}));

export const setPluginPlayerList = (plugins: PluginLoadedFormat[]) => setGlobalState((prev) => ({...prev, playerPluginLoaded: plugins}));
export const setInformationPluginList = (plugins: PluginLoadedFormat[]) => setGlobalState((prev) => ({...prev, informationPluginLoaded: plugins}));
