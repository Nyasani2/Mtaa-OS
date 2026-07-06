/**
 * MTAA Transport Fare Estimation Engine
 * Real-world rates based on Bolt/Uber pricing per country
 * Supports: Kenya (KES), Nigeria (NGN), South Africa (ZAR), Ghana (GHS), Tanzania (TZS), Uganda (UGX), Rwanda (RWF)
 */

export interface CountryRates {
  currency: string;
  currencySymbol: string;
  locale: string;
  baseFare: number;
  perKm: number;
  perMinute: number;
  minimumFare: number;
  surgeMultiplier: number;
  bookingFee: number;
  serviceTypes: Record<string, ServiceTypeRate>;
}

export interface ServiceTypeRate {
  name: string;
  baseMultiplier: number;
  description: string;
  maxPassengers?: number;
  maxWeightKg?: number;
}

export interface FareEstimate {
  currency: string;
  currencySymbol: string;
  amount: number;
  formatted: string;
  distanceKm: number;
  durationMinutes: number;
  baseFare: number;
  distanceCharge: number;
  timeCharge: number;
  bookingFee: number;
  surgeMultiplier: number;
  serviceType: string;
  breakdown: FareBreakdown;
}

export interface FareBreakdown {
  base: number;
  distance: number;
  time: number;
  booking: number;
  surge: number;
  total: number;
}

