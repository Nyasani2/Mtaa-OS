# ASIS AI — Adaptive System Intelligence System

## Overview

ASIS is the OS-wide intelligence layer for MTAA OS. It is NOT a simple chatbot — it is a modular, scalable AI subsystem that serves as:

- **Conversational AI** — Natural language interface for all MTAA services
- **Recommendation Engine** — Context-aware suggestions across wallet, jobs, transport, health
- **Automation Assistant** — Safe, permission-controlled task execution
- **Financial Intelligence** — Transaction analysis, fraud detection preparation, FX insights
- **Engineering Reasoning** — Infrastructure planning and simulation support
- **Future Orchestration Layer** — Extensible architecture for civic, creative, and health intelligence

## Architecture Principles

1. **No Direct DB Writes** — All actions route through service layers
2. **Security First** — PIN/biometric confirmation for all sensitive actions
3. **Modular Design** — Each layer is independently deployable
4. **African-First** — Kenya default, multi-country ready
5. **Fintech-Safe** — Full audit trails, permission validation, anti-fraud hooks
6. **Mobile-First** — Lightweight, fast, premium mobile UX

## Layer Structure

```
asis/
├── core/           # Event bus, context, orchestrator, config, health
├── chat/           # UI, streaming, session management
├── context/        # Conversation state, intent detection
├── memory/         # User memory, embeddings, personalization
├── agents/         # Navigator, Wallet, Jobs, Transport, Engineering agents
├── actions/        # Tool definitions, action validation
├── recommendation/ # Suggestion engine, preference learning
├── billing/        # Usage tracking, cost management
├── security/       # Permission layer, audit logs, confirmation gates
├── engineering/    # Simulation bridge, lattice planner, swarm rules
├── simulation/     # Scenario modeling, what-if analysis
├── health/         # Health vault interface, consent management
├── transport/      # MTaxi/MTruck integration, routing intelligence
├── jobs/           # Job matching, CV analysis, hiring assistance
├── wallet/         # Financial assistant, claim system, FX layer
└── shared/         # Types, interfaces, utilities, constants
```

## Layer Delivery Plan

| Layer | Contents | Status |
|-------|----------|--------|
| 1 | Core Foundation (event bus, config, orchestrator, security, types) | **DELIVERED** |
| 2 | Chat System (UI, streaming, session manager, renderer) | Pending |
| 3 | Agent System (6 agents, routing, structured outputs) | Pending |
| 4 | Memory + Personalization (memory engine, embeddings, preferences) | Pending |
| 5 | Wallet + Claim System (assistant, QR onboarding, FX) | Pending |
| 6 | Cash Point Network (agent map, liquidity, cross-border) | Pending |
| 7 | Health System (vault, QR access, consent, audit) | Pending |
| 8 | Engineering System (assistant, planner, simulation) | Pending |
| 9 | Voice + Avatar (TTS, STT, avatar config, personality) | Pending |
| 10 | Studio System (text-to-video, music, scene batching) | Pending |

## Security Rules

- No direct database writes from ASIS
- All actions go through service layer with validation
- Sensitive actions require PIN or biometric confirmation
- Full audit logs for critical actions
- Modular permissions system per country
- KYC level gating for all financial tools

## Country Architecture

Default: **Kenya (KE)**

Extensible via `CountryProfile`:
- Currency (KES, UGX, TZS, NGN, etc.)
- Tax rules (VAT, withholding, digital services)
- Withdrawal methods (M-Pesa, Airtel Money, bank, cash point)
- KYC rules (tier limits, ID requirements, biometric)
- Compliance rules (CBK, data localization, reporting thresholds)
- Locale (language, timezone, date/number formats)
- Emergency numbers

## Integration with MTAA OS

ASIS integrates with existing MTAA modules:
- **Wallet** → `/api/wallet` (transactions, balances, escrow)
- **Health** → `/api/health` (appointments, records, providers)
- **Transport** → `/api/transport` (MTaxi, MTruck, bookings)
- **Jobs** → `/api/jobs` (listings, applications, CVs)
- **Civic** → `/api/civic` (permits, reports, courts, police)
- **Messaging** → `/api/messaging` (notifications, chat)

## Boot Sequence

```typescript
import { ASIS, createConfig } from 'asis';

const asis = await ASIS.initialize({
  config: createConfig({
    environment: 'production',
    countryProfile: DEFAULT_COUNTRY_PROFILE,
  }),
});

// Register domain agents
asis.orchestrator.registerAgent('wallet_agent', walletAgent);
asis.orchestrator.registerAgent('transport_agent', transportAgent);
asis.orchestrator.registerAgent('jobs_agent', jobsAgent);
asis.orchestrator.registerAgent('health_agent', healthAgent);
asis.orchestrator.registerAgent('civic_agent', civicAgent);
asis.orchestrator.registerAgent('navigator_agent', navigatorAgent);

// Process user input
const response = await asis.orchestrator.processUserInput(
  'Send 500 KSh to John'
);
```

## Event Bus

ASIS uses a typed, priority-aware event bus for OS-wide coordination:

```typescript
asis.eventBus.on('wallet:transaction:complete', (event) => {
  // Handle completed transaction
});

asis.eventBus.emit('asis:notification', {
  title: 'Payment Sent',
  body: '500 KSh sent to John',
}, { priority: 'high' });
```

## Health Monitoring

Built-in self-monitoring with metrics:
- Memory usage
- Event bus health
- Module status
- Uptime tracking
- Error rate

## License

Proprietary — MTAA AFRIQ MASTER BUILD
