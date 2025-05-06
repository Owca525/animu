import { defaultConfig } from "../config";

const userReducer = (state = defaultConfig, action) => {
  switch (action.type) {
    case "setConfig":
      return { ...action.payload };
    case "resetConfig":
        return { ...defaultConfig };
    default:
      return state;
  }
};

export default userReducer;
