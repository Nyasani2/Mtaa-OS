export default {
  name: "MTAA OS",
  slug: "mtaa-os",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/mtaa_home.jpg",
  scheme: "mtaa",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/images/mtaa_splash.jpg",
    resizeMode: "contain",
    backgroundColor: "#000000",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.mtaa.os",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/mtaa_home.jpg",
      backgroundColor: "#000000",
    },
    package: "com.mtaa.os",
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
  ],
  experiments: {
    typedRoutes: true,
    tsconfigPaths: true,
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
};
