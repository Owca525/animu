import { homeData } from "../GlobalInterface";

const initialState: homeData = {
    isLoading: false,
    isError: false,
    data: [],
    search: "",
    page: 1,
    stopScrolling: false,
    containerLoading: false,
    localSearch: false
};

const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case "setAllHomeData":
      return { ...state, ...action.payload };
    case "setLoadingHome":
      return { ...state, isLoading: action.payload };
    case "setErrorHome":
      return { ...state, isError: action.payload };
    case "setSearch":
      return { ...state, search: action.payload };
    case "setPage":
      return { ...state, page: action.payload };
    case "setStopScrolling":
      return { ...state, stopScrolling: action.payload };
    case "setcontainerLoading":
      return { ...state, containerLoading: action.payload };
    case "setLocalSearch":
      return { ...state, localSearch: action.payload };
    case "resetHomeData":
        return { ...initialState };
    default:
      return state;
  }
};

export default userReducer;
