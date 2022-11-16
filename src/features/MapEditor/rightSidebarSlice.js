import _ from 'lodash';
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  primitives: {
    selectedTileset: null,
  },
};

const mapRightSidebarSlice = createSlice({
  name: 'mapRightSidebar',
  initialState,
  reducers: {
    setMapRightSidebarPrimitives (state, action) {
      state.primitives = _.merge(state.primitives, action.payload);
    },
    assignMapRightSidebarPrimitives (state, action) {
      state.primitives = _.assign(state.primitives, action.payload);
    },
  },
});

export const { setMapRightSidebarPrimitives, assignMapRightSidebarPrimitives } = mapRightSidebarSlice.actions;

export const selectMapRightSidebarPrimitives = (state) => state.mapRightSidebar.primitives;

export const mapRightSidebarReducer = mapRightSidebarSlice.reducer;
