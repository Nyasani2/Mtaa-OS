# MTAA Education Redesign V2

## What's Inside

| File | Purpose |
|------|---------|
| `app/(education)/index.tsx` | Modern landing page — hero, 3-pillar grid, registration hub, How It Works, Connected Campus, stats, Education Pulse |
| `app/(education)/register/index.tsx` | Registration hub — 4 gradient cards (School / Student / Parent / Teacher) |
| `app/(education)/register/school.tsx` | 3-step school registration — School Info -> Head Teacher -> Capacity |
| `app/(education)/register/student.tsx` | 3-step student enrollment — Personal -> School -> Guardian |
| `app/(education)/register/parent.tsx` | 3-step parent registration — Personal -> Child Link -> Verification |
| `app/(education)/register/teacher.tsx` | 3-step teacher onboarding — Personal -> School Assignment -> Qualifications |

## Auth Integration

All registration forms integrate with MTAA single auth:
- Pre-fill user data from `useAuthStore` (name, email, phone from `user.user_metadata`)
- Check `isAuthenticated` before submission — redirect to login if not signed in
- Attach `user_id` to every registration payload for database linkage
- Each form has a `// TODO: Wire to education_service.createX(payload)` comment where you hook your real API

## Design

- Zero emojis — clean text + gradient colors only (no encoding corruption)
- Expo LinearGradient for all hero/header backgrounds
- Ionicons from `@expo/vector-icons` for icons
- Collapsible 3-pillar capability grid on landing page
- Floating header that appears on scroll
- Stepper indicators on all multi-step forms
- Chip selectors for options (ownership, gender, programs, subjects, etc.)
- Summary review on final step before submission

## Installation

```bash
cd ~/Downloads
# Download the ZIP from the sandbox link provided

# Extract to your project
unzip -o education_redesign_v2.zip -d ~/MTAA_OS_V10/

# Ensure the register directory exists
mkdir -p ~/MTAA_OS_V10/app/\(education\)/register
```

## Wiring Your Services

Each form has a `handleSubmit` function with a payload object. Replace the `setTimeout` mock with your actual service call:

```typescript
// In school.tsx, student.tsx, parent.tsx, teacher.tsx
// Replace:
setTimeout(() => { ... }, 1500);

// With:
await educationService.createSchool(payload);
// or educationService.enrollStudent(payload)
// or educationService.registerParent(payload)
// or educationService.registerTeacher(payload)
```

## Dependencies

- `expo-linear-gradient`
- `@expo/vector-icons`
- `expo-router`
- `@/lib/auth/store/auth.store` (your existing auth store)
