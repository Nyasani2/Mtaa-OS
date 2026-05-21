export const HOOKUP_APP = {
  id: "hookup",
  name: "Hookup",
  version: "1.0.0",
  category: "social",
  description:
    "Real-time social connection platform with chat, discovery, rooms, and profiles. AI-moderated, end-to-end encrypted.",

  entry: "(hookup)",

  permissions: [
    "supabase.read",
    "supabase.write",
    "realtime.chat",
    "realtime.presence",
    "location.read",
    "camera.access",
    "microphone.access",
    "notifications.push"
  ],

  modules: [
    "chat",
    "discover",
    "profile",
    "rooms",
    "matching",
    "moderation",
    "encryption"
  ],

  status: "stable",

  installable: true,

  entryPoints: {
    home: "/(hookup)",
    chat: "/(hookup)/chat",
    discover: "/(hookup)/discover",
    profile: "/(hookup)/profile",
    rooms: "/(hookup)/rooms",
  }
};
