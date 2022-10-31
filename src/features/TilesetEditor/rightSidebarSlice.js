import _ from 'lodash';
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  primitives: {
    colors: [],
    currentColor: '#000000',
  },
};

const tilesetRightSidebarSlice = createSlice({
  name: 'tilesetRightSidebar',
  initialState,
  reducers: {
    setTilesetRightSidebarPrimitives (state, action) {
      state.primitives = _.merge(state.primitives, action.payload);
    },
    assignTilesetRightSidebarPrimitives (state, action) {
      state.primitives = _.assign(state.primitives, action.payload);
    },
  },
});

export const { setTilesetRightSidebarPrimitives, assignTilesetRightSidebarPrimitives } = tilesetRightSidebarSlice.actions;

export const tilesetRightSidebarReducer = tilesetRightSidebarSlice.reducer;
