// @ts-nocheck
/**
 * ASIS CSE — Proactive & Predictive Engine
 * Anticipates needs and alerts the user before they ask.
 */
import { supabase } from '@/lib/supabase';

export interface ProactiveAlert {
  id: string;
  type: 'warning' | 'info' | 'suggestion' | 'emergency';
  title: string;
  message: string;
  action?: { label: string; route: string };
  timestamp: number;
}

export class ProactiveEngine {
  private lastCheck = 0;
  private checkInterval = 60000; // Check every minute

  async evaluateContext(userId: string, currentScreen: string, timeOfDay: string): Promise<ProactiveAlert[]> {
    const now = Date.now();
    if (now - this.lastCheck < this.checkInterval) return [];
    this.lastCheck = now;

    const alerts: ProactiveAlert[] = [];

    // 1. Wallet Balance Check
    try {
      const { data } = await supabase
        .from('wallet_accounts')
        .select('balance')
        .eq('user_id', userId)
        .eq('is_default', true)
        .single();
      
      if (data && data.balance < 100) {
        alerts.push({
          id: 'low_balance',
          type: 'warning',
          title: 'Low Balance',
          message: `Sir, your wallet balance is KES ${data.balance}. Would you like to deposit funds?`,
          action: { label: 'Open Wallet', route: '/(os)/wallet' },
          timestamp: now,
        });
      }
    } catch (e) { /* Ignore DB errors */ }

    // 2. Predictive Assistance based on Time & Screen
    if (timeOfDay === 'morning' && currentScreen === 'home') {
      alerts.push({
        id: 'morning_commute',
        type: 'suggestion',
        title: 'Morning Commute',
        message: 'Good morning. Shall I open MTaxi for your usual route to work?',
        action: { label: 'Book MTaxi', route: '/(os)/mtaxi' },
        timestamp: now,
      });
    }

    if (timeOfDay === 'evening' && currentScreen === 'home') {
      alerts.push({
        id: 'evening_summary',
        type: 'info',
        title: 'Daily Summary',
        message: 'Would you like to see your spending summary for today?',
        action: { label: 'View Summary', route: '/(os)/wallet/history' },
        timestamp: now,
      });
    }

    return alerts;
  }
}

export const proactiveEngine = new ProactiveEngine();
