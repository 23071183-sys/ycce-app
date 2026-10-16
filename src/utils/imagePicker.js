import { requireOptionalNativeModule } from 'expo-modules-core';

// Builds made before expo-image-picker was added don't contain its native
// code, and importing it there throws. Check for the native module first and
// only load the JS when it exists, so those builds just hide the feature.
export const imagePickerAvailable = Boolean(requireOptionalNativeModule('ExponentImagePicker'));

// Lets the user choose a square photo from the library. Resolves to the picked
// asset, or null if they cancelled or the picker isn't in this build.
export async function pickSquarePhoto() {
  if (!imagePickerAvailable) return null;
  const ImagePicker = require('expo-image-picker');
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });
  if (result.canceled || !result.assets?.length) return null;
  return result.assets[0];
}