export const COUNTRY_RATES: Record<string, CountryRates> = {
  kenya: {
    currency: 'KES',
    currencySymbol: 'KES',
    locale: 'en-KE',
    baseFare: 50,
    perKm: 35,
    perMinute: 3,
    minimumFare: 100,
    surgeMultiplier: 1.0,
    bookingFee: 20,
    serviceTypes: {
      boda: { name: 'Standard Boda', baseMultiplier: 0.6, description: '1 passenger · Helmet included', maxPassengers: 1 },
      boda_xl: { name: 'Boda XL', baseMultiplier: 0.8, description: '2 passengers · Extra storage', maxPassengers: 2 },
      boda_delivery: { name: 'Boda Delivery', baseMultiplier: 0.7, description: 'Packages up to 10kg', maxWeightKg: 10 },
      economy: { name: 'Economy', baseMultiplier: 1.0, description: 'Affordable rides', maxPassengers: 4 },
      comfort: { name: 'Comfort', baseMultiplier: 1.4, description: 'Newer cars, top drivers', maxPassengers: 4 },
      premium: { name: 'Premium', baseMultiplier: 2.0, description: 'Luxury vehicles', maxPassengers: 4 },
      xl: { name: 'XL', baseMultiplier: 1.6, description: 'Up to 6 passengers', maxPassengers: 6 },
      truck: { name: 'Truck', baseMultiplier: 2.5, description: 'Cargo transport', maxPassengers: 2 },
      local_haul: { name: 'Local Haul', baseMultiplier: 15.0, description: 'Within city · Same day', maxWeightKg: 3500 },
      long_haul: { name: 'Long Haul', baseMultiplier: 25.0, description: 'Inter-city · 1-3 days', maxWeightKg: 12000 },
      heavy_load: { name: 'Heavy Load', baseMultiplier: 40.0, description: 'Industrial · Specialized', maxWeightKg: 25000 },
    },
  },
  nigeria: {
    currency: 'NGN',
    currencySymbol: '₦',
    locale: 'en-NG',
    baseFare: 400,
    perKm: 120,
    perMinute: 10,
    minimumFare: 600,
    surgeMultiplier: 1.0,
    bookingFee: 100,
    serviceTypes: {
      boda: { name: 'Standard Boda', baseMultiplier: 0.6, description: '1 passenger · Helmet included', maxPassengers: 1 },
      boda_xl: { name: 'Boda XL', baseMultiplier: 0.8, description: '2 passengers · Extra storage', maxPassengers: 2 },
      boda_delivery: { name: 'Boda Delivery', baseMultiplier: 0.7, description: 'Packages up to 10kg', maxWeightKg: 10 },
      economy: { name: 'Economy', baseMultiplier: 1.0, description: 'Affordable rides', maxPassengers: 4 },
      comfort: { name: 'Comfort', baseMultiplier: 1.4, description: 'Newer cars, top drivers', maxPassengers: 4 },
      premium: { name: 'Premium', baseMultiplier: 2.0, description: 'Luxury vehicles', maxPassengers: 4 },
      xl: { name: 'XL', baseMultiplier: 1.6, description: 'Up to 6 passengers', maxPassengers: 6 },
      truck: { name: 'Truck', baseMultiplier: 2.5, description: 'Cargo transport', maxPassengers: 2 },
      local_haul: { name: 'Local Haul', baseMultiplier: 15.0, description: 'Within city · Same day', maxWeightKg: 3500 },
      long_haul: { name: 'Long Haul', baseMultiplier: 25.0, description: 'Inter-city · 1-3 days', maxWeightKg: 12000 },
      heavy_load: { name: 'Heavy Load', baseMultiplier: 40.0, description: 'Industrial · Specialized', maxWeightKg: 25000 },
    },
  },
  south_africa: {
    currency: 'ZAR',
    currencySymbol: 'R',
    locale: 'en-ZA',
    baseFare: 25,
    perKm: 10,
    perMinute: 1,
    minimumFare: 35,
    surgeMultiplier: 1.0,
    bookingFee: 5,
    serviceTypes: {
      boda: { name: 'Standard Boda', baseMultiplier: 0.6, description: '1 passenger · Helmet included', maxPassengers: 1 },
      boda_xl: { name: 'Boda XL', baseMultiplier: 0.8, description: '2 passengers · Extra storage', maxPassengers: 2 },
      boda_delivery: { name: 'Boda Delivery', baseMultiplier: 0.7, description: 'Packages up to 10kg', maxWeightKg: 10 },
      economy: { name: 'Economy', baseMultiplier: 1.0, description: 'Affordable rides', maxPassengers: 4 },
      comfort: { name: 'Comfort', baseMultiplier: 1.4, description: 'Newer cars, top drivers', maxPassengers: 4 },
      premium: { name: 'Premium', baseMultiplier: 2.0, description: 'Luxury vehicles', maxPassengers: 4 },
      xl: { name: 'XL', baseMultiplier: 1.6, description: 'Up to 6 passengers', maxPassengers: 6 },
      truck: { name: 'Truck', baseMultiplier: 2.5, description: 'Cargo transport', maxPassengers: 2 },
      local_haul: { name: 'Local Haul', baseMultiplier: 15.0, description: 'Within city · Same day', maxWeightKg: 3500 },
      long_haul: { name: 'Long Haul', baseMultiplier: 25.0, description: 'Inter-city · 1-3 days', maxWeightKg: 12000 },
      heavy_load: { name: 'Heavy Load', baseMultiplier: 40.0, description: 'Industrial · Specialized', maxWeightKg: 25000 },
    },
  },
  ghana: {
    currency: 'GHS',
    currencySymbol: 'GH₵',
    locale: 'en-GH',
    baseFare: 5,
    perKm: 2.5,
    perMinute: 0.3,
    minimumFare: 8,
    surgeMultiplier: 1.0,
    bookingFee: 1,
    serviceTypes: {
      boda: { name: 'Standard Boda', baseMultiplier: 0.6, description: '1 passenger · Helmet included', maxPassengers: 1 },
      boda_xl: { name: 'Boda XL', baseMultiplier: 0.8, description: '2 passengers · Extra storage', maxPassengers: 2 },
      boda_delivery: { name: 'Boda Delivery', baseMultiplier: 0.7, description: 'Packages up to 10kg', maxWeightKg: 10 },
      economy: { name: 'Economy', baseMultiplier: 1.0, description: 'Affordable rides', maxPassengers: 4 },
      comfort: { name: 'Comfort', baseMultiplier: 1.4, description: 'Newer cars, top drivers', maxPassengers: 4 },
      premium: { name: 'Premium', baseMultiplier: 2.0, description: 'Luxury vehicles', maxPassengers: 4 },
      xl: { name: 'XL', baseMultiplier: 1.6, description: 'Up to 6 passengers', maxPassengers: 6 },
      truck: { name: 'Truck', baseMultiplier: 2.5, description: 'Cargo transport', maxPassengers: 2 },
      local_haul: { name: 'Local Haul', baseMultiplier: 15.0, description: 'Within city · Same day', maxWeightKg: 3500 },
      long_haul: { name: 'Long Haul', baseMultiplier: 25.0, description: 'Inter-city · 1-3 days', maxWeightKg: 12000 },
      heavy_load: { name: 'Heavy Load', baseMultiplier: 40.0, description: 'Industrial · Specialized', maxWeightKg: 25000 },
    },
  },
  tanzania: {
    currency: 'TZS',
    currencySymbol: 'TSh',
    locale: 'en-TZ',
    baseFare: 1500,
    perKm: 800,
    perMinute: 80,
    minimumFare: 2500,
    surgeMultiplier: 1.0,
    bookingFee: 500,
    serviceTypes: {
      boda: { name: 'Standard Boda', baseMultiplier: 0.6, description: '1 passenger · Helmet included', maxPassengers: 1 },
      boda_xl: { name: 'Boda XL', baseMultiplier: 0.8, description: '2 passengers · Extra storage', maxPassengers: 2 },
      boda_delivery: { name: 'Boda Delivery', baseMultiplier: 0.7, description: 'Packages up to 10kg', maxWeightKg: 10 },
      economy: { name: 'Economy', baseMultiplier: 1.0, description: 'Affordable rides', maxPassengers: 4 },
      comfort: { name: 'Comfort', baseMultiplier: 1.4, description: 'Newer cars, top drivers', maxPassengers: 4 },
      premium: { name: 'Premium', baseMultiplier: 2.0, description: 'Luxury vehicles', maxPassengers: 4 },
      xl: { name: 'XL', baseMultiplier: 1.6, description: 'Up to 6 passengers', maxPassengers: 6 },
      truck: { name: 'Truck', baseMultiplier: 2.5, description: 'Cargo transport', maxPassengers: 2 },
      local_haul: { name: 'Local Haul', baseMultiplier: 15.0, description: 'Within city · Same day', maxWeightKg: 3500 },
      long_haul: { name: 'Long Haul', baseMultiplier: 25.0, description: 'Inter-city · 1-3 days', maxWeightKg: 12000 },
      heavy_load: { name: 'Heavy Load', baseMultiplier: 40.0, description: 'Industrial · Specialized', maxWeightKg: 25000 },
    },
  },
  uganda: {
    currency: 'UGX',
    currencySymbol: 'USh',
    locale: 'en-UG',
    baseFare: 3000,
    perKm: 1500,
    perMinute: 150,
    minimumFare: 5000,
    surgeMultiplier: 1.0,
    bookingFee: 1000,
    serviceTypes: {
      boda: { name: 'Standard Boda', baseMultiplier: 0.6, description: '1 passenger · Helmet included', maxPassengers: 1 },
      boda_xl: { name: 'Boda XL', baseMultiplier: 0.8, description: '2 passengers · Extra storage', maxPassengers: 2 },
      boda_delivery: { name: 'Boda Delivery', baseMultiplier: 0.7, description: 'Packages up to 10kg', maxWeightKg: 10 },
      economy: { name: 'Economy', baseMultiplier: 1.0, description: 'Affordable rides', maxPassengers: 4 },
      comfort: { name: 'Comfort', baseMultiplier: 1.4, description: 'Newer cars, top drivers', maxPassengers: 4 },
      premium: { name: 'Premium', baseMultiplier: 2.0, description: 'Luxury vehicles', maxPassengers: 4 },
      xl: { name: 'XL', baseMultiplier: 1.6, description: 'Up to 6 passengers', maxPassengers: 6 },
      truck: { name: 'Truck', baseMultiplier: 2.5, description: 'Cargo transport', maxPassengers: 2 },
      local_haul: { name: 'Local Haul', baseMultiplier: 15.0, description: 'Within city · Same day', maxWeightKg: 3500 },
      long_haul: { name: 'Long Haul', baseMultiplier: 25.0, description: 'Inter-city · 1-3 days', maxWeightKg: 12000 },
      heavy_load: { name: 'Heavy Load', baseMultiplier: 40.0, description: 'Industrial · Specialized', maxWeightKg: 25000 },
    },
  },
  rwanda: {
    currency: 'RWF',
    currencySymbol: 'RF',
    locale: 'en-RW',
    baseFare: 1000,
    perKm: 500,
    perMinute: 50,
    minimumFare: 1500,
    surgeMultiplier: 1.0,
    bookingFee: 200,
    serviceTypes: {
      boda: { name: 'Standard Boda', baseMultiplier: 0.6, description: '1 passenger · Helmet included', maxPassengers: 1 },
      boda_xl: { name: 'Boda XL', baseMultiplier: 0.8, description: '2 passengers · Extra storage', maxPassengers: 2 },
      boda_delivery: { name: 'Boda Delivery', baseMultiplier: 0.7, description: 'Packages up to 10kg', maxWeightKg: 10 },
      economy: { name: 'Economy', baseMultiplier: 1.0, description: 'Affordable rides', maxPassengers: 4 },
      comfort: { name: 'Comfort', baseMultiplier: 1.4, description: 'Newer cars, top drivers', maxPassengers: 4 },
      premium: { name: 'Premium', baseMultiplier: 2.0, description: 'Luxury vehicles', maxPassengers: 4 },
      xl: { name: 'XL', baseMultiplier: 1.6, description: 'Up to 6 passengers', maxPassengers: 6 },
      truck: { name: 'Truck', baseMultiplier: 2.5, description: 'Cargo transport', maxPassengers: 2 },
      local_haul: { name: 'Local Haul', baseMultiplier: 15.0, description: 'Within city · Same day', maxWeightKg: 3500 },
      long_haul: { name: 'Long Haul', baseMultiplier: 25.0, description: 'Inter-city · 1-3 days', maxWeightKg: 12000 },
      heavy_load: { name: 'Heavy Load', baseMultiplier: 40.0, description: 'Industrial · Specialized', maxWeightKg: 25000 },
    },
  },
};

