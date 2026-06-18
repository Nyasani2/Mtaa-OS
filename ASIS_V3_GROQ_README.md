# ASIS v3 + Groq Cloud Integration

## What's New
- **Groq API Client** — Free tier AI for complex queries (30 req/min)
- **Smart Routing** — M-Theory (local) → Groq (free) → Kimi (paid)
- **Cost Tracking** — Every Groq request shows tokens + USD cost
- **Health Check** — Real-time status of all 3 engines in header
- **Constitutional Gate** — Ubuntu values safety check on every request

## Files Added/Updated
```
lib/asis/api/groq-client.ts          # NEW — Groq API client
lib/asis/core/asisV3Engine.ts        # UPDATED — Multi-engine routing
app/(os)/asis/index.tsx              # UPDATED — Shows Groq status
```

## Install Steps

### 1. Add Groq API Key to .env
```bash
cd ~/MTAA_OS_V10
echo 'EXPO_PUBLIC_GROQ_API_KEY=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' >> .env
```

### 2. Extract the ZIP
```bash
cd ~/MTAA_OS_V10
rm -rf .expo
unzip -o ~/Downloads/asis-v3-groq.zip -d ./
```

### 3. Start the app
```bash
cd ~/MTAA_OS_V10
export NODE_OPTIONS="--max-old-space-size=4096"
npx expo start --clear --port 8082
```

## Test Commands

| Type | Expected Engine | Expected Result |
|------|----------------|-----------------|
| `what is 2 + 2 * 2` | M-Theory (local) | `2 + 2 * 2 = 6` |
| `write javascript code for fibonacci` | M-Theory (local) | Code + execution |
| `explain quantum computing` | Groq (cloud) | Detailed explanation |
| `what is the capital of France` | Groq (cloud) | "Paris" |
| `benchmark` | Stats | Shows Groq requests, tokens, cost |

## Architecture

```
User Question
    |
    v
M-Theory Analyzer (complexity 0-1, safety)
    |
    +-- complexity < 0.6 + safe --> M-Theory (free, instant)
    |
    +-- complexity >= 0.6 + safe --> Groq API (free tier)
    |                                  |
    |                                  +-- fail --> Kimi API (paid)
    |                                  |               |
    |                                  |               +-- fail --> M-Theory fallback
    |                                  |
    |                                  +-- success --> Response + cost tracking
    |
    +-- unsafe --> Constitutional Gate block
```

## Groq Free Tier Limits
- **30 requests per minute**
- **14,400 requests per day**
- **Llama 3.1 8B** (fast) and **Llama 3.3 70B** (smart)
- No credit card required

## Production Path (Millions of Users)
- M-Theory runs on every device (governance, safety, routing)
- Cloud APIs (Groq/Kimi/OpenAI) subsidized by MTAA wallet fees
- Users pay nothing — MTAA covers API costs
