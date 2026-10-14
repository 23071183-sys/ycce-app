import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { dark, light } from '../theme';

const ThemeContext = createContext(dark);

export function ThemeProvider({ children }) {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? dark : light;
  return <ThemeContext.Provider value={colors}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
