import { supabase } from '@/lib/supabase';
import { getEmergencyData, EmergencyData } from '../security/emergency-card';

export interface AmbulanceDispatch {
  id: string;
  patientId: string;
  patientName: string;
  location: { lat: number; lng: number; address: string };
  condition: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'requested' | 'dispatched' | 'en_route' | 'arrived' | 'completed' | 'cancelled';
  driverName?: string;
  driverPhone?: string;
  vehicleId?: string;
  etaMinutes?: number;
  hospitalId?: string;
  hospitalName?: string;
  createdAt: string;
  updatedAt: string;
}

const TABLE_DISPATCH = 'health_ambulance_dispatches';

export async function requestAmbulance(
  patientId: string,
  location: { lat: number; lng: number; address: string },
  condition: string,
  priority: AmbulanceDispatch['priority']
): Promise<AmbulanceDispatch | null> {
  const dispatch: AmbulanceDispatch = {
    id: crypto.randomUUID(),
    patientId,
    patientName: '',
    location,
    condition,
    priority,
    status: 'requested',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const db = {
    id: dispatch.id,
    patient_id: dispatch.patientId,
    patient_name: dispatch.patientName,
    lat: location.lat,
    lng: location.lng,
    address: location.address,
    condition,
    priority,
    status: 'requested',
    created_at: dispatch.createdAt,
    updated_at: dispatch.updatedAt,
  };
  const { data, error } = await supabase.from(TABLE_DISPATCH).insert(db).select().single();
  if (error || !data) return null;
  return mapDb(data);
}

export async function getDispatchStatus(dispatchId: string): Promise<AmbulanceDispatch | null> {
  const { data, error } = await supabase
    .from(TABLE_DISPATCH)
    .select('*')
    .eq('id', dispatchId)
    .single();
  if (error || !data) return null;
  return mapDb(data);
}

export async function cancelDispatch(dispatchId: string): Promise<boolean> {
  const { error } = await supabase
    .from(TABLE_DISPATCH)
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', dispatchId);
  return !error;
}

export async function getPatientDispatches(patientId: string): Promise<AmbulanceDispatch[]> {
  const { data, error } = await supabase
    .from(TABLE_DISPATCH)
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(mapDb);
}

export async function getEmergencyDataForMedic(): Promise<EmergencyData | null> {
  return getEmergencyData();
}

function mapDb(row: any): AmbulanceDispatch {
  return {
    id: row.id,
    patientId: row.patient_id,
    patientName: row.patient_name,
    location: { lat: row.lat, lng: row.lng, address: row.address },
    condition: row.condition,
    priority: row.priority,
    status: row.status,
    driverName: row.driver_name,
    driverPhone: row.driver_phone,
    vehicleId: row.vehicle_id,
    etaMinutes: row.eta_minutes,
    hospitalId: row.hospital_id,
    hospitalName: row.hospital_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
