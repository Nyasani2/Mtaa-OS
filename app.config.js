export default {
  expo: {
    name: "MTAA OS",
    slug: "mtaa-os",
    version: "1.0.0",
    orientation: "portrait",
    scheme: "mtaa",
    userInterfaceStyle: "automatic",
    icon: "./assets/images/mtaa_icon.png",
    splash: {
      image: "./assets/images/mtaa_splash.png",
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
        foregroundImage: "./assets/images/mtaa_icon.png",
        backgroundColor: "#000000",
      },
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "READ_CONTACTS",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "SEND_SMS"
      ],
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            { scheme: "mtaa" },
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
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow MTAA OS to use your location for transport and delivery services."
        }
      ],
      [
        "expo-contacts",
        {
          "contactsPermission": "Allow MTAA OS to access your contacts to easily call or message them."
        }
      ],
      [
        "expo-camera",
        {
          "cameraPermission": "Allow MTAA OS to access your camera for QR scanning, profile photos, and verification."
        }
      ]
    ],
    experiments: {
      typedRoutes: true,
      tsconfigPaths: true,
    },
    updates: {
      url: "https://u.expo.dev/67589048-d14b-4c80-8ce3-4955651494d9",
    },
    runtimeVersion: "1.0.0",
    extra: {
      eas: {
        projectId: "67589048-d14b-4c80-8ce3-4955651494d9",
      },
    },
  },
};
