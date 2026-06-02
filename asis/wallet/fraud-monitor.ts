/**
 * ASIS Layer 5 — Fraud Monitor Scaffold
 * Lightweight detection: velocity, device, PIN, duplicate claims, geo
 */

import { FraudAlert, Transfer, ClaimLink } from './types';
import { EventBus } from '../kernel/event-bus';

export interface FraudConfig {
  velocityWindowMinutes: number;
  maxTransfersPerWindow: number;
  maxAmountPerWindow: number;
  maxFailedPinAttempts: number;
  maxDuplicateClaims: number;
  geoMaxDistanceKm: number;
}

export class FraudMonitor {
  private config: FraudConfig;
  private eventBus: EventBus;
  private alerts: FraudAlert[] = [];
  private transferHistory: Map<string, Transfer[]> = new Map(); // userId -> transfers
  private deviceHistory: Map<string, { deviceId: string; timestamp: Date; location?: string }[]> = new Map();
  private pinAttempts: Map<string, { count: number; lastAttempt: Date }> = new Map();
  private claimAttempts: Map<string, number> = new Map(); // token -> count

  constructor(eventBus: EventBus, config: Partial<FraudConfig> = {}) {
    this.eventBus = eventBus;
    this.config = {
      velocityWindowMinutes: 60,
      maxTransfersPerWindow: 10,
      maxAmountPerWindow: 100000,
      maxFailedPinAttempts: 3,
      maxDuplicateClaims: 2,
      geoMaxDistanceKm: 500,
      ...config,
    };

    this.listenToEvents();
  }

  /**
   * Analyze transfer for fraud risk
   */
  async analyzeTransfer(transfer: Transfer): Promise<{ risk: number; alerts: string[]; blocked: boolean }> {
    const alerts: string[] = [];
    let risk = 0;

    // Velocity check
    const velocity = this.checkVelocity(transfer.senderId);
    if (velocity.count > this.config.maxTransfersPerWindow) {
      risk += 30;
      alerts.push(`High transfer velocity: ${velocity.count} transfers in ${this.config.velocityWindowMinutes} minutes`);
    }
    if (velocity.amount > this.config.maxAmountPerWindow) {
      risk += 40;
      alerts.push(`High transfer amount: ${velocity.amount} in ${this.config.velocityWindowMinutes} minutes`);
    }

    // New recipient check
    const isNewRecipient = this.isNewRecipient(transfer.senderId, transfer.recipientId);
    if (isNewRecipient && transfer.amount > 10000) {
      risk += 20;
      alerts.push('Large transfer to new recipient');
    }

    // Device check
    const deviceRisk = this.checkDeviceRisk(transfer.senderId, transfer.metadata?.deviceId as string);
    if (deviceRisk > 0) {
      risk += deviceRisk;
      alerts.push('Suspicious device behavior detected');
    }

    // Block if risk too high
    const blocked = risk >= 70;

    if (blocked || risk > 30) {
      this.createAlert({
        type: 'velocity',
        severity: blocked ? 'critical' : 'high',
        userId: transfer.senderId,
        transferId: transfer.id,
        description: alerts.join('; '),
        evidence: { risk, transferAmount: transfer.amount, velocity },
      });
    }

    return { risk, alerts, blocked };
  }

  /**
   * Check device behavior
   */
  async checkDevice(userId: string, deviceId: string, action: string): Promise<{ risk: number; alerts: string[] }> {
    const alerts: string[] = [];
    let risk = 0;

    const history = this.deviceHistory.get(userId) || [];
    const recentDevices = history.filter(h => Date.now() - h.timestamp.getTime() < 86400000);

    // New device
    const knownDevices = new Set(recentDevices.map(h => h.deviceId));
    if (!knownDevices.has(deviceId)) {
      risk += 15;
      alerts.push('New device detected');
    }

    // Multiple devices
    if (knownDevices.size > 3) {
      risk += 10;
      alerts.push('Multiple devices used recently');
    }

    // Record device
    history.push({ deviceId, timestamp: new Date() });
    this.deviceHistory.set(userId, history.slice(-20));

    return { risk, alerts };
  }

