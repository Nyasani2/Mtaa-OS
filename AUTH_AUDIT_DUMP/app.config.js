export default {
  expo: {
    name: "MTAA OS",
    slug: "mtaa-os",
    version: "1.0.0",
    orientation: "portrait",

    scheme: "mtaa",

    userInterfaceStyle: "automatic",

    icon: "./assets/images/mtaa_home.jpg",

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
      package: "com.mtaa.os",

      adaptiveIcon: {
        foregroundImage: "./assets/images/mtaa_home.jpg",
        backgroundColor: "#000000",
      },

      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "mtaa",
            },
            {
              scheme: "https",
              host: "mtaa-os.vercel.app",
              pathPrefix: "/auth/reset-password",
            },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },

    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },

    plugins: [
      "expo-secure-store",
    ],

    experiments: {
      typedRoutes: true,
      tsconfigPaths: true,
    },

    extra: {
      eas: {
        projectId: "67589048-d14b-4c80-8ce3-4955651494d9",
      },

      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
  },
};
