# Salvaged from accidentally-committed ~/Desktop folder

These 10 files were NOT duplicates of anything in the main tree — they were unique.
The other 44 files in the original ~/Desktop/MTAA_Wallet_Audit folder were byte-identical
duplicates of existing main-tree files and were deleted outright.

## Needs human decision:
- `mtaa_mpesa_daraja_frontend_v3.ts` (524 lines) — a business_owners/multi-config Daraja model.
  Main tree already has 8+ separate Daraja/M-Pesa integration locations (see audit report).
  Unclear if this v3 design supersedes or duplicates those. NEEDS COMPARISON before use.
- `wallet-v2-service.ts` / `wallet-v2-types.ts` — a "v2" wallet redesign. Confirmed NOT referenced
  anywhere in the live app. Matching SQL exists at repo root (wallet-v2-rpc-and-rls.sql,
  WALLET_V2_INSTALL.md) but was apparently never wired to frontend. Was this abandoned
  intentionally, or lost? NEEDS HUMAN DECISION.
- `asis-wallet-stubs/` — the ONLY trace of "fraud monitoring" anywhere in the codebase, and it's
  placeholder-only (WalletAssistant.suggest() returns an empty array). FraudMonitor,
  TransferOrchestrator, TransferPolicy, TransactionValidator (imported by
  lib/system/adapters/asis-adapter.ts) do not exist ANYWHERE, not even here. Fraud monitoring
  needs to be built from scratch — this is not a bug fix, it's a missing feature.
- `hooks/useWalletLive.ts`, `hooks/useWalletStore.ts` — unclear if superseded by current
  wallet hooks in main tree. NEEDS COMPARISON.
