import Cookies from 'js-cookie';
import { createAsyncThunk, createSlice, isAnyOf } from '@reduxjs/toolkit';
import { apiClient } from '../../app/apiClient';

const initialState = {
  primitives: {
    // { username, email }
    user: null,
  },
};

export const getUser = createAsyncThunk(
  'common/getUser',
  // payload; { email, password } or null if using token
  async (payload) => {
    try {
      const response = await apiClient.get('/users', { params: payload });
      return response.data;
    } catch (err) {
      throw new Error(err.response.data.error);
    }
  },
);

export const postUser = createAsyncThunk(
  'common/postUser',
  async (payload) => {
    try {
      const response = await apiClient.post('/users', payload);
      return response.data;
    } catch (err) {
      throw new Error(JSON.stringify(err.response.data.error));
    }
  },
);

export const deleteUser = createAsyncThunk(
  'common/deleteUser',
  async (payload) => {
    const response = await apiClient.delete('/users/deregister', { params: payload });
    return response.data;
  },
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    logout: (state, action) => {
      state.primitives.user = null;
      Cookies.remove('token');
      action.payload.navigate('/');
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        isAnyOf(getUser.rejected, postUser.rejected), (state) => {
          state.primitives.user = null;
        })
      .addMatcher(
        isAnyOf(getUser.fulfilled, postUser.fulfilled),
        (state, action) => {
          const { token, username, email } = action.payload;
          if (token != null) Cookies.set('token', token);
          state.primitives.user = { username, email };
        },
      );
  },
});

export const { logout } = userSlice.actions;

export const userReducer = userSlice.reducer;
