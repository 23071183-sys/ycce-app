import { requireOptionalNativeModule } from 'expo-modules-core';

// The installed APK predates expo-camera and expo-location, and importing
// either there throws. Check for the native module first and only load the JS
// when it exists; screens fall back to typing a code or skip location.
export const cameraAvailable = Boolean(requireOptionalNativeModule('ExpoCamera'));
export const locationAvailable = Boolean(requireOptionalNativeModule('ExpoLocation'));

// The phone's current position as { lat, lng }. Throws with a readable message
// when location is unavailable or permission is refused.
export async function getCurrentLocation() {
  if (!locationAvailable) throw new Error('This version of the app can’t read your location. Update the app to scan in.');
  const Location = require('expo-location');
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new Error('Allow location access so your attendance can be checked against the classroom.');
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return { lat: pos.coords.latitude, lng: pos.coords.longitude };
}
