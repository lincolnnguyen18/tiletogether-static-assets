import { createAsyncThunk, createSlice, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';
import { apiClient } from '../../app/apiClient';
import { getQueryParams } from '../Dashboard/Dashboard';
import _ from 'lodash';
import { notPresent } from '../../utils/equalityUtils';
import { getActionName } from '../../utils/stringUtils';

const initialState = {
  files: null,
  file: null,
  sortCommentsBy: 'date',
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

export const asyncCreateFile = createAsyncThunk(
  'file/createFile',
  async ({ file }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/files', file);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response.data.error);
    }
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
  async ({ fileId, content, parentId }) => {
    return apiClient.post(`/files/${fileId}/comment`, { content, parentId });
  },
);

export const asyncLikeComment = createAsyncThunk(
  'file/likeComment',
  async ({ id, commentId, liked }) => {
    return apiClient.post(`/files/${id}/${commentId}/like`, { liked });
  },
);

const fileSlice = createSlice({
  name: 'file',
  initialState,
  reducers: {
    sortComments: (state, action) => {
      const { type } = action.payload;
      state.sortCommentsBy = type;
    },
    setCommentLike: (state, action) => {
      const { username, liked, fileId, commentId } = action.payload;
      if (state.file && (state.file._id === fileId || state.file.id === fileId)) {
        const commentIdx = state.file.comments.findIndex(c => c._id === commentId);
        if (liked) {
          state.file.comments[commentIdx].likes.push({ username, createdAt: Date.now() });
          state.file.comments[commentIdx].likeCount += 1;
        } else {
          state.file.comments[commentIdx].likes = state.file.comments[commentIdx].likes.filter(l => l.username !== username);
          state.file.comments[commentIdx].likeCount -= 1;
        }
      }
      if (state.files) {
        const fileIndex = state.files.findIndex(file => file._id === fileId);
        if (fileIndex !== -1) {
          const commentIdx = state.files[fileIndex].comments.findIndex(comment => comment._id === commentId);
          if (liked) {
            state.files[fileIndex].comments[commentIdx].likes.push({ username, createdAt: Date.now() });
            state.files[fileIndex].comments[commentIdx].likeCount += 1;
          } else {
            state.files[fileIndex].comments[commentIdx].likes = state.files[fileIndex].comments[commentIdx].likes.filter(l => l.username !== username);
            state.files[fileIndex].comments[commentIdx].likeCount -= 1;
          }
        }
      }
    },
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
        // console.log(action.payload);
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
      .addCase(asyncPostComment.fulfilled, (state, action) => {
        // only update file comments
        state.file.comments = action.payload.data.file.comments;
      })
      .addCase(asyncGetFileToView.fulfilled, (state, action) => {
        // console.log(action.payload);
        state.file = action.payload;
      })
      .addCase(asyncGetFileToView.pending, (state) => {
        state.file = null;
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
        // console.log(action.payload, getActionName(action));
        state.errors = action.payload;
      });
  },
});

export const { setFileLike, clearFileErrors, clearFileStatus, sortComments, setCommentLike } = fileSlice.actions;

export const selectFileStatuses = state => state.file.statuses;
export const selectFileErrors = state => state.file.errors;

export const fileReducer = fileSlice.reducer;
