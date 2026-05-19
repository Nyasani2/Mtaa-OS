export default {
  expo: {
    name: "MTAA_OS_V10",
    slug: "mtaa-os-v10",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "dark",

    plugins: [
      "expo-router",
      "expo-local-authentication",
    ],

    experiments: {
      typedRoutes: true
    },

    ios: {
      supportsTablet: true
    },

    android: {
      package: "com.mtaa.os"
    }
  }
};
