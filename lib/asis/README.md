# ASIS v1 — African Super Intelligence System

## What is ASIS?

ASIS is the **cognitive operating layer** of MTAA OS. Not a chatbot. Not an app. Infrastructure.

**Analogy:**
- MTAA = Body
- Kernel = Nervous System
- ASIS = Brain

ASIS observes, understands, coordinates, assists, learns, and optimizes activity across the entire MTAA ecosystem.

## Architecture

```
lib/asis/
├── core/
│   ├── asisEngine.ts       # Main intelligence router
│   ├── safetyGate.ts       # Security enforcement
│   ├── contextBuilder.ts   # MTAA-wide context injection
│   └── memoryEngine.ts     # Short-term + long-term memory
├── edge-functions/
│   └── asis-proxy/         # Supabase edge function (single backend)
│       └── index.ts
├── prompts/
│   └── wallet.prompt.ts    # Domain-specific system prompts
├── services/
│   └── asisService.ts      # Client-side service
├── hooks/
│   └── useAsis.ts          # React hook for components
├── components/
│   ├── AsisHomeButton.tsx  # Floating home screen icon
│   └── AsisChatScreen.tsx  # Full chat interface
└── types.ts                # All ASIS type definitions
```

## 7 Runtime Roles

1. **Assistant** — Chat, voice, guidance
2. **Analyst** — Reports, forecasts, insights
3. **Auditor** — Anomaly, fraud, waste detection
4. **Coordinator** — Cross-system workflow triggers
5. **Educator** — Teach, explain procedures/regulations
6. **Guardian** — Security, fraud, identity, risk monitoring
7. **Memory** — Institutional, user, community, organizational memory

## 5 Intelligence Layers

1. **Personal** — Individual citizen context
2. **Community** — Streets/villages/estates/wards
3. **Business** — Enterprise analytics
4. **Government** — Department decision-support
5. **National** — Country-wide trend identification

## AI Provider: Kimi (Moonshot AI)

**Why Kimi:**
- OpenAI-compatible API (drop-in replacement)
- K2.5: $0.60/M input, $3.00/M output tokens
- K2.6: $0.95/M input, $4.00/M output tokens
- Automatic caching: $0.10-$0.16/M (80-85% savings)
- Free tier: ¥15 credit for new accounts
- 262K context window
- Strong agent and coding performance

**Development strategy:**
- Use Kimi for development (cheap, familiar)
- Multi-provider fallback for production (OpenAI/Claude)
- Edge function handles provider switching
- Client never holds API keys

## Security: Safe-Evolution-Gate

ASIS **CANNOT**:
- Modify kernel, auth, or security settings
- Access other users' data
- Bypass PIN, biometric, or MFA
- Generate code that modifies system files
- Execute transactions without user confirmation

All AI calls go through `core/api/` edge functions. Rate limited (50/min). Cost limited ($5/day).

## Wallet Intelligence (First Domain)

ASIS Wallet Intelligence understands:
- Balance, transactions, payment methods
- Spending patterns, income vs expenses
- Fraud signals, risk flags
- FX rates, cross-border transfers
- Savings goals, financial health

**Capabilities:**
- Explain transaction history and patterns
- Suggest savings strategies
- Warn about suspicious activity
- Recommend optimal transfer routes
- Help create payment links/claim links
- Explain fees and FX implications

**Limitations:**
- Cannot execute transactions (user must confirm in UI)
- Cannot access other users' wallet data
- Cannot modify wallet settings or PIN
- Cannot bypass security checks

## Installation

### 1. Run SQL Schema
```bash
psql -d your_database -f asis_schema.sql
```

### 2. Deploy Edge Function
```bash
supabase functions deploy asis-proxy
```

### 3. Set Environment Variables
```bash
supabase secrets set KIMI_API_KEY=your_kimi_key
supabase secrets set OPENAI_API_KEY=your_openai_key  # fallback
supabase secrets set ANTHROPIC_API_KEY=your_claude_key  # fallback
```

### 4. Add Files to Project
```
lib/asis/          -> Copy all files
app/(os)/asis/     -> Create route for chat screen
```

### 5. Add Home Button to OS Shell
Import `AsisHomeButton` in your home screen layout and place it as a floating action button.

### 6. Register in AppStore
Add ASIS to the app registry so users can discover it.

## Usage

### Basic Chat
```tsx
import { useAsis } from '@/lib/asis/hooks/useAsis';

function MyComponent() {
  const { messages, sendMessage, isLoading } = useAsis({
    userId: 'user-123',
    app: 'wallet',
    domain: 'wallet',
  });

  return (
    <View>
      {messages.map(msg => (
        <Text key={msg.timestamp}>{msg.content}</Text>
      ))}
      <Button title="Ask ASIS" onPress={() => sendMessage('What is my balance?')} />
    </View>
  );
}
```

### Home Button
```tsx
import { AsisHomeButton } from '@/lib/asis/components/AsisHomeButton';

function HomeScreen() {
  return (
    <View style={{ flex: 1 }}>
      {/* Your home screen content */}
      <AsisHomeButton userId="user-123" position="bottom-right" />
    </View>
  );
}
```

### Chat Screen
```tsx
import { AsisChatScreen } from '@/lib/asis/components/AsisChatScreen';

export default function AsisRoute() {
  return <AsisChatScreen userId="user-123" />;
}
```

## Cost Estimates

| Usage Level | Daily Requests | Tokens/Request | Monthly Cost (Kimi K2.5) |
|-------------|---------------|----------------|--------------------------|
| Light | 50 | 2K | ~$2-5 |
| Medium | 200 | 3K | ~$15-30 |
| Heavy | 1,000 | 5K | ~$80-150 |
| Enterprise | 5,000 | 5K | ~$400-800 |

With caching: 80-85% reduction in repeated context costs.

## Next Steps

1. Wire additional domains (transport, health, jobs, civic)
2. Add voice input/output
3. Implement proactive insights (push notifications)
4. Build analytics dashboard for ASIS usage
5. Add multi-language support (Swahili, Amharic, French, etc.)
6. Train domain-specific fine-tuned models

## License

MTAA Proprietary — All Rights Reserved
