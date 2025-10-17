import { infoPluginPlayer } from "@renderer/plugins/allmanga";
import { playerPluginFormat } from "../GlobalInterface";
import { AniZone } from "@renderer/plugins/anizone";
import { lycorisCafe } from "@renderer/plugins/lycoriscafe";
import { infoPlugin } from "@renderer/plugins/anilistApi";
import { GojoLive } from "@renderer/plugins/gojoLive";

const initialState = {
    loadedPlugins: [infoPluginPlayer, AniZone, lycorisCafe, GojoLive] as playerPluginFormat[],
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
