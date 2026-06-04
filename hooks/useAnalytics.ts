// hooks/useAnalytics.ts
import { useEffect, useCallback } from 'react';
import { useIdentity } from '@/hooks/useAuthStore';
import { supabase } from '@/lib/supabase/client';

export interface AnalyticsEvent {
  id?: string;
  event_type: string;
  event_name: string;
  user_id?: string;
  session_id?: string;
  properties?: Record<string, any>;
  timestamp: string;
}

export interface PageView {
  path: string;
  title: string;
  referrer?: string;
  duration_ms?: number;
}

export function useAnalytics() {
  const { user, session } = useIdentity();

  const trackEvent = useCallback(async (
    eventName: string,
    eventType: 'interaction' | 'navigation' | 'transaction' | 'error' | 'system' = 'interaction',
    properties?: Record<string, any>
  ) => {
    const event: AnalyticsEvent = {
      event_type: eventType,
      event_name: eventName,
      user_id: user?.id,
      session_id: session?.access_token?.slice(0, 32),
      properties: {
        ...properties,
        platform: 'mobile',
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };

    // Fire-and-forget to analytics edge function
    try {
      await supabase.functions.invoke('analytics-track', {
        body: event,
      });
    } catch (err) {
      // Silently fail — analytics should never block UX
      console.debug('[Analytics] Track failed:', err);
    }
  }, [user, session]);

  const trackPageView = useCallback(async (pageView: PageView) => {
    await trackEvent('page_view', 'navigation', {
      path: pageView.path,
      title: pageView.title,
      referrer: pageView.referrer,
    });
  }, [trackEvent]);

  const trackError = useCallback(async (error: Error, context?: string) => {
    await trackEvent('error', 'error', {
      message: error.message,
      stack: error.stack,
      context,
    });
  }, [trackEvent]);

  const trackTransaction = useCallback(async (
    transactionType: string,
    amount: number,
    currency: string,
    status: string,
    metadata?: Record<string, any>
  ) => {
    await trackEvent('transaction', 'transaction', {
      transaction_type: transactionType,
      amount,
      currency,
      status,
      ...metadata,
    });
  }, [trackEvent]);

  // Auto-track session start
  useEffect(() => {
    if (user) {
      trackEvent('session_start', 'system', {
        user_id: user.id,
        email: user.email,
      });
    }
  }, [user, trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackError,
    trackTransaction,
    isReady: !!user,
  };
}

export default useAnalytics;
