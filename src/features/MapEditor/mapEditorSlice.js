import _ from 'lodash';
import { createAsyncThunk, createSlice, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';
import { apiClient } from '../../app/apiClient';
import { getActionName } from '../../utils/stringUtils';

const initialState = {
  file: null,
  primitives: {
    // draw, erase, select
    activeTool: 'select',
    dragStart: null,
    dragging: false,
    lastSelectedLayer: null,
  },
  tilesetCanvases: {},
  statuses: {},
  errors: {},
};

export const asyncGetFileToEdit = createAsyncThunk(
  'mapEditor/getFileToEdit',
  async ({ id }) => {
    const response = await apiClient.get(`/files/${id}/edit`);
    let { file, signedUrls } = response.data;

    file.rootLayer.isRootLayer = true;
    // use cloneDeepWith to set all layers selected and expanded to false
    function customizer (layer) {
      if (_.get(layer, '_id')) {
        if (layer.isRootLayer) {
          _.assign(layer, { selected: false, expanded: true });
        } else if (['layer', 'tileset'].includes(layer.type)) {
          _.assign(layer, { selected: false, expanded: false });
        }
      }
    }
    file.rootLayer.isRootLayer = true;
    file = _.cloneDeepWith(file, customizer);
    const tilesetCanvases = {};

    async function loadImages () {
      // console.log('signedUrls', signedUrls);

      for (const tileset of file.tilesets) {
        const image = new window.Image();
        image.src = signedUrls[tileset.file];
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        tilesetCanvases[tileset.file] = canvas;
      }
    }
    await loadImages();

    return { file, tilesetCanvases };
  },
);

export const asyncPatchFile = createAsyncThunk(
  'mapEditor/patchFile',
  async ({ id, updates }, { rejectWithValue, getState }) => {
    const { file } = getState().mapEditor;

    const newTilesetCanvases = {};

    try {
      const response = await apiClient.patch(`/files/${id}`, updates);

      // determine new tilesets
      // console.log('file.tilesets', file.tilesets);
      // console.log('data.file.tilesets', response.data.file.tilesets);
      const newTilesets = _.differenceBy(response.data.file.tilesets, file.tilesets, 'file');
      // console.log('newTilesets', newTilesets);

      // get canvases
      for (const tileset of newTilesets) {
        const image = new window.Image();
        image.src = tileset.imageUrl;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        newTilesetCanvases[tileset.file] = canvas;
      }

      return { newFile: response.data.file, newTilesetCanvases };
    } catch (err) {
      return rejectWithValue(err.response.data.error);
    }
  },
);

export const asyncDeleteFile = createAsyncThunk(
  'mapEditor/deleteFile',
  async ({ id }) => {
    const response = await apiClient.delete(`/files/${id}`);
    return response.data.file;
  },
);

const mapEditorSlice = createSlice({
  name: 'mapEditor',
  initialState,
  reducers: {
    setMapEditorPrimitives (state, action) {
      state.primitives = _.merge(state.primitives, action.payload);
    },
    updateLayer: (state, action) => {
      const { newLayer } = action.payload;

      // use cloneDeepWith to avoid mutating state
      function customizer (value) {
        // if layer's _id matches newLayer's _id, return newLayer
        if (_.get(value, '_id') === _.get(newLayer, '_id')) {
          return newLayer;
        }
      }

      state.file.rootLayer = _.cloneDeepWith(state.file.rootLayer, customizer);
    },
    clearMapEditorErrors: state => {
      state.errors = {};
    },
    clearMapEditorStatus: (state, action) => {
      const { status } = action.payload;
      state.statuses[status] = null;
    },
  },
  extraReducers (builder) {
    builder
      .addCase(asyncGetFileToEdit.pending, (state) => {
        state.file = null;
      })
      .addCase(asyncGetFileToEdit.fulfilled, (state, action) => {
        const { file, tilesetCanvases } = action.payload;
        // console.log('file', file);
        state.file = file;
        state.tilesetCanvases = tilesetCanvases;
      })
      .addCase(asyncPatchFile.fulfilled, (state, action) => {
        const { newFile, newTilesetCanvases } = action.payload;

        const fieldsToUpdate = Object.keys(action.meta.arg.updates);
        const pickedFile = _.pick(newFile, fieldsToUpdate);
        // console.log('pickedFile', pickedFile);
        _.merge(state.file, pickedFile);
        // replace the sharedWith field
        state.file.sharedWith = newFile.sharedWith;

        // replace the tilesets field
        state.file.tilesets = newFile.tilesets;
        state.tilesetCanvases = _.merge(state.tilesetCanvases, newTilesetCanvases);
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
      });
  },
});

export const {
  setMapEditorPrimitives,
  clearMapEditorErrors,
  clearMapEditorStatus,
  updateLayer,
} = mapEditorSlice.actions;

export const selectMapEditorPrimitives = (state) => state.mapEditor.primitives;
export const selectMapFile = (state) => state.mapEditor.file;
export const selectLastSelectedLayer = state => state.mapEditor.primitives.lastSelectedLayer;
export const selectTilesetCanvases = state => state.mapEditor.tilesetCanvases;
export const selectMapEditorStatuses = (state) => state.mapEditor.statuses;
export const selectMapEditorErrors = (state) => state.mapEditor.errors;

export const mapEditorReducer = mapEditorSlice.reducer;
