// reducers/index.ts
import { combineReducers } from 'redux';
import userReducer from "./sidebar";

const rootReducer = combineReducers({
    sidebar: userReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;