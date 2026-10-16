import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { EmptyState } from './ui';
import { useTheme } from '../context/ThemeContext';
import { radius } from '../theme';

// Camera view that reports each QR code once. Only render this when
// cameraAvailable is true: it loads expo-camera, which isn't in older builds.
// While paused it ignores codes, so the parent can show a result first.
export default function QRScanner({ onScan, paused = false, height = 300 }) {
  const c = useTheme();
  const { CameraView, useCameraPermissions } = require('expo-camera');
  const [permission, requestPermission] = useCameraPermissions();
  const lastCode = useRef({ data: null, at: 0 });

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) requestPermission();
  }, [permission?.granted, permission?.canAskAgain]);

  if (!permission) return <View style={[styles.frame, { height, backgroundColor: c.surfaceAlt }]} />;
  if (!permission.granted) {
    return (
      <View style={[styles.frame, { height, backgroundColor: c.surfaceAlt }]}>
        <EmptyState
          icon="camera-outline"
          title="Camera access needed"
          message="Allow the camera to scan codes, or type the code below."
          actionTitle={permission.canAskAgain ? 'Allow camera' : undefined}
          onAction={permission.canAskAgain ? requestPermission : undefined}
        />
      </View>
    );
  }

  const handle = ({ data }) => {
    // The camera fires many times a second for the same code.
    const now = Date.now();
    if (data === lastCode.current.data && now - lastCode.current.at < 3000) return;
    lastCode.current = { data, at: now };
    onScan(data);
  };

  return (
    <View style={[styles.frame, { height, borderColor: c.border }]}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={paused ? undefined : handle}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  frame: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
  },
});
