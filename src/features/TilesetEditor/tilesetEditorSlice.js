import _ from 'lodash';
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  primitives: {},
};

const tilesetEditorSlice = createSlice({
  name: 'tilesetCanvas',
  initialState,
  reducers: {
    setTilesetEditorPrimitives (state, action) {
      state.primitives = _.merge(state.primitives, action.payload);
    },
  },
});

export const { setTilesetEditorPrimitives } = tilesetEditorSlice.actions;

export const tilesetEditorReducer = tilesetEditorSlice.reducer;
