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

const PRODUCTION_API = 'https://ycce-app-backend.onrender.com/api';

// Priority: explicit URL > derived LAN address > a last resort that depends on
// how the app is running. In development that is localhost (a simulator on
// this machine). A published update or installed build has no Metro host to
// derive from, and localhost there is the phone itself, so it must fall back
// to the hosted API instead — otherwise a build made without the env var opens
// to empty screens with nothing reporting why.
export const resolveBaseUrl = () =>
  process.env.EXPO_PUBLIC_API_URL ||
  deriveApiUrlFromMetro() ||
  (__DEV__ ? `http://localhost:${API_PORT}/api` : PRODUCTION_API);

// The host sleeps when idle and takes ~25s to answer the request that wakes it,
// so a 15s ceiling aborted calls that would have succeeded.
const api = axios.create({
  baseURL: resolveBaseUrl(),
  timeout: 40000,
});

// While the host is still starting it answers 503 rather than queueing, so the
// first request after an idle period fails even though nothing is wrong. Retry
// those a few times before surfacing anything to the user.
const WAKE_RETRY_STATUSES = [502, 503, 504];
const WAKE_RETRY_DELAYS_MS = [2000, 5000, 10000];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
      return Promise.reject(error);
    }

    const config = error.config;
    if (config && WAKE_RETRY_STATUSES.includes(error.response?.status)) {
      const attempt = config._wakeRetry ?? 0;
      if (attempt < WAKE_RETRY_DELAYS_MS.length) {
        config._wakeRetry = attempt + 1;
        await sleep(WAKE_RETRY_DELAYS_MS[attempt]);
        return api(config);
      }
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
