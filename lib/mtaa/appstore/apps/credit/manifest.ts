export const CREDIT_APP = {
  id: "credit",
  name: "Credit & Finance",
  version: "1.0.0",
  category: "finance",
  description: "Credit scoring, loans, investments, and transaction history.",
  entry: "(credit)",
  permissions: ["supabase.read", "supabase.write", "secure.storage"],
  modules: ["credit", "loans", "investments", "transactions"],
  status: "stable",
  installable: true,
  entryPoints: { home: "/(os)/credit", loans: "/(os)/credit/loans", investments: "/(os)/credit/investments", history: "/(os)/credit/history" },
  screens: [] as any,
};
