import _ from 'lodash';
import { createAsyncThunk, createSlice, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';
import { apiClient } from '../../app/apiClient';
import { getActionName } from '../../utils/stringUtils';
import ObjectID from 'bson-objectid';
import { emitLayerUpdates } from './tilesetEditorSocketApi';
import { downloadFileAsCanvas } from './TilesetCanvas';

const initialState = {
  file: null,
  primitives: {
    // draw, erase, select
    activeTool: 'draw',
    brushColor: 'red',
    colors: [],
    calculateColors: false,
    dragStart: null,
    dragging: false,
    lastSelectedLayer: null,
    savingChanges: false,
    // downloadFormat is null or 'png'/'tmx' to indicate which format is being downloaded
    downloadFormat: null,
    fileImageChanged: false,
    reuploadingFileImage: false,
  },
  newChanges: {},
  statuses: {},
  errors: {},
};

export const asyncGetFileToEdit = createAsyncThunk(
  'tilesetEditor/getFileToEdit',
  async ({ id }) => {
    const response = await apiClient.get(`/files/${id}/edit`);
    return response.data;
  },
);

export const asyncPatchFile = createAsyncThunk(
  'tilesetEditor/patchFile',
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
  'tilesetEditor/deleteFile',
  async ({ id }) => {
    const response = await apiClient.delete(`/files/${id}`);
    return response.data.file;
  },
);

export const asyncSaveChanges = createAsyncThunk(
  'tilesetEditor/saveChanges',
  async ({ layerData, newChanges, file }) => {
    const rootLayer = file.rootLayer;
    // console.log('newChanges', newChanges);
    // console.log('file', file);
    const changedLayerIds = Object.keys(newChanges);
    const canvasUpdates = {};

    for (let i = 0; i < changedLayerIds.length; i++) {
      const layerId = changedLayerIds[i];
      // console.log('layerId', layerId, updates);

      if (newChanges[layerId].canvas) {
        // console.log(`updating canvas data for layer ${layerId}`);
        const canvas = layerData[layerId].canvas;
        const blob = await new Promise((resolve) => canvas.toBlob(resolve));
        canvasUpdates[layerId] = await blob.arrayBuffer();
      }
    }

    // update rootLayer with newChanges
    const layerIds = [];
    function traverse (layer) {
      // console.log(layer);
      if (layer.type === 'layer' && !layerIds.includes(layer._id)) {
        layerIds.push(layer._id);
      }
      if (newChanges[layer._id] && newChanges[layer._id].position) {
        // console.log('updating position', layerData[layer._id].position);
        return { ...layer, position: layerData[layer._id].position };
      }
      if (layer.layers) {
        for (const child of layer.layers) {
          traverse(child);
        }
      }
    }
    const newRootLayer = _.cloneDeepWith(rootLayer, traverse);
    // console.log(newRootLayer);

    // console.log('layerIds', layerIds);
    const newFileCanvas = downloadFileAsCanvas({ file, layerData });
    const newFileBlob = await new Promise((resolve) => newFileCanvas.toBlob(resolve));
    const newImage = await newFileBlob.arrayBuffer();
    emitLayerUpdates({ newRootLayer, canvasUpdates, layerIds, newImage });
  },
);

const tilesetEditorSlice = createSlice({
  name: 'tilesetEditor',
  initialState,
  reducers: {
    setTilesetEditorPrimitives (state, action) {
      state.primitives = _.merge(state.primitives, action.payload);
    },
    addNewTilesetLayer (state) {
      // log last selected layer
      const lastSelectedLayer = state.primitives.lastSelectedLayer;
      // console.log('lastSelectedLayer', _.cloneDeep(lastSelectedLayer));
      let lastSelectedLayerExists = false;

      // get new layer name; traverse through all layers and find the unnamed layer with the highest number, e.g. if "Layer 13" then new layer name is "Layer 14"
      let highestNumber = 0;
      function getHighestNumber (layer) {
        if (!layer) return;
        if (layer.name.startsWith('Layer ')) {
          const number = parseInt(layer.name.split(' ')[1]);
          if (number > highestNumber) highestNumber = number;
        }
        if (layer.layers) {
          layer.layers.forEach(layer => getHighestNumber(layer));
        }
        if (lastSelectedLayer && layer._id === lastSelectedLayer._id) lastSelectedLayerExists = true;
      }
      getHighestNumber(state.file.rootLayer);

      if (!lastSelectedLayerExists) {
        state.primitives.lastSelectedLayer = null;
      }

      const newLayer = {
        _id: ObjectID().toHexString(),
        name: `Layer ${highestNumber + 1}`,
        type: 'layer',
        selected: true,
        opacity: 1,
        layers: [],
      };

      // if last selected layer is null, add layer to beginning of rootLayer's layers array
      if (!lastSelectedLayer) {
        state.file.rootLayer.layers.unshift(newLayer);
      // else if last selected layer is a group layer, add layer to beginning of last selected layer's layers array
      } else if (lastSelectedLayer.type === 'group') {
        function customizer (layer) {
          // if layer is last selected layer, return new layer
          if (layer._id === lastSelectedLayer._id) {
            lastSelectedLayer.expanded = true;
            lastSelectedLayer.layers.unshift(newLayer);
            return lastSelectedLayer;
          }
        }
        // add new layer to last selected layer's layers array
        state.file.rootLayer = _.cloneDeepWith(state.file.rootLayer, customizer);
      // else if last selected layer is a layer, add layer before last selected layer
      } else if (lastSelectedLayer.type === 'layer') {
        function customizer (layer) {
          // if layer is group and contains last selected layer, return new layer
          if (layer.type === 'group' && layer.layers.some(layer => layer._id === lastSelectedLayer._id)) {
            // console.log('layer', _.cloneDeep(layer));
            const index = layer.layers.findIndex(layer => layer._id === lastSelectedLayer._id);
            layer.layers.splice(index, 0, newLayer);
            return layer;
          }
        }
        // add new layer before last selected layer
        state.file.rootLayer = _.cloneDeepWith(state.file.rootLayer, customizer);
      }

      // clear all selections except new layer
      function customizer2 (layer) {
        if (_.get(layer, '_id') && layer._id !== newLayer._id) {
          _.assign(layer, { selected: false });
        }
      }
      state.file.rootLayer = _.cloneDeepWith(state.file.rootLayer, customizer2);
      state.primitives.lastSelectedLayer = newLayer;

      setTimeout(() => {
        const layerDiv = document.getElementById(`explorer-${newLayer._id}`);
        if (layerDiv) {
          layerDiv.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
        }
      }, 100);
    },
    setFilePrimitives: (state, action) => {
      state.primitives = _.merge(state.primitives, action.payload);
    },
    updateLayer: (state, action) => {
      const { newLayer } = action.payload;

      if (!state.file) return;

      // use cloneDeepWith to avoid mutating state
      function customizer (layer) {
        // if layer's _id matches newLayer's _id, return newLayer
        if (_.get(layer, '_id') === _.get(newLayer, '_id')) {
          return newLayer;
        }
      }

      state.file.rootLayer = _.cloneDeepWith(state.file.rootLayer, customizer);
    },
    deleteSelectedLayers: (state) => {
      // get selected layers
      const selectedLayers = [];
      function customizer (layer) {
        if (layer.selected) {
          selectedLayers.push(layer);
          if (state.newChanges[layer._id]) {
            state.newChanges[layer._id].deleted = true;
          } else {
            state.newChanges[layer._id] = { deleted: true };
          }
        }
      }
      _.cloneDeepWith(state.file.rootLayer, customizer);

      // if selectedLayers includes lastSelectedLayer, set lastSelectedLayer to null
      if (selectedLayers.some(layer => layer._id === state.primitives.lastSelectedLayer._id)) {
        state.primitives.lastSelectedLayer = null;
      }

      // use cloneDeepWith to avoid mutating state
      function traverse (layer) {
        // if a group's layers is in selectedLayers, filter it out
        if (layer.type === 'group') {
          selectedLayers.forEach(selectedLayer => {
            layer.layers = layer.layers.filter(layer => layer._id !== selectedLayer._id);
          });

          traverse(layer.layers);
        }
      }

      state.file.rootLayer = _.cloneDeepWith(state.file.rootLayer, traverse);
    },
    deleteLayerById: (state, action) => {
      const { id } = action.payload;
      state.newChanges[id] = { deleted: true };

      // use cloneDeepWith to avoid mutating state
      function traverse (layer) {
        if (!layer) return;
        if (layer.type === 'group') {
          layer.layers = layer.layers.filter(layer => layer._id !== id);
        }
        traverse(layer.layers);
      }

      state.file.rootLayer = _.cloneDeepWith(state.file.rootLayer, traverse);

      if (state.primitives.lastSelectedLayer === id) {
        state.primitives.lastSelectedLayer = null;
      }
    },
    updateAllLayers: (state, action) => {
      // action.payload is an object of key-value pairs where the key is an attribute name and the value is the new value for that attribute
      const newAttributes = action.payload;

      // use cloneDeepWith to avoid mutating state
      function customizer (layer) {
        // if layer has an _id, update its attributes
        if (_.get(layer, '_id')) {
          _.assign(layer, newAttributes);
        }
      }

      if (!state.file || !state.file.rootLayer) return;

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

      // console.log('selectedLayers', selectedLayers);

      // use cloneDeepWith to avoid mutating state
      function customizer (layer) {
        // if layer has an _id, update its attributes
        if (_.get(layer, '_id') && selectedLayers.includes(layer._id)) {
          // console.log('layer', _.cloneDeep(layer));
          _.assign(layer, newAttributes);
        }
      }

      state.file.rootLayer = _.cloneDeepWith(state.file.rootLayer, customizer);
    },
    updateLayerAndItsChildren: (state, action) => {
      const { newLayer, newAttributes } = action.payload;

      // traverse layer and its children, updating attributes
      function traverse (layer) {
        _.assign(layer, newAttributes);

        if (layer.type === 'group' && layer.layers.length > 0) {
          layer.layers.forEach(traverse);
        }
      }
      traverse(newLayer);

      // use cloneDeepWith to avoid mutating state
      function customizer (layer) {
        // if layer's _id matches layer's _id, return layer
        if (_.get(layer, '_id') === _.get(newLayer, '_id')) {
          return newLayer;
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
          // check if moveToLayer is selectedLayer or a child of selectedLayer, if so, return
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
            // if moveToLayer is a layer, insert selectedLayers after it
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

      selectedLayers.forEach((layer) => {
        if (state.newChanges[layer._id]) {
          state.newChanges[layer._id].deleted = true;
        } else {
          state.newChanges[layer._id] = { deleted: true };
        }
      });
    },
    addNewChanges: (state, action) => {
      const { layerId, newChanges } = action.payload;
      if (!state.newChanges[layerId]) {
        state.newChanges[layerId] = {};
      }
      newChanges.forEach((attribute) => {
        state.newChanges[layerId][attribute] = true;
      });
    },
    clearChanges: (state) => {
      state.newChanges = {};
    },
    updateLayersUpToRoot: (state, action) => {
      const { fromLayer, newAttributes } = action.payload;

      // create function to traverse from root layer to fromFayer, once path to layer is found, recurse back up while updating each layer's value until root layer is reached
      function traverse (layer) {
        if (layer._id === fromLayer._id) {
          return layer;
        } else if (layer.type === 'group' && layer.layers.length > 0) {
          for (let i = 0; i < layer.layers.length; i++) {
            const result = traverse(layer.layers[i]);
            if (result) {
              _.assign(layer, newAttributes);
              return result;
            }
          }
        }
      }

      traverse(state.file.rootLayer);
    },
    clearTilesetEditorErrors: state => {
      state.errors = {};
    },
    clearTilesetEditorStatus: (state, action) => {
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
        const { file, signedUrls } = action.payload;
        // console.log('file', file);
        // console.log('signedUrls', signedUrls);
        file.rootLayer.isRootLayer = true;
        // use cloneDeepWith to set all layers selected and expanded to false
        function customizer (layer) {
          if (_.get(layer, '_id')) {
            if (layer.isRootLayer) {
              _.assign(layer, { selected: false, expanded: true });
            } else if (['group', 'layer'].includes(layer.type)) {
              _.assign(layer, { selected: false, expanded: false });
            }
            if (signedUrls[layer._id]) {
              layer.tilesetLayerUrl = signedUrls[layer._id];
            }
          }
        }

        state.file = _.cloneDeepWith(file, customizer);
      })
      .addCase(asyncPatchFile.fulfilled, (state, action) => {
        const fieldsToUpdate = Object.keys(action.meta.arg.updates);
        const pickedFile = _.pick(action.payload, fieldsToUpdate);
        _.merge(state.file, pickedFile);
        // replace the sharedWith field
        state.file.sharedWith = action.payload.sharedWith;
        if (state.primitives.fileImageChanged) {
          state.primitives.fileImageChanged = false;
          state.primitives.reuploadingFileImage = true;
        }
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

export const selectTilesetFile = (state) => state.tilesetEditor.file;
export const selectTilesetNewChanges = (state) => state.tilesetEditor.newChanges;
export const selectTilesetEditorPrimitives = (state) => state.tilesetEditor.primitives;
export const selectLastSelectedLayer = state => state.tilesetEditor.primitives.lastSelectedLayer;
export const selectTilesetEditorStatuses = (state) => state.tilesetEditor.statuses;
export const selectTilesetEditorErrors = (state) => state.tilesetEditor.errors;

export const {
  setTilesetEditorPrimitives,
  addNewTilesetLayer,
  updateLayer,
  deleteSelectedLayers,
  deleteLayerById,
  updateAllLayers,
  updateAllLayersBetween,
  updateLayersUpToRoot,
  updateLayerAndItsChildren,
  moveSelectedLayers,
  clearTilesetEditorErrors,
  clearTilesetEditorStatus,
  addNewChanges,
  clearChanges,
} = tilesetEditorSlice.actions;

export const tilesetEditorReducer = tilesetEditorSlice.reducer;
