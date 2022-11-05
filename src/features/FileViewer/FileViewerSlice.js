import { createSlice } from '@reduxjs/toolkit';
import { apiClient } from '../../app/apiClient';

const initialState = {};

export const postComment = async ({ fileId, comment }) => {
  try {
    const response = await apiClient.post(`/files/${fileId}/comment`, { content: comment });
    return response.data;
  } catch (err) {
    throw new Error(JSON.stringify(err.response.data.error));
  }
};

const fileViewerSlice = createSlice({
  name: 'file',
  initialState,
  reducers: {},
  extraReducers: () => {},
});

export const fileViewerReducer = fileViewerSlice.reducer;
