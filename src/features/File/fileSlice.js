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

export const getFileToEdit = createAsyncThunk(
  'file/getFileToEdit',
  async ({ id }) => {
    try {
      const response = await apiClient.get(`/files/${id}/edit`);
      return response.data.file;
    } catch (err) {
      throw new Error(err.response.data.error);
    }
  },
);

export const asyncLikeFile = createAsyncThunk(
  'file/likeFile',
  async ({ id, liked }) => {
    try {
      return apiClient.post(`/files/${id}/like`, { liked });
    } catch (err) {
      throw new Error(err.response.data.error);
    }
  },
);

export const postComment = createAsyncThunk(
  'file/postComment',
  async ({ fileId, content }) => {
    try {
      return apiClient.post(`/files/${fileId}/comment`, { content });
    } catch (err) {
      throw new Error(JSON.stringify(err.response.data.error));
    }
  },
);

const fileSlice = createSlice({
  name: 'file',
  initialState,
  reducers: {
    setFileLike: (state, action) => {
      const { username, liked, fileId } = action.payload;
      if (state.file && (state.file._id === fileId || state.file.id === fileId)) {
        if (liked) {
          state.file.likes.push({ username, createdAt: Date.now() });
          state.file.likeCount += 1;
        } else {
          state.file.likes = state.file.likes.filter(l => l.username !== username);
          state.file.likeCount -= 1;
        }
      }
      if (state.files) {
        const fileIndex = state.files.findIndex(file => file._id === fileId);
        if (fileIndex !== -1) {
          if (liked) {
            state.files[fileIndex].likes.push({ username, createdAt: Date.now() });
            state.files[fileIndex].likeCount += 1;
          } else {
            state.files[fileIndex].likes = state.files[fileIndex].likes.filter(l => l.username !== username);
            state.files[fileIndex].likeCount -= 1;
          }
        }
      }
    },
  },
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
      .addCase(postComment.fulfilled, (state, action) => {
        state.file = action.payload.data.file;
      })
      .addMatcher(isAnyOf(getFiles.rejected, getFileToEdit.rejected, getFileToView.rejected), (state, action) => {
        const actionName = getActionName(action);
        state.errors.push(actionName);
        state.pending = _.pull(state.pending, actionName);
      })
      .addMatcher(isAnyOf(getFiles.fulfilled, getFileToEdit.fulfilled, getFileToView.fulfilled), (state, action) => {
        state.pending = _.pull(state.pending, getActionName(action));
      })
      .addMatcher(isAnyOf(getFileToEdit.pending, getFileToView.pending), (state, action) => {
        state.errors = [];
        state.file = null;
        state.pending.push(getActionName(action));
      })
      .addMatcher(isAnyOf(getFileToView.fulfilled, getFileToEdit.fulfilled), (state, action) => {
        state.file = action.payload;
      });
  },
});

export const { setFileLike } = fileSlice.actions;

export const fileReducer = fileSlice.reducer;
