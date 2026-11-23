// Metro ist der Bündler von Expo. Diese Einstellungen braucht expo-sqlite im Browser:
// - "wasm" als Datei-Typ, damit die SQLite-Datenbank für den Browser geladen werden kann
// - Zwei Header, die der Browser für SharedArrayBuffer verlangt
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('wasm');

// react-native-track-player bringt für den Browser eine Abhängigkeit mit (shaka-player), die wir nicht brauchen.
// Die App ist für das Handy gebaut. Im Browser bekommt das Modul deshalb eine leere Ersatzdatei, damit der Bundler nicht abbricht.
const standardAufloesung = config.resolver.resolveRequest;
config.resolver.resolveRequest = (kontext, modulName, plattform) => {
  if (plattform === 'web' && modulName.startsWith('shaka-player')) {
    return { type: 'empty' };
  }
  if (standardAufloesung) return standardAufloesung(kontext, modulName, plattform);
  return kontext.resolveRequest(kontext, modulName, plattform);
};

config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    middleware(req, res, next);
  };
};

module.exports = config;
