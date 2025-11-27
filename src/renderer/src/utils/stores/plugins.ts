import { infoPluginPlayer } from "@renderer/plugins/allmanga";
import { playerPluginFormat } from "../types";
import { AniZone } from "@renderer/plugins/anizone";
import { lycorisCafe } from "@renderer/plugins/lycoriscafe";
import { createStore } from "solid-js/store";
import { informationPluginManager } from "../pluginManager";
import { GojoLive } from "@renderer/plugins/gojoLive";

const initialState = {
    loadedPlugins: [infoPluginPlayer, AniZone, lycorisCafe, GojoLive] as playerPluginFormat[],
    informationPlugin: new informationPluginManager(),
    playerPlugin: undefined as playerPluginFormat | undefined,
    playerPluginCache: undefined
};

const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case "setPluginPlayer":
      return { ...state, playerPlugin: action.payload, playerPluginCache: undefined };
    case "setInformationPlugin":
        return { ...state, informationPlugin: action.payload };
    case "setLoadedPlugins":
        return { ...state, loadedPlugins: action.payload };
    case "setPlayerPluginCache":
        return { ...state, playerPluginCache: action.payload };
    case "ResetLoadedPlugins":
        return { informationPlugin: undefined, playerPlugin: undefined, loadedPlugins: [], playerPluginCache: undefined };
    default:
      return state;
  }
};

export default userReducer;

export const [globalState, setGlobalState] = createStore(initialState);

export const getPluginList = () => globalState.loadedPlugins;
export const getInformationPlugin = () => globalState.informationPlugin;
export const getPlayerPLugin = () => globalState.playerPlugin;
export const setPlayerPlugin = (plugin: playerPluginFormat | undefined) => setGlobalState((prev) => ({...prev, playerPlugin: plugin}));

