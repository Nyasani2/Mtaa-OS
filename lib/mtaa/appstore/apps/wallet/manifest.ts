export const WALLET_APP = {
  id: "wallet",
  name: "Wallet",
  version: "1.0.0",
  category: "system",
  description: "Secure digital wallet with escrow, transfers, deposits, and transaction history.",
  entry: "(wallet)",
  permissions: ["supabase.read", "supabase.write", "secure.storage", "biometric.read"],
  modules: ["balance", "transfer", "deposit", "escrow", "transactions", "scan"],
  status: "stable",
  installable: false,
  entryPoints: {
    home: "/(wallet)",
    deposit: "/(wallet)/deposit",
    transfer: "/(wallet)/transfer",
    send: "/(wallet)/send",
  }
};
