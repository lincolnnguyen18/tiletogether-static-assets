import { createSlice } from '@reduxjs/toolkit';
import _ from 'lodash';

const initialState = {
  primitives: {
    currentSearchKeywords: '',
    // currentPage; home, likes, your-files, shared-files
    currentPage: 'home',
    sidebarOpen: false,
  },
  // user; { username, email }
  user: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setDashboardPrimitives: (state, action) => {
      state.primitives = _.merge(state.primitives, action.payload);
    },
    replaceDashboardPrimitives: (state, action) => {
      _.assign(state.primitives, action.payload);
    },
  },
});

export const { setDashboardPrimitives, replaceDashboardPrimitives } = dashboardSlice.actions;

export const dashboardReducer = dashboardSlice.reducer;
