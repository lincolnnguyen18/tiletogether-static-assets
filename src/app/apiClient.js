import axios from 'axios';
import Cookies from 'js-cookie';

export const apiClient = axios.create({
  baseURL: process.env.REACT_APP_SERVER_URL + '/api',
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${Cookies.get('token')}`;
  return config;
}, (error) => {
  Promise.reject(error);
});
