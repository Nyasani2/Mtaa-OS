/**
 * ASIS Layer 6 — Cash Point Engine
 * Registration, discovery, availability, liquidity tracking
 * Supports: fixed agents, roaming agents, shops, kiosks, supermarkets
 */

import {
  CashPoint,
  CashPointType,
  OperationalState,
  GeoLocation,
  OperatingHours,
  ReputationScore,
} from './types';
import { IGeoDiscoveryProvider, GeoFilters } from './interfaces';
import { EventBus } from '../kernel/event-bus';

export class CashPointEngine implements IGeoDiscoveryProvider {
  const name = 'mtaa_cash_point_engine';
  private cashPoints: Map<string, CashPoint> = new Map();
  private geoIndex: Map<string, Set<string>> = new Map(); // geohash -> ids
  private nameIndex: Map<string, Set<string>> = new Map(); // name word -> ids
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.seedSampleData();
  }

  /**
   * Register a new cash point
   */
  async register(cashPoint: Omit<CashPoint, 'reputation' | 'lastSeen'>): Promise<CashPoint> {
    const fullPoint: CashPoint = {
      ...cashPoint,
      reputation: this.defaultReputation(),
      lastSeen: new Date(),
    };

    this.cashPoints.set(fullPoint.id, fullPoint);
    this.indexByLocation(fullPoint);
    this.indexByName(fullPoint);

    this.eventBus.emit('cashpoint:registered', {
      id: fullPoint.id,
      name: fullPoint.name,
      type: fullPoint.type,
      country: fullPoint.country,
    });

    return fullPoint;
  }

  /**
   * Update cash point status
   */
  async updateStatus(id: string, status: OperationalState): Promise<CashPoint | null> {
    const point = this.cashPoints.get(id);
    if (!point) return null;

    const oldStatus = point.status;
    point.status = status;
    point.lastSeen = new Date();

    this.eventBus.emit('cashpoint:status_changed', {
      id,
      oldStatus,
      newStatus: status,
      timestamp: new Date(),
    });

    return point;
  }

  /**
   * Update cash point location (for roaming agents)
   */
  async updateLocation(id: string, location: GeoLocation): Promise<CashPoint | null> {
    const point = this.cashPoints.get(id);
    if (!point) return null;
    if (point.type !== CashPointType.ROAMING_AGENT) return null;

    // Remove from old geohash index
    this.removeFromGeoIndex(id, point.location.geohash);

    point.location = location;
    point.lastSeen = new Date();

    // Add to new geohash index
    this.indexByLocation(point);

    this.eventBus.emit('cashpoint:location_updated', {
      id,
      lat: location.lat,
      lng: location.lng,
      geohash: location.geohash,
    });

    return point;
  }

  /**
   * Find cash points near coordinates
   */
  async findNearby(lat: number, lng: number, radiusKm: number = 5, filters?: GeoFilters): Promise<CashPoint[]> {
    const nearby: CashPoint[] = [];

    for (const point of this.cashPoints.values()) {
      // Skip non-public states
      if (point.status === OperationalState.SUSPENDED || point.status === OperationalState.MAINTENANCE) {
        continue;
      }

      const distance = this.haversine(lat, lng, point.location.lat, point.location.lng);
      if (distance > radiusKm) continue;

      // Apply filters
      if (filters?.currencies && !filters.currencies.some(c => point.currencies.includes(c))) continue;
      if (filters?.types && !filters.types.includes(point.type)) continue;
      if (filters?.minRating && point.rating < filters.minRating) continue;
      if (filters?.requireVerified && !point.verified) continue;
      if (filters?.operationalState && !filters.operationalState.includes(point.status)) continue;
      if (filters?.maxFee) {
        const maxFee = Math.max(...Object.values(point.fees));
        if (maxFee > filters.maxFee) continue;
      }
      if (filters?.languages && !filters.languages.some(l => point.languages.includes(l))) continue;

      nearby.push({ ...point, distance } as any);
    }

    // Sort: nearest first, then by rating for ties
    return nearby.sort((a, b) => {
      const distA = (a as any).distance;
      const distB = (b as any).distance;
      if (Math.abs(distA - distB) < 0.3) {
        return b.rating - a.rating;
      }
      return distA - distB;
    });
  }

  /**
   * Find by geohash
   */
  async findByGeohash(geohash: string, precision: number = 5): Promise<CashPoint[]> {
    const prefix = geohash.substring(0, precision);
    const results: CashPoint[] = [];

    for (const [hash, ids] of this.geoIndex) {
      if (hash.startsWith(prefix)) {
        for (const id of ids) {
          const point = this.cashPoints.get(id);
          if (point && point.status !== OperationalState.SUSPENDED) {
            results.push(point);
          }
        }
      }
    }

    return results;
  }

  /**
   * Get by ID
   */
  async getById(id: string): Promise<CashPoint | null> {
    return this.cashPoints.get(id) || null;
  }

  /**
   * Search by name or address
   */
  async search(query: string, country?: string): Promise<CashPoint[]> {
    const queryLower = query.toLowerCase();
    const results: CashPoint[] = [];
    const seen = new Set<string>();

    // Search by name index
    for (const [word, ids] of this.nameIndex) {
      if (word.includes(queryLower)) {
        for (const id of ids) {
          if (seen.has(id)) continue;
          seen.add(id);

          const point = this.cashPoints.get(id);
          if (!point) continue;
          if (country && point.country !== country) continue;
          if (point.status === OperationalState.SUSPENDED) continue;

          results.push(point);
        }
      }
    }

    // Also search addresses
    for (const point of this.cashPoints.values()) {
      if (seen.has(point.id)) continue;
      if (country && point.country !== country) continue;
      if (point.status === OperationalState.SUSPENDED) continue;

      const addressMatch = point.location.address.toLowerCase().includes(queryLower) ||
        point.location.city.toLowerCase().includes(queryLower);

      if (addressMatch) {
        results.push(point);
      }
    }

    return results;
  }

  /**
   * Get all cash points for a country
   */
  getByCountry(country: string): CashPoint[] {
    return Array.from(this.cashPoints.values()).filter(p => p.country === country);
  }

  /**
   * Get operational stats
   */
  getStats(): { total: number; online: number; offline: number; lowLiquidity: number; byCountry: Record<string, number> } {
    const stats = { total: 0, online: 0, offline: 0, lowLiquidity: 0, byCountry: {} as Record<string, number> };

    for (const point of this.cashPoints.values()) {
      stats.total++;
      stats.byCountry[point.country] = (stats.byCountry[point.country] || 0) + 1;

      if (point.status === OperationalState.ONLINE) stats.online++;
      if (point.status === OperationalState.OFFLINE) stats.offline++;
      if (point.status === OperationalState.LOW_LIQUIDITY) stats.lowLiquidity++;
    }

    return stats;
  }

  async health(): Promise<{ available: boolean; latency: number }> {
    return { available: true, latency: 0 };
  }

  private indexByLocation(point: CashPoint): void {
    const geohash = point.location.geohash;
    // Index at multiple precisions for flexible lookup
    for (let precision = 4; precision <= 7; precision++) {
      const prefix = geohash.substring(0, precision);
      if (!this.geoIndex.has(prefix)) {
        this.geoIndex.set(prefix, new Set());
      }
      this.geoIndex.get(prefix)!.add(point.id);
    }
  }

  private removeFromGeoIndex(id: string, geohash: string): void {
    for (let precision = 4; precision <= 7; precision++) {
      const prefix = geohash.substring(0, precision);
      this.geoIndex.get(prefix)?.delete(id);
    }
  }

  private indexByName(point: CashPoint): void {
    const words = `${point.name} ${point.operatorName}`.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (word.length < 2) continue;
      if (!this.nameIndex.has(word)) {
        this.nameIndex.set(word, new Set());
      }
      this.nameIndex.get(word)!.add(point.id);
    }
  }

  private haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRad(deg: number): number {
    return deg * Math.PI / 180;
  }

  private defaultReputation(): ReputationScore {
    return {
      overall: 3.0,
      reliability: 3.0,
      liquidityConsistency: 3.0,
      customerRating: 3.0,
      disputeRate: 0,
      fraudFlags: 0,
      totalTransactions: 0,
      successfulTransactions: 0,
      lastUpdated: new Date(),
    };
  }

  private seedSampleData(): void {
    const samples: Omit<CashPoint, 'reputation' | 'lastSeen'>[] = [
      {
        id: 'cp_ke_nairobi_001',
        name: 'Mama Njoro Shop',
        type: CashPointType.SHOP,
        operatorName: 'Jane Njoro',
        operatorId: 'agent_ke_001',
        phone: '+254712345678',
        currencies: ['KES', 'USD'],
        liquidity: { KES: 75000, USD: 800 },
        status: OperationalState.ONLINE,
        location: {
          lat: -1.2921, lng: 36.8219,
          address: 'Moi Avenue, Nairobi CBD',
          city: 'Nairobi', region: 'Nairobi County', country: 'Kenya',
          geohash: 'kzf0t',
        },
        operatingHours: {
          timezone: 'Africa/Nairobi',
          schedule: [
            { day: 'Mon', open: '07:00', close: '21:00', closed: false },
            { day: 'Tue', open: '07:00', close: '21:00', closed: false },
            { day: 'Wed', open: '07:00', close: '21:00', closed: false },
            { day: 'Thu', open: '07:00', close: '21:00', closed: false },
            { day: 'Fri', open: '07:00', close: '21:00', closed: false },
            { day: 'Sat', open: '08:00', close: '20:00', closed: false },
            { day: 'Sun', open: '10:00', close: '18:00', closed: false },
          ],
          is24Hours: false,
        },
        rating: 4.6,
        reviewCount: 42,
        fees: { withdrawal: 40, deposit: 0, transfer: 30 },
        minAmount: 50,
        maxAmount: 50000,
        verified: true,
        region: 'nairobi_cbd',
        country: 'Kenya',
        timezone: 'Africa/Nairobi',
        languages: ['en', 'sw'],
        metadata: { hasParking: true, wheelchairAccessible: false },
      },
      {
        id: 'cp_ug_kampala_001',
        name: 'City Mobile Agent',
        type: CashPointType.ROAMING_AGENT,
        operatorName: 'David Okello',
        operatorId: 'agent_ug_001',
        phone: '+256782345678',
        currencies: ['UGX', 'KES', 'USD'],
        liquidity: { UGX: 2500000, KES: 15000, USD: 500 },
        status: OperationalState.ONLINE,
        location: {
          lat: 0.3136, lng: 32.5811,
          address: 'Kampala Road',
          city: 'Kampala', region: 'Central', country: 'Uganda',
          geohash: 's00tw',
        },
        operatingHours: {
          timezone: 'Africa/Kampala',
          schedule: [
            { day: 'Mon', open: '08:00', close: '18:00', closed: false },
            { day: 'Tue', open: '08:00', close: '18:00', closed: false },
            { day: 'Wed', open: '08:00', close: '18:00', closed: false },
            { day: 'Thu', open: '08:00', close: '18:00', closed: false },
            { day: 'Fri', open: '08:00', close: '18:00', closed: false },
            { day: 'Sat', open: '09:00', close: '15:00', closed: false },
            { day: 'Sun', open: '00:00', close: '00:00', closed: true },
          ],
          is24Hours: false,
        },
        rating: 4.3,
        reviewCount: 28,
        fees: { withdrawal: 1500, deposit: 0, transfer: 1000 },
        minAmount: 5000,
        maxAmount: 200000,
        verified: true,
        region: 'kampala_central',
        country: 'Uganda',
        timezone: 'Africa/Kampala',
        languages: ['en', 'lg'],
        metadata: { isRoaming: true, coverageRadius: 2 },
      },
      {
        id: 'cp_ng_lagos_001',
        name: 'Olu Supermarket',
        type: CashPointType.SUPERMARKET,
        operatorName: 'Olu Enterprises',
        operatorId: 'agent_ng_001',
        phone: '+2348123456789',
        currencies: ['NGN', 'USD', 'GHS'],
        liquidity: { NGN: 500000, USD: 2000, GHS: 10000 },
        status: OperationalState.ONLINE,
        location: {
          lat: 6.5244, lng: 3.3792,
          address: 'Ikeja City Mall',
          city: 'Lagos', region: 'Lagos State', country: 'Nigeria',
          geohash: 's14mt',
        },
        operatingHours: {
          timezone: 'Africa/Lagos',
          schedule: [
            { day: 'Mon', open: '08:00', close: '22:00', closed: false },
            { day: 'Tue', open: '08:00', close: '22:00', closed: false },
            { day: 'Wed', open: '08:00', close: '22:00', closed: false },
            { day: 'Thu', open: '08:00', close: '22:00', closed: false },
            { day: 'Fri', open: '08:00', close: '22:00', closed: false },
            { day: 'Sat', open: '08:00', close: '22:00', closed: false },
            { day: 'Sun', open: '10:00', close: '20:00', closed: false },
          ],
          is24Hours: false,
        },
        rating: 4.1,
        reviewCount: 156,
        fees: { withdrawal: 100, deposit: 0, transfer: 50 },
        minAmount: 500,
        maxAmount: 100000,
        verified: true,
        region: 'lagos_ikeja',
        country: 'Nigeria',
        timezone: 'Africa/Lagos',
        languages: ['en', 'yo', 'ha', 'ig'],
        metadata: { hasParking: true, wheelchairAccessible: true, securityGuard: true },
      },
      {
        id: 'cp_tz_dar_001',
        name: 'Kariakoo Kiosk',
        type: CashPointType.KIOSK,
        operatorName: 'Fatima Hassan',
        operatorId: 'agent_tz_001',
        phone: '+255712345678',
        currencies: ['TZS', 'KES', 'UGX'],
        liquidity: { TZS: 3000000, KES: 10000, UGX: 2000000 },
        status: OperationalState.LOW_LIQUIDITY,
        location: {
          lat: -6.8163, lng: 39.2683,
          address: 'Kariakoo Market',
          city: 'Dar es Salaam', region: 'Dar es Salaam', country: 'Tanzania',
          geohash: 'kyguy',
        },
        operatingHours: {
          timezone: 'Africa/Dar_es_Salaam',
          schedule: [
            { day: 'Mon', open: '06:00', close: '20:00', closed: false },
            { day: 'Tue', open: '06:00', close: '20:00', closed: false },
            { day: 'Wed', open: '06:00', close: '20:00', closed: false },
            { day: 'Thu', open: '06:00', close: '20:00', closed: false },
            { day: 'Fri', open: '06:00', close: '20:00', closed: false },
            { day: 'Sat', open: '06:00', close: '20:00', closed: false },
            { day: 'Sun', open: '08:00', close: '16:00', closed: false },
          ],
          is24Hours: false,
        },
        rating: 3.9,
        reviewCount: 67,
        fees: { withdrawal: 500, deposit: 0, transfer: 300 },
        minAmount: 1000,
        maxAmount: 50000,
        verified: true,
        region: 'dar_kariakoo',
        country: 'Tanzania',
        timezone: 'Africa/Dar_es_Salaam',
        languages: ['en', 'sw'],
        metadata: { marketLocation: true, busyHours: '10:00-14:00' },
      },
    ];

    for (const sample of samples) {
      this.register(sample);
    }
  }
}