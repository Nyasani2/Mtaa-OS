# MTAA OS V10 — Unified Authentication Architecture

## Problem
Every module service calls `supabase.auth.getUser()` independently:
- MStudio: 14 separate auth checks (redundant, inconsistent)
- Education: ZERO auth checks (security breach)
- Streets: mixed approach
- Tribes: relies on hook-layer `user` object

This creates:
1. **Auth fragmentation** — no single source of truth
2. **Security gaps** — some services forget auth entirely
3. **Testability issues** — services coupled to Supabase auth
4. **Performance waste** — multiple `getUser()` round-trips per action

## Solution: The OS Kernel Auth Pattern

```
OS SHELL / KERNEL
  lib/auth/store/auth.store.ts (canonical)
    • useAuthStore() hook
    • user object: { id, email, role, ... }
    • Single Supabase session listener
         |
         v
MODULE HOOKS
  useEducation, useMStudio, useStreets
  const { user } = useAuthStore()
         |
         v
MODULE SERVICES (dumb data layer)
  createAssignment(userId, data)
  createVideo(userId, data)
  createPost(userId, data)
  NO supabase.auth.getUser() calls
  NO auth logic
  Just data + owner injection
         |
         v
SUPABASE / DATABASE
  RLS Policies
  auth.uid() = creator_id
  auth.uid() = user_id
  auth.uid() = teacher_id
```

## Rule: Four-Layer Auth

| Layer | Responsibility | Who |
|---|---|---|
| **Layer 1: OS Kernel** | Session management, token refresh, identity validation | lib/auth/store/auth.store.ts |
| **Layer 2: Module Hooks** | Get user from store, pass to service, handle UI state | lib/hooks/useXxx.ts |
| **Layer 3: Services** | Receive userId, inject into owner column, execute query | lib/services/xxx-service.ts |
| **Layer 4: Database** | RLS enforces auth.uid() = owner_column | Supabase policies |

## Service Function Signature Rule

BEFORE (broken):
  export async function createAssignment(data: Partial<Assignment>) {
    await supabase.from('education_assignments').insert(data)
  }

AFTER (unified):
  export async function createAssignment(
    userId: string,        // from useAuthStore().user.id
    data: Partial<Assignment>
  ) {
    await supabase.from('education_assignments')
      .insert({ ...data, teacher_id: userId })
  }

## Hook Pattern

// lib/hooks/useEducation.ts
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useEducation() {
  const user = useAuthStore((s) => s.user);

  const createAssignment = async (formData: AssignmentForm) => {
    if (!user?.id) throw new Error('Not authenticated');
    return educationService.createAssignment(user.id, formData);
  };

  return { createAssignment };
}

## Parent-Child Account Extension

The same unified auth store serves parents AND children:
- Parent logs in -> useAuthStore returns parent user
- Parent registers child -> child gets sub-account linked via family_members
- Child logs in (with PIN) -> useAuthStore returns child user
- All services use the SAME userId pattern regardless of account type

## Migration Checklist

[ ] Refactor lib/services/education-service.ts (33 functions)
[ ] Refactor lib/services/mstudio-service.ts (14+ functions)
[ ] Refactor lib/services/streets-service.ts (3 functions)
[ ] Refactor lib/tribes/services/tribes.service.ts (10+ functions)
[ ] Update all hooks to pass user.id from useAuthStore
[ ] Remove all supabase.auth.getUser() from services
[ ] Add created_by / owner columns to tables missing them
[ ] Update RLS policies to check owner columns
