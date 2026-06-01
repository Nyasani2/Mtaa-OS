export const STREETS_APP = {
  id: "streets",
  name: "Streets",
  version: "1.0.0",
  category: "civic",
  description: "City navigation, service reporting, and civic infrastructure monitoring.",
  entry: "(streets)",
  permissions: ["location.read", "supabase.write", "notifications.push"],
  modules: ["map", "report", "services"],
  status: "beta",
  installable: true,
  entryPoints: { home: "/(os)/streets", map: "/(os)/streets/map", report: "/(os)/streets/report", services: "/(os)/streets/services" },
};
