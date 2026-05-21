# MTAA OS — Phase 2 Cleanup Package

## What's Inside (30 files)

| Directory | Contents | Files |
|-----------|----------|-------|
| `fixes/` | Broken import fixes, missing hooks, settings layout | 4 |
| `manifests/` | App manifests for AppStore registry | 6 |
| `scripts/` | Cleanup automation (duplicates, stubs, audit) | 3 |
| `sql/` | RLS policies for remaining tables | 1 |
| `kernel/` | Boot sequence, service manager, panic handler, safe mode, memory watchdog | 5 |
| `lazy-loading/` | Route-level lazy loading, app chunking, deferred hydration | 3 |
| `appstore/` | Unified registry, install lifecycle, permission system | 3 |
| `offline/` | Cache manager, sync queue, state persistence | 3 |
| `deeplinking/` | Link handler, route resolver | 2 |

## Installation (5 steps)

```bash
# 1. Extract ZIP to project root
cd ~/MTAA_OS_V10
unzip ~/Downloads/MTAA_PHASE2_CLEANUP.zip -d .phase2-cleanup

# 2. Run extraction script (creates backup)
bash .phase2-cleanup/EXTRACT_FIRST.sh

# 3. Apply all changes
bash .phase2-cleanup/APPLY_CHANGES.sh

# 4. Run cleanup scripts
bash ~/MTAA_OS_V10/scripts/remove-duplicates.sh
bash ~/MTAA_OS_V10/scripts/remove-stubs.sh

# 5. Run SQL in Supabase Editor
# Copy contents of sql/rls-remaining-tables.sql and execute
```

## Then Test

```bash
cd ~/MTAA_OS_V10
npx expo start --clear
```

## What Each Module Does

### Kernel Stability
- **Boot Sequence**: Ordered startup (kernel → auth → wallet → network → apps) with timeouts
- **Service Manager**: Lazy-loaded services with dependency resolution and circular detection
- **Panic Handler**: Crash recovery, enters safe mode after 3 failures in 30 seconds
- **Safe Mode**: Fallback UI with retry/reset options when boot fails
- **Memory Watchdog**: Monitors JS heap, warns at 75%, triggers cleanup at 90%

### Lazy Loading
- **Route Loader**: `React.lazy()` wrapper with Suspense fallback for route-level code splitting
- **App Chunker**: 7 chunks by category (core, transport, commerce, social, civic, learning, health)
- **Deferred Hydration**: Non-critical UI renders after first paint using `requestIdleCallback`

### App Store
- **Unified Registry**: Single source of truth for all 6+ app manifests with KYC filtering
- **Install Lifecycle**: Download → chunk load → Supabase record → installed state tracking
- **Permission System**: Runtime grants per app (camera, location, contacts, etc.)

### Offline
- **Cache Manager**: Memory → AsyncStorage → Network tiered cache with TTL
- **Sync Queue**: Queue actions offline, process with retry when connected
- **State Persistence**: Save critical state across app restarts with version migration

### Deep Linking
- **Link Handler**: Parse `mtaa://app/path` URLs and route to correct app
- **Route Resolver**: Map 11 deep link patterns to Expo Router routes with param extraction
