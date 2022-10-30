import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiClient } from '../../app/apiClient';
import { wait } from '../../utils/timeUtils';
import _ from 'lodash';

const initialState = {
  files: [],
  lastFile: null,
  limit: 10,
  pending: [],
};

export const getRecommendation = createAsyncThunk(
  'common/getRecommendation',
  async (payload) => {
    try {
      await wait(500);
      const params = _.mapKeys(payload, (__, key) => _.snakeCase(key));
      const response = await apiClient.get(`/files/${payload.id}/recommend`, { params });
      return response.data.files;
    } catch (err) {
      throw new Error(err.response.data.error);
    }
  },
);

export const getMoreRecommendation = createAsyncThunk(
  'common/getMoreRecommendation',
  async (payload) => {
    try {
      await wait(500);
      const response = await apiClient.get(`/files/${payload.id}/recommend`, { params: payload });
      return response.data.files;
    } catch (err) {
      throw new Error(err.response.data.error);
    }
  },
);

const fileViewerSlice = createSlice({
  name: 'file',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getRecommendation.pending, (state) => {
        state.files = [];
      })
      .addCase(getRecommendation.fulfilled, (state, action) => {
        state.files = action.payload;
        state.lastFile = action.payload[state.limit - 1];
      })
      .addCase(getMoreRecommendation.pending, (state) => {
        state.pending.push('getMoreFiles');
      })
      .addCase(getMoreRecommendation.fulfilled, (state, action) => {
        state.files = state.files.concat(action.payload);
        state.lastFile = action.payload[state.limit - 1];
        state.pending = state.pending.filter((item) => item !== 'getMoreFiles');
      });
  },
});

export const fileViewerReducer = fileViewerSlice.reducer;
