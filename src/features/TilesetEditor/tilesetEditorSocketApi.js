import { socketClient } from '../../app/apiClient';
import Cookies from 'js-cookie';

socketClient.on('connect', () => {
  console.log('connected');
});

export function socketJoin ({ fileId }) {
  const token = Cookies.get('token');
  socketClient.emit('socketJoin', { fileId, token });
}

export function socketUpdateLayerPosition ({ layerId, position }) {
  socketClient.emit('socketUpdateLayerPosition', { layerId, position });
}

export function socketUpdateLayerImage ({ layerId, color, brushSize, brushType, params }) {
  socketClient.emit('socketUpdateLayerImage', { layerId, color, brushSize, brushType, params });
}

export function socketSynchronizeLayerPosition (handler) {
  // when called, clear any old listeners
  socketClient.off('socketSynchronizeLayerPosition');
  // attach new listener
  socketClient.on('socketSynchronizeLayerPosition', handler);
}

// export function socketSendUnsavedChanges (handler) {
//   socketClient.off('socketSendUnsavedChanges');
//   socketClient.on('socketSendUnsavedChanges', handler);
// }
