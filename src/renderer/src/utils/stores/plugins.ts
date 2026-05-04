import { informationPluginInstanceFormat, playerPluginInstanceFormat, pluginRepoExpanded, pluginsGlobalFormat } from "../types";
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

export const getPlayerPluginList = () => structuredClone(globalState.pluginManager.playerPluginList);
export const getInformationPluginList = () => structuredClone(globalState.pluginManager.informationPluginList);
export const getAllPluginList = () => [...structuredClone(globalState.pluginManager.playerPluginList), ...structuredClone(globalState.pluginManager.informationPluginList)];

export const getInformationPlugin = () => globalState.informationPlugin;
export const getPlayerPLugin = () => globalState.playerPlugin;
export const pluginManager = () => globalState.pluginManager;
export const getPluginRepo = () => globalState.pluginRepo;

export const setPluginRepo = (data: pluginRepoExpanded[]) => setGlobalState((prev) => ({ ...prev, pluginRepo: data }));

export const setPlayerPlugin = (plugin: playerPluginInstanceFormat) => setGlobalState((prev) => ({...prev, playerPlugin: plugin}));
export const setInformationPlugin = (plugin: informationPluginInstanceFormat) => setGlobalState((prev: any) => ({...prev, informationPlugin: plugin}));
