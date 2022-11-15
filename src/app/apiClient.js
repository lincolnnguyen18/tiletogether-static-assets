import axios from 'axios';
import Cookies from 'js-cookie';
import { wait } from '../utils/timeUtils';
import { io } from 'socket.io-client';

export const apiClient = axios.create({
  baseURL: process.env.REACT_APP_SERVER_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use(async (config) => {
  await wait(500);
  config.headers.Authorization = `Bearer ${Cookies.get('token')}`;
  return config;
}, (error) => {
  Promise.reject(error);
});

export const socketClient = io(process.env.REACT_APP_SERVER_URL);
