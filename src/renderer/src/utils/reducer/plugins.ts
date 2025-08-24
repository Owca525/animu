import { infoPluginPlayer } from "@renderer/plugins/allmanga";
import { infoPlugin } from "@renderer/plugins/anilistApi";
import { pluginFormat } from "../GlobalInterface";

const initialState = {
    loadedPlugins: [infoPlugin, infoPluginPlayer] as pluginFormat[],
    informationPlugin: infoPlugin,
    playerPlugin: infoPluginPlayer,
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
