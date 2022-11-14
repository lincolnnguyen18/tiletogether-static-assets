import { socketClient } from '../../app/apiClient';

// Emitters
export function emitLayerPosition ({ layerId, position }) {
  socketClient.emit('layerPosition', { layerId, position });
}

export function emitLayerImage ({ layerId, color, brushSize, brushType, params }) {
  socketClient.emit('layerImage', { layerId, color, brushSize, brushType, params });
}

export function emitLayerUpdates ({ newRootLayer, canvasUpdates, layerIds, newImage }) {
  socketClient.emit('layerUpdates', { newRootLayer, canvasUpdates, layerIds, newImage });
}

// Event listeners
export function onLayerPosition (handler) {
  // when called, clear any old listeners
  socketClient.off('layerPosition');
  // attach new listener
  socketClient.on('layerPosition', handler);
}

export function onChangesSaved (handler) {
  // when called, clear any old listeners
  socketClient.off('changesSaved');
  // attach new listener
  socketClient.on('changesSaved', handler);
}
