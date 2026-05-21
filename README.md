# MTAA Phase 0 Fix Package - Complete Build

## Files Included (68 files)

### Auth & User Layer
- `hooks/useAuth.ts` - Real Supabase auth hook with session management
- `hooks/useUser.ts` - User data hook with profile fetching/updating
- `hooks/useAuthStore.ts` - Zustand auth state store
- `app/auth/login.tsx` - Login screen with email/password + biometric
- `app/auth/register.tsx` - Registration flow (2-step: account + profile)
- `app/auth/_layout.tsx` - Auth route layout

### Health Module (Native React Native)
- `lib/health/types.ts` - Complete TypeScript types for all health tables
- `lib/health/services/` - Patient, Appointment, Hospital, EHR, Ambulance services
- `lib/health/hooks/` - useHealthPatient, useHospital hooks
- `lib/health/controllers/health.controller.ts` - Business logic controller
- `app/(os)/health/index.tsx` - Health home dashboard
- `app/(os)/health/appointments.tsx` - Appointment list + booking
- `app/(os)/health/hospitals.tsx` - Hospital finder with search/filter
- `app/(os)/health/ambulance.tsx` - Emergency ambulance request (3-step flow)
- `app/(os)/health/records.tsx` - Medical records with type filtering
- `app/(os)/health/lab-tests.tsx` - Lab results viewer
- `app/(os)/health/insurance.tsx` - Insurance policy management
- `app/(os)/health/vaccinations.tsx` - Vaccination records
- `app/(os)/health/pharmacy.tsx` - Pharmacy orders
- `app/(os)/health/profile.tsx` - Health profile editor
- `app/(os)/health/book-appointment.tsx` - Multi-step booking wizard
- `app/(os)/health/_layout.tsx` - Health route layout

### Wallet Module
- `lib/wallet/store.ts` - Zustand wallet store (accounts, transactions, payment methods, escrow)
- `app/(os)/wallet/index.tsx` - Wallet dashboard with balance, actions, recent tx
- `app/(os)/wallet/deposit.tsx` - Deposit screen with method selection
- `app/(os)/wallet/_layout.tsx` - Wallet route layout

### Settings Module (All Working Buttons)
- `app/(os)/settings/index.tsx` - Settings home with all navigation
- `app/(os)/settings/profile.tsx` - Profile viewer/editor with KYC info
- `app/(os)/settings/change-password.tsx` - Password change with validation
- `app/(os)/settings/payment-methods.tsx` - Payment methods list (native)
- `app/(os)/settings/notifications.tsx` - Per-app notification toggles
- `app/(os)/settings/tx-alerts.tsx` - Transaction alert configuration
- `app/(os)/settings/help.tsx` - Help center with searchable articles
- `app/(os)/settings/bug-report.tsx` - Bug report form with categories
- `app/(os)/settings/about.tsx` - App info + social links
- `app/(os)/settings/privacy.tsx` - Full privacy policy
- `app/(os)/settings/terms.tsx` - Full terms of service
- `app/(os)/settings/_layout.tsx` - Settings route layout

### AppStore Module
- `lib/kernel/services/rail.service.ts` - App registry, install/uninstall, updates
- `app/(os)/appstore/index.tsx` - App Store with categories, search, install buttons
- `app/(os)/appstore/_layout.tsx` - AppStore route layout

### Kernel / OS Layer
- `lib/kernel/kernel-init.ts` - Kernel initializer with module dependency resolution
- `lib/kernel/kernel-bootloader.ts` - Module registration (auth, wallet, health, appstore, analytics, search)
- `lib/kernel/kernel-panic-handler.ts` - Crash recovery + safe mode
- `lib/kernel/kernel-safe-mode.ts` - Safe mode manager with feature flags
- `lib/kernel/kernel-service-manager.ts` - Dependency injection container
- `lib/kernel/kernel-state-machine.ts` - App-level state machine (booting -> ready)
- `lib/kernel/runtime/BootGate.tsx` - Boot gate component with progress
- `lib/kernel/runtime/BootScreen.tsx` - Animated splash screen
- `lib/kernel/runtime/ModuleBoundary.tsx` - Error boundary per module
- `lib/kernel/services/telemetry.service.ts` - Event tracking + metrics

### Shell / Routing
- `app/(os)/_layout.tsx` - OS layout with BootGate wrapper
- `app/(os)/index.tsx` - Home dashboard with quick actions
- `app/_layout.tsx` - Root layout with auth state
- `app/index.tsx` - Root redirect
- `lib/index.ts` - Barrel exports

## Installation

```bash
# Extract to your project root
unzip mtaa_phase0_fix_complete.zip -d .

# Install dependencies if needed
npm install zustand @supabase/supabase-js expo-router react-native

# Ensure tsconfig paths are set:
# "@/*": ["./*"] or "@/*": ["src/*"]
```

## What This Fixes
1. ✅ useAuth hook created (real Supabase auth)
2. ✅ useUser hook created (profile data management)
3. ✅ Health module converted to native React Native
4. ✅ Wallet store path fixed + real schema types
5. ✅ Settings layout mismatch fixed
6. ✅ useAuthstore typo fixed (useAuthStore)
7. ✅ Duplicate exports removed (barrel files clean)
8. ✅ Payment methods converted to native
9. ✅ Install button wired to real Supabase endpoints
10. ✅ Rail registry + monitor created
11. ✅ All settings buttons connect to real screens
12. ✅ Analytics + telemetry foundation built
13. ✅ Kernel boot system with safe mode
14. ✅ Module boundaries + error recovery
15. ✅ State machine for app lifecycle

## Next Steps
- Deploy edge functions for wallet operations (deposit/withdraw/transfer/escrow)
- Add RLS policies to remaining tables (46 tables noted)
- Replace any remaining placeholder images with local assets
- Test each screen against live Supabase instance
