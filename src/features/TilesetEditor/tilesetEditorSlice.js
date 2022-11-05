import _ from 'lodash';
import { createAsyncThunk, createSlice, isAnyOf } from '@reduxjs/toolkit';
import { apiClient } from '../../app/apiClient';
import { getActionName } from '../../utils/stringUtils';
import ObjectID from 'bson-objectid';
import { trimPng } from '../../utils/canvasUtils';

const initialState = {
  file: null,
  layerImages: {},
  layerCanvases: {},
  layerOpacities: {},
  primitives: {
    activeCanvas: null,
    activeCanvasCtx: null,
    activeLayer: null,
    colors: [],
    calculateColors: false,
    dragStart: null,
    dragging: false,
    lastSelectedLayer: null,
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
        state.layerOpacities[newLayer._id] = newLayer.opacity;

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
    setTilesetLayerOpacity (state, action) {
      const { layerId, opacity } = action.payload;
      state.layerOpacities[layerId] = opacity;
    },
    changeActiveLayerOpacity (state, action) {
      let { opacity } = action.payload;
      opacity /= 100;
      state.layerOpacities[state.primitives.activeLayer._id] = opacity;
    },
    setFilePrimitives: (state, action) => {
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
    updateAllLayers: (state, action) => {
      // action.payload is an object of key-value pairs where the key is an attribute name and the value is the new value for that attribute
      const newAttributes = action.payload;

      // use cloneDeepWith to avoid mutating state
      function customizer (value) {
        // if layer has an _id, update its attributes
        if (_.get(value, '_id')) {
          _.assign(value, newAttributes);
        }
      }

      state.file.rootLayer = _.cloneDeepWith(state.file.rootLayer, customizer);
    },
    updateAllLayersBetween: (state, action) => {
      const { startLayer, endLayer, newAttributes } = action.payload;

      const selectedLayers = [];
      let done = false;

      // traverse from start layer to end layer, adding each layer to selectedLayers
      function traverse (layer) {
        if (done) return;

        if (layer._id === startLayer._id || layer._id === endLayer._id) {
          selectedLayers.push(layer._id);
        } else if (selectedLayers.length > 0) {
          selectedLayers.push(layer._id);
        }

        if (layer._id !== selectedLayers[0] && (layer._id === endLayer._id || layer._id === startLayer._id)) {
          done = true;
          return;
        }

        if (layer.type === 'group' && layer.layers.length > 0) {
          layer.layers.forEach(traverse);
        }
      }

      traverse(state.file.rootLayer);

      // use cloneDeepWith to avoid mutating state
      function customizer (value) {
        // if layer has an _id, update its attributes
        if (_.get(value, '_id') && selectedLayers.includes(value._id)) {
          _.assign(value, newAttributes);
        }
      }

      state.file.rootLayer = _.cloneDeepWith(state.file.rootLayer, customizer);
    },
    moveSelectedLayers: (state, action) => {
      const { moveToLayer } = action.payload;
      const selectedLayers = [];

      let invalid = false;

      // traverse from rootLayer, if a layer is selected, add it to selectedLayers, remove it from its parent layer, and don't recurse into it, continue until all layers have been traversed
      function traverse1 (layer) {
        if (invalid) return;

        // get all selected layers
        const selectedLayer = _.filter(layer.layers, { selected: true });
        if (selectedLayer.length > 0) {
          // checck if moveToLayer is selectedLayer or a child of selectedLayer, if so, return
          if (moveToLayer._id === selectedLayer[0]._id) {
            invalid = true;
            return;
          } else {
            function traverse2 (layer) {
              if (layer._id === moveToLayer._id) {
                invalid = true;
              } else if (layer.type === 'group' && layer.layers.length > 0) {
                layer.layers.forEach(traverse2);
              }
            }
            traverse2(selectedLayer[0]);
          }

          selectedLayers.push(...selectedLayer);
        } else {
          // if layer is a group, recurse into it
          if (layer.type === 'group' && layer.layers.length > 0) {
            layer.layers.forEach(traverse1);
          }
        }
      }
      traverse1(state.file.rootLayer);

      if (invalid) return;

      let moved = false;
      // console.log(`selectedLayers: ${JSON.stringify(selectedLayers)}`);

      // cloneDeep while excluding selected layers
      function traverse2 (layer) {
        if (layer.type === 'group') {
          layer.layers = _.filter(layer.layers, (layer) => !selectedLayers.includes(layer));

          if (!moved) {
            if (layer.layers.some((layer) => layer._id === moveToLayer._id && layer.type === 'layer')) {
              const index = _.findIndex(layer.layers, { _id: moveToLayer._id });
              // console.log(`${layer.name} contains ${moveToLayer.name}, moving after ${moveToLayer.name}`);
              layer.layers = [...layer.layers.slice(0, index + 1), ...selectedLayers, ...layer.layers.slice(index + 1)];
              moved = true;
            // else if moveToLayer is a group, insert selectedLayers at beginning of group's layers
            } else if (layer._id === moveToLayer._id && layer.type === 'group') {
              // console.log(`Moving to start of ${moveToLayer.name}'s layers`);
              layer.layers = [...selectedLayers, ...layer.layers];
            }
          }

          layer.layers.forEach(traverse2);
        }
      }
      traverse2(state.file.rootLayer);
    },
  },
  extraReducers (builder) {
    builder
      .addCase(getFileToEdit.fulfilled, (state, action) => {
        const imageUrls = _.range(0, 30).map((i) => `/mock-layer-images/${i}.png`);

        const file = action.payload;
        // use cloneDeepWith to set all layers selected and expanded to false
        function customizer (value) {
          if (_.get(value, '_id')) {
            _.assign(value, { selected: false, expanded: true });

            if (value.type === 'layer') {
              const imageUrl = _.sample(imageUrls);
              _.assign(value, { imageUrl, position: { x: 0, y: 0 } });
            }
          }
        }

        file.rootLayer.isRootLayer = true;

        state.file = _.cloneDeepWith(file, customizer);
      })
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
      });
  },
});

export const selectFile = (state) => state.tilesetEditor.file;
export const selectPrimitives = (state) => state.tilesetEditor.primitives;
export const selectDrag = state => state.tilesetEditor.primitives.drag;
export const selectLastSelectedLayer = state => state.tilesetEditor.primitives.lastSelectedLayer;

export const {
  setTilesetEditorPrimitives,
  setTilesetEditorLayerImage,
  setTilesetEditorLayerCanvas,
  deleteActiveTilesetLayer,
  addNewTilesetLayer,
  setActiveTilesetLayer,
  changeActiveLayerOpacity,
  setTilesetLayerOpacity,
  updateLayer,
  updateAllLayers,
  updateAllLayersBetween,
  moveSelectedLayers,
} = tilesetEditorSlice.actions;

export const tilesetEditorReducer = tilesetEditorSlice.reducer;
