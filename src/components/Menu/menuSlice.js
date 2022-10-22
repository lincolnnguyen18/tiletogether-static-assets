import { createSlice } from '@reduxjs/toolkit';
import _ from 'lodash';

const initialState = {
  menu: {
    open: false,
    pos: { x: 0, y: 0 },
    width: 200,
    firstFocusable: null,
  },
  children: null,
};

export const menuSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    setMenu: (state, action) => {
      const newMenu = _.cloneDeep(state.menu);
      _.merge(newMenu, action.payload);
      state.menu = newMenu;
    },
    setMenuChildren: (state, action) => {
      state.children = action.payload;
    },
  },
});

export const { setMenu, setMenuChildren } = menuSlice.actions;

export const menuReducer = menuSlice.reducer;
