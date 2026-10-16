import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useThemeControls } from './src/context/ThemeContext';
import { UnreadProvider } from './src/context/UnreadContext';
import AppNavigator from './src/navigation/AppNavigator';

// Follows the app's own theme choice, which may differ from the device setting.
function ThemedStatusBar() {
  const { scheme } = useThemeControls();
  return <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UnreadProvider>
          <ThemedStatusBar />
          <AppNavigator />
        </UnreadProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