export const DEFAULT_COUNTRY = 'kenya';

export function detectCountry(lat?: number, lng?: number, userCountry?: string): string {
  if (userCountry && COUNTRY_RATES[userCountry.toLowerCase()]) {
    return userCountry.toLowerCase();
  }
  if (lat && lng) {
    if (lat >= -5 && lat <= 5 && lng >= 33 && lng <= 42) return 'kenya';
    if (lat >= -12 && lat <= -1 && lng >= 29 && lng <= 41) return 'tanzania';
    if (lat >= -2 && lat <= 4 && lng >= 29 && lng <= 35) return 'uganda';
    if (lat >= -3 && lat <= -1 && lng >= 28 && lng <= 31) return 'rwanda';
  }
  return DEFAULT_COUNTRY;
}

export function calculateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function estimateDurationMinutes(distanceKm: number, serviceType: string): number {
  const speeds: Record<string, number> = {
    boda: 35, boda_xl: 30, boda_delivery: 30,
    economy: 25, comfort: 25, premium: 25, xl: 22, truck: 20,
    local_haul: 25, long_haul: 60, heavy_load: 40,
  };
  const speed = speeds[serviceType] || 25;
  return Math.ceil((distanceKm / speed) * 60);
}

export function calculateFare(
  pickup: { lat: number; lng: number; address?: string },
  destination: { lat: number; lng: number; address?: string },
  serviceType: string,
  countryCode: string = DEFAULT_COUNTRY,
  surgeMultiplier: number = 1.0
): FareEstimate {
  const country = COUNTRY_RATES[countryCode] || COUNTRY_RATES[DEFAULT_COUNTRY];
  const serviceRate = country.serviceTypes[serviceType] || country.serviceTypes.economy;

  const distanceKm = calculateDistanceKm(pickup.lat, pickup.lng, destination.lat, destination.lng);
  const durationMinutes = estimateDurationMinutes(distanceKm, serviceType);

  const baseFare = country.baseFare * serviceRate.baseMultiplier;
  const distanceCharge = distanceKm * country.perKm * serviceRate.baseMultiplier;
  const timeCharge = durationMinutes * country.perMinute * serviceRate.baseMultiplier;
  const bookingFee = country.bookingFee;

  let subtotal = baseFare + distanceCharge + timeCharge + bookingFee;
  const surgeCharge = subtotal * (surgeMultiplier - 1);
  let total = subtotal * surgeMultiplier;

  if (total < country.minimumFare * serviceRate.baseMultiplier) {
    total = country.minimumFare * serviceRate.baseMultiplier;
  }

  total = Math.round(total);

  return {
    currency: country.currency,
    currencySymbol: country.currencySymbol,
    amount: total,
    formatted: formatCurrency(total, country.currency, country.locale),
    distanceKm,
    durationMinutes,
    baseFare: Math.round(baseFare),
    distanceCharge: Math.round(distanceCharge),
    timeCharge: Math.round(timeCharge),
    bookingFee: Math.round(bookingFee),
    surgeMultiplier,
    serviceType,
    breakdown: {
      base: Math.round(baseFare),
      distance: Math.round(distanceCharge),
      time: Math.round(timeCharge),
      booking: Math.round(bookingFee),
      surge: Math.round(surgeCharge),
      total,
    },
  };
}

