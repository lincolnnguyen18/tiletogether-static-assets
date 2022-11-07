import { createAsyncThunk, createSlice, isAnyOf, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';
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
  statuses: {},
  errors: {},
};

export const asyncGetFiles = createAsyncThunk(
  'file/getFiles',
  async ({ location, loadMore, getRecommended }, { getState }) => {
    const fileSlice = getState().file;
    const { limit, page, noMoreFiles } = fileSlice.primitives;
    if (noMoreFiles) return;

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
  },
);

export const asyncGetFileToView = createAsyncThunk(
  'file/getFileToView',
  async ({ id }) => {
    const response = await apiClient.get(`/files/${id}`);
    return response.data.file;
  },
);

export const asyncGetFileToEdit = createAsyncThunk(
  'file/getFileToEdit',
  async ({ id }) => {
    const response = await apiClient.get(`/files/${id}/edit`);
    return response.data.file;
  },
);

export const asyncPatchFile = createAsyncThunk(
  'file/patchFile',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/files/${id}`, updates);
      return response.data.file;
    } catch (err) {
      return rejectWithValue(err.response.data.error);
    }
  },
);

export const asyncDeleteFile = createAsyncThunk(
  'file/deleteFile',
  async ({ id }) => {
    const response = await apiClient.delete(`/files/${id}`);
    return response.data.file;
  },
);

export const asyncLikeFile = createAsyncThunk(
  'file/likeFile',
  async ({ id, liked }) => {
    return apiClient.post(`/files/${id}/like`, { liked });
  },
);

export const asyncPostComment = createAsyncThunk(
  'file/postComment',
  async ({ fileId, content }) => {
    return apiClient.post(`/files/${fileId}/comment`, { content });
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
    clearFileErrors: state => {
      state.errors = {};
    },
    clearFileStatus: (state, action) => {
      const { status } = action.payload;
      state.statuses[status] = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(asyncGetFiles.pending, (state, action) => {
        if (notPresent(action.meta.arg.loadMore)) {
          state.files = null;
          state.primitives.noMoreFiles = false;
        }
      })
      .addCase(asyncGetFiles.fulfilled, (state, action) => {
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
      .addCase(asyncPatchFile.fulfilled, (state, action) => {
        const fieldsToUpdate = Object.keys(action.meta.arg.updates);
        const pickedFile = _.pick(action.payload, fieldsToUpdate);
        _.merge(state.file, pickedFile);
        // replace the sharedWith field
        state.file.sharedWith = action.payload.sharedWith;
      })
      .addCase(asyncPostComment.fulfilled, (state, action) => {
        state.file = action.payload.data.file;
      })
      .addMatcher(isPending, (state, action) => {
        state.errors = {};
        state.statuses[getActionName(action)] = 'pending';
      })
      .addMatcher(isFulfilled, (state, action) => {
        state.errors = {};
        state.statuses[getActionName(action)] = 'fulfilled';
      })
      .addMatcher(isRejected, (state, action) => {
        state.statuses[getActionName(action)] = 'rejected';
        state.errors = action.payload;
      })
      .addMatcher(isAnyOf(asyncGetFileToView.fulfilled, asyncGetFileToEdit.fulfilled), (state, action) => {
        state.file = action.payload;
      })
      .addMatcher(isAnyOf(asyncGetFileToView.pending, asyncGetFileToEdit.pending), (state) => {
        state.file = null;
      });
  },
});

export const { setFileLike, clearFileErrors, clearFileStatus } = fileSlice.actions;

export const selectDashboardStatuses = state => state.file.statuses;
export const selectDashboardErrors = state => state.file.errors;

export const fileReducer = fileSlice.reducer;
