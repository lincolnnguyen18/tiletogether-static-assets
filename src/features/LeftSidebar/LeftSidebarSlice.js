import { createSlice } from '@reduxjs/toolkit';
import _ from 'lodash';

const intitialState = {
  primitives: {
    drawerOpen: false,
    drawerPage: null,
  },
};

const leftSidebarSlice = createSlice({
  name: 'leftSidebar',
  initialState: intitialState,
  reducers: {
    setLeftSidebarPrimitives: (state, action) => {
      state.primitives = _.merge(state.primitives, action.payload);
    },
  },
});

export const { setLeftSidebarPrimitives } = leftSidebarSlice.actions;

export const leftSidebarReducer = leftSidebarSlice.reducer;
