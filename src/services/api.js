import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: 'https://ycce-app-backend.onrender.com/api',
  timeout: 10000,
});

let _logoutCallback = null;
export const setLogoutCallback = (fn) => { _logoutCallback = fn; };

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  response => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['token', 'user']);
      if (_logoutCallback) _logoutCallback();
    }
    return Promise.reject(error);
  }
);

export default api;
