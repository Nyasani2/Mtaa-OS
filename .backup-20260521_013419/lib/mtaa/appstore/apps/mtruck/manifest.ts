export const MTRUCK_APP = {
  id: "mtruck",
  name: "MTRUCK OS",
  version: "1.0.0",
  category: "logistics",
  description:
    "Autonomous freight and logistics operating system with AI dispatch, fleet intelligence, and predictive routing.",

  entry: "(mtruck)",

  permissions: [
    "supabase.read",
    "supabase.write",
    "realtime.tracking",
    "maps.access"
  ],

  modules: [
    "dispatch",
    "tracking",
    "ai",
    "control",
    "os"
  ],

  status: "stable",

  installable: true,

  entryPoints: {
    home: "/(mtruck)",
    dispatch: "/(mtruck)/dispatch",
    tracking: "/(mtruck)/tracking",
  }
};
