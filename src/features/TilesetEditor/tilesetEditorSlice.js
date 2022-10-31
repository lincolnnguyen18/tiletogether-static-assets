import _ from 'lodash';
import { createAsyncThunk, createSlice, isAnyOf } from '@reduxjs/toolkit';
import { apiClient } from '../../app/apiClient';
import { getActionName } from '../../utils/stringUtils';
import ObjectID from 'bson-objectid';

const initialState = {
  file: null,
  layerImages: {},
  layerCanvases: {},
  primitives: {
    activeCanvas: null,
    activeCanvasCtx: null,
    activeLayer: null,
  },
  errors: [],
  pending: [],
};

export const getFileToEdit = createAsyncThunk(
  'tilesetEditor/getFileToEdit',
  async ({ id }) => {
    try {
      const response = await apiClient.get(`/files/${id}/edit`);
      return response.data.file;
    } catch (err) {
      throw new Error(err.response.data.error);
    }
  },
);

const tilesetEditorSlice = createSlice({
  name: 'tilesetEditor',
  initialState,
  reducers: {
    setTilesetEditorPrimitives (state, action) {
      state.primitives = _.merge(state.primitives, action.payload);
    },
    setTilesetEditorLayerImage (state, action) {
      const { layerId, image } = action.payload;
      state.layerImages[layerId] = image;
    },
    addNewTilesetLayer (state) {
      if (state.file && state.file.rootLayer) {
        const newLayer = {
          name: `New Layer ${state.file.rootLayer.layers.length + 1}`,
          opacity: 1,
          type: 'layer',
          visible: true,
          _id: ObjectID().toHexString(),
          layers: [],
        };
        state.file.rootLayer.layers.push(newLayer);

        const img = new window.Image();
        const canvas = document.createElement('canvas');

        canvas.width = state.file.width * state.file.tileDimension;
        canvas.height = state.file.height * state.file.tileDimension;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        img.src = canvas.toDataURL();
        state.layerImages[newLayer._id] = img;
        state.layerCanvases[newLayer._id] = canvas;
        state.primitives.activeLayer = newLayer;
        state.primitives.activeCanvas = canvas;
        state.primitives.activeCanvasCtx = ctx;
      }
    },
    setActiveTilesetLayer (state, action) {
      const { layer } = action.payload;
      state.primitives.activeLayer = layer;
      state.primitives.activeCanvas = state.layerCanvases[layer._id];
      state.primitives.activeCanvasCtx = state.layerCanvases[layer._id].getContext('2d', { willReadFrequently: true });
    },
    deleteActiveTilesetLayer (state) {
      delete state.layerImages[state.primitives.activeLayer._id];
      delete state.layerCanvases[state.primitives.activeLayer._id];
      // use lodash to recursively filter out the layer
      // traverse layers recursively in a depth-first manner
      // if the layer is found, filter it from the layers array
      function deepFind (layers, layerId) {
        console.log('deepFind', layers, layerId);
        for (let i = 0; i < layers.length; i++) {
          if (layers[i]._id === layerId) {
            layers.splice(i, 1);
            return;
          }
          if (layers[i].layers && layers[i].layers.length > 0) {
            deepFind(layers[i].layers, layerId);
          }
        }
      }
      deepFind(state.file.rootLayer.layers, state.primitives.activeLayer._id);
      // set active layer to first layer in root layer
      state.primitives.activeLayer = state.file.rootLayer.layers[0];
      state.primitives.activeCanvas = state.layerCanvases[state.primitives.activeLayer._id];
      state.primitives.activeCanvasCtx = state.layerCanvases[state.primitives.activeLayer._id].getContext('2d', { willReadFrequently: true });
    },
    setTilesetEditorLayerCanvas (state, action) {
      const { layerId, canvas } = action.payload;
      state.layerCanvases[layerId] = canvas;
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
  setTilesetEditorPrimitives,
  setTilesetEditorLayerImage,
  setTilesetEditorLayerCanvas,
  deleteActiveTilesetLayer,
  addNewTilesetLayer,
  setActiveTilesetLayer,
} = tilesetEditorSlice.actions;

export const tilesetEditorReducer = tilesetEditorSlice.reducer;
