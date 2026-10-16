import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import api, { setLogoutCallback } from '../services/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerPushToken() {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;
    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
  } catch {
    return null;
  }
}

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const userRef = useRef(null);
  userRef.current = user;

  useEffect(() => {
    const loadAuth = async () => {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        // Re-register push token on app launch in case it changed
        const pushToken = await registerPushToken();
        if (pushToken) {
          api.put('/users/push-token', { expo_push_token: pushToken }).catch(() => {});
        }
      }
      setLoading(false);
    };
    loadAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { user, token } = res.data;
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
    // Register push notifications after login
    const pushToken = await registerPushToken();
    if (pushToken) {
      api.put('/users/push-token', { expo_push_token: pushToken }).catch(() => {});
    }
  };

  // Re-reads the signed-in user's profile (or takes one the caller already has,
  // e.g. from a profile update response) and keeps the stored copy in step.
  const refreshUser = async (fresh) => {
    const me = fresh || (await api.get('/users/me')).data;
    const merged = { ...(userRef.current || {}), ...me };
    setUser(merged);
    await AsyncStorage.setItem('user', JSON.stringify(merged));
    return merged;
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    setLogoutCallback(logout);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
