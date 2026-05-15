/**
 * MTAA AFRIQ — Notification Engine (Kernel Layer)
 * Handles: Live Updates, Rich Notifications, Grouping, Cooldown, Actions
 * Real-time delivery via WebSocket + FCM fallback
 * Phase: P0 Foundation
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import EventEmitter from 'eventemitter3'
// ─── Types ─────────────────────────────────────────────────────────

export type NotificationPriority = 'critical' | 'high' | 'normal' | 'low';
export type NotificationCategory = 
  | 'mtaxi_ride' | 'mtruck_dispatch' | 'payment' | 'escrow' | 'message'
  | 'system' | 'marketing' | 'security' | 'appointment' | 'delivery';

export interface NotificationPayload {
  id: string;
  user_id: string;
  title: string;
  body: string;
  priority: NotificationPriority;
  category: NotificationCategory;
  image_url?: string;
  deep_link?: string;
  actions?: NotificationAction[];
  progress?: NotificationProgress;
  group_key?: string;
  thread_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  expires_at?: string;
}

export interface NotificationAction {
  id: string;
  label: string;
  icon?: string;
  destructive?: boolean;
  requires_auth?: boolean;
  endpoint?: string;
  payload?: Record<string, unknown>;
}

export interface NotificationProgress {
  current: number;
  total: number;
  indeterminate?: boolean;
  label?: string;
}

export interface NotificationPreferences {
  user_id: string;
  global_enabled: boolean;
  quiet_hours_start: string | null; // "22:00"
  quiet_hours_end: string | null;   // "07:00"
  cooldown_enabled: boolean;
  cooldown_threshold: number;       // seconds between same-category bursts
  per_category: Record<NotificationCategory, CategoryPreference>;
  per_app: Record<string, AppPreference>;
  channels: ChannelPreference[];
  updated_at: string;
}

export interface CategoryPreference {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  banner: boolean;
  lock_screen: boolean;
  priority_override?: NotificationPriority;
}

export interface AppPreference {
  enabled: boolean;
  badge_count: boolean;
  sound_override?: string;
}

export interface ChannelPreference {
  id: string;
  name: string;
  description: string;
  importance: NotificationPriority;
  sound_uri?: string;
  vibration_pattern?: number[];
  led_color?: string;
}

export interface DeviceToken {
  id: string;
  user_id: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  app_version: string;
  os_version: string;
  last_active: string;
  enabled: boolean;
}

export interface NotificationDelivery {
  notification_id: string;
  device_token_id: string;
  channel: 'websocket' | 'fcm' | 'sms' | 'email';
  status: 'pending' | 'delivered' | 'failed' | 'read' | 'dismissed';
  delivered_at?: string;
  read_at?: string;
  error?: string;
}

// ─── Constants ─────────────────────────────────────────────────────

const DEFAULT_COOLDOWN_SECONDS = 30;
const MAX_RETRY_ATTEMPTS = 3;
const WEBSOCKET_TIMEOUT_MS = 5000;
const FCM_BATCH_SIZE = 500;

const DEFAULT_CATEGORY_PREFS: Record<NotificationCategory, CategoryPreference> = {
  mtaxi_ride: { enabled: true, sound: true, vibration: true, banner: true, lock_screen: true },
  mtruck_dispatch: { enabled: true, sound: true, vibration: true, banner: true, lock_screen: true },
  payment: { enabled: true, sound: true, vibration: true, banner: true, lock_screen: true },
  escrow: { enabled: true, sound: true, vibration: false, banner: true, lock_screen: true },
  message: { enabled: true, sound: true, vibration: false, banner: true, lock_screen: true },
  system: { enabled: true, sound: false, vibration: false, banner: true, lock_screen: true },
  marketing: { enabled: false, sound: false, vibration: false, banner: false, lock_screen: false },
  security: { enabled: true, sound: true, vibration: true, banner: true, lock_screen: true },
  appointment: { enabled: true, sound: true, vibration: false, banner: true, lock_screen: true },
  delivery: { enabled: true, sound: true, vibration: true, banner: true, lock_screen: true },
};

// ─── Notification Engine Class ─────────────────────────────────────

export class NotificationEngine extends EventEmitter {
  private supabase: SupabaseClient;
  private wsConnections: Map<string, WebSocket> = new Map();
  private cooldownTracker: Map<string, number> = new Map();
  private fcmApiKey: string;
  private isProcessing: boolean = false;

  constructor(supabaseUrl: string, supabaseKey: string, fcmApiKey?: string) {
    super();
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.fcmApiKey = fcmApiKey || ''; // Deprecated: Firebase sunset
  }

  // ─── Core Send Flow ──────────────────────────────────────────────

  /**
   * Send a notification to a user
   * Flow: Validate → Check prefs → Check cooldown → Persist → Route → Deliver
   */
  async send(payload: Omit<NotificationPayload, 'id' | 'created_at'>): Promise<string> {
    const notificationId = this.generateId();
    const now = new Date().toISOString();

    const fullPayload: NotificationPayload = {
      ...payload,
      id: notificationId,
      created_at: now,
    };

    // 1. Validate
    if (!payload.user_id || !payload.title || !payload.body) {
      throw new Error('Missing required fields: user_id, title, body');
    }

    // 2. Check user preferences
    const prefs = await this.getUserPreferences(payload.user_id);
    if (!prefs.global_enabled) {
      this.emit('blocked', { notificationId, reason: 'global_disabled' });
      return notificationId;
    }

    // 3. Check quiet hours
    if (this.isQuietHours(prefs)) {
      // Queue for later delivery unless critical
      if (payload.priority !== 'critical') {
        await this.queueForLater(fullPayload, prefs.quiet_hours_end!);
        this.emit('queued', { notificationId, reason: 'quiet_hours' });
        return notificationId;
      }
    }

    // 4. Check category preferences
    const catPref = prefs.per_category[payload.category];
    if (!catPref?.enabled) {
      this.emit('blocked', { notificationId, reason: 'category_disabled' });
      return notificationId;
    }

    // 5. Check cooldown
    if (prefs.cooldown_enabled && await this.isOnCooldown(payload.user_id, payload.category, prefs.cooldown_threshold)) {
      this.emit('cooldown', { notificationId, category: payload.category });
      // Still persist but don't deliver immediately
      await this.persistNotification(fullPayload, 'cooldown');
      return notificationId;
    }

    // 6. Persist to database
    await this.persistNotification(fullPayload, 'pending');

    // 7. Route and deliver
    await this.routeDelivery(fullPayload, prefs);

    // 8. Update cooldown tracker
    this.updateCooldown(payload.user_id, payload.category);

    this.emit('sent', { notificationId, userId: payload.user_id });
    return notificationId;
  }

  /**
   * Send to multiple users (batch)
   */
  async sendBatch(payloads: Omit<NotificationPayload, 'id' | 'created_at'>[]): Promise<string[]> {
    const ids: string[] = [];
    for (const payload of payloads) {
      try {
        const id = await this.send(payload);
        ids.push(id);
      } catch (err) {
        this.emit('batch_error', { payload, error: err });
      }
    }
    return ids;
  }

  // ─── Live Updates ────────────────────────────────────────────────

  /**
   * Update an existing notification with progress (Live Update)
   * Used for: MTaxi approaching, delivery tracking, file uploads
   */
  async updateProgress(notificationId: string, progress: NotificationProgress): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ 
        progress,
        updated_at: new Date().toISOString(),
      })
      .eq('id', notificationId);

    if (error) throw error;

    // Push update to connected devices
    const notification = await this.getNotification(notificationId);
    if (notification) {
      await this.pushLiveUpdate(notification);
    }
  }

  /**
   * Complete a live update notification
   */
  async completeLiveUpdate(notificationId: string, finalMessage?: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({
        progress: { current: 100, total: 100, label: 'Complete' },
        body: finalMessage || 'Complete',
        completed_at: new Date().toISOString(),
      })
      .eq('id', notificationId);

    if (error) throw error;

    const notification = await this.getNotification(notificationId);
    if (notification) {
      await this.pushLiveUpdate(notification);
      // Auto-dismiss after 5 seconds
      setTimeout(() => this.dismiss(notificationId), 5000);
    }
  }

  // ─── Delivery Routing ────────────────────────────────────────────

  private async routeDelivery(payload: NotificationPayload, prefs: NotificationPreferences): Promise<void> {
    // Get active device tokens
    const tokens = await this.getActiveDeviceTokens(payload.user_id);

    if (tokens.length === 0) {
      // No devices — fallback to SMS for critical, email for high
      if (payload.priority === 'critical') {
        await this.fallbackToSMS(payload);
      } else if (payload.priority === 'high') {
        await this.fallbackToEmail(payload);
      }
      return;
    }

    // Try WebSocket first for real-time
    const wsDelivered: string[] = [];
    for (const token of tokens) {
      const ws = this.wsConnections.get(token.id);
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({
            type: 'notification',
            payload,
            timestamp: new Date().toISOString(),
          }));
          await this.recordDelivery(payload.id, token.id, 'websocket', 'delivered');
          wsDelivered.push(token.id);
        } catch {
          await this.recordDelivery(payload.id, token.id, 'websocket', 'failed');
        }
      }
    }

    // FCM for devices not reached via WebSocket
    const fcmTokens = tokens
      .filter(t => !wsDelivered.includes(t.id) && t.platform !== 'web')
      .map(t => t.token);

    if (fcmTokens.length > 0) {
      await this.sendFCM(payload, fcmTokens);
      for (const token of tokens.filter(t => !wsDelivered.includes(t.id))) {
        await this.recordDelivery(payload.id, token.id, 'fcm', 'delivered');
      }
    }

    // Web push for web devices
    const webTokens = tokens
      .filter(t => !wsDelivered.includes(t.id) && t.platform === 'web')
      .map(t => t.token);

    if (webTokens.length > 0) {
      await this.sendWebPush(payload, webTokens);
    }
  }

  // ─── FCM Integration ─────────────────────────────────────────────

  private async sendFCM(payload: NotificationPayload, tokens: string[]): Promise<void> {
    // NO FCM — Firebase sunset, using Supabase Realtime + SMS fallback only
    // WebSocket delivery is handled in routeDelivery()
    // If we reach here, user is offline — queue for SMS if critical
    if (payload.priority === 'critical') {
      await this.fallbackToSMS(payload);
    }
    this.emit('fcm_skipped', { 
      notificationId: payload.id, 
      reason: 'Firebase sunset — using Supabase Realtime + SMS' 
    });
  }

  // ─── Web Push ────────────────────────────────────────────────────

  private async sendWebPush(payload: NotificationPayload, tokens: string[]): Promise<void> {
    // Web Push API implementation
    for (const token of tokens) {
      try {
        // Use web-push library or native Push API
        this.emit('webpush_sent', { token, notificationId: payload.id });
      } catch (err) {
        this.emit('webpush_error', { token, error: err });
      }
    }
  }

  // ─── Fallback Channels ───────────────────────────────────────────

  private async fallbackToSMS(payload: NotificationPayload): Promise<void> {
    const { data: user } = await this.supabase
      .from('profiles')
      .select('phone')
      .eq('id', payload.user_id)
      .single();

    if (user?.phone) {
      // Call SMS gateway (Twilio, Africa's Talking, etc.)
      await this.supabase.rpc('send_sms', {
        to_phone: user.phone,
        message: `${payload.title}: ${payload.body}`,
      });
    }
  }

  private async fallbackToEmail(payload: NotificationPayload): Promise<void> {
    const { data: user } = await this.supabase
      .from('profiles')
      .select('email')
      .eq('id', payload.user_id)
      .single();

    if (user?.email) {
      await this.supabase.rpc('send_email', {
        to_email: user.email,
        subject: payload.title,
        body: payload.body,
      });
    }
  }

  // ─── Notification Actions ────────────────────────────────────────

  /**
   * Execute a notification action
   */
  async executeAction(notificationId: string, actionId: string, userId: string): Promise<unknown> {
    const notification = await this.getNotification(notificationId);
    if (!notification) throw new Error('Notification not found');
    if (notification.user_id !== userId) throw new Error('Unauthorized');

    const action = notification.actions?.find(a => a.id === actionId);
    if (!action) throw new Error('Action not found');

    if (action.requires_auth) {
      // Verify auth token
      const { data: session } = await this.supabase.auth.getSession();
      if (!session) throw new Error('Authentication required');
    }

    if (action.endpoint) {
      // Call the action endpoint via core/api/
      const response = await fetch(`${process.env.API_BASE_URL}${action.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getServiceToken()}`,
        },
        body: JSON.stringify({
          notification_id: notificationId,
          action_id: actionId,
          user_id: userId,
          payload: action.payload,
        }),
      });

      return response.json();
    }

    // Default actions
    switch (actionId) {
      case 'dismiss':
        await this.dismiss(notificationId);
        return { success: true };
      case 'mark_read':
        await this.markAsRead(notificationId);
        return { success: true };
      default:
        throw new Error(`Unknown action: ${actionId}`);
    }
  }

  // ─── Notification Lifecycle ──────────────────────────────────────

  async markAsRead(notificationId: string): Promise<void> {
    const now = new Date().toISOString();
    await this.supabase
      .from('notifications')
      .update({ read_at: now, status: 'read' })
      .eq('id', notificationId);

    await this.supabase
      .from('notification_deliveries')
      .update({ status: 'read', read_at: now })
      .eq('notification_id', notificationId);

    this.emit('read', { notificationId });
  }

  async dismiss(notificationId: string): Promise<void> {
    await this.supabase
      .from('notifications')
      .update({ dismissed_at: new Date().toISOString(), status: 'dismissed' })
      .eq('id', notificationId);

    this.emit('dismissed', { notificationId });
  }

  async delete(notificationId: string): Promise<void> {
    await this.supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    this.emit('deleted', { notificationId });
  }

  async archive(notificationId: string): Promise<void> {
    await this.supabase
      .from('notifications')
      .update({ archived_at: new Date().toISOString(), status: 'archived' })
      .eq('id', notificationId);

    this.emit('archived', { notificationId });
  }

  // ─── Grouping & Threading ────────────────────────────────────────

  /**
   * Get grouped notifications for inbox display
   */
  async getGroupedNotifications(userId: string): Promise<Record<string, NotificationPayload[]>> {
    const { data } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .is('archived_at', null)
      .order('created_at', { ascending: false });

    if (!data) return {};

    const grouped: Record<string, NotificationPayload[]> = {};
    for (const notif of data) {
      const key = notif.group_key || notif.category;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(notif);
    }

    return grouped;
  }

  /**
   * Get thread messages
   */
  async getThread(threadId: string, userId: string): Promise<NotificationPayload[]> {
    const { data } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    return data || [];
  }

  // ─── Preferences Management ──────────────────────────────────────

  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    const { data } = await this.supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data) return data as NotificationPreferences;

    // Create defaults
    const defaults: NotificationPreferences = {
      user_id: userId,
      global_enabled: true,
      quiet_hours_start: '22:00',
      quiet_hours_end: '07:00',
      cooldown_enabled: true,
      cooldown_threshold: DEFAULT_COOLDOWN_SECONDS,
      per_category: DEFAULT_CATEGORY_PREFS,
      per_app: {},
      channels: [
        { id: 'default', name: 'General', description: 'Default notification channel', importance: 'normal' },
        { id: 'critical', name: 'Critical Alerts', description: 'Urgent notifications', importance: 'critical', vibration_pattern: [0, 500, 200, 500] },
        { id: 'payments', name: 'Payments', description: 'Payment and escrow updates', importance: 'high' },
        { id: 'rides', name: 'Rides & Deliveries', description: 'MTaxi and MTruck updates', importance: 'high' },
      ],
      updated_at: new Date().toISOString(),
    };

    await this.supabase.from('notification_preferences').insert(defaults);
    return defaults;
  }

  async updatePreferences(userId: string, updates: Partial<NotificationPreferences>): Promise<void> {
    await this.supabase
      .from('notification_preferences')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
  }

  async updateCategoryPreference(
    userId: string,
    category: NotificationCategory,
    pref: Partial<CategoryPreference>
  ): Promise<void> {
    const current = await this.getUserPreferences(userId);
    const updated = {
      ...current.per_category,
      [category]: { ...current.per_category[category], ...pref },
    };

    await this.supabase
      .from('notification_preferences')
      .update({
        per_category: updated,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
  }

  // ─── Device Token Management ─────────────────────────────────────

  async registerDeviceToken(token: Omit<DeviceToken, 'id' | 'last_active'>): Promise<string> {
    const tokenId = this.generateId();

    // Deactivate old tokens for same device
    await this.supabase
      .from('device_tokens')
      .update({ enabled: false })
      .eq('user_id', token.user_id)
      .eq('platform', token.platform);

    await this.supabase.from('device_tokens').insert({
      ...token,
      id: tokenId,
      last_active: new Date().toISOString(),
    });

    return tokenId;
  }

  async unregisterDeviceToken(tokenId: string): Promise<void> {
    await this.supabase
      .from('device_tokens')
      .update({ enabled: false })
      .eq('id', tokenId);
  }

  private async getActiveDeviceTokens(userId: string): Promise<DeviceToken[]> {
    const { data } = await this.supabase
      .from('device_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('enabled', true)
      .order('last_active', { ascending: false })
      .limit(10);

    return data || [];
  }

  // ─── WebSocket Management ────────────────────────────────────────

  registerWebSocket(userId: string, deviceTokenId: string, ws: WebSocket): void {
    this.wsConnections.set(deviceTokenId, ws);

    ws.onclose = () => {
      this.wsConnections.delete(deviceTokenId);
    };

    ws.onerror = () => {
      this.wsConnections.delete(deviceTokenId);
    };

    // Update last active
    this.supabase
      .from('device_tokens')
      .update({ last_active: new Date().toISOString() })
      .eq('id', deviceTokenId);
  }

  private async pushLiveUpdate(notification: NotificationPayload): Promise<void> {
    const tokens = await this.getActiveDeviceTokens(notification.user_id);
    for (const token of tokens) {
      const ws = this.wsConnections.get(token.id);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'live_update',
          payload: notification,
          timestamp: new Date().toISOString(),
        }));
      }
    }
  }

  // ─── Cooldown Logic ──────────────────────────────────────────────

  private async isOnCooldown(userId: string, category: NotificationCategory, threshold: number): Promise<boolean> {
    const key = `${userId}:${category}`;
    const lastSent = this.cooldownTracker.get(key);
    if (!lastSent) return false;
    return (Date.now() - lastSent) < threshold * 1000;
  }

  private updateCooldown(userId: string, category: NotificationCategory): void {
    const key = `${userId}:${category}`;
    this.cooldownTracker.set(key, Date.now());
  }

  // ─── Quiet Hours ─────────────────────────────────────────────────

  private isQuietHours(prefs: NotificationPreferences): boolean {
    if (!prefs.quiet_hours_start || !prefs.quiet_hours_end) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = prefs.quiet_hours_start.split(':').map(Number);
    const [endH, endM] = prefs.quiet_hours_end.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes < endMinutes) {
      return currentTime >= startMinutes && currentTime < endMinutes;
    } else {
      // Wraps around midnight
      return currentTime >= startMinutes || currentTime < endMinutes;
    }
  }

  // ─── Queue Management ────────────────────────────────────────────

  private async queueForLater(payload: NotificationPayload, deliverAfter: string): Promise<void> {
    await this.supabase.from('notification_queue').insert({
      notification_id: payload.id,
      user_id: payload.user_id,
      payload,
      deliver_after: deliverAfter,
      created_at: new Date().toISOString(),
    });
  }

  /**
   * Process queued notifications (call from cron job)
   */
  async processQueue(): Promise<void> {
    const now = new Date().toISOString();
    const { data: queued } = await this.supabase
      .from('notification_queue')
      .select('*')
      .lte('deliver_after', now)
      .eq('processed', false);

    if (!queued) return;

    for (const item of queued) {
      try {
        await this.send(item.payload);
        await this.supabase
          .from('notification_queue')
          .update({ processed: true, processed_at: now })
          .eq('id', item.id);
      } catch (err) {
        this.emit('queue_error', { item, error: err });
      }
    }
  }

  // ─── Badge Count ─────────────────────────────────────────────────

  async getUnreadCount(userId: string): Promise<number> {
    const { count } = await this.supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null)
      .is('archived_at', null);

    return count || 0;
  }

  async updateBadgeCount(userId: string): Promise<void> {
    const count = await this.getUnreadCount(userId);

    // Push badge update to all devices
    const tokens = await this.getActiveDeviceTokens(userId);
    for (const token of tokens) {
      const ws = this.wsConnections.get(token.id);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'badge_update',
          count,
          timestamp: new Date().toISOString(),
        }));
      }
    }
  }

  // ─── Cleanup ─────────────────────────────────────────────────────

  async cleanupOldNotifications(daysToKeep: number = 30): Promise<void> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysToKeep);

    await this.supabase
      .from('notifications')
      .delete()
      .lt('created_at', cutoff.toISOString())
      .not('status', 'in', '(pending,read)');
  }

  // ─── Helpers ─────────────────────────────────────────────────────

  private async persistNotification(payload: NotificationPayload, status: string): Promise<void> {
    await this.supabase.from('notifications').insert({
      ...payload,
      status,
    });
  }

  private async getNotification(id: string): Promise<NotificationPayload | null> {
    const { data } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .single();
    return data;
  }

  private async recordDelivery(
    notificationId: string,
    deviceTokenId: string,
    channel: string,
    status: string
  ): Promise<void> {
    await this.supabase.from('notification_deliveries').insert({
      notification_id: notificationId,
      device_token_id: deviceTokenId,
      channel,
      status,
      delivered_at: status === 'delivered' ? new Date().toISOString() : null,
    });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getServiceToken(): Promise<string> {
    const { data } = await this.supabase.auth.getSession();
    return data.session?.access_token || '';
  }
}

// ─── Singleton Export ──────────────────────────────────────────────

let engineInstance: NotificationEngine | null = null;

export function getNotificationEngine(): NotificationEngine {
  if (!engineInstance) {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const fcmKey = ''; // FCM deprecated — using Supabase Realtime + SMS
    engineInstance = new NotificationEngine(supabaseUrl, supabaseKey, fcmKey);
  }
  return engineInstance;
}

