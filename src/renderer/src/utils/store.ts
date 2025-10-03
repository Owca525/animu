import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "redux";

import pluginStore from "./reducer/plugins"
import HomeData from "./reducer/home"
import Config from "./reducer/config"
import Global from "./reducer/global";

const rootReducer = combineReducers({
    plugin: pluginStore,
    home: HomeData,
    config: Config,
    global: Global
});

const store = configureStore({
  reducer: rootReducer,
});

export default store;
