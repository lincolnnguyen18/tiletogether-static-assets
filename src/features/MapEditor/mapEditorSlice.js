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
  statuses: {},
  errors: {},
};

export const asyncGetFileToEdit = createAsyncThunk(
  'tilesetEditor/getFileToEdit',
  async ({ id }) => {
    const response = await apiClient.get(`/files/${id}/edit`);
    return response.data.file;
  },
);

export const asyncPatchFile = createAsyncThunk(
  'mapEditor/patchFile',
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
        const file = action.payload;
        // use cloneDeepWith to set all layers selected and expanded to false
        function customizer (value) {
          if (_.get(value, '_id')) {
            // TODO: figure out way to identify root layer more properly
            if (value.name === 'test_root_layer') {
              _.assign(value, { selected: false, expanded: true });
            } else {
              _.assign(value, { selected: false, expanded: false });
            }
          }
        }

        file.rootLayer.isRootLayer = true;

        state.file = _.cloneDeepWith(file, customizer);
      })
      .addCase(asyncPatchFile.fulfilled, (state, action) => {
        const fieldsToUpdate = Object.keys(action.meta.arg.updates);
        const pickedFile = _.pick(action.payload, fieldsToUpdate);
        _.merge(state.file, pickedFile);
        // replace the sharedWith field
        state.file.sharedWith = action.payload.sharedWith;
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
export const selectMapEditorStatuses = (state) => state.mapEditor.statuses;
export const selectMapEditorErrors = (state) => state.mapEditor.errors;

export const mapEditorReducer = mapEditorSlice.reducer;
