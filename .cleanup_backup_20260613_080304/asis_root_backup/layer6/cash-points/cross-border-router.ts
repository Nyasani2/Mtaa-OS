/**
 * ASIS Layer 6 — Cross-Border Router
 * Country profiles, corridor management, FX route compatibility
 * Kenya, Uganda, Tanzania, Nigeria, South Sudan + future countries
 * NO hardcoded assumptions — fully configurable
 */

import { CountryProfile, CrossBorderRoute, SettlementMode } from './types';
import { ICrossBorderProvider } from './interfaces';

export class CrossBorderRouter implements ICrossBorderProvider {
  name = 'mtaa_cross_border_router';
  private countries: Map<string, CountryProfile> = new Map();
  private corridors: Map<string, CrossBorderRoute> = new Map();

  constructor() {
    this.seedCountryProfiles();
    this.seedCorridors();
  }

  /**
   * Register a country profile
   */
  registerCountry(profile: CountryProfile): void {
    this.countries.set(profile.code, profile);
  }

  /**
   * Get country profile
   */
  getCountry(code: string): CountryProfile | undefined {
    return this.countries.get(code);
  }

  /**
   * Get all country profiles
   */
  getAllCountries(): CountryProfile[] {
    return Array.from(this.countries.values());
  }

  /**
   * Get available corridors from a country
   */
  async getCorridors(fromCountry: string): Promise<CrossBorderRoute[]> {
    return Array.from(this.corridors.values()).filter(
      c => c.fromCountry === fromCountry && c.active
    );
  }

  /**
   * Get specific corridor
   */
  async getCorridor(fromCountry: string, toCountry: string): Promise<CrossBorderRoute | null> {
    const key = `${fromCountry}_${toCountry}`;
    return this.corridors.get(key) || null;
  }

  /**
   * Estimate cross-border transfer
   */
  async estimate(
    fromCountry: string,
    toCountry: string,
    amount: number,
    currency: string
  ): Promise<{ duration: number; fee: number; fxRate: number; totalReceived: number }> {
    const corridor = await this.getCorridor(fromCountry, toCountry);
    if (!corridor || !corridor.active) {
      throw new CrossBorderError(`No active corridor from ${fromCountry} to ${toCountry}`);
    }

    const fee = corridor.feeStructure.base || 0 + 
      (amount * (corridor.feeStructure.percentage || 0));
    const converted = amount * corridor.fxSpread; // Simplified
    const totalReceived = converted - fee;

    return {
      duration: corridor.estimatedDuration,
      fee,
      fxRate: corridor.fxSpread,
      totalReceived: Math.max(0, totalReceived),
    };
  }

  /**
   * Check if route is viable
   */
  isRouteViable(fromCountry: string, toCountry: string): boolean {
    const corridor = this.corridors.get(`${fromCountry}_${toCountry}`);
    return corridor?.active || false;
  }

  /**
   * Get FX-compatible countries for a currency
   */
  getFXCompatibleCountries(currency: string): string[] {
    const compatible: string[] = [];
    for (const country of this.countries.values()) {
      if (country.fxRouteCompatibility.includes(currency)) {
        compatible.push(country.code);
      }
    }
    return compatible;
  }

  /**
   * Explain cross-border route to user
   */
  explainRoute(fromCountry: string, toCountry: string, amount: number, currency: string): string {
    const corridor = this.corridors.get(`${fromCountry}_${toCountry}`);
    if (!corridor) {
      return `Cross-border transfers from ${fromCountry} to ${toCountry} are not yet available.`;
    }

    const fromProfile = this.countries.get(fromCountry);
    const toProfile = this.countries.get(toCountry);

    const parts: string[] = [];
    parts.push(`Sending from ${fromProfile?.name || fromCountry} to ${toProfile?.name || toCountry}.`);
    parts.push(`Estimated time: ${corridor.estimatedDuration} minutes.`);
    parts.push(`FX spread: ${(corridor.fxSpread * 100).toFixed(2)}%.`);

    if (corridor.settlementMode === SettlementMode.DELAYED) {
      parts.push('This route uses delayed settlement for regulatory compliance.');
    }

    if (corridor.regulatoryRequirements.length > 0) {
      parts.push(`Required: ${corridor.regulatoryRequirements.join(', ')}.`);
    }

    return parts.join(' ');
  }

