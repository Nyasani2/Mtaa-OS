import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { hasPin } from '@/lib/security/pin-engine';
import { useAuthStore } from '@/lib/auth/store/auth.store';

/**
 * PIN Setup Guard
 * Place this in your OS home screen or layout.
 * If user is authenticated but has no PIN, redirects to set-pin.
 * After setting PIN, user returns to OS home.
 */
export function usePinSetupGuard() {
  const router = useRouter();
  const segments = useSegments();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    // Only check if we're in the OS area
    const isInOS = segments[0] === '(os)';
    if (!isInOS) return;

    const checkPin = async () => {
      const pinSet = await hasPin();
      if (!pinSet) {
        // Redirect to set-pin, but only if not already there
        const currentPath = segments.join('/');
        if (!currentPath.includes('set-pin')) {
          router.push('/auth/set-pin');
        }
      }
    };

    checkPin();
  }, [isAuthenticated, isLoading, segments, router]);
}
