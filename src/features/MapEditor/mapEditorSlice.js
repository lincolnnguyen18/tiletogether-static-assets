import _ from 'lodash';
import { createAsyncThunk, createSlice, isAnyOf } from '@reduxjs/toolkit';
import { apiClient } from '../../app/apiClient';
import { getActionName } from '../../utils/stringUtils';

const initialState = {
  file: null,
  layerImages: {},
  layerCanvases: {},
  primitives: {
    activeCanvas: null,
    activeLayer: null,
  },
  errors: [],
  pending: [],
};

export const getFileToEdit = createAsyncThunk(
  'mapEditor/getFileToEdit',
  async ({ id }) => {
    try {
      const response = await apiClient.get(`/files/${id}/edit`);
      return response.data.file;
    } catch (err) {
      throw new Error(err.response.data.error);
    }
  },
);

const mapEditorSlice = createSlice({
  name: 'mapEditor',
  initialState,
  reducers: {
    setMapEditorPrimitives (state, action) {
      state.primitives = _.merge(state.primitives, action.payload);
    },
    setMapEditorLayerImage (state, action) {
      const { layerId, image } = action.payload;
      state.layerImages[layerId] = image;
    },
    deleteMapEditorLayerImage (state, action) {
      const { layerId } = action.payload;
      delete state.layerImages[layerId];
    },
    setMapEditorLayerCanvas (state, action) {
      const { layerId, canvas } = action.payload;
      state.layerCanvases[layerId] = canvas;
    },
    deleteMapEditorLayerCanvas (state, action) {
      const { layerId } = action.payload;
      delete state.layerCanvases[layerId];
    },
  },
  extraReducers (builder) {
    builder
      .addMatcher(isAnyOf(getFileToEdit.rejected), (state, action) => {
        const actionName = getActionName(action);
        state.errors.push(actionName);
        state.pending = _.pull(state.pending, actionName);
      })
      .addMatcher(isAnyOf(getFileToEdit.fulfilled), (state, action) => {
        state.pending = _.pull(state.pending, getActionName(action));
      })
      .addMatcher(isAnyOf(getFileToEdit.pending), (state, action) => {
        state.errors = [];
        state.file = null;
        state.pending.push(getActionName(action));
      })
      .addMatcher(
        isAnyOf(getFileToEdit.fulfilled), (state, action) => {
          state.file = action.payload;
        });
  },
});

export const {
  setMapEditorPrimitives,
  setMapEditorLayerImage,
  deleteMapEditorLayerImage,
  setMapEditorLayerCanvas,
  deleteMapEditorLayerCanvas,
} = mapEditorSlice.actions;

export const mapEditorReducer = mapEditorSlice.reducer;
