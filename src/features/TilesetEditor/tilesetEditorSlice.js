import _ from 'lodash';
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  primitives: {
    cursor: { pageX: window.innerWidth / 2, pageY: window.innerHeight / 2 },
    scale: 1,
    maxScale: 30,
    virtualScale: null,
    scaleFactor: 0.04,
  },
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
