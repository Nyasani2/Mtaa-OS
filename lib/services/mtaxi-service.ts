import { supabase } from '@/lib/supabase';

export type MTaxiAction = 
  | 'request' | 'accept' | 'complete' | 'cancel' 
  | 'onboard_vehicle' | 'inspection_payment' | 'inspection_complete' | 'vehicle_approval';

export interface MTaxiRequestParams {
  action: 'request';
  riderId: string;
  pickup: { lat: number; lng: number; address: string };
  destination: { lat: number; lng: number; address: string };
  vehicleType: 'boda' | 'taxi' | 'executive' | 'truck';
  paymentMethod: 'wallet' | 'mpesa' | 'cash';
  estimatedFare?: number;
}

export interface MTaxiAcceptParams {
  action: 'accept';
  requestId: string;
  driverId: string;
  vehicleId: string;
}

export interface MTaxiCompleteParams {
  action: 'complete';
  tripId: string;
  driverId: string;
  finalFare: number;
  rating?: number;
  feedback?: string;
}

export interface MTaxiCancelParams {
  action: 'cancel';
  tripId: string;
  cancelledBy: 'rider' | 'driver';
  reason: string;
}

export interface MTaxiOnboardVehicleParams {
  action: 'onboard_vehicle';
  driverId: string;
  vehicleData: {
    make: string; model: string; year: number; plate: string;
    color: string; type: string; insurance: string; inspectionDue: string;
  };
}

export interface MTaxiInspectionPaymentParams {
  action: 'inspection_payment';
  vehicleId: string;
  driverId: string;
  amount: number;
  paymentMethod: 'wallet' | 'mpesa';
}

export interface MTaxiInspectionCompleteParams {
  action: 'inspection_complete';
  vehicleId: string;
  inspectorId: string;
  passed: boolean;
  notes?: string;
  nextDue?: string;
}

export interface MTaxiVehicleApprovalParams {
  action: 'vehicle_approval';
  vehicleId: string;
  approvedBy: string;
  status: 'approved' | 'rejected' | 'suspended';
  reason?: string;
}

export type MTaxiParams = 
  | MTaxiRequestParams | MTaxiAcceptParams | MTaxiCompleteParams | MTaxiCancelParams
  | MTaxiOnboardVehicleParams | MTaxiInspectionPaymentParams | MTaxiInspectionCompleteParams | MTaxiVehicleApprovalParams;

export async function mtaxiOperation(params: MTaxiParams) {
  const { data, error } = await supabase.functions.invoke('mtaxi-operations', {
    body: params,
  });
  if (error) throw error;
  return data;
}

export const requestRide = (p: Omit<MTaxiRequestParams, 'action'>) => 
  mtaxiOperation({ action: 'request', ...p } as MTaxiRequestParams);

export const acceptRide = (p: Omit<MTaxiAcceptParams, 'action'>) => 
  mtaxiOperation({ action: 'accept', ...p } as MTaxiAcceptParams);

export const completeTrip = (p: Omit<MTaxiCompleteParams, 'action'>) => 
  mtaxiOperation({ action: 'complete', ...p } as MTaxiCompleteParams);

export const cancelTrip = (p: Omit<MTaxiCancelParams, 'action'>) => 
  mtaxiOperation({ action: 'cancel', ...p } as MTaxiCancelParams);

export const onboardVehicle = (p: Omit<MTaxiOnboardVehicleParams, 'action'>) => 
  mtaxiOperation({ action: 'onboard_vehicle', ...p } as MTaxiOnboardVehicleParams);

export const inspectionPayment = (p: Omit<MTaxiInspectionPaymentParams, 'action'>) => 
  mtaxiOperation({ action: 'inspection_payment', ...p } as MTaxiInspectionPaymentParams);

export const inspectionComplete = (p: Omit<MTaxiInspectionCompleteParams, 'action'>) => 
  mtaxiOperation({ action: 'inspection_complete', ...p } as MTaxiInspectionCompleteParams);

export const vehicleApproval = (p: Omit<MTaxiVehicleApprovalParams, 'action'>) => 
  mtaxiOperation({ action: 'vehicle_approval', ...p } as MTaxiVehicleApprovalParams);
