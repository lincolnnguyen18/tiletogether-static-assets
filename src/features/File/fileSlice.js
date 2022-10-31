import { createAsyncThunk, createSlice, isAnyOf } from '@reduxjs/toolkit';
import { apiClient } from '../../app/apiClient';
import { getQueryParams } from '../Dashboard/Dashboard';
import _ from 'lodash';
import { notPresent } from '../../utils/equalityUtils';
import { getActionName } from '../../utils/stringUtils';

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
  'file/getFiles',
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
  'file/getFileToView',
  async ({ id }) => {
    try {
      const response = await apiClient.get(`/files/${id}`);
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
          state.primitives.page += 1;
        }
        if (action.payload.length < state.primitives.limit) {
          state.primitives.noMoreFiles = true;
        }
      })
      .addMatcher(isAnyOf(getFiles.rejected, getFileToView.rejected), (state, action) => {
        const actionName = getActionName(action);
        state.errors.push(actionName);
        state.pending = _.pull(state.pending, actionName);
      })
      .addMatcher(isAnyOf(getFiles.fulfilled, getFileToView.fulfilled), (state, action) => {
        state.pending = _.pull(state.pending, getActionName(action));
      })
      .addMatcher(isAnyOf(getFileToView.pending), (state, action) => {
        state.errors = [];
        state.file = null;
        state.pending.push(getActionName(action));
      })
      .addMatcher(
        isAnyOf(getFileToView.fulfilled), (state, action) => {
          state.file = action.payload;
        });
  },
});

export const fileReducer = fileSlice.reducer;
