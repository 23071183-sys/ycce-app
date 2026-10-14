import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_PORT = 3000;

// In LAN mode the Metro host is the same machine running the API, so the API
// address can be derived from it. This keeps working after a Wi-Fi change,
// which a hardcoded IP does not. Returns null for tunnel hosts, which serve
// Metro but not the API.
const deriveApiUrlFromMetro = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (!hostUri) return null;

  const host = hostUri.split('://').pop().split('/')[0].split(':')[0];
  if (!host || host.includes('exp.direct') || host.includes('exp.host')) return null;

  return `http://${host}:${API_PORT}/api`;
};

// Priority: explicit tunnel URL > derived LAN address > localhost (simulator).
export const resolveBaseUrl = () =>
  process.env.EXPO_PUBLIC_API_URL || deriveApiUrlFromMetro() || `http://localhost:${API_PORT}/api`;

const api = axios.create({
  baseURL: resolveBaseUrl(),
  timeout: 15000,
});

let _logoutCallback = null;
export const setLogoutCallback = (fn) => { _logoutCallback = fn; };

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // localtunnel serves an interstitial page unless this header is present.
  config.headers['bypass-tunnel-reminder'] = '1';
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

// A 401 is already dealt with above: the session is cleared and the user is sent
// back to the login screen. Logging it again only raises a LogBox toast over that
// screen, which reads as a crash. Screens pass fetch failures here instead of
// straight to console.error so the expected case stays quiet.
export const reportError = (error) => {
  if (error?.response?.status === 401) return;
  console.error(error);
};

export default api;
