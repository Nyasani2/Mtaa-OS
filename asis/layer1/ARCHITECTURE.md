# ASIS AI Architecture Notes

## Design Decisions

### 1. Singleton Pattern for ASIS Root
ASIS is designed as a singleton because it is an OS-wide intelligence layer. There should never be multiple instances running simultaneously. The singleton ensures:
- Single event bus across all modules
- Shared context engine
- Coordinated health monitoring
- Centralized security policy

### 2. Event-Driven Architecture
All communication between ASIS modules happens through the event bus. This decouples modules and allows:
- Async processing
- Priority handling (critical events processed first)
- Middleware for filtering/transforming
- Replay capability via history
- Easy testing (mock events)

### 3. Security Layer as First-Class Citizen
Security is not an afterthought. The security layer initializes FIRST during boot and:
- Validates all user contexts
- Gates all tool access via KYC levels
- Requires confirmation for sensitive actions
- Maintains audit logs
- Handles lockouts after failed attempts
- Never stores biometric data

### 4. No Direct DB Access
ASIS NEVER writes directly to database tables. All data operations go through:
- Service interfaces (IASISService)
- Domain service layers
- API endpoints
This ensures:
- RLS policies are respected
- Business rules are enforced
- Audit trails are complete
- Schema changes don't break ASIS

### 5. Confirmation Gates
All sensitive actions require explicit user confirmation:
- Financial: PIN or biometric
- Health: Biometric preferred
- Civic: PIN + biometric for high-value
The orchestrator detects when confirmation is needed and returns a `confirmation_required` response type.

### 6. Intent Detection (Rule-Based → ML)
Current intent detection is rule-based regex for speed and zero dependencies. Future layers will add:
- Embedding-based semantic matching
- Fine-tuned classification model
- Multi-turn context awareness
- Entity extraction (NER)

### 7. Country Profile Abstraction
All country-specific logic is abstracted behind `CountryProfile`. This enables:
- Single codebase for all African markets
- Runtime country switching
- Compliance rule enforcement
- Currency/tax calculation
- KYC tier management

### 8. Agent Registry Pattern
Agents are registered dynamically with the orchestrator. This allows:
- Lazy loading of agents
- Feature-flagged agent availability
- A/B testing different agent implementations
- Easy addition of new domain agents

### 9. Health Monitoring
Self-monitoring is built in from day one:
- Memory tracking
- Event bus diagnostics
- Module health checks
- Error aggregation
- Automatic degradation detection

### 10. Type Safety
All modules use strict TypeScript interfaces:
- No `any` types in public APIs
- Explicit return types
- Discriminated unions for response types
- Generic service interfaces

## Performance Considerations

- Event bus history capped at 1000 events
- Audit log capped at 10000 entries (auto-trim to 5000)
- Conversation history capped at 50 messages (configurable)
- Memory metrics use `performance.memory` when available
- Debounce/throttle utilities for UI events
- Memoization with TTL for expensive calculations

## Error Handling Strategy

1. **Graceful Degradation**: If an agent fails, fall back to navigator
2. **Retry Logic**: Exponential backoff for service calls
3. **Circuit Breaker**: Future layer will add circuit breaker pattern
4. **User-Friendly Messages**: Never expose internal errors to users
5. **Critical Event Logging**: All errors logged to security audit trail

## Testing Strategy

- Unit tests for each core module
- Event bus mocking for integration tests
- Agent stubbing for orchestrator tests
- Security layer fuzzing
- Performance benchmarks for intent detection

## Future Extensions

### Layer 2: Chat System
- React Native UI components
- Streaming response handling
- Message renderer with markdown
- Typing indicators
- Dark/light theme support

### Layer 3: Agent System
- Base agent class with common logic
- Navigator agent (general help, routing)
- Wallet agent (transactions, balances, claims)
- Transport agent (MTaxi, MTruck, bookings)
- Jobs agent (search, apply, post)
- Engineering agent (simulation, planning)

### Layer 4: Memory
- User memory store (facts, preferences)
- Semantic search with embeddings
- Behavior learning
- Privacy controls (user-owned, exportable, deletable)

### Layer 5-10: Domain Systems
See README.md Layer Delivery Plan

## Integration Points

### With MTAA Kernel
ASIS registers as a module with the kernel:
```typescript
kernel.registerModule('asis', asis);
```

### With AppStore
ASIS provides app recommendations via:
```typescript
asis.recommendation.generateForUser(userId);
```

### With Wallet
ASIS delegates all financial operations:
```typescript
asis.wallet.send({ amount, recipient, currency });
```

### With Health
ASIS requests health data with consent:
```typescript
asis.health.requestAccess({ recordType, providerId });
```
