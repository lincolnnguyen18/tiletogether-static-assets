import { createSlice } from '@reduxjs/toolkit';

const initialState = {};

const fileViewerSlice = createSlice({
  name: 'file',
  initialState,
  reducers: {},
  extraReducers: () => {},
});

export const fileViewerReducer = fileViewerSlice.reducer;
