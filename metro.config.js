// Metro ist der Bündler von Expo. Diese Einstellungen braucht expo-sqlite im Browser:
// - "wasm" als Datei-Typ, damit die SQLite-Datenbank für den Browser geladen werden kann
// - Zwei Header, die der Browser für SharedArrayBuffer verlangt
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('wasm');

config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    middleware(req, res, next);
  };
};

module.exports = config;
