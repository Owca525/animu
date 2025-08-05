const initialState = {
    id: undefined,
    episodes_data: undefined
};

const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case "setInformationID":
      return { ...state, id: action.payload };
    case "setInformationEpisodesData":
      return { ...state, episodes_data: action.payload };
    case "ClearInformation":
        return { id: undefined, episodes_data: undefined };
    default:
      return state;
  }
};

export default userReducer;
