import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "redux";

import pluginStore from "./reducer/plugins"

const rootReducer = combineReducers({
    plugin: pluginStore
});

const store = configureStore({
  reducer: rootReducer,
});

export default store;
