const initialState = {
    incognito: false
};

const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case "setIcognitoMode":
      return { ...state, incognito: action.payload };
    case "ClearGlobal":
        return { incognito: false };
    default:
      return state;
  }
};

export default userReducer;
