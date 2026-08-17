const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix: react-native-maps crashes web bundler — shim it on web
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform, info) => {
  if (platform === 'web' && moduleName === 'react-native-maps') {
    return {
      filePath: require('path').join(__dirname, 'shims/react-native-maps.web.js'),
      type: 'sourceFile',
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform, info);
  }
  return context.resolveRequest(context, moduleName, platform, info);
};

module.exports = config;
