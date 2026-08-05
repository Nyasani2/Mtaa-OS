import { supabase } from '@/lib/supabase';

export interface OBDDiagnostic {
  id: string;
  vehicle_id: string;
  scan_date: string;
  scanner_device_id?: string;
  fault_codes: OBDFaultCode[];
  readiness_status: Record<string, boolean>;
  live_data: Record<string, number>;
  freeze_frame?: Record<string, any>;
  mileage_km: number;
  fuel_level_percent?: number;
  engine_temp_c?: number;
  battery_voltage?: number;
  mechanic_id?: string;
  notes?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'requires_attention';
  estimated_repair_cost?: number;
  created_at: string;
}

export interface OBDFaultCode {
  code: string;
  description: string;
  severity: 'info' | 'minor' | 'major' | 'critical';
  system: string;
  probable_causes: string[];
  recommended_actions: string[];
  is_cleared: boolean;
  cleared_at?: string;
  cleared_by?: string;
}

export interface RepairRecord {
  id: string;
  diagnostic_id: string;
  vehicle_id: string;
  mechanic_id: string;
  repair_type: string;
  description: string;
  parts_replaced: RepairPart[];
  labor_hours: number;
  labor_rate: number;
  total_cost: number;
  before_photos: string[];
  after_photos: string[];
  invoice_url?: string;
  warranty_months?: number;
  customer_approved: boolean;
  approved_at?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'warranty_claim';
  created_at: string;
}

export interface RepairPart {
  name: string;
  part_number?: string;
  quantity: number;
  unit_cost: number;
  supplier?: string;
}

export async function runOBDScan(vehicleId: string, scannerDeviceId?: string) {
  const { data: user } = await supabase.auth.getUser();

  // Simulate OBD scan (in production, this would connect to actual OBD-II device)
  const mockFaultCodes: OBDFaultCode[] = [
    { code: 'P0300', description: 'Random/Multiple Cylinder Misfire Detected', severity: 'major', system: 'engine', probable_causes: ['Worn spark plugs', 'Faulty ignition coil', 'Fuel injector issues'], recommended_actions: ['Replace spark plugs', 'Test ignition coils'], is_cleared: false },
    { code: 'P0420', description: 'Catalyst System Efficiency Below Threshold', severity: 'major', system: 'emissions', probable_causes: ['Failing catalytic converter', 'O2 sensor malfunction'], recommended_actions: ['Inspect catalytic converter', 'Replace O2 sensors'], is_cleared: false },
  ];

  const diagnostic = {
    vehicle_id: vehicleId,
    scan_date: new Date().toISOString(),
    scanner_device_id: scannerDeviceId,
    fault_codes: mockFaultCodes,
    readiness_status: { misfire: true, fuel: true, comp: true, catalyst: false },
    live_data: { rpm: 750, speed: 0, throttle: 12.5, coolant_temp: 92 },
    mileage_km: 45230,
    fuel_level_percent: 67,
    engine_temp_c: 92,
    battery_voltage: 12.4,
    mechanic_id: user.user?.id,
    status: 'requires_attention' as const,
    estimated_repair_cost: 15000,
  };

  const { data, error } = await supabase
    .from('obd_diagnostics')
    .insert(diagnostic)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getVehicleDiagnostics(vehicleId: string, limit = 10) {
  const { data, error } = await supabase
    .from('obd_diagnostics')
    .select(`
      *,
      mechanic:mechanic_id(id, full_name),
      vehicle:vehicle_id(plate_number, make, model)
    `)
    .eq('vehicle_id', vehicleId)
    .order('scan_date', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function getDiagnosticById(id: string) {
  const { data, error } = await supabase
    .from('obd_diagnostics')
    .select(`
      *,
      mechanic:mechanic_id(id, full_name),
      vehicle:vehicle_id(*),
      repairs:repair_records(*)
    `)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function clearFaultCode(diagnosticId: string, code: string) {
  const { data: user } = await supabase.auth.getUser();

  const { data: diagnostic } = await supabase
    .from('obd_diagnostics')
    .select('fault_codes')
    .eq('id', diagnosticId)
    .maybeSingle();

  const updatedCodes = (diagnostic?.fault_codes || []).map((fc: any) =>
    fc.code === code ? { ...fc, is_cleared: true, cleared_at: new Date().toISOString(), cleared_by: user.user?.id } : fc
  );

  const { data, error } = await supabase
    .from('obd_diagnostics')
    .update({ fault_codes: updatedCodes, updated_at: new Date().toISOString() })
    .eq('id', diagnosticId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createRepairRecord(repair: Omit<RepairRecord, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('repair_records')
    .insert(repair)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getRepairHistory(vehicleId: string) {
  const { data, error } = await supabase
    .from('repair_records')
    .select(`
      *,
      mechanic:mechanic_id(id, full_name),
      diagnostic:diagnostic_id(*)
    `)
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function updateRepairStatus(repairId: string, status: string, notes?: string) {
  const updates: any = { status, updated_at: new Date().toISOString() };
  if (notes) updates.notes = notes;

  const { data, error } = await supabase
    .from('repair_records')
    .update(updates)
    .eq('id', repairId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function compareBeforeAfter(diagnosticId: string) {
  const { data: before } = await supabase
    .from('obd_diagnostics')
    .select('fault_codes, live_data, scan_date')
    .eq('id', diagnosticId)
    .maybeSingle();

  const { data: after } = await supabase
    .from('obd_diagnostics')
    .select('fault_codes, live_data, scan_date')
    .eq('vehicle_id', before?.vehicle_id)
    .gt('scan_date', before?.scan_date)
    .order('scan_date', { ascending: true })
    .limit(1)
    .maybeSingle();

  return {
    before: before || null,
    after: after || null,
    improvements: calculateImprovements(before, after),
  };
}

function calculateImprovements(before: any, after: any) {
  if (!before || !after) return [];

  const improvements = [];
  const beforeCodes = before.fault_codes?.filter((f: any) => !f.is_cleared).length || 0;
  const afterCodes = after.fault_codes?.filter((f: any) => !f.is_cleared).length || 0;

  if (afterCodes < beforeCodes) {
    improvements.push(`${beforeCodes - afterCodes} fault codes cleared`);
  }

  if (after.live_data?.coolant_temp < before.live_data?.coolant_temp) {
    improvements.push('Engine temperature normalized');
  }

  return improvements;
}

export const OBD_SYSTEMS = [
  { id: 'engine', name: 'Engine', icon: '🔧' },
  { id: 'transmission', name: 'Transmission', icon: '⚙️' },
  { id: 'abs', name: 'ABS', icon: '🛑' },
  { id: 'airbag', name: 'Airbag', icon: '💨' },
  { id: 'emissions', name: 'Emissions', icon: '💨' },
  { id: 'fuel', name: 'Fuel System', icon: '⛽' },
  { id: 'cooling', name: 'Cooling', icon: '❄️' },
  { id: 'electrical', name: 'Electrical', icon: '⚡' },
  { id: 'tpms', name: 'TPMS', icon: '🛞' },
];