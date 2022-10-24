import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiClient } from '../../app/apiClient';
import { wait } from '../../utils/timeUtils';
import _ from 'lodash';

const initialState = {
  files: null,
  lastFile: null,
  limit: 10,
  pending: [],
};

export const getFiles = createAsyncThunk(
  'common/getFiles',
  async (payload) => {
    try {
      await wait(1000);
      const params = _.mapKeys(payload, (__, key) => _.snakeCase(key));
      const response = await apiClient.get('/files', { params });
      return response.data.files;
    } catch (err) {
      throw new Error(err.response.data.error);
    }
  },
);

export const getMoreFiles = createAsyncThunk(
  'common/getMoreFiles',
  async (payload) => {
    try {
      await wait(1000);
      const response = await apiClient.get('/files', { params: payload });
      return response.data.files;
    } catch (err) {
      throw new Error(err.response.data.error);
    }
  },
);

const fileSlice = createSlice({
  name: 'file',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getFiles.pending, (state) => {
        state.files = null;
      })
      .addCase(getFiles.fulfilled, (state, action) => {
        state.files = action.payload;
        state.lastFile = action.payload[state.limit - 1];
      })
      .addCase(getMoreFiles.pending, (state) => {
        state.pending.push('getMoreFiles');
      })
      .addCase(getMoreFiles.fulfilled, (state, action) => {
        state.files = state.files.concat(action.payload);
        state.lastFile = action.payload[state.limit - 1];
        state.pending = state.pending.filter((item) => item !== 'getMoreFiles');
      });
  },
});

export const fileReducer = fileSlice.reducer;
