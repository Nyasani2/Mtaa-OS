import { supabase } from '@/lib/supabase';
import { calculateFare, calculateDistanceKm, detectCountry, type FareEstimate } from '@/lib/services/fare-engine';

export type BodaAction =
  | 'request' | 'accept' | 'complete' | 'cancel'
  | 'onboard_rider' | 'rider_approval';

export interface BodaRequestParams {
  action: 'request';
  riderId: string;
  pickup: { lat: number; lng: number; address: string };
  destination: { lat: number; lng: number; address: string };
  bodaType: 'boda' | 'boda_xl' | 'boda_delivery';
  paymentMethod: 'wallet' | 'mpesa' | 'cash';
  estimatedFare: number;
  currency: string;
}

export interface BodaAcceptParams {
  action: 'accept';
  requestId: string;
  driverId: string;
  bodaId: string;
}

export interface BodaCompleteParams {
  action: 'complete';
  tripId: string;
  driverId: string;
  finalFare: number;
  rating?: number;
  feedback?: string;
}

export interface BodaCancelParams {
  action: 'cancel';
  tripId: string;
  cancelledBy: 'rider' | 'driver';
  reason: string;
}

export interface BodaOnboardParams {
  action: 'onboard_rider';
  riderData: {
    fullName: string;
    phone: string;
    idNumber: string;
    licenseNumber: string;
    licenseExpiry: string;
    helmetSerial?: string;
    emergencyContact?: string;
  };
}

export interface BodaApprovalParams {
  action: 'rider_approval';
  riderId: string;
  approvedBy: string;
  status: 'approved' | 'rejected' | 'suspended';
  reason?: string;
}

export type BodaParams =
  | BodaRequestParams | BodaAcceptParams | BodaCompleteParams | BodaCancelParams
  | BodaOnboardParams | BodaApprovalParams;

export async function bodaOperation(params: BodaParams) {
  const { data, error } = await supabase.functions.invoke('boda-operations', {
    body: params,
  });
  if (error) throw error;
  return data;
}

export const requestBoda = (p: Omit<BodaRequestParams, 'action'>) =>
  bodaOperation({ action: 'request', ...p } as BodaRequestParams);

export const acceptBoda = (p: Omit<BodaAcceptParams, 'action'>) =>
  bodaOperation({ action: 'accept', ...p } as BodaAcceptParams);

export const completeBodaTrip = (p: Omit<BodaCompleteParams, 'action'>) =>
  bodaOperation({ action: 'complete', ...p } as BodaCompleteParams);

export const cancelBodaTrip = (p: Omit<BodaCancelParams, 'action'>) =>
  bodaOperation({ action: 'cancel', ...p } as BodaCancelParams);

export const onboardBodaRider = (p: Omit<BodaOnboardParams, 'action'>) =>
  bodaOperation({ action: 'onboard_rider', ...p } as BodaOnboardParams);

export const approveBodaRider = (p: Omit<BodaApprovalParams, 'action'>) =>
  bodaOperation({ action: 'rider_approval', ...p } as BodaApprovalParams);

export function getBodaFareEstimate(
  pickup: { lat: number; lng: number; address?: string },
  destination: { lat: number; lng: number; address?: string },
  bodaType: 'boda' | 'boda_xl' | 'boda_delivery' = 'boda',
  countryCode?: string
): FareEstimate {
  return calculateFare(pickup, destination, bodaType, countryCode || detectCountry(pickup.lat, pickup.lng));
}

export async function getAvailableBodas(lat: number, lng: number, radiusKm: number = 5) {
  // FIXED 2026-07-18: was filtering on 'status' and 'online' columns that
  // don't exist on boda_riders — the real columns are 'is_approved' and
  // 'is_online'. This query would have silently returned zero results
  // (or errored) for every search, regardless of how many bodas were
  // actually online nearby.
  const { data, error } = await supabase
    .from('boda_riders')
    .select('*')
    .eq('is_approved', true)
    .eq('is_online', true)
    .gte('current_lat', lat - 0.045)
    .lte('current_lat', lat + 0.045)
    .gte('current_lng', lng - 0.045)
    .lte('current_lng', lng + 0.045)
    .limit(20);

  if (error) throw error;

  return (data || []).filter((rider: any) => {
    if (!rider.current_lat || !rider.current_lng) return false;
    const dist = calculateDistanceKm(lat, lng, rider.current_lat, rider.current_lng);
    return dist <= radiusKm;
  });
}

export function getBodaTypes(countryCode: string = 'kenya') {
   
  const { getServiceTypes, getCountryInfo } = require('./fare-engine');
  const types = getServiceTypes(countryCode);
  const country = getCountryInfo(countryCode);

  return types
    .filter((t: any) => t.id.startsWith('boda'))
    .map((t: any) => ({
      ...t,
      basePrice: Math.round(country.baseFare * t.baseMultiplier),
      currency: country.currency,
      currencySymbol: country.currencySymbol,
    }));
}
