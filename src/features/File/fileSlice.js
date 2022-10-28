import { createAsyncThunk, createSlice, isAnyOf } from '@reduxjs/toolkit';
import { apiClient } from '../../app/apiClient';
import { wait } from '../../utils/timeUtils';
import _ from 'lodash';

const initialState = {
  files: null,
  file: null,
  lastFile: null,
  limit: 10,
  pending: [],
  errors: [],
};

export const getFiles = createAsyncThunk(
  'common/getFiles',
  async (payload) => {
    try {
      await wait(500);
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
      await wait(500);
      const response = await apiClient.get('/files', { params: payload });
      return response.data.files;
    } catch (err) {
      throw new Error(err.response.data.error);
    }
  },
);

export const getFileToView = createAsyncThunk(
  'common/getFileToView',
  async ({ id }) => {
    try {
      await wait(500);
      const response = await apiClient.get(`/files/${id}`);
      return response.data.file;
    } catch (err) {
      throw new Error(err.response.data.error);
    }
  },
);

export const getFileToEdit = createAsyncThunk(
  'common/getFileToEdit',
  async ({ id }) => {
    try {
      await wait(500);
      const response = await apiClient.get(`/files/${id}/edit`);
      return response.data.file;
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
      })
      .addCase(getFileToEdit.rejected, (state, _) => {
        state.errors.push('getFileToEdit');
      })
      .addMatcher(
        isAnyOf(getFileToView.pending, getFileToEdit.pending), (state) => {
          state.file = null;
          state.errors = state.errors.filter((item) => item !== 'getFileToEdit');
        })
      .addMatcher(
        isAnyOf(getFileToView.fulfilled, getFileToEdit.fulfilled), (state, action) => {
          state.file = action.payload;
        });
  },
});

export const fileReducer = fileSlice.reducer;
