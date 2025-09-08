import { infoPluginPlayer } from "@renderer/plugins/allmanga";
import { infoPlugin } from "@renderer/plugins/anilistApi";
import { pluginFormat } from "../GlobalInterface";
import { AniZone } from "@renderer/plugins/anizone";
import { lycorisCafe } from "@renderer/plugins/lycoriscafe";

const initialState = {
    loadedPlugins: [infoPlugin, infoPluginPlayer, AniZone, lycorisCafe] as pluginFormat[],
    informationPlugin: infoPlugin,
    playerPlugin: undefined,
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
