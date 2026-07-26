export type CountryCode = 'KE' | 'UG' | 'TZ' | 'RW' | 'ET' | 'NG' | 'ZA';

export interface CountryConfig {
  code: CountryCode;
  name: string;
  currency: string;
  taxAuthority: string;
  flag: string;
}

export const COUNTRIES: CountryConfig[] = [
  { code: 'KE', name: 'Kenya', currency: 'KES', taxAuthority: 'KRA', flag: '🇰🇪' },
  { code: 'UG', name: 'Uganda', currency: 'UGX', taxAuthority: 'URA', flag: '🇺🇬' },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS', taxAuthority: 'TRA', flag: '🇹🇿' },
  { code: 'RW', name: 'Rwanda', currency: 'RWF', taxAuthority: 'RRA', flag: '🇷🇼' },
  { code: 'ET', name: 'Ethiopia', currency: 'ETB', taxAuthority: 'ERCA', flag: '🇪🇹' },
  { code: 'NG', name: 'Nigeria', currency: 'NGN', taxAuthority: 'FIRS', flag: '🇳🇬' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', taxAuthority: 'SARS', flag: '🇿🇦' },
];

export interface TaxRevenue {
  id: string;
  country_code: CountryCode;
  tax_type: 'income' | 'vat' | 'corporate' | 'customs' | 'property';
  amount: number;
  target: number;
  period: string;
  collected_at: string;
}

export interface BusinessRegistration {
  id: string;
  country_code: CountryCode;
  business_name: string;
  registration_number: string;
  tax_pin: string;
  status: 'active' | 'suspended' | 'dormant';
  sector: string;
  annual_turnover: number;
  registered_at: string;
}

export interface TaxPayment {
  id: string;
  country_code: CountryCode;
  business_id: string;
  tax_type: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  due_date: string;
  paid_at?: string;
}

export interface ComplianceReport {
  id: string;
  country_code: CountryCode;
  total_businesses: number;
  compliant_businesses: number;
  tax_collection_rate: number;
  period: string;
}
