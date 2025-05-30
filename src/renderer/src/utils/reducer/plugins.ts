import { infoPluginPlayer } from "@renderer/plugins/allmanga";
import { infoPlugin } from "@renderer/plugins/anilistApi";

const initialState = {
    informationPlugin: infoPlugin,
    playerPlugin: infoPluginPlayer
};

const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case "setPluginPlayer":
      return { ...state, playerPlugin: action.payload };
    case "setInformationPlugin":
        return { ...state, informationPlugin: action.payload };
    case "ResetLoadedPlugins":
        return { informationPlugin: null, playerPlugin: null };
    default:
      return state;
  }
};

export default userReducer;
