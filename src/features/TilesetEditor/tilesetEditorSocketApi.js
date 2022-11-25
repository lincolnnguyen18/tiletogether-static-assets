import { socketClient } from '../../app/apiClient';

// Emitters
export function emitLayerPosition ({ layerId, position }) {
  socketClient.emit('layerPosition', { layerId, position });
}

export function emitLayerUpdates ({ newRootLayer, canvasUpdates, layerIds, newImage, layerTileUpdates }) {
  socketClient.emit('layerUpdates', { newRootLayer, canvasUpdates, layerIds, newImage, layerTileUpdates });
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
