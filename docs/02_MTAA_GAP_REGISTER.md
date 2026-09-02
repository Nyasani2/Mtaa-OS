# 02 — MTAA GAP REGISTER

| Area | Status | Evidence | Action |
|------|--------|----------|--------|
| Wallet ledger | ✅ LIVE | wallet_accounts/transactions + mtaa_* RPCs | none |
| Wallet reads (agents/credit/escrow/savings/tax) | ✅ WIRED | direct RLS tables | none |
| Agent privileged ops | ✅ EDGE FN | agent-operations (register/activate/float) | none |
| M-Pesa STK | ✅ SANDBOX-LIVE | mpesa-stk-push + callback | Go-Live creds |
| Network settings | ✅ LIVE-HW | expo-network/battery/location | none |
| Hooks (9) | ✅ WIRED | useAnalytics..useTransport | none |
| Coming-soon UI (21) | ⏸ INTENTIONAL | product roadmap | keep |
| Health records mock | 🟡 PARTIAL | MOCK_RECORDS fallback | wire to health_records |
| Health map | 🟡 PLACEHOLDER | list hybrid | add map lib later |
| ASIS health | 🟡 STUB | SymptomChecker stub | wire to asis-cse |