  async health(): Promise<{ available: boolean; latency: number }> {
    return { available: true, latency: 0 };
  }

  private seedCountryProfiles(): void {
    const profiles: CountryProfile[] = [
      {
        code: 'KE',
        name: 'Kenya',
        currencies: ['KES', 'USD'],
        primaryCurrency: 'KES',
        settlementModes: [SettlementMode.INSTANT, SettlementMode.DELAYED],
        cashOutMethods: ['mobile_money', 'bank_transfer', 'cash_point', 'agent'],
        regulatoryMetadata: {
          regulator: 'CBK',
          licenseRequired: 'yes',
          maxTransaction: '1000000',
          kycThreshold: '100000',
        },
        fxRouteCompatibility: ['KES', 'UGX', 'TZS', 'USD', 'EUR'],
        languages: ['en', 'sw'],
        timezone: 'Africa/Nairobi',
        mobileMoneyProviders: ['M-Pesa', 'Airtel Money'],
        bankNetworkStatus: 'active',
        agentDensity: 'high',
        averageInternetUptime: 85,
      },
      {
        code: 'UG',
        name: 'Uganda',
        currencies: ['UGX', 'USD'],
        primaryCurrency: 'UGX',
        settlementModes: [SettlementMode.INSTANT, SettlementMode.DELAYED, SettlementMode.BATCHED],
        cashOutMethods: ['mobile_money', 'bank_transfer', 'cash_point'],
        regulatoryMetadata: {
          regulator: 'BOU',
          licenseRequired: 'yes',
          maxTransaction: '5000000',
          kycThreshold: '500000',
        },
        fxRouteCompatibility: ['UGX', 'KES', 'TZS', 'USD', 'EUR'],
        languages: ['en', 'lg'],
        timezone: 'Africa/Kampala',
        mobileMoneyProviders: ['MTN Mobile Money', 'Airtel Money'],
        bankNetworkStatus: 'active',
        agentDensity: 'medium',
        averageInternetUptime: 78,
      },
      {
        code: 'TZ',
        name: 'Tanzania',
        currencies: ['TZS', 'USD'],
        primaryCurrency: 'TZS',
        settlementModes: [SettlementMode.INSTANT, SettlementMode.DELAYED],
        cashOutMethods: ['mobile_money', 'bank_transfer', 'cash_point', 'agent'],
        regulatoryMetadata: {
          regulator: 'BOT',
          licenseRequired: 'yes',
          maxTransaction: '3000000',
          kycThreshold: '300000',
        },
        fxRouteCompatibility: ['TZS', 'KES', 'UGX', 'USD'],
        languages: ['en', 'sw'],
        timezone: 'Africa/Dar_es_Salaam',
        mobileMoneyProviders: ['M-Pesa', 'Tigo Pesa', 'Airtel Money'],
        bankNetworkStatus: 'active',
        agentDensity: 'medium',
        averageInternetUptime: 72,
      },
      {
        code: 'NG',
        name: 'Nigeria',
        currencies: ['NGN', 'USD', 'GHS'],
        primaryCurrency: 'NGN',
        settlementModes: [SettlementMode.INSTANT, SettlementMode.DELAYED, SettlementMode.BATCHED],
        cashOutMethods: ['mobile_money', 'bank_transfer', 'cash_point', 'agent'],
        regulatoryMetadata: {
          regulator: 'CBN',
          licenseRequired: 'yes',
          maxTransaction: '10000000',
          kycThreshold: '1000000',
        },
        fxRouteCompatibility: ['NGN', 'GHS', 'USD', 'EUR', 'GBP'],
        languages: ['en', 'yo', 'ha', 'ig'],
        timezone: 'Africa/Lagos',
        mobileMoneyProviders: ['MTN MoMo', 'Airtel Money', '9mobile'],
        bankNetworkStatus: 'active',
        agentDensity: 'high',
        averageInternetUptime: 70,
      },
      {
        code: 'SS',
        name: 'South Sudan',
        currencies: ['SSP', 'USD'],
        primaryCurrency: 'SSP',
        settlementModes: [SettlementMode.DELAYED, SettlementMode.MANUAL],
        cashOutMethods: ['cash_point', 'agent'],
        regulatoryMetadata: {
          regulator: 'BOSS',
          licenseRequired: 'yes',
          maxTransaction: '500000',
          kycThreshold: '100000',
        },
        fxRouteCompatibility: ['SSP', 'USD'],
        languages: ['en'],
        timezone: 'Africa/Juba',
        mobileMoneyProviders: ['MTN Mobile Money'],
        bankNetworkStatus: 'limited',
        agentDensity: 'low',
        averageInternetUptime: 45,
      },
      {
        code: 'GH',
        name: 'Ghana',
        currencies: ['GHS', 'USD'],
        primaryCurrency: 'GHS',
        settlementModes: [SettlementMode.INSTANT, SettlementMode.DELAYED],
        cashOutMethods: ['mobile_money', 'bank_transfer', 'cash_point'],
        regulatoryMetadata: {
          regulator: 'BOG',
          licenseRequired: 'yes',
          maxTransaction: '5000000',
          kycThreshold: '500000',
        },
        fxRouteCompatibility: ['GHS', 'NGN', 'USD', 'EUR'],
        languages: ['en'],
        timezone: 'Africa/Accra',
        mobileMoneyProviders: ['MTN MoMo', 'Vodafone Cash', 'AirtelTigo Money'],
        bankNetworkStatus: 'active',
        agentDensity: 'high',
        averageInternetUptime: 82,
      },
    ];

    for (const profile of profiles) {
      this.registerCountry(profile);
    }
  }

