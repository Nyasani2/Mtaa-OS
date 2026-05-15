export default {
  expo: {
    name: "MTAA",
    slug: "mtaa",
    plugins: ["expo-barcode-scanner"],
  },
}
export default {
  expo: {
    name: "MTAA_OS_V10",
    slug: "mtaa-os-v10",
    version: "1.0.0",
    extra: {
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
  },
};
export default {
  expo: {
    name: "MTAA_OS_V10",
    slug: "MTAA_OS_V10",
    plugins: [
      "expo-router",
      "expo-secure-store"
    ]
  }
};
