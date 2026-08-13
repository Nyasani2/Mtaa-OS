#!/bin/bash
# MTAA Auth Definitive Fix — Direct sed commands
cd ~/MTAA_OS_V10

echo "=== Fixing lib/auth/useAuth.ts ==="
sed -i 's/profile: store.profile,/\/\/ profile removed — does not exist in store/g' lib/auth/useAuth.ts
sed -i 's/refreshSession: store.refreshSession,/\/\/ refreshSession removed — does not exist in store/g' lib/auth/useAuth.ts
echo "Done."

echo ""
echo "=== Fixing lib/auth/os-gate.tsx ==="
# Replace the entire file with the corrected version
cat > lib/auth/os-gate.tsx << 'EOF'
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';

const AUTH_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/update-password',
  '/create-pin',
];

export function OSGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, pinSet } = useAuthStore();
  const [gateReady, setGateReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setGateReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isLoading || !gateReady) return;

    const isAuthRoute = AUTH_ROUTES.includes(pathname);

    const inRecovery =
      typeof window !== 'undefined' &&
      sessionStorage.getItem('mtaa_in_recovery') === 'true';

    if (inRecovery) {
      if (pathname !== '/update-password') {
        sessionStorage.removeItem('mtaa_in_recovery');
      } else {
        return;
      }
    }

    if (!user) {
      if (!isAuthRoute) router.replace('/login');
      return;
    }

    if (!pinSet) {
      if (pathname !== '/create-pin') router.replace('/create-pin');
      return;
    }

    if (isAuthRoute) {
      if (pathname === '/login' || pathname === '/signup') {
        router.replace('/(os)');
      }
    }
  }, [user, isLoading, pinSet, pathname, router, gateReady]);

  if (isLoading || !gateReady) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#00d4ff" />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
EOF
echo "Done."

echo ""
echo "=== Fixing Profile sign out ==="
sed -i "s|router.replace('/auth/login')|router.replace('/login')|g" "app/(os)/profile/index.tsx"
echo "Done."

echo ""
echo "=== Fixing Settings sign out ==="
sed -i "s|router.replace('/auth')|router.replace('/login')|g" "app/(os)/settings/profile.tsx"
echo "Done."

echo ""
echo "=== Fixing wallet useIdentity imports ==="
sed -i 's|import { useIdentity } from "@/lib/auth/store/auth.store";|import { useIdentity } from "@/lib/auth";|g' "app/(os)/wallet/banks.tsx"
sed -i 's|import { useIdentity } from "@/lib/auth/store/auth.store";|import { useIdentity } from "@/lib/auth";|g' "app/(os)/wallet/escrow.tsx"
sed -i 's|import { useIdentity } from "@/lib/auth/store/auth.store";|import { useIdentity } from "@/lib/auth";|g' "app/(os)/wallet/qr-scan.tsx"
sed -i 's|import { useIdentity } from "@/lib/auth/store/auth.store";|import { useIdentity } from "@/lib/auth";|g' "app/(os)/wallet/qr.tsx"
sed -i 's|import { useIdentity } from "@/lib/auth/store/auth.store";|import { useIdentity } from "@/lib/auth";|g' "app/(os)/wallet/savings-loans.tsx"
echo "Done."

echo ""
echo "=== Global sweep for remaining /auth/ routes ==="
find app -name "*.tsx" -o -name "*.ts" | while read f; do
  sed -i "s|'/auth/login'|'/login'|g" "$f"
  sed -i "s|'/auth/signup'|'/signup'|g" "$f"
  sed -i "s|'/auth/forgot-password'|'/forgot-password'|g" "$f"
  sed -i "s|'/auth/create-pin'|'/create-pin'|g" "$f"
  sed -i "s|router.replace('/auth')|router.replace('/login')|g" "$f"
done
echo "Done."

echo ""
echo "=== VERIFICATION ==="

echo ""
echo "[1] useAuth.ts:"
grep -n "profile:\|refreshSession:" lib/auth/useAuth.ts && echo "  ✗ STILL BROKEN" || echo "  ✓ Clean"

echo ""
echo "[2] os-gate.tsx pinSet check:"
grep -q "pinSet" lib/auth/os-gate.tsx && echo "  ✓ Has pinSet" || echo "  ✗ Missing pinSet"

echo ""
echo "[3] Profile sign out:"
grep -n "router.replace" app/\(os\)/profile/index.tsx | grep "/auth/login" && echo "  ✗ STILL BROKEN" || echo "  ✓ Clean"

echo ""
echo "[4] Settings sign out:"
grep -n "router.replace" app/\(os\)/settings/profile.tsx | grep "'/auth'" && echo "  ✗ STILL BROKEN" || echo "  ✓ Clean"

echo ""
echo "[5] Wallet useIdentity imports:"
grep -rn "useIdentity.*auth.store" app/\(os\)/wallet/ && echo "  ✗ STILL BROKEN" || echo "  ✓ All clean"

echo ""
echo "[6] Remaining /auth/ routes in app/:"
count=$(grep -rn "'/auth/login'\|'/auth/signup'\|'/auth/forgot-password'\|'/auth/create-pin'" app/ 2>/dev/null | wc -l)
echo "  Found: $count"
if [ "$count" -gt 0 ]; then
  grep -rn "'/auth/login'\|'/auth/signup'\|'/auth/forgot-password'\|'/auth/create-pin'" app/ 2>/dev/null | head -5
fi

echo ""
echo "=== All fixes applied. Run: rm -rf .expo node_modules/.cache && npx expo start --clear ==="
