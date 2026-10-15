// Expo Go only loads updates tagged with its own SDK runtime ("exposdk:57.0.0"),
// while installed builds use the app version ("1.0.0"). A single update cannot
// carry both, so updates meant for Expo Go are published with EXPO_GO=1 to their
// own branch and channel; everything else keeps the app.json setting.
module.exports = ({ config }) => ({
  ...config,
  runtimeVersion: process.env.EXPO_GO === '1'
    ? { policy: 'sdkVersion' }
    : config.runtimeVersion,
});
