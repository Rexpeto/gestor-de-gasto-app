// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Expo SQLite necesita resolver archivos .wasm para su dev plugin
config.resolver.assetExts.push('wasm');

module.exports = withUniwindConfig(config, {
  // relative path to your global.css file
  cssEntryFile: './src/global.css',
  // auto-generated typings
  dtsFile: './src/uniwind-types.d.ts',
});
