# MTAA Admin Diagnostics Dashboard

## Files

| File | Destination |
|------|-------------|
| `app/(os)/admin/diagnostics.tsx` | `~/MTAA_OS_V10/app/(os)/admin/diagnostics.tsx` |
| `components/admin/DiagnosticsButton.tsx` | `~/MTAA_OS_V10/components/admin/DiagnosticsButton.tsx` |

## Install

```bash
cd ~/MTAA_OS_V10
mkdir -p app/(os)/admin components/admin

# Extract files
unzip -o mtaa_admin_diagnostics.zip

# Or copy manually:
cp app/\(os\)/admin/diagnostics.tsx ~/MTAA_OS_V10/app/\(os\)/admin/
cp components/admin/DiagnosticsButton.tsx ~/MTAA_OS_V10/components/admin/
```

## Usage

In your home screen:

```tsx
import { DiagnosticsButton } from '@/components/admin/DiagnosticsButton';

// In JSX:
<DiagnosticsButton />
```

Or manually:

```tsx
import { useRouter } from 'expo-router';
const router = useRouter();

<TouchableOpacity onPress={() => router.push('/(os)/admin/diagnostics')}>
  <Text>🔧 Diagnostics</Text>
</TouchableOpacity>
```

## Admin Gate

Only users with `role === 'admin'` or `is_super_admin === true` can access.
Non-admins see 🚫 screen.

## Layers

1. Kernel (event bus, registry, boot sequence, panic handler, safe mode)
2. Auth & Identity (auth store, session)
3-20. Placeholder — expand as we audit
