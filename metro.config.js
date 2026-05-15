const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// IMPORTANT: disable unstable env virtual module resolution issues
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
