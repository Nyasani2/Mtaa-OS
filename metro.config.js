const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude backup dirs and heavy paths from Metro scan
config.resolver.blockList = [
  /auth-cleanup-backup-.*/,
  /\.git\/.*/,
  /\.expo\/web\/cache\/.*/,
  /node_modules\/.*\/node_modules\/.*/,
  /backups\/.*/,
  /archive\/.*/,
  /\.backup\/.*/,
];

// Keep asset extensions clean
config.resolver.assetExts = config.resolver.assetExts.filter(
  (ext) => !['svg', 'md', 'txt'].includes(ext)
);

module.exports = config;
