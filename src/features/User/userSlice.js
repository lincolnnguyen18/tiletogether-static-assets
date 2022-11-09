import Cookies from 'js-cookie';
import { createAsyncThunk, createSlice, isAnyOf, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';
import { apiClient } from '../../app/apiClient';
import { getActionName } from '../../utils/stringUtils';

const initialState = {
  primitives: {
    // { username, email }
    user: null,
  },
  statuses: {},
  errors: {},
};

export const asyncGetUser = createAsyncThunk(
  'user/getUser',
  // payload; { email, password } or null if using token
  async (payload) => {
    const response = await apiClient.get('/users', { params: payload });
    return response.data;
  },
);

export const asyncPostUser = createAsyncThunk(
  'user/postUser',
  async (payload) => {
    try {
      const response = await apiClient.post('/users', payload);
      return response.data;
    } catch (err) {
      throw new Error(JSON.stringify(err.response.data.error));
    }
  },
);

export const asyncDeleteUser = createAsyncThunk(
  'user/deleteUser',
  async (payload) => {
    const response = await apiClient.delete('/users/deregister', { params: payload });
    return response.data;
  },
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    logout: (state) => {
      state.primitives.user = null;
      Cookies.remove('token');
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(isPending, (state, action) => {
        state.errors = {};
        state.statuses[getActionName(action)] = 'pending';
      })
      .addMatcher(isRejected, (state, action) => {
        state.statuses[getActionName(action)] = 'rejected';
        state.errors = action.payload;

        // if is asyncGetUser then set user to null
        if (getActionName(action) === 'asyncGetUser') {
          state.primitives.user = null;
        }
      })
      .addMatcher(isFulfilled, (state, action) => {
        state.errors = {};
        state.statuses[getActionName(action)] = 'fulfilled';
      })
      .addMatcher(
        isAnyOf(asyncGetUser.fulfilled, asyncPostUser.fulfilled),
        (state, action) => {
          const { token, username, email } = action.payload;
          if (token != null) Cookies.set('token', token);
          state.primitives.user = { username, email };
        },
      );
  },
});

export const { logout } = userSlice.actions;

export const selectUser = state => state.user.primitives.user;
export const selectUserStatuses = state => state.user.statuses;
export const selectUserErrors = state => state.user.errors;

export const userReducer = userSlice.reducer;
