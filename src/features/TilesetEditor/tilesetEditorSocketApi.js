import { socketClient } from '../../app/apiClient';
import Cookies from 'js-cookie';

socketClient.on('connect', () => {
  console.log('connected');
});

// Emitters

export function emitJoinRoom ({ fileId }) {
  const token = Cookies.get('token');
  socketClient.emit('joinRoom', { fileId, token });
}

export function emitLeaveRoom ({ fileId }) {
  socketClient.emit('leaveRoom', { fileId });
}

export function emitLayerPosition ({ layerId, position }) {
  socketClient.emit('layerPosition', { layerId, position });
}

export function emitLayerImage ({ layerId, color, brushSize, brushType, params }) {
  socketClient.emit('layerImage', { layerId, color, brushSize, brushType, params });
}

// Event listeners

export function onLayerPosition (handler) {
  // when called, clear any old listeners
  socketClient.off('layerPosition');
  // attach new listener
  socketClient.on('layerPosition', handler);
}
