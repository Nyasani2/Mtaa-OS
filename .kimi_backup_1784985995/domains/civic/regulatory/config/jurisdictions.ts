/**
 * Multi-jurisdiction tax configuration.
 * Every country/region MTAA operates in must be registered here.
 * Tax rates, currencies, and authority integrations are defined per jurisdiction.
 */

export interface JurisdictionConfig {
  code: string;           // ISO 3166-1 alpha-2
  name: string;           // Full country name
  flag: string;           // Emoji flag
  currency: string;       // ISO 4217 currency code
  taxRate: number;        // Default withholding tax rate (0-1)
  authorityName: string;  // Tax authority name (KRA, URA, TRA, etc.)
  authorityWalletId: string; // Supabase wallet_accounts.id for authority
  authorityCode: string;  // Authority short code
  vatRate: number;        // VAT/GST rate if applicable
  incomeTaxBrackets: Array<{ min: number; max: number; rate: number }>;
  filingFrequency: 'monthly' | 'quarterly' | 'annual';
  registrationRequired: boolean;
  supportedTransactionTypes: string[];
}

export const JURISDICTIONS: Record<string, JurisdictionConfig> = {
  KE: {
    code: 'KE',
    name: 'Kenya',
    flag: '🇰🇪',
    currency: 'KES',
    taxRate: 0.05,        // 5% withholding on platform earnings
    authorityName: 'Kenya Revenue Authority',
    authorityWalletId: 'wallet_kra_001',
    authorityCode: 'KRA',
    vatRate: 0.16,
    incomeTaxBrackets: [
      { min: 0, max: 288000, rate: 0.10 },
      { min: 288001, max: 388000, rate: 0.25 },
      { min: 388001, max: 6000000, rate: 0.30 },
      { min: 6000001, max: 9600000, rate: 0.325 },
      { min: 9600001, max: Infinity, rate: 0.35 },
    ],
    filingFrequency: 'monthly',
    registrationRequired: true,
    supportedTransactionTypes: ['mtaxi_ride', 'mtruck_delivery', 'boda_ride', 'shop_sale', 'restaurant_order', 'creator_earning'],
  },
  UG: {
    code: 'UG',
    name: 'Uganda',
    flag: '🇺🇬',
    currency: 'UGX',
    taxRate: 0.06,
    authorityName: 'Uganda Revenue Authority',
    authorityWalletId: 'wallet_ura_001',
    authorityCode: 'URA',
    vatRate: 0.18,
    incomeTaxBrackets: [
      { min: 0, max: 2820000, rate: 0.0 },
      { min: 2820001, max: 4020000, rate: 0.10 },
      { min: 4020001, max: 4920000, rate: 0.20 },
      { min: 4920001, max: 10200000, rate: 0.30 },
      { min: 10200001, max: Infinity, rate: 0.40 },
    ],
    filingFrequency: 'monthly',
    registrationRequired: true,
    supportedTransactionTypes: ['mtaxi_ride', 'mtruck_delivery', 'boda_ride', 'shop_sale', 'restaurant_order'],
  },
  TZ: {
    code: 'TZ',
    name: 'Tanzania',
    flag: '🇹🇿',
    currency: 'TZS',
    taxRate: 0.05,
    authorityName: 'Tanzania Revenue Authority',
    authorityWalletId: 'wallet_tra_001',
    authorityCode: 'TRA',
    vatRate: 0.18,
    incomeTaxBrackets: [
      { min: 0, max: 270000, rate: 0.0 },
      { min: 270001, max: 520000, rate: 0.08 },
      { min: 520001, max: 760000, rate: 0.20 },
      { min: 760001, max: 1000000, rate: 0.25 },
      { min: 1000001, max: Infinity, rate: 0.30 },
    ],
    filingFrequency: 'monthly',
    registrationRequired: true,
    supportedTransactionTypes: ['mtaxi_ride', 'mtruck_delivery', 'boda_ride', 'shop_sale'],
  },
  RW: {
    code: 'RW',
    name: 'Rwanda',
    flag: '🇷🇼',
    currency: 'RWF',
    taxRate: 0.05,
    authorityName: 'Rwanda Revenue Authority',
    authorityWalletId: 'wallet_rra_001',
    authorityCode: 'RRA',
    vatRate: 0.18,
    incomeTaxBrackets: [
      { min: 0, max: 60000, rate: 0.0 },
      { min: 60001, max: 100000, rate: 0.20 },
      { min: 100001, max: 200000, rate: 0.30 },
      { min: 200001, max: Infinity, rate: 0.40 },
    ],
    filingFrequency: 'monthly',
    registrationRequired: true,
    supportedTransactionTypes: ['mtaxi_ride', 'mtruck_delivery', 'shop_sale'],
  },
  NG: {
    code: 'NG',
    name: 'Nigeria',
    flag: '🇳🇬',
    currency: 'NGN',
    taxRate: 0.05,
    authorityName: 'Federal Inland Revenue Service',
    authorityWalletId: 'wallet_firs_001',
    authorityCode: 'FIRS',
    vatRate: 0.075,
    incomeTaxBrackets: [
      { min: 0, max: 300000, rate: 0.07 },
      { min: 300001, max: 600000, rate: 0.11 },
      { min: 600001, max: 1100000, rate: 0.15 },
      { min: 1100001, max: 1600000, rate: 0.19 },
      { min: 1600001, max: 3200000, rate: 0.21 },
      { min: 3200001, max: Infinity, rate: 0.24 },
    ],
    filingFrequency: 'monthly',
    registrationRequired: true,
    supportedTransactionTypes: ['mtaxi_ride', 'mtruck_delivery', 'boda_ride', 'shop_sale', 'restaurant_order', 'creator_earning'],
  },
  GH: {
    code: 'GH',
    name: 'Ghana',
    flag: '🇬🇭',
    currency: 'GHS',
    taxRate: 0.05,
    authorityName: 'Ghana Revenue Authority',
    authorityWalletId: 'wallet_gra_001',
    authorityCode: 'GRA',
    vatRate: 0.15,
    incomeTaxBrackets: [
      { min: 0, max: 490, rate: 0.0 },
      { min: 491, max: 600, rate: 0.05 },
      { min: 601, max: 730, rate: 0.10 },
      { min: 731, max: 3896, rate: 0.175 },
      { min: 3897, max: 19896, rate: 0.25 },
      { min: 19897, max: 50416, rate: 0.30 },
      { min: 50417, max: Infinity, rate: 0.35 },
    ],
    filingFrequency: 'monthly',
    registrationRequired: true,
    supportedTransactionTypes: ['mtaxi_ride', 'mtruck_delivery', 'shop_sale', 'restaurant_order'],
  },
  ZA: {
    code: 'ZA',
    name: 'South Africa',
    flag: '🇿🇦',
    currency: 'ZAR',
    taxRate: 0.075,
    authorityName: 'South African Revenue Service',
    authorityWalletId: 'wallet_sars_001',
    authorityCode: 'SARS',
    vatRate: 0.15,
    incomeTaxBrackets: [
      { min: 0, max: 237100, rate: 0.18 },
      { min: 237101, max: 370500, rate: 0.26 },
      { min: 370501, max: 512800, rate: 0.31 },
      { min: 512801, max: 673000, rate: 0.36 },
      { min: 673001, max: 857900, rate: 0.39 },
      { min: 857901, max: 1817000, rate: 0.41 },
      { min: 1817001, max: Infinity, rate: 0.45 },
    ],
    filingFrequency: 'monthly',
    registrationRequired: true,
    supportedTransactionTypes: ['mtaxi_ride', 'mtruck_delivery', 'shop_sale', 'restaurant_order', 'creator_earning'],
  },
  ET: {
    code: 'ET',
    name: 'Ethiopia',
    flag: '🇪🇹',
    currency: 'ETB',
    taxRate: 0.02,
    authorityName: 'Ethiopian Revenue and Customs Authority',
    authorityWalletId: 'wallet_erca_001',
    authorityCode: 'ERCA',
    vatRate: 0.15,
    incomeTaxBrackets: [
      { min: 0, max: 600, rate: 0.0 },
      { min: 601, max: 1650, rate: 0.10 },
      { min: 1651, max: 3200, rate: 0.15 },
      { min: 3201, max: 5250, rate: 0.20 },
      { min: 5251, max: 7800, rate: 0.25 },
      { min: 7801, max: 10900, rate: 0.30 },
      { min: 10901, max: Infinity, rate: 0.35 },
    ],
    filingFrequency: 'monthly',
    registrationRequired: true,
    supportedTransactionTypes: ['mtaxi_ride', 'boda_ride', 'shop_sale'],
  },
};

export function getJurisdiction(code: string): JurisdictionConfig | undefined {
  return JURISDICTIONS[code];
}

export function getAllJurisdictions(): JurisdictionConfig[] {
  return Object.values(JURISDICTIONS);
}

export function getSupportedCurrencies(): string[] {
  return [...new Set(Object.values(JURISDICTIONS).map((j) => j.currency))];
}

export function calculateIncomeTax(annualIncome: number, jurisdictionCode: string): number {
  const jurisdiction = JURISDICTIONS[jurisdictionCode];
  if (!jurisdiction) return 0;

  let tax = 0;
  for (const bracket of jurisdiction.incomeTaxBrackets) {
    if (annualIncome > bracket.min) {
      const taxableInBracket = Math.min(annualIncome, bracket.max) - bracket.min;
      tax += taxableInBracket * bracket.rate;
    }
  }
  return Math.round(tax * 100) / 100;
}
