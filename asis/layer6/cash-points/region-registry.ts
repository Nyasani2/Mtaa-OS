/**
 * ASIS Layer 6 — Region Registry
 * Country profiles, regional groups, language hints, currency metadata, timezone
 */

import { RegionGroup, GeoBounds, CountryProfile } from './types';
import { CrossBorderRouter } from './cross-border-router';

export class RegionRegistry {
  private regions: Map<string, RegionGroup> = new Map();
  private router: CrossBorderRouter;

  constructor(router: CrossBorderRouter) {
    this.router = router;
    this.seedRegions();
  }

  /**
   * Register a region
   */
  registerRegion(region: RegionGroup): void {
    this.regions.set(region.id, region);
  }

  /**
   * Get region by ID
   */
  getRegion(id: string): RegionGroup | undefined {
    return this.regions.get(id);
  }

  /**
   * Get regions by country
   */
  getRegionsByCountry(country: string): RegionGroup[] {
    return Array.from(this.regions.values()).filter(r => r.country === country);
  }

  /**
   * Get country profile
   */
  getCountryProfile(countryCode: string): CountryProfile | undefined {
    return this.router.getCountry(countryCode);
  }

  /**
   * Get all countries
   */
  getAllCountries(): CountryProfile[] {
    return this.router.getAllCountries();
  }

  /**
   * Get currency metadata for a country
   */
  getCurrencyMetadata(countryCode: string): {
    primary: string;
    supported: string[];
    fxCompatible: string[];
  } | null {
    const profile = this.router.getCountry(countryCode);
    if (!profile) return null;

    return {
      primary: profile.primaryCurrency,
      supported: profile.currencies,
      fxCompatible: profile.fxRouteCompatibility,
    };
  }

  /**
   * Get language hints for a region
   */
  getLanguages(countryCode: string): string[] {
    const profile = this.router.getCountry(countryCode);
    return profile?.languages || ['en'];
  }

  /**
   * Get timezone for country
   */
  getTimezone(countryCode: string): string {
    const profile = this.router.getCountry(countryCode);
    return profile?.timezone || 'UTC';
  }

  /**
   * Check if coordinates are within a region
   */
  isInRegion(lat: number, lng: number, regionId: string): boolean {
    const region = this.regions.get(regionId);
    if (!region) return false;

    const bounds = region.coverageArea;
    return lat >= bounds.south && lat <= bounds.north && lng >= bounds.west && lng <= bounds.east;
  }

  /**
   * Find region containing coordinates
   */
  findRegionForLocation(lat: number, lng: number): RegionGroup | null {
    for (const region of this.regions.values()) {
      if (this.isInRegion(lat, lng, region.id)) {
        return region;
      }
    }
    return null;
  }

  /**
   * Get regional stats
   */
  getRegionStats(regionId: string): {
    cashPointCount: number;
    languages: string[];
    currencies: string[];
    coverageArea: number; // approximate km²
  } | null {
    const region = this.regions.get(regionId);
    if (!region) return null;

    const bounds = region.coverageArea;
    const area = this.approximateArea(bounds);

    return {
      cashPointCount: region.agentCount,
      languages: [region.language],
      currencies: [region.currency],
      coverageArea: area,
    };
  }

  private seedRegions(): void {
    const regions: RegionGroup[] = [
      {
        id: 'region_nairobi_cbd',
        name: 'Nairobi CBD',
        country: 'Kenya',
        cashPointIds: ['cp_ke_nairobi_001'],
        language: 'en',
        currency: 'KES',
        timezone: 'Africa/Nairobi',
        agentCount: 1,
        totalLiquidity: { KES: 75000, USD: 800 },
        coverageArea: {
          north: -1.28,
          south: -1.30,
          east: 36.83,
          west: 36.81,
        },
      },
      {
        id: 'region_kampala_central',
        name: 'Kampala Central',
        country: 'Uganda',
        cashPointIds: ['cp_ug_kampala_001'],
        language: 'en',
        currency: 'UGX',
        timezone: 'Africa/Kampala',
        agentCount: 1,
        totalLiquidity: { UGX: 2500000, KES: 15000, USD: 500 },
        coverageArea: {
          north: 0.32,
          south: 0.31,
          east: 32.59,
          west: 32.57,
        },
      },
      {
        id: 'region_lagos_ikeja',
        name: 'Lagos Ikeja',
        country: 'Nigeria',
        cashPointIds: ['cp_ng_lagos_001'],
        language: 'en',
        currency: 'NGN',
        timezone: 'Africa/Lagos',
        agentCount: 1,
        totalLiquidity: { NGN: 500000, USD: 2000, GHS: 10000 },
        coverageArea: {
          north: 6.53,
          south: 6.52,
          east: 3.38,
          west: 3.37,
        },
      },
      {
        id: 'region_dar_kariakoo',
        name: 'Dar es Salaam Kariakoo',
        country: 'Tanzania',
        cashPointIds: ['cp_tz_dar_001'],
        language: 'sw',
        currency: 'TZS',
        timezone: 'Africa/Dar_es_Salaam',
        agentCount: 1,
        totalLiquidity: { TZS: 3000000, KES: 10000, UGX: 2000000 },
        coverageArea: {
          north: -6.81,
          south: -6.82,
          east: 39.27,
          west: 39.26,
        },
      },
    ];

    for (const region of regions) {
      this.registerRegion(region);
    }
  }

  private approximateArea(bounds: GeoBounds): number {
    // Rough approximation: 1 degree lat ≈ 111 km, 1 degree lng varies
    const latKm = (bounds.north - bounds.south) * 111;
    const avgLat = (bounds.north + bounds.south) / 2;
    const lngKm = (bounds.east - bounds.west) * 111 * Math.cos(this.toRad(avgLat));
    return latKm * lngKm;
  }

  private toRad(deg: number): number {
    return deg * Math.PI / 180;
  }
}
