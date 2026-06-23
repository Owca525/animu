import { informationPluginInstanceFormat, playerPluginInstanceFormat, pluginRepoExpanded, pluginsGlobalFormat } from "../types";
import { createStore } from "solid-js/store";
import pluginManager, { InformationPluginInstance, playerPluginInstance } from "../pluginManager";

const initialState: pluginsGlobalFormat = {
    informationPluginLoaded: [],
    playerPluginLoaded: [],

    informationPlugin: new InformationPluginInstance,
    playerPlugin: new playerPluginInstance,

    pluginRepo: [] as pluginRepoExpanded[]
};

export const [globalState, setGlobalState] = createStore<pluginsGlobalFormat>(initialState);

export const getPlayerPluginList = () => structuredClone(pluginManager.playerPluginList);
export const getInformationPluginList = () => structuredClone(pluginManager.informationPluginList);
export const getAllPluginList = () => [...structuredClone(pluginManager.playerPluginList), ...structuredClone(pluginManager.informationPluginList)];

export const getInformationPlugin = () => globalState.informationPlugin;
export const getPlayerPLugin = () => globalState.playerPlugin;
export const getPluginRepo = () => globalState.pluginRepo;

export const setPluginRepo = (data: pluginRepoExpanded[]) => setGlobalState((prev) => ({ ...prev, pluginRepo: data }));

export const setPlayerPlugin = (plugin: playerPluginInstanceFormat) => setGlobalState((prev) => ({...prev, playerPlugin: plugin}));
export const setInformationPlugin = (plugin: informationPluginInstanceFormat) => setGlobalState((prev: any) => ({...prev, informationPlugin: plugin}));
