export const HEALTH_APP = {
  id: "health",
  name: "Health",
  version: "1.0.0",
  category: "system",
  description: "Health records, appointments, telemedicine, and emergency services.",
  entry: "(health)",
  permissions: ["supabase.read", "supabase.write", "notifications.push", "camera.access"],
  modules: ["records", "appointments", "telemedicine", "pharmacy", "ambulance"],
  status: "stable",
  installable: false,
  entryPoints: {
    home: "/(health)",
    appointments: "/(health)/book-appointment",
    ambulance: "/(health)/ambulance",
  }
};