  private seedCorridors(): void {
    const corridors: CrossBorderRoute[] = [
      {
        id: 'corridor_ke_ug',
        fromCountry: 'KE',
        toCountry: 'UG',
        fromCurrency: 'KES',
        toCurrency: 'UGX',
        supportedMethods: ['mobile_money', 'bank_transfer'],
        estimatedDuration: 30,
        fxSpread: 0.025,
        feeStructure: { base: 100, percentage: 0.01 },
        settlementMode: SettlementMode.INSTANT,
        regulatoryRequirements: ['valid_id'],
        active: true,
        lastVerified: new Date(),
      },
      {
        id: 'corridor_ke_tz',
        fromCountry: 'KE',
        toCountry: 'TZ',
        fromCurrency: 'KES',
        toCurrency: 'TZS',
        supportedMethods: ['mobile_money', 'bank_transfer'],
        estimatedDuration: 45,
        fxSpread: 0.03,
        feeStructure: { base: 150, percentage: 0.015 },
        settlementMode: SettlementMode.DELAYED,
        regulatoryRequirements: ['valid_id', 'source_of_funds'],
        active: true,
        lastVerified: new Date(),
      },
      {
        id: 'corridor_ug_tz',
        fromCountry: 'UG',
        toCountry: 'TZ',
        fromCurrency: 'UGX',
        toCurrency: 'TZS',
        supportedMethods: ['mobile_money'],
        estimatedDuration: 60,
        fxSpread: 0.035,
        feeStructure: { base: 2000, percentage: 0.02 },
        settlementMode: SettlementMode.DELAYED,
        regulatoryRequirements: ['valid_id'],
        active: true,
        lastVerified: new Date(),
      },
      {
        id: 'corridor_ng_gh',
        fromCountry: 'NG',
        toCountry: 'GH',
        fromCurrency: 'NGN',
        toCurrency: 'GHS',
        supportedMethods: ['bank_transfer', 'mobile_money'],
        estimatedDuration: 120,
        fxSpread: 0.04,
        feeStructure: { base: 500, percentage: 0.02 },
        settlementMode: SettlementMode.BATCHED,
        regulatoryRequirements: ['valid_id', 'source_of_funds', 'purpose'],
        active: true,
        lastVerified: new Date(),
      },
    ];

    for (const corridor of corridors) {
      this.corridors.set(`${corridor.fromCountry}_${corridor.toCountry}`, corridor);
    }
  }
}

export class CrossBorderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CrossBorderError';
  }
}
