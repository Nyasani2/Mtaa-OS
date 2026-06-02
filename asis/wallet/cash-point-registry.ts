/**
 * ASIS Layer 5 — Cash Point Registry
 * Africa-ready: shops, kiosks, mobile agents, supermarkets, roaming agents
 * Multi-country, multi-currency, offline-capable
 */

import { CashPoint, Currency } from './types';
import { ICashPointProvider } from './interfaces';

export class CashPointRegistry implements ICashPointProvider {
  name = 'mtaa_cash_points';
  private cashPoints: Map<string, CashPoint> = new Map();
  private geoIndex: Map<string, Set<string>> = new Map(); // geohash -> cashpoint ids

  constructor() {
    // Seed with sample data for testing
    this.seedSampleData();
  }

  /**
   * Register a cash point
   */
  register(point: CashPoint): void {
    this.cashPoints.set(point.id, point);
    this.indexByLocation(point);
  }

  /**
   * Find cash points near location
   */
  async findNearby(lat: number, lng: number, radiusKm: number = 5, currency?: Currency): Promise<CashPoint[]> {
    const nearby: CashPoint[] = [];

    for (const point of this.cashPoints.values()) {
      const distance = this.haversine(lat, lng, point.location.lat, point.location.lng);

      if (distance <= radiusKm) {
        // Filter by currency if specified
        if (currency && !point.currencies.includes(currency)) continue;

        // Filter by status
        if (point.status === 'closed') continue;

        nearby.push({ ...point, distance } as any);
      }
    }

    // Sort by distance and rating
    return nearby.sort((a, b) => {
      const distA = (a as any).distance;
      const distB = (b as any).distance;
      if (Math.abs(distA - distB) < 0.5) {
        return b.rating - a.rating;
      }
      return distA - distB;
    });
  }

  /**
   * Get cash point by ID
   */
  async getById(id: string): Promise<CashPoint | null> {
    return this.cashPoints.get(id) || null;
  }

  /**
   * Check liquidity
   */
  async checkLiquidity(cashPointId: string, currency: Currency, amount: number): Promise<boolean> {
    const point = this.cashPoints.get(cashPointId);
    if (!point) return false;
    if (point.status === 'offline' || point.status === 'low_liquidity') return false;

    const available = point.liquidity[currency] || 0;
    return available >= amount;
  }

  /**
   * Reserve liquidity (scaffold)
   */
  async reserve(cashPointId: string, currency: Currency, amount: number, ttlMinutes: number = 30): Promise<boolean> {
    const point = this.cashPoints.get(cashPointId);
    if (!point) return false;

    const available = point.liquidity[currency] || 0;
    if (available < amount) return false;

    // Deduct from liquidity
    point.liquidity[currency] = available - amount;

    // Auto-restore after TTL
    setTimeout(() => {
      point.liquidity[currency] = (point.liquidity[currency] || 0) + amount;
    }, ttlMinutes * 60000);

    return true;
  }

  /**
   * Update cash point status
   */
  updateStatus(id: string, status: CashPoint['status']): void {
    const point = this.cashPoints.get(id);
    if (point) {
      point.status = status;
      point.lastSeen = new Date();
    }
  }

  /**
   * Update liquidity
   */
  updateLiquidity(id: string, currency: Currency, amount: number): void {
    const point = this.cashPoints.get(id);
    if (point) {
      point.liquidity[currency] = amount;
      point.lastSeen = new Date();
    }
  }

  /**
   * Health check
   */
  async health(): Promise<{ available: boolean; latency: number }> {
    return { available: true, latency: 0 };
  }

