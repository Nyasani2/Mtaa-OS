# ASIS Layer 5 — Wallet Intelligence + Claim System

## Purpose

This is NOT just a wallet module. It is:
- Intelligent onboarding infrastructure
- Viral growth infrastructure (claim links + QR onboarding)
- Financial routing abstraction
- Future cross-border architecture
- AI-assisted transaction orchestration

## Architecture

| Component | File | Purpose |
|-----------|------|---------|
| **Wallet Assistant** | `wallet-assistant.ts` | Natural language guidance, anomaly detection, flow guidance |
| **Transfer Orchestrator** | `transfer-orchestrator.ts` | Validate → dry-run → confirm → execute → audit pipeline |
| **Transaction Intelligence** | `transaction-intelligence.ts` | Spending patterns, insights, recommendations |
| **Payment Router** | `payment-routing.ts` | Multi-provider routing with fallback |
| **FX Engine** | `fx-engine.ts` | Rate abstraction, conversion estimation (no live APIs) |
| **Claim Link Engine** | `claim-link-engine.ts` | Secure tokens, viral growth loop |
| **QR Onboarding** | `qr-onboarding.ts` | QR generation/parsing for claims, referrals, payments |
| **Conversational Onboarding** | `conversational-onboarding.ts` | Human, calm, guided onboarding |
| **Cash Point Registry** | `cash-point-registry.ts` | Africa-ready agent network |
| **Fraud Monitor** | `fraud-monitor.ts` | Velocity, device, PIN, geo detection |
| **Transfer Policy** | `security/transfer-policy.ts` | KYC-aware limits |
| **Transaction Validator** | `security/transaction-validator.ts` | 3-stage validation pipeline |
| **Claim Preview Card** | `ui/claim-preview-card.tsx` | Trustworthy claim UI |
| **Onboarding Flow** | `ui/onboarding-flow.tsx` | Progressive disclosure onboarding |
| **QR Claim Screen** | `ui/qr-claim-screen.tsx` | Scan → preview → claim flow |

## Security Model

All financial actions follow:
1. **Validate** — policy + fraud checks
2. **Dry-run** — preview fees, FX, warnings
3. **Confirm** — PIN/biometric + user confirmation
4. **Execute** — final validation + provider call
5. **Audit** — immutable event log

## Growth Loop

```
User sends money → recipient not found
    ↓
Generate claim link
    ↓
Share via WhatsApp/SMS
    ↓
Recipient installs MTAA
    ↓
ASIS guides onboarding
    ↓
Recipient claims funds
    ↓
New active user
```

## African-First Design

- Low-end Android optimization
- Offline-capable cash points
- Multi-currency (KES, UGX, TZS, RWF, NGN, GHS, ZAR, USD, EUR, GBP)
- Intermittent connectivity support
- Agent-driven cash economy
- Multilingual-ready

## Future Evolution

- Real banking integrations (plug into IPaymentRouteProvider)
- Live FX APIs (plug into IFXProvider)
- Cross-border corridors
- Distributed cash point network
- Conversational fintech UX
