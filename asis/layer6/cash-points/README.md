# ASIS Layer 6 — Cash Point Network + Cross-Border Infrastructure

## Purpose

This is NOT just an agent system. It is:
- Distributed liquidity infrastructure
- Cross-border cash coordination
- Intelligent routing architecture
- Geo-aware financial infrastructure
- Future African financial mesh foundations

## Architecture

| Component | File | Purpose |
|-----------|------|---------|
| **Cash Point Engine** | `cash-point-engine.ts` | Registration, discovery, availability, 5 geohash precision levels |
| **Geo Discovery** | `geo-discovery.ts` | Nearby search, low-memory caching, offline-aware, coverage stats |
| **Liquidity Manager** | `liquidity-manager.ts` | Float estimation, health scoring, balancing suggestions |
| **Route Optimizer** | `route-optimizer.ts` | Nearest/cheapest/safest/best liquidity routes with explanations |
| **Cross-Border Router** | `cross-border-router.ts` | 6 country profiles, corridor management, FX compatibility |
| **Settlement Orchestrator** | `settlement-orchestrator.ts` | Batching, delayed settlement, reconciliation scaffold |
| **Agent Reputation** | `agent-reputation.ts` | Explainable scoring: reliability, liquidity, ratings, disputes |
| **Operational State** | `operational-state.ts` | 5 states, transition validation, uptime stats |
| **Offline Queue** | `offline-queue.ts` | Queued withdrawals, auto-sync, retry with backoff |
| **Region Registry** | `region-registry.ts` | Country profiles, regional groups, language/timezone |
| **Fraud Shield** | `security/fraud-shield.ts` | KYC, routing patterns, liquidity anomalies, fake detection |
| **Agent Verification** | `security/agent-verification.ts` | KYC levels, documents, training, background checks |
| **Cash Point Map** | `ui/cash-point-map.tsx` | Map-first UX, filter bar, bottom sheet list |
| **Cash Point Card** | `ui/cash-point-card.tsx` | Compact + full card with status, fees, liquidity warnings |
| **Liquidity Status** | `ui/liquidity-status.tsx` | Network health visualization |

## Countries Supported

| Country | Code | Currencies | Mobile Money |
|---------|------|-----------|-------------|
| Kenya | KE | KES, USD | M-Pesa, Airtel Money |
| Uganda | UG | UGX, USD | MTN, Airtel |
| Tanzania | TZ | TZS, USD | M-Pesa, Tigo, Airtel |
| Nigeria | NG | NGN, USD, GHS | MTN MoMo, Airtel, 9mobile |
| Ghana | GH | GHS, USD | MTN MoMo, Vodafone, AirtelTigo |
| South Sudan | SS | SSP, USD | MTN |

## Security

- Fraud Shield: KYC, velocity, round-trip detection, fake agent detection
- Agent Verification: 3 KYC levels, background checks, training
- Auto-suspend at fraud score ≥ 80

## Offline-First

- Offline Queue: 5 retry attempts with exponential backoff
- Auto-sync on network recovery
- Local transaction queue with status tracking