  private haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * Math.PI / 180;
  }

  private indexByLocation(point: CashPoint): void {
    // Simple geohash (first 4 chars = ~20km precision)
    const geohash = this.encodeGeohash(point.location.lat, point.location.lng, 4);
    if (!this.geoIndex.has(geohash)) {
      this.geoIndex.set(geohash, new Set());
    }
    this.geoIndex.get(geohash)!.add(point.id);
  }

  private encodeGeohash(lat: number, lng: number, precision: number): string {
    const base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
    let idx = 0;
    let bit = 0;
    let evenBit = true;
    let geohash = '';

    let latRange = [-90.0, 90.0];
    let lngRange = [-180.0, 180.0];

    while (geohash.length < precision) {
      if (evenBit) {
        const mid = (lngRange[0] + lngRange[1]) / 2;
        if (lng >= mid) {
          idx = idx * 2 + 1;
          lngRange[0] = mid;
        } else {
          idx = idx * 2;
          lngRange[1] = mid;
        }
      } else {
        const mid = (latRange[0] + latRange[1]) / 2;
        if (lat >= mid) {
          idx = idx * 2 + 1;
          latRange[0] = mid;
        } else {
          idx = idx * 2;
          latRange[1] = mid;
        }
      }

      evenBit = !evenBit;
      bit++;

      if (bit === 5) {
        geohash += base32[idx];
        bit = 0;
        idx = 0;
      }
    }

    return geohash;
  }

  private seedSampleData(): void {
    const samples: CashPoint[] = [
      {
        id: 'cp_nairobi_1',
        name: 'QuickCash Kiosk',
        type: 'kiosk',
        operatorName: 'John Kamau',
        phone: '+254712345678',
        currencies: [Currency.KES, Currency.USD],
        liquidity: { [Currency.KES]: 50000, [Currency.USD]: 500 },
        status: 'online',
        location: { lat: -1.2921, lng: 36.8219, address: 'Moi Avenue', city: 'Nairobi', country: 'Kenya' },
        operatingHours: { open: '08:00', close: '20:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
        rating: 4.5,
        reviewCount: 23,
        fees: { withdrawal: 50, deposit: 0 },
        minAmount: 100,
        maxAmount: 50000,
        lastSeen: new Date(),
        verified: true,
      },
      {
        id: 'cp_nairobi_2',
        name: 'Safari Supermarket',
        type: 'supermarket',
        operatorName: 'Safari Group',
        phone: '+254723456789',
        currencies: [Currency.KES, Currency.UGX, Currency.TZS],
        liquidity: { [Currency.KES]: 200000, [Currency.UGX]: 5000000, [Currency.TZS]: 3000000 },
        status: 'online',
        location: { lat: -1.2845, lng: 36.8234, address: 'Kenyatta Avenue', city: 'Nairobi', country: 'Kenya' },
        operatingHours: { open: '07:00', close: '22:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
        rating: 4.2,
        reviewCount: 156,
        fees: { withdrawal: 30, deposit: 0 },
        minAmount: 50,
        maxAmount: 100000,
        lastSeen: new Date(),
        verified: true,
      },
      {
        id: 'cp_kampala_1',
        name: 'City Agent Mobile',
        type: 'mobile_agent',
        operatorName: 'Sarah Okello',
        phone: '+256712345678',
        currencies: [Currency.UGX, Currency.KES, Currency.USD],
        liquidity: { [Currency.UGX]: 1000000, [Currency.KES]: 20000, [Currency.USD]: 300 },
        status: 'online',
        location: { lat: 0.3136, lng: 32.5811, address: 'Kampala Road', city: 'Kampala', country: 'Uganda' },
        operatingHours: { open: '09:00', close: '18:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
        rating: 4.7,
        reviewCount: 45,
        fees: { withdrawal: 1000, deposit: 0 },
        minAmount: 5000,
        maxAmount: 200000,
        lastSeen: new Date(),
        verified: true,
      },
      {
        id: 'cp_lagos_1',
        name: 'Market Square Kiosk',
        type: 'kiosk',
        operatorName: 'Chinedu Okafor',
        phone: '+2348123456789',
        currencies: [Currency.NGN, Currency.USD, Currency.GHS],
        liquidity: { [Currency.NGN]: 100000, [Currency.USD]: 1000, [Currency.GHS]: 5000 },
        status: 'online',
        location: { lat: 6.5244, lng: 3.3792, address: 'Oba Akran Avenue', city: 'Lagos', country: 'Nigeria' },
        operatingHours: { open: '08:00', close: '19:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
        rating: 4.0,
        reviewCount: 67,
        fees: { withdrawal: 100, deposit: 0 },
        minAmount: 500,
        maxAmount: 50000,
        lastSeen: new Date(),
        verified: true,
      },
    ];

    for (const point of samples) {
      this.register(point);
    }
  }
}
