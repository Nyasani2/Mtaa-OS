export const JOBS_APP = {
  id: "jobs",
  name: "Jobs & Work",
  version: "1.0.0",
  category: "work",
  description: "Find jobs, post openings, manage applications, and build your work profile.",
  entry: "(jobs)",
  permissions: ["supabase.read", "supabase.write", "notifications.push"],
  modules: ["search", "applications", "profile", "post"],
  status: "stable",
  installable: true,
  entryPoints: { home: "/(os)/jobs", search: "/(os)/jobs/search", applications: "/(os)/jobs/applications", profile: "/(os)/jobs/profile" },
};
