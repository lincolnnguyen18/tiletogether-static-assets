import { createAsyncThunk, createSlice, isAnyOf } from '@reduxjs/toolkit';
import { apiClient } from '../../app/apiClient';
import { getQueryParams } from '../Dashboard/Dashboard';
import _ from 'lodash';
import { notPresent } from '../../utils/equalityUtils';

const initialState = {
  files: null,
  file: null,
  primitives: {
    limit: 10,
    page: 1,
    noMoreFiles: false,
  },
  pending: [],
  errors: [],
};

export const getFiles = createAsyncThunk(
  'common/getFiles',
  async ({ location, loadMore, getRecommended }, { getState }) => {
    const fileSlice = getState().file;
    const { limit, page, noMoreFiles } = fileSlice.primitives;
    if (noMoreFiles) return;

    try {
      let params = getQueryParams(location);
      params.limit = limit;
      params.page = page;
      if (notPresent(loadMore)) {
        params.page = 1;
      }
      params = _.mapKeys(params, (__, key) => _.snakeCase(key));

      let response;
      if (notPresent(getRecommended)) {
        response = await apiClient.get('/files', { params });
      } else {
        response = await apiClient.get(`/files/${getRecommended}/recommend`, { params });
      }
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
      .addCase(getFiles.pending, (state, action) => {
        if (notPresent(action.meta.arg.loadMore)) {
          state.files = null;
          state.primitives.noMoreFiles = false;
        } else {
          state.pending.push('getFiles');
        }
      })
      .addCase(getFiles.fulfilled, (state, action) => {
        if (notPresent(action.meta.arg.loadMore)) {
          state.files = action.payload;
          state.primitives.page = 2;
        } else {
          state.files = state.files.concat(action.payload);
          state.pending = state.pending.filter((item) => item !== 'getFiles');
          state.primitives.page += 1;
        }

        if (action.payload.length < state.primitives.limit) {
          state.primitives.noMoreFiles = true;
        }
      })
      .addCase(getFileToEdit.rejected, (state, _) => {
        state.errors.push('getFileToEdit');
      })
      .addCase(getFileToView.rejected, (state, _) => {
        state.errors.push('getFileToView');
      })
      .addMatcher(
        isAnyOf(getFileToView.pending, getFileToEdit.pending), (state) => {
          state.file = null;
          state.errors = [];
        })
      .addMatcher(
        isAnyOf(getFileToView.fulfilled, getFileToEdit.fulfilled), (state, action) => {
          state.file = action.payload;
        });
  },
});

export const fileReducer = fileSlice.reducer;
