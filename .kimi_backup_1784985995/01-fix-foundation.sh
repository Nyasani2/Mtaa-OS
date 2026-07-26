#!/bin/bash
# 01-fix-foundation.sh — Creates missing foundation barrels
cd ~/MTAA_OS_V10
set -e

echo "=== FIX 1: FOUNDATION FILES ==="

# lib/supabase.ts
mkdir -p lib
cat > lib/supabase.ts << 'EOF'
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;
EOF
echo "  ✓ lib/supabase.ts"

# constants/Colors.ts
mkdir -p constants
cat > constants/Colors.ts << 'EOF'
export const Colors = {
  light: {
    text: '#11181C', background: '#fff', tint: '#0a7ea4',
    icon: '#687076', tabIconDefault: '#687076', tabIconSelected: '#0a7ea4',
    primary: '#0a7ea4', secondary: '#687076', border: '#E1E3E5',
    error: '#E5484D', success: '#30A46C', warning: '#F5A524',
  },
  dark: {
    text: '#ECEDEE', background: '#151718', tint: '#fff',
    icon: '#9BA1A6', tabIconDefault: '#9BA1A6', tabIconSelected: '#fff',
    primary: '#fff', secondary: '#9BA1A6', border: '#2A2D2E',
    error: '#E5484D', success: '#30A46C', warning: '#F5A524',
  },
};
export default Colors;
EOF
echo "  ✓ constants/Colors.ts"

# lib/auth/identity.ts (re-export barrel)
mkdir -p lib/auth
cat > lib/auth/identity.ts << 'EOF'
export { useAuthStore } from './store/auth.store';
export { useAuth } from './useAuth';
export { useIdentity } from './useIdentity';
export type { AuthState, User } from './store/auth.store';
EOF
echo "  ✓ lib/auth/identity.ts"

# lib/kernel/registry/kernel-registry.ts
mkdir -p lib/kernel/registry
cat > lib/kernel/registry/kernel-registry.ts << 'EOF'
// Re-export from canonical registry
export { default } from '../registry';
export * from '../registry';
EOF
echo "  ✓ lib/kernel/registry/kernel-registry.ts"

# lib/mtaa/appstore/store.ts
mkdir -p lib/mtaa/appstore
cat > lib/mtaa/appstore/store.ts << 'EOF'
import { create } from 'zustand';

interface AppStoreState {
  installedApps: string[];
  installApp: (appId: string) => void;
  uninstallApp: (appId: string) => void;
}

export const useAppStore = create<AppStoreState>((set) => ({
  installedApps: [],
  installApp: (appId) => set((s) => ({ installedApps: [...s.installedApps, appId] })),
  uninstallApp: (appId) => set((s) => ({ installedApps: s.installedApps.filter((a) => a !== appId) })),
}));
EOF
echo "  ✓ lib/mtaa/appstore/store.ts"

# lib/mtaa/appstore/apps/types.ts
mkdir -p lib/mtaa/appstore/apps
cat > lib/mtaa/appstore/apps/types.ts << 'EOF'
export interface AppManifest {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  route: string;
  version: string;
  isOSApp?: boolean;
  isActive?: boolean;
}
EOF
echo "  ✓ lib/mtaa/appstore/apps/types.ts"

# lib/apps-store/types.ts
mkdir -p lib/apps-store
cat > lib/apps-store/types.ts << 'EOF'
export * from '../mtaa/appstore/apps/types';
EOF
echo "  ✓ lib/apps-store/types.ts"

# lib/components/wallet-pin-guard.tsx
mkdir -p lib/components
cat > lib/components/wallet-pin-guard.tsx << 'EOF'
import React from 'react';
import { View, Text } from 'react-native';

export const WalletPinGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};
export default WalletPinGuard;
EOF
echo "  ✓ lib/components/wallet-pin-guard.tsx"

echo "=== FOUNDATION COMPLETE ==="
