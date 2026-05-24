# ZIP 10 — ASIS System Runtime Core

## What This Is

The **execution runtime** that makes ASIS actually operate in real time.

**NOT** AI reasoning logic. **NOT** cognition. **NOT** UI.

This is the **operating system layer** for ASIS intelligence.

## Architecture

```
┌─────────────────────────────────────────┐
│         ASIS Runtime (asis-runtime.ts)   │
│  ┌─────────────────────────────────────┐  │
│  │  System Bootloader (6 phases)      │  │
│  │  ├─ validation → registration        │  │
│  │  ├─ event_bus → agent_attach        │  │
│  │  └─ cognitive_attach → ready       │  │
│  └─────────────────────────────────────┘  │
│  ┌─────────────────────────────────────┐  │
│  │  Runtime Kernel                      │  │
│  │  REQUEST → VALIDATE → DISPATCH      │  │
│  │  → EXECUTE → RESULT → STATE → LOG   │  │
│  └─────────────────────────────────────┘  │
│  ┌─────────┐ ┌─────────┐ ┌─────────────┐ │
│  │ Module  │ │ Event   │ │ Execution   │ │
│  │ Registry│ │ Bus     │ │ Engine      │ │
│  └─────────┘ └─────────┘ └─────────────┘ │
│  ┌─────────┐ ┌─────────┐ ┌─────────────┐ │
│  │ Task    │ │ Failure │ │ Performance │ │
│  │ Scheduler│ │ Recovery│ │ Throttle    │ │
│  └─────────┘ └─────────┘ └─────────────┘ │
│  ┌─────────────────────────────────────┐  │
│  │  Runtime Monitor + Execution Hooks   │  │
│  └─────────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Files

| File | Purpose |
|------|---------|
| `asis-runtime.ts` | Main orchestrator. Boot, execute, monitor, shutdown |
| `system-bootloader.ts` | 6-phase boot: validation → registration → event_bus → agent_attach → cognitive_attach → ready |
| `runtime-kernel.ts` | Central execution loop: validate → dispatch → execute → log |
| `module-registry.ts` | Track all modules, health checks, dependency validation, hot-reload ready |
| `lifecycle-manager.ts` | 6-state machine: initializing → active → degraded → suspended → failed → recovering |
| `execution-engine.ts` | Tool calls, agent runs, workflows. Parallel/sequential, retry, timeout, rollback |
| `event-runtime-bus.ts` | System nervous system. Priority queues, ordered delivery, replay, async listeners |
| `task-scheduler.ts` | Delayed actions, recurring tasks, batch optimization. Priority: health > wallet > transport > cash > general |
| `failure-recovery.ts` | Circuit breaker, rollback, degraded mode, isolation, restart |
| `performance-throttle.ts` | CPU/memory/rate limiting. 4 levels: normal → reduced → minimal → emergency |
| `runtime-monitor.ts` | Health snapshots, latency tracking, failure rates, stability score (0-100) |
| `execution-hooks.ts` | Hook manager: pre → safety → execute → post → failure |
| `hooks/pre-execution-hook.ts` | Validation: payload, source, timeout, rate limit |
| `hooks/post-execution-hook.ts` | Cleanup, metrics, slow execution detection |
| `hooks/failure-hook.ts` | Error logging, alerting, retry triggering |
| `hooks/safety-hook.ts` | Domain restrictions, consent re-validation, risk assessment |
| `types.ts` | Complete runtime type system |
| `interfaces.ts` | Service contracts |

## ZIP Integration

| ZIP | System | Runtime Integration |
|-----|--------|---------------------|
| 4 | Memory | Module registry + event bus |
| 5 | Wallet | Execution engine tool calls |
| 6 | Cash | Execution engine + task scheduler |
| 7 | Health | Lifecycle strict control + safety hooks |
| 8 | Voice/Avatar | Event bus attachment |
| 9 | Cognition | Cognitive engine attach phase + execution plans |
| Hardening | Consent/Behavior | Safety hooks + failure recovery |

## Usage

```typescript
import { ASISRuntime } from './asis/runtime';

const runtime = new ASISRuntime({
  country: 'KE',
  kycLevel: 2,
  systemProfile: 'production',
  maxConcurrentExecutions: 5,
  defaultTimeoutMs: 10000,
  retryAttempts: 3,
  retryDelayMs: 1000,
  circuitBreakerThreshold: 5,
  circuitBreakerResetMs: 30000,
  memoryThresholdMB: 256,
  cpuThresholdPercent: 80,
  requestRateLimit: 100,
  enableHotReload: false,
  enablePartialBoot: true,
});

await runtime.boot();

const result = await runtime.execute({
  id: 'req_1',
  type: 'tool_call',
  source: 'wallet_module',
  payload: { toolId: 'tool_wallet_balance', parameters: {} },
  priority: 'normal',
  timeoutMs: 5000,
  retryPolicy: { attempts: 2, delayMs: 1000, backoffMultiplier: 2 },
  createdAt: new Date().toISOString(),
  correlationId: 'corr_1',
});

console.log(result.status);
console.log(runtime.getHealthReport());

await runtime.shutdown();
```

## Runtime Principles

- **Execute safely before quickly**
- **Recover before failing**
- **Degrade before crashing**
- **Log everything important**
- **Maintain deterministic execution order**
- **Avoid silent failures**

## Guarantees

- No module executes outside lifecycle control
- No tool runs without runtime validation
- No agent executes without event tracking
- No failure is silent
- No state change is unlogged
