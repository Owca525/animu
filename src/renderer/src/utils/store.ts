import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "redux";

import pluginStore from "./reducer/plugins"
import HomeData from "./reducer/home"

const rootReducer = combineReducers({
    plugin: pluginStore,
    home: HomeData
});

const store = configureStore({
  reducer: rootReducer,
});

export default store;
