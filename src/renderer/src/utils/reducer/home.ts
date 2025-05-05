import { homeData } from "../GlobalInterface";

const initialState: homeData = {
    isLoading: false,
    isError: false,
    data: []
};

const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case "setAllHomeData":
      return { ...state, ...action.payload };
    case "setLoadingHome":
      return { ...state, isLoading: action.payload };
    case "setErrorHome":
      return { ...state, isError: action.payload };
    case "resetHomeData":
        return { ...initialState };
    default:
      return state;
  }
};

export default userReducer;
