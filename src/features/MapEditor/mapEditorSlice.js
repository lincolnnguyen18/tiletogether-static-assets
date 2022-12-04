import _ from 'lodash';
import { createAsyncThunk, createSlice, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';
import { apiClient } from '../../app/apiClient';
import { getActionName } from '../../utils/stringUtils';
import ObjectID from 'bson-objectid';
import { getFirstAndLastGuids } from '../../utils/mapUtils';
import { jszip } from '../../utils/fileUtils';
import { saveAs } from 'file-saver';
import { create } from 'xmlbuilder2';
import { downloadFileAsCanvas } from '../TilesetEditor/TilesetCanvas';
import { emitLayerUpdates } from '../TilesetEditor/tilesetEditorSocketApi';
import axios from 'axios';

export function getCurrentGuids ({ firstGuids, file, tilesetCanvases }) {
  return file.tilesets.map(tileset => [firstGuids[tileset.file], firstGuids[tileset.file] + tilesetCanvases[tileset.file].width / file.tileDimension * tilesetCanvases[tileset.file].height / file.tileDimension - 1]);
}

const initialState = {
  file: null,
  primitives: {
    // draw, erase, select
    activeTool: 'draw',
    dragStart: null,
    dragging: false,
    lastSelectedLayer: null,
    brushTileset: null,
    brushTileIndices: null,
    savingChanges: false,
    // downloadFormat is null or 'png'/'tmx' to indicate which format is being downloaded
    downloadFormat: null,
    fileImageChanged: false,
    reuploadingFileImage: false,
  },
  layerData: {},
  tilesetCanvases: {},
  firstGuids: {},
  layerTiles: {},
  brushCanvas: null,
  newChanges: {},
  statuses: {},
  errors: {},
};

export const asyncGetFileToEdit = createAsyncThunk(
  'mapEditor/getFileToEdit',
  async ({ id }) => {
    const response = await apiClient.get(`/files/${id}/edit`);
    let { file, signedUrls } = response.data;
    // console.log('file', file);
    // console.log('signedUrls', signedUrls);
    const layerData = {};

    file.rootLayer.isRootLayer = true;
    // use cloneDeepWith to set all layers selected and expanded to false
    function customizer (layer) {
      if (_.get(layer, '_id')) {
        if (layer.isRootLayer) {
          _.assign(layer, { selected: false, expanded: true });
        } else if (layer.type === 'layer') {
          _.assign(layer, { selected: false, expanded: false });
          layerData[layer._id] = { position: layer.position };
        }
      }
    }
    file.rootLayer.isRootLayer = true;
    file = _.cloneDeepWith(file, customizer);
    const tilesetCanvases = {};
    const layerTiles = {};
    const newFirstGids = {};
    let firstGid = 1;

    async function loadImages () {
      // console.log('signedUrls', signedUrls);

      for (const tileset of file.tilesets) {
        const image = new window.Image();
        image.src = signedUrls[tileset.file];
        image.crossOrigin = 'Anonymous';
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        tilesetCanvases[tileset.file] = canvas;

        newFirstGids[tileset.file] = firstGid;
        const tileCount = tilesetCanvases[tileset.file].width / file.tileDimension * tilesetCanvases[tileset.file].height / file.tileDimension;
        firstGid += tileCount;
      }

      for (const layerId of file.layerIds) {
        // console.log('layerId', layerId);
        const tilesJsonUrl = signedUrls[layerId];
        // console.log('tilesJsonUrl', tilesJsonUrl);

        const tilesJson = await axios.get(tilesJsonUrl);
        // console.log('tilesJson', tilesJson.data);
        layerTiles[layerId] = tilesJson.data;

        const layerCanvas = document.createElement('canvas');
        layerCanvas.width = layerTiles[layerId][0].length * file.tileDimension;
        layerCanvas.height = layerTiles[layerId].length * file.tileDimension;
        const layerCtx = layerCanvas.getContext('2d');

        // const position = layerData[layerId].position;
        // console.log('position', position);

        // calculate tileset and tile indices for each tile based on the tile's gid
        for (let y = 0; y < layerTiles[layerId].length; y++) {
          for (let x = 0; x < layerTiles[layerId][y].length; x++) {
            const tileGid = layerTiles[layerId][y][x];
            // console.log('tileGid', tileGid);
            if (!tileGid) continue;
            let tileTileset;
            file.tilesets.forEach(tileset => {
              if (tileGid >= newFirstGids[tileset.file] && tileGid < newFirstGids[tileset.file] + tilesetCanvases[tileset.file].width / file.tileDimension * tilesetCanvases[tileset.file].height / file.tileDimension) {
                tileTileset = tileset;
              }
            });
            // console.log('tileTileset', tileTileset);

            // calculate x, y position of tile in tileset
            const tilesetX = (tileGid - newFirstGids[tileTileset.file]) % (tilesetCanvases[tileTileset.file].width / file.tileDimension) * file.tileDimension;
            const tilesetY = Math.floor((tileGid - newFirstGids[tileTileset.file]) / (tilesetCanvases[tileTileset.file].width / file.tileDimension)) * file.tileDimension;
            // console.log('tilesetX', tilesetX);
            // console.log('tilesetY', tilesetY);

            // calculate x, y position of tile in layer
            const layerX = x * file.tileDimension;
            const layerY = y * file.tileDimension;
            // console.log('layerX', layerX);
            // console.log('layerY', layerY);

            // draw tile to layer canvas
            layerCtx.drawImage(tilesetCanvases[tileTileset.file], tilesetX, tilesetY, file.tileDimension, file.tileDimension, layerX, layerY, file.tileDimension, file.tileDimension);
            // }
          }
        }

        layerData[layerId].canvas = layerCanvas;
      }
    }
    await loadImages();

    // console.log('layerData', layerData);
    // console.log('newFirstGids', newFirstGids);

    return { file, tilesetCanvases, layerTiles, layerData, newFirstGids };
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
        image.crossOrigin = 'Anonymous';
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

export const asyncSaveChanges = createAsyncThunk(
  'mapEditor/saveChanges',
  async (__, { getState }) => {
    const { file, newChanges, layerTiles } = getState().mapEditor;
    const layerData = getState().mapEditor.layerData;

    // console.log('newChanges', newChanges);
    // console.log('file', file);
    const changedLayerIds = Object.keys(newChanges);
    const layerTileUpdates = {};

    for (let i = 0; i < changedLayerIds.length; i++) {
      const layerId = changedLayerIds[i];
      // console.log('layerId', layerId, updates);

      if (newChanges[layerId].canvas) {
        // console.log(`updating tiles for layer ${layerId}`);
        // console.log('tiles', layerTiles[layerId]);
        layerTileUpdates[layerId] = layerTiles[layerId];
      }
    }

    const layerIds = [];
    function traverse (layer) {
      // console.log(layer);
      if (layer.type === 'layer' && !layerIds.includes(layer._id)) {
        layerIds.push(layer._id);
      }
      if (layer.type === 'layer') {
        const position = layerData[layer._id].position;
        // console.log('position', position);
        const newLayer = _.cloneDeep(layer);
        newLayer.position = position;
        return newLayer;
      }
      if (layer.layers) {
        for (const child of layer.layers) {
          traverse(child);
        }
      }
    }
    const newRootLayer = _.cloneDeepWith(file.rootLayer, traverse);
    // console.log('newRootLayer', newRootLayer);

    // console.log('layerIds', changedLayerIds);
    const newFileCanvas = downloadFileAsCanvas({ file, layerData });
    const newFileBlob = await new Promise((resolve) => newFileCanvas.toBlob(resolve));
    const newImage = await newFileBlob.arrayBuffer();
    emitLayerUpdates({ newRootLayer, layerIds, newImage, layerTileUpdates });
  },
);

const mapEditorSlice = createSlice({
  name: 'mapEditor',
  initialState,
  reducers: {
    setBrushCanvas (state, action) {
      state.brushCanvas = action.payload;
    },
    updateLayerTiles (state, action) {
      const { layerId, tiles } = action.payload;
      state.layerTiles[layerId] = tiles;
    },
    assignLayerTiles (state, action) {
      state.layerTiles = action.payload;
    },
    setMapEditorPrimitives (state, action) {
      state.primitives = _.merge(state.primitives, action.payload);
    },
    assignMapEditorPrimitives (state, action) {
      state.primitives = _.assign(state.primitives, action.payload);
    },
    addNewMapLayer (state) {
      // TODO: add new layer at appropriate position; for now just add to start of rootLayer's layers
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
      }
      getHighestNumber(state.file.rootLayer);

      const newLayer = {
        _id: ObjectID().toHexString(),
        name: `Layer ${highestNumber + 1}`,
        type: 'layer',
        selected: true,
        opacity: 1,
        layers: [],
      };

      state.file.rootLayer.layers.unshift(newLayer);

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
    clearMapEditorErrors: state => {
      state.errors = {};
    },
    clearMapEditorStatus: (state, action) => {
      const { status } = action.payload;
      state.statuses[status] = null;
    },
    setLayerData: (state, action) => {
      state.layerData = action.payload;
    },
    eraseTileInLayer: (state, action) => {
      let { layerId, y, x } = action.payload;
      const canvas = state.layerData[layerId].canvas;
      const ctx = canvas.getContext('2d');
      const tileDimension = state.file.tileDimension;
      y *= tileDimension;
      x *= tileDimension;
      // console.log(`erasing tile at ${x}, ${y} with tileDimension ${tileDimension}`);
      ctx.clearRect(x, y, tileDimension, tileDimension);
      const newLayerData = { ...state.layerData };
      newLayerData[layerId].canvas = canvas;
      state.layerData = newLayerData;
    },
    assignTilesetCanvases: (state, action) => {
      state.tilesetCanvases = action.payload;
    },
    assignFirstGuids: (state, action) => {
      state.firstGuids = action.payload;
    },
    downloadMapAsTmx: (state) => {
      const file = state.file;
      const tileDimension = file.tileDimension;
      // console.log('downloading map as tmx');

      let mapXml = create({ version: '1.0', encoding: 'UTF-8' })
        .ele('map', {
          version: '1.9',
          tiledversion: '1.9.1',
          orientation: 'orthogonal',
          renderorder: 'right-down',
          width: file.width,
          height: file.height,
          tilewidth: tileDimension,
          tileheight: tileDimension,
          infinite: 0,
        });

      const tilesetCanvasesFolder = jszip.folder('tilesets');
      const metadataFolder = jszip.folder('metadata');
      state.file.tilesets.forEach(tileset => {
        const tilesetCanvas = state.tilesetCanvases[tileset.file];
        tilesetCanvasesFolder.file(`${tileset.name}.png`, tilesetCanvas.toDataURL().split(',')[1], { base64: true });
        const tileCount = tilesetCanvas.width / tileDimension * tilesetCanvas.height / tileDimension;

        const tilesetXml = create({ version: '1.0', encoding: 'UTF-8' })
          .ele('tileset', {
            version: '1.9',
            tiledversion: '1.9.1',
            name: tileset.name,
            tilewidth: tileDimension,
            tileheight: tileDimension,
            tilecount: tileCount,
            columns: tilesetCanvas.width / tileDimension,
          })
          .ele('image', {
            source: `../tilesets/${tileset.name}.png`,
            width: tilesetCanvas.width,
            height: tilesetCanvas.height,
          })
          .end({ prettyPrint: true });
        metadataFolder.file(`${tileset.name}.tsx`, tilesetXml);

        mapXml = mapXml.ele('tileset', {
          firstgid: state.firstGuids[tileset.file],
          source: `./metadata/${tileset.name}.tsx`,
        }).up();
      });

      let layerId = 1;
      function layerToXml (layer, parentXml) {
        // console.log(layer);
        if (layer == null) return null;
        if (layer.type === 'group') {
          let groupXml = parentXml.ele('group', {
            id: layerId,
            name: layer.name,
            width: file.width,
            height: file.height,
          });
          // add layers in layer.layers to groupXml in reverse order
          layer.layers.slice().reverse().forEach(childLayer => {
            // console.log('adding child layer to group');
            groupXml.ele(layerToXml(childLayer, groupXml));
          });
          groupXml = groupXml.up;
          layerId++;
        } else if (layer.type === 'layer' && state.layerData[layer._id]) {
          const tiles = _.cloneDeep(state.layerTiles[layer._id]);

          // create a new 2d array of tiles that is the same size as the map
          const newTiles = Array(file.height).fill().map(() => Array(file.width).fill(0));
          // console.log('newTiles', newTiles);

          // fill in the new array with the tiles from the layer at layer's position
          const position = _.cloneDeep(state.layerData[layer._id].position);
          position.x /= tileDimension;
          position.y /= tileDimension;
          // console.log('position', position);
          // skip tiles outside of the map
          for (let i = 0; i < tiles.length; i++) {
            for (let j = 0; j < tiles[i].length; j++) {
              if (position.x + j >= 0 && position.x + j < file.width && position.y + i >= 0 && position.y + i < file.height) {
                newTiles[position.y + i][position.x + j] = tiles[i][j] ?? 0;
              }
            }
          }
          // console.log('newTiles', newTiles);

          // flatten into 1d array and convert to csv
          const csv = newTiles.flat().join(',');
          // make sure to insert '\n' every width number of elements
          // const csv = newTiles.map(row => row.join(',')).join('\n');
          // doesn't work, something related to line breaks is breaking tiled so not using newlines to separate rows
          // console.log('csv', csv);

          parentXml.ele('layer', {
            id: layerId,
            opacity: layer.opacity === 1 ? null : layer.opacity,
            name: layer.name,
            width: file.width,
            height: file.height,
          }).ele('data', { encoding: 'csv' })
            .txt(csv)
            .up().up();
          layerId++;
        }
      }

      // use slice, reverse, and forEach to iterate in reverse order
      file.rootLayer.layers.slice().reverse().forEach(layer => {
        layerToXml(layer, mapXml);
      });

      mapXml = mapXml.end({ prettyPrint: true });
      // console.log('mapXml', mapXml);

      jszip.file('map.tmx', mapXml);

      async function download (name) {
        const content = await jszip.generateAsync({ type: 'blob' });
        saveAs(content, `${name}.zip`);
      }
      download(state.file.name);
    },
    downloadMapAsJson: (state) => {
      const file = state.file;
      const tileDimension = file.tileDimension;
      // console.log('downloading map as json');

      const mapJson = {
        version: '1.9',
        tiledversion: '1.9.1',
        orientation: 'orthogonal',
        renderorder: 'right-down',
        width: file.width,
        height: file.height,
        tilewidth: tileDimension,
        tileheight: tileDimension,
        infinite: false,
      };

      const tilesetCanvasesFolder = jszip.folder('tilesets');
      const metadataFolder = jszip.folder('metadata');
      mapJson.tilesets = state.file.tilesets.map(tileset => {
        const tilesetCanvas = state.tilesetCanvases[tileset.file];
        tilesetCanvasesFolder.file(`${tileset.name}.png`, tilesetCanvas.toDataURL().split(',')[1], { base64: true });
        const tileCount = tilesetCanvas.width / tileDimension * tilesetCanvas.height / tileDimension;

        const tilesetJson = {
          columns: tilesetCanvas.width / tileDimension,
          image: `../tilesets/${tileset.name}.png`,
          imagewidth: tilesetCanvas.width,
          imageheight: tilesetCanvas.height,
          margin: 0,
          name: tileset.name,
          spacing: 0,
          tilecount: tileCount,
          tiledversion: '1.9.1',
          tileheight: tileDimension,
          tilewidth: tileDimension,
          type: 'tileset',
          version: '1.8',
        };
        metadataFolder.file(`${tileset.name}.json`, JSON.stringify(tilesetJson));

        return {
          firstgid: state.firstGuids[tileset.file],
          source: `./metadata/${tileset.name}.json`,
        };
      });

      let layerId = 1;
      function layerToJson (layer, parentJson) {
        // console.log(layer);
        if (layer == null) return null;
        if (layer.type === 'group') {
          const groupJson = {
            id: layerId,
            name: layer.name,
            width: file.width,
            height: file.height,
            visible: layer.visible,
            opacity: layer.opacity,
            type: 'group',
            layers: [],
          };
          // add layers in layer.layers to groupXml in reverse order
          layer.layers.slice().reverse().forEach(childLayer => {
            // console.log('adding child layer to group');
            groupJson.layers.push(layerToJson(childLayer, groupJson));
          });
          if (!parentJson.layers) parentJson.layers = [];
          parentJson.layers.push(groupJson);
          layerId++;
        } else if (layer.type === 'layer' && state.layerData[layer._id]) {
          const tiles = _.cloneDeep(state.layerTiles[layer._id]);

          // create a new 2d array of tiles that is the same size as the map
          const newTiles = Array(file.height).fill().map(() => Array(file.width).fill(0));
          // console.log('newTiles', newTiles);

          // fill in the new array with the tiles from the layer at layer's position
          const position = _.cloneDeep(state.layerData[layer._id].position);
          position.x /= tileDimension;
          position.y /= tileDimension;
          // console.log('position', position);
          // skip tiles outside of the map
          for (let i = 0; i < tiles.length; i++) {
            for (let j = 0; j < tiles[i].length; j++) {
              if (position.x + j >= 0 && position.x + j < file.width && position.y + i >= 0 && position.y + i < file.height) {
                newTiles[position.y + i][position.x + j] = tiles[i][j] ?? 0;
              }
            }
          }
          // console.log('newTiles', newTiles);

          // flatten into 1d array
          const csv = newTiles.flat();
          // make sure to insert '\n' every width number of elements
          // const csv = newTiles.map(row => row.join(',')).join('\n');
          // doesn't work, something related to line breaks is breaking tiled so not using newlines to separate rows
          // console.log('csv', csv);

          if (!parentJson.layers) parentJson.layers = [];
          parentJson.layers.push({
            data: csv,
            height: file.height,
            id: layerId,
            name: layer.name,
            opacity: layer.opacity,
            type: 'tilelayer',
            visible: true,
            width: file.width,
            x: 0,
            y: 0,
          });
          layerId++;
        }
      }

      // use slice, reverse, and forEach to iterate in reverse order
      file.rootLayer.layers.slice().reverse().forEach(layer => {
        layerToJson(layer, mapJson);
      });

      // console.log('mapJson', mapJson);

      jszip.file('map.json', JSON.stringify(mapJson));

      async function download (name) {
        const content = await jszip.generateAsync({ type: 'blob' });
        saveAs(content, `${name}.zip`);
      }
      download(state.file.name);
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
    clearFile: (state) => {
      state.file = null;
      state.layerData = {};
      state.layerTiles = {};
      state.tilesetCanvases = {};
      state.firstGuids = {};
      state.newChanges = {};
      state.statuses.getFileToEdit = null;
    },
  },
  extraReducers (builder) {
    builder
      .addCase(asyncGetFileToEdit.pending, (state) => {
        state.file = null;
      })
      .addCase(asyncGetFileToEdit.fulfilled, (state, action) => {
        const { file, tilesetCanvases, newFirstGids, layerTiles, layerData } = action.payload;
        // console.log('file', file);
        state.firstGuids = newFirstGids;
        state.file = file;
        state.tilesetCanvases = tilesetCanvases;
        state.layerTiles = layerTiles;
        state.layerData = layerData;
      })
      .addCase(asyncPatchFile.fulfilled, (state, action) => {
        const { newFile, newTilesetCanvases } = action.payload;

        // create array of first guids, last guids for tiles in order
        // const currentGids = state.file.tilesets.map(tileset => [state.firstGuids[tileset.file], state.firstGuids[tileset.file] + state.tilesetCanvases[tileset.file].width / state.file.tileDimension * state.tilesetCanvases[tileset.file].height / state.file.tileDimension - 1]);

        if (Object.keys(newTilesetCanvases).length > 0) {
          // also calculate firstGid for each tileset
          // do this by finding first Gid with enough space for new tileset
          for (const tilesetFileId of Object.keys(newTilesetCanvases)) {
            const currentGuids = getCurrentGuids({ firstGuids: state.firstGuids, file: state.file, tilesetCanvases: state.tilesetCanvases });
            // console.log('currentGuids', currentGuids);

            // find first Gid with enough space for new tileset
            // console.log('tileset', tilesetFileId);
            // console.log('newTilesetCanvases', newTilesetCanvases);
            // console.log('newTilesetCanvases[tileset.file]', newTilesetCanvases[tilesetFileId]);
            const canvas = newTilesetCanvases[tilesetFileId];
            // console.log('width', canvas.width);
            // console.log('height', canvas.height);
            const tileDimension = newFile.tileDimension;
            const tileCount = canvas.width / tileDimension * canvas.height / tileDimension;
            // console.log('tileCount', tileCount);

            const newGuidPair = getFirstAndLastGuids(currentGuids, tileCount);
            // console.log('newFirstGuid', newGuidPair);

            state.firstGuids[tilesetFileId] = newGuidPair[0];
            // console.log('state.firstGuids', _.cloneDeep(state.firstGuids));
          }
        }

        const fieldsToUpdate = Object.keys(action.meta.arg.updates);
        const pickedFile = _.pick(newFile, fieldsToUpdate);
        // console.log('pickedFile', pickedFile);
        _.merge(state.file, pickedFile);
        // replace the sharedWith field
        state.file.sharedWith = newFile.sharedWith;

        // replace the tilesets field
        state.file.tilesets = newFile.tilesets;
        state.tilesetCanvases = _.merge(state.tilesetCanvases, newTilesetCanvases);

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

export const {
  setMapEditorPrimitives,
  assignMapEditorPrimitives,
  clearMapEditorErrors,
  clearMapEditorStatus,
  updateLayer,
  updateAllLayers,
  deleteSelectedLayers,
  updateAllLayersBetween,
  updateLayersUpToRoot,
  updateLayerAndItsChildren,
  moveSelectedLayers,
  addNewMapLayer,
  setBrushCanvas,
  updateLayerTiles,
  assignLayerTiles,
  setLayerData,
  eraseTileInLayer,
  assignTilesetCanvases,
  assignFirstGuids,
  downloadMapAsTmx,
  downloadMapAsJson,
  addNewChanges,
  clearChanges,
  clearFile,
} = mapEditorSlice.actions;

export const selectMapEditorPrimitives = (state) => state.mapEditor.primitives;
export const selectMapFile = (state) => state.mapEditor.file;
export const selectBrushCanvas = (state) => state.mapEditor.brushCanvas;
export const selectLayerTiles = (state) => state.mapEditor.layerTiles;
export const selectLastSelectedLayer = state => state.mapEditor.primitives.lastSelectedLayer;
export const selectTilesetCanvases = state => state.mapEditor.tilesetCanvases;
export const selectMapNewChanges = (state) => state.mapEditor.newChanges;
export const selectFirstGuids = state => state.mapEditor.firstGuids;
export const selectMapEditorStatuses = (state) => state.mapEditor.statuses;
export const selectMapEditorErrors = (state) => state.mapEditor.errors;
export const selectLayerData = (state) => state.mapEditor.layerData;

export const mapEditorReducer = mapEditorSlice.reducer;
