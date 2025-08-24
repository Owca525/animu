import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "redux";

import pluginStore from "./reducer/plugins"
import HomeData from "./reducer/home"
import Config from "./reducer/config"
import information from "./reducer/information";
import Global from "./reducer/global";

const rootReducer = combineReducers({
    plugin: pluginStore,
    home: HomeData,
    config: Config,
    information: information,
    global: Global
});

const store = configureStore({
  reducer: rootReducer,
});

export default store;
