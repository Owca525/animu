
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const initialState = {
    hover: false,
};

const sidebarSlice = createSlice({
    name: 'HoverSidebar',
    initialState,
    reducers: {
        setHover (state, action: PayloadAction<boolean>) {
            state.hover = action.payload;
        }
    },
});

export const { setHover } = sidebarSlice.actions;
export default sidebarSlice.reducer;