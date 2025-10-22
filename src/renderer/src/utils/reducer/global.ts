import { globalDataFormat } from "../GlobalInterface";

const initialState: globalDataFormat = {
    incognito: false,
    history: { continue: [], history: [] }
};

const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case "setIcognitoMode":
      return { ...state, incognito: action.payload };
    case "setNewContinueWatch":
      return { ...state, history: { ...state.history, continue: action.payload} };
    case "setNewHistory":
      return { ...state, history: { ...state.history, history: action.payload} };
    case "ClearGlobal":
        return { incognito: false, history: { continue: [], history: [] } };
    default:
      return state;
  }
};

export default userReducer;
