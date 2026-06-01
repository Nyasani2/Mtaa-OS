import { supabase } from '@/lib/supabase/client';
import { Alert } from 'react-native';

/**
 * Handle deep links for auth flows:
 * - Password reset: mtaa://auth/reset-password
 * - Email confirmation: mtaa://auth/confirm
 * - Magic link: mtaa://auth/magic-link
 */
export async function handleAuthDeepLink(url: string): Promise<void> {
  if (!url) return;

  const urlObj = new URL(url);
  const path = urlObj.pathname;
  const params = urlObj.searchParams;

  // Password reset flow
  if (path.includes('reset-password') || params.has('type', 'recovery')) {
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken) {
      // Exchange the recovery token for a session
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      });

      if (error) {
        Alert.alert('Reset Error', error.message);
        return;
      }

      // Navigate to reset password screen
      // Router navigation handled by the screen itself via onAuthStateChange
      return;
    }
  }

  // Email confirmation flow
  if (path.includes('confirm') || params.has('type', 'signup')) {
    const token = params.get('token');
    const type = params.get('type');

    if (token && type) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: type as any,
      });

      if (error) {
        Alert.alert('Verification Error', error.message);
        return;
      }

      Alert.alert('Success', 'Email verified successfully!');
    }
  }

  // Magic link flow
  if (path.includes('magic-link')) {
    // Session is automatically established by Supabase
    // The app should listen to onAuthStateChange
  }
}

/**
 * Extract auth params from any URL format
 * Handles both mtaa:// and https:// callbacks
 */
export function parseAuthParams(url: string): Record<string, string> {
  try {
    const urlObj = new URL(url);
    const params: Record<string, string> = {};
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  } catch {
    // Fallback for malformed URLs
    const params: Record<string, string> = {};
    const queryString = url.split('?')[1];
    if (queryString) {
      queryString.split('&').forEach((pair) => {
        const [key, value] = pair.split('=');
        if (key) params[key] = decodeURIComponent(value || '');
      });
    }
    return params;
  }
}
