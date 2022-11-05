import { createSlice } from '@reduxjs/toolkit';
import { apiClient } from '../../app/apiClient';

const initialState = {};

export const postComment = async ({ fileId, content }) => {
  console.log(fileId, content);
  try {
    const response = await apiClient.post(`/files/${fileId}/comment`, { content });
    return response.data;
  } catch (err) {
    throw new Error(JSON.stringify(err.response.data.error));
  }
};

const fileViewerSlice = createSlice({
  name: 'fileViewer',
  initialState,
  reducers: {},
  extraReducers: () => {},
});

export const fileViewerReducer = fileViewerSlice.reducer;
