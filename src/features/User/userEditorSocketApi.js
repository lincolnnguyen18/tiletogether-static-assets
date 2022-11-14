import { socketClient } from '../../app/apiClient';
import Cookies from 'js-cookie';

socketClient.on('connect', () => {
  console.log('connected');
});

socketClient.on('disconnect', () => {
  console.log('disconnected');
});

// Emitters
export function emitJoinRoom ({ fileId }) {
  const token = Cookies.get('token');
  socketClient.emit('joinRoom', { fileId, token });
}

export function emitLeaveRoom ({ fileId }) {
  socketClient.emit('leaveRoom', { fileId });
}

// Event listeners
export function onConnected (handler) {
  socketClient.on('connect', handler);
}