export function formatCurrency(amount: number, currency: string, locale?: string): string {
  const country = Object.values(COUNTRY_RATES).find(c => c.currency === currency);
  const useLocale = locale || country?.locale || 'en-KE';

  try {
    return new Intl.NumberFormat(useLocale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${country?.currencySymbol || currency} ${amount.toLocaleString()}`;
  }
}

export function getServiceTypes(countryCode: string = DEFAULT_COUNTRY) {
  const country = COUNTRY_RATES[countryCode] || COUNTRY_RATES[DEFAULT_COUNTRY];
  return Object.entries(country.serviceTypes).map(([key, value]) => ({
    id: key,
    ...value,
  }));
}

export function getCountryInfo(countryCode: string = DEFAULT_COUNTRY) {
  return COUNTRY_RATES[countryCode] || COUNTRY_RATES[DEFAULT_COUNTRY];
}

export function compareFares(
  pickup: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  countryCode: string = DEFAULT_COUNTRY
): FareEstimate[] {
  const country = COUNTRY_RATES[countryCode] || COUNTRY_RATES[DEFAULT_COUNTRY];
  const estimates: FareEstimate[] = [];

  for (const [serviceType] of Object.entries(country.serviceTypes)) {
    estimates.push(calculateFare(pickup, destination, serviceType, countryCode));
  }

  return estimates.sort((a, b) => a.amount - b.amount);
}

export interface ASISFareContext {
  userId: string;
  pickupAddress: string;
  destinationAddress: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  weather?: 'clear' | 'rain' | 'heavy_rain';
  trafficLevel?: 'low' | 'medium' | 'high';
  previousRides?: number;
  loyaltyTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export function getASISFareRecommendation(context: ASISFareContext): {
  recommendation: string;
  bestValue: string;
  fastest: string;
  savingsTip?: string;
} {
  const { timeOfDay, trafficLevel, loyaltyTier } = context;

  let recommendation = '';
  let bestValue = 'economy';
  let fastest = 'boda';
  let savingsTip: string | undefined;

  if (timeOfDay === 'morning' && trafficLevel === 'high') {
    recommendation = 'Morning rush detected. Boda will be fastest, but Comfort offers AC and a relaxed ride.';
    fastest = 'boda';
    bestValue = 'economy';
  } else if (timeOfDay === 'night') {
    recommendation = 'Night ride — safety first. We recommend Comfort or Premium with verified drivers.';
    bestValue = 'comfort';
    fastest = 'comfort';
    savingsTip = 'Use MTAA Wallet for 5% night ride cashback.';
  } else if (trafficLevel === 'low') {
    recommendation = 'Clear roads! Economy is your best value. Boda if you\'re in a hurry.';
    bestValue = 'economy';
    fastest = 'boda';
  } else {
    recommendation = 'Moderate traffic. Economy offers the best balance of price and comfort.';
    bestValue = 'economy';
    fastest = 'boda';
  }

  if (loyaltyTier === 'gold' || loyaltyTier === 'platinum') {
    savingsTip = `${loyaltyTier} tier: You get 10% off all rides today!`;
  }

  return { recommendation, bestValue, fastest, savingsTip };
}
