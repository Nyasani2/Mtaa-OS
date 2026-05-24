/**
 * ASIS Layer 6 — Geo Discovery Engine
 * Nearby search, geohash indexing, low-memory caching, offline-aware
 * Optimized for low-end Android + intermittent networks
 */

import { CashPoint, GeoLocation, GeoFilters } from './types';
import { CashPointEngine } from './cash-point-engine';

export interface DiscoveryResult {
  cashPoint: CashPoint;
  distanceKm: number;
  estimatedWalkMinutes: number;
  estimatedDriveMinutes: number;
  isOpenNow: boolean;
  closesInMinutes?: number;
}

export class GeoDiscovery {
  private engine: CashPointEngine;
  private cache: Map<string, { results: DiscoveryResult[]; cachedAt: Date }> = new Map();
  private cacheTTL: number = 300000; // 5 minutes
  private maxCacheSize: number = 50; // Keep small for low memory

  constructor(engine: CashPointEngine) {
    this.engine = engine;
  }

  /**
   * Find nearby cash points with rich discovery data
   */
  async discover(
    lat: number,
    lng: number,
    options: {
      radiusKm?: number;
      limit?: number;
      filters?: GeoFilters;
      routePriority?: string;
    } = {}
  ): Promise<DiscoveryResult[]> {
    const { radiusKm = 5, limit = 20, filters } = options;
    const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}_${radiusKm}_${JSON.stringify(filters)}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt.getTime() < this.cacheTTL) {
      return cached.results.slice(0, limit);
    }

    // Find nearby
    const nearby = await this.engine.findNearby(lat, lng, radiusKm, filters);

    // Enrich with discovery data
    const results: DiscoveryResult[] = nearby.map(point => {
      const distanceKm = this.haversine(lat, lng, point.location.lat, point.location.lng);
      return {
        cashPoint: point,
        distanceKm,
        estimatedWalkMinutes: Math.round(distanceKm * 12), // ~5 km/h walking
        estimatedDriveMinutes: Math.round(distanceKm * 2 + 5), // ~30 km/h + traffic
        isOpenNow: this.isOpenNow(point.operatingHours),
        closesInMinutes: this.getClosesInMinutes(point.operatingHours),
      };
    });

    // Sort by distance
    results.sort((a, b) => a.distanceKm - b.distanceKm);

    // Cache results
    this.setCache(cacheKey, results);

    return results.slice(0, limit);
  }

  /**
   * Quick nearby check — returns closest cash point
   */
  async getClosest(lat: number, lng: number, currency?: string): Promise<DiscoveryResult | null> {
    const results = await this.discover(lat, lng, {
      radiusKm: 10,
      limit: 1,
      filters: currency ? { currencies: [currency] } : undefined,
    });

    return results[0] || null;
  }

  /**
   * Get cash points along a route (for multi-stop planning)
   */
  async getAlongRoute(
    waypoints: Array<{ lat: number; lng: number }>,
    maxDeviationKm: number = 2,
    currency?: string
  ): Promise<DiscoveryResult[]> {
    const allResults: DiscoveryResult[] = [];
    const seen = new Set<string>();

    for (const wp of waypoints) {
      const nearby = await this.discover(wp.lat, wp.lng, {
        radiusKm: maxDeviationKm,
        filters: currency ? { currencies: [currency] } : undefined,
      });

      for (const result of nearby) {
        if (!seen.has(result.cashPoint.id)) {
          seen.add(result.cashPoint.id);
          allResults.push(result);
        }
      }
    }

    return allResults.sort((a, b) => a.distanceKm - b.distanceKm);
  }

  /**
   * Get coverage stats for a region
   */
  async getCoverageStats(lat: number, lng: number, radiusKm: number = 10): Promise<{
    totalCashPoints: number;
    onlineCount: number;
    avgDistance: number;
    coverageQuality: 'excellent' | 'good' | 'fair' | 'poor';
    currencies: string[];
  }> {
    const results = await this.discover(lat, lng, { radiusKm, limit: 100 });

    const online = results.filter(r => r.cashPoint.status === 'online');
    const avgDistance = results.length > 0
      ? results.reduce((sum, r) => sum + r.distanceKm, 0) / results.length
      : 0;

    const currencies = new Set<string>();
    for (const r of results) {
      for (const c of r.cashPoint.currencies) currencies.add(c);
    }

    let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
    if (online.length >= 10 && avgDistance < 1) quality = 'excellent';
    else if (online.length >= 5 && avgDistance < 2) quality = 'good';
    else if (online.length >= 2 && avgDistance < 5) quality = 'fair';

    return {
      totalCashPoints: results.length,
      onlineCount: online.length,
      avgDistance,
      coverageQuality: quality,
      currencies: Array.from(currencies),
    };
  }

  private setCache(key: string, results: DiscoveryResult[]): void {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, { results, cachedAt: new Date() });
  }

  private isOpenNow(hours: CashPoint['operatingHours']): boolean {
    const now = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const day = dayNames[now.getDay()];
    const schedule = hours.schedule.find(s => s.day === day);

    if (!schedule || schedule.closed) return false;

    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [openH, openM] = schedule.open.split(':').map(Number);
    const [closeH, closeM] = schedule.close.split(':').map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    return currentTime >= openMinutes && currentTime <= closeMinutes;
  }

  private getClosesInMinutes(hours: CashPoint['operatingHours']): number | undefined {
    if (!this.isOpenNow(hours)) return undefined;

    const now = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const day = dayNames[now.getDay()];
    const schedule = hours.schedule.find(s => s.day === day);

    if (!schedule || schedule.closed) return undefined;

    const [closeH, closeM] = schedule.close.split(':').map(Number);
    const closeMinutes = closeH * 60 + closeM;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return closeMinutes - currentMinutes;
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
}