  /**
   * Record failed PIN attempt
   */
  recordFailedPin(userId: string): { locked: boolean; remaining: number } {
    const attempts = this.pinAttempts.get(userId) || { count: 0, lastAttempt: new Date() };

    // Reset if last attempt was > 1 hour ago
    if (Date.now() - attempts.lastAttempt.getTime() > 3600000) {
      attempts.count = 0;
    }

    attempts.count++;
    attempts.lastAttempt = new Date();
    this.pinAttempts.set(userId, attempts);

    const locked = attempts.count >= this.config.maxFailedPinAttempts;
    const remaining = Math.max(0, this.config.maxFailedPinAttempts - attempts.count);

    if (locked) {
      this.createAlert({
        type: 'pin',
        severity: 'critical',
        userId,
        description: `Account locked: ${attempts.count} failed PIN attempts`,
        evidence: { attempts: attempts.count },
      });
    }

    return { locked, remaining };
  }

  /**
   * Check duplicate claim attempts
   */
  checkDuplicateClaim(token: string): boolean {
    const count = (this.claimAttempts.get(token) || 0) + 1;
    this.claimAttempts.set(token, count);

    if (count > this.config.maxDuplicateClaims) {
      this.createAlert({
        type: 'duplicate',
        severity: 'high',
        userId: 'unknown',
        description: `Multiple claim attempts for token ${token.substring(0, 8)}...`,
        evidence: { claimCount: count },
      });
      return true;
    }

    return false;
  }

  /**
   * Check for onboarding loop (fake accounts)
   */
  checkOnboardingLoop(deviceId: string, phoneNumber: string): boolean {
    // Simple check: same device, multiple accounts
    const history = this.deviceHistory.get(phoneNumber) || [];
    const sameDeviceCount = history.filter(h => h.deviceId === deviceId).length;

    if (sameDeviceCount > 3) {
      this.createAlert({
        type: 'onboarding_loop',
        severity: 'high',
        userId: phoneNumber,
        deviceId,
        description: 'Multiple accounts created from same device',
        evidence: { sameDeviceCount },
      });
      return true;
    }

    return false;
  }

  /**
   * Check geolocation anomaly
   */
  checkGeoAnomaly(userId: string, lat: number, lng: number): boolean {
    const history = this.deviceHistory.get(userId) || [];
    const lastLocation = history[history.length - 1];

    if (lastLocation?.location) {
      const [lastLat, lastLng] = lastLocation.location.split(',').map(Number);
      const distance = this.haversine(lat, lng, lastLat, lastLng);

      if (distance > this.config.geoMaxDistanceKm) {
        this.createAlert({
          type: 'geo',
          severity: 'medium',
          userId,
          description: `Unusual location: ${distance.toFixed(0)} km from last login`,
          evidence: { distance, lastLocation: lastLocation.location, newLocation: `${lat},${lng}` },
        });
        return true;
      }
    }

    // Update location
    history.push({ deviceId: 'current', timestamp: new Date(), location: `${lat},${lng}` });
    this.deviceHistory.set(userId, history.slice(-10));

    return false;
  }

  /**
   * Get alerts for user
   */
  getAlerts(userId: string, status?: FraudAlert['status']): FraudAlert[] {
    return this.alerts.filter(
      a => a.userId === userId && (!status || a.status === status)
    );
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string, resolution: 'resolved' | 'false_positive'): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = resolution;
      alert.resolvedAt = new Date();
    }
  }

  private checkVelocity(userId: string): { count: number; amount: number } {
    const window = this.config.velocityWindowMinutes * 60000;
    const transfers = this.transferHistory.get(userId) || [];
    const recent = transfers.filter(t => Date.now() - t.createdAt.getTime() < window);

    return {
      count: recent.length,
      amount: recent.reduce((sum, t) => sum + t.amount, 0),
    };
  }

  private isNewRecipient(senderId: string, recipientId?: string): boolean {
    if (!recipientId) return true;
    const transfers = this.transferHistory.get(senderId) || [];
    return !transfers.some(t => t.recipientId === recipientId);
  }

  private checkDeviceRisk(userId: string, deviceId?: string): number {
    if (!deviceId) return 0;
    const history = this.deviceHistory.get(userId) || [];
    const knownDevices = new Set(history.map(h => h.deviceId));
    return knownDevices.has(deviceId) ? 0 : 20;
  }

  private createAlert(partial: Omit<FraudAlert, 'id' | 'timestamp' | 'status'>): void {
    const alert: FraudAlert = {
      ...partial,
      id: `fraud_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date(),
      status: 'open',
    };

    this.alerts.push(alert);
    this.eventBus.emit('fraud:alert', alert);
  }

  private listenToEvents(): void {
    this.eventBus.on('wallet:transfer_initiated', (data) => {
      // Record for velocity tracking
      const transfers = this.transferHistory.get(data.senderId) || [];
      transfers.push(data as Transfer);
      this.transferHistory.set(data.senderId, transfers.slice(-50));
    });
  }

  private haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
