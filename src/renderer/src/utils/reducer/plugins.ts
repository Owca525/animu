import { infoPluginPlayer } from "@renderer/plugins/allmanga";
import { infoPlugin } from "@renderer/plugins/anilistApi";
import { pluginFormat } from "../GlobalInterface";
import { AniZone } from "@renderer/plugins/anizone";
import { lycorisCafe } from "@renderer/plugins/lycoriscafe";

const initialState = {
    loadedPlugins: [infoPlugin, infoPluginPlayer, AniZone, lycorisCafe] as pluginFormat[],
    informationPlugin: infoPlugin,
    playerPlugin: undefined,
};

const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case "setPluginPlayer":
      return { ...state, playerPlugin: action.payload };
    case "setInformationPlugin":
        return { ...state, informationPlugin: action.payload };
    case "setLoadedPlugins":
        return { ...state, loadedPlugins: action.payload };
    case "ResetLoadedPlugins":
        return { informationPlugin: undefined, playerPlugin: undefined, loadedPlugins: [] };
    default:
      return state;
  }
};

export default userReducer;
