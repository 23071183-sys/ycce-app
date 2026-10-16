import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { palette, space, radius, type } from '../theme';

const STORAGE_KEY = 'themePreference';
const PREFERENCES = ['system', 'light', 'dark'];

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [preference, setPreferenceState] = useState('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => { if (PREFERENCES.includes(saved)) setPreferenceState(saved); })
      .catch(() => {});
  }, []);

  // Override the scheme natively, not just in JS, so system alerts, pickers and
  // the keyboard follow the user's choice too. 'unspecified' goes back to
  // following the device. useColorScheme() then reports the effective scheme.
  useEffect(() => {
    Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);
  }, [preference]);

  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';

  const setPreference = (next) => {
    if (!PREFERENCES.includes(next)) return;
    setPreferenceState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  };

  const value = useMemo(() => {
    const colors = palette[scheme];
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    const navTheme = {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.accent,
        background: colors.bg,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        notification: colors.danger,
      },
    };
    return { colors, scheme, preference, setPreference, navTheme, space, radius, type };
  }, [scheme, preference]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// The colour set for the current scheme. Screens written before the redesign
// call this as `const c = useTheme()`, so it keeps returning the colours alone.
export const useTheme = () => useContext(ThemeContext).colors;

// Scheme, the user's preference and its setter, and the navigation theme.
export const useThemeControls = () => useContext(ThemeContext);
