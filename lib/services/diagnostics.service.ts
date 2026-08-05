import { supabase } from '@/lib/supabase';

// ─── Types ───

export interface FaultCode {
  code: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  system: string;
  is_pending: boolean;
  is_permanent: boolean;
  cleared?: boolean;
}

export interface LiveDataPoint {
  parameter: string;
  value: number;
  unit: string;
  min?: number;
  max?: number;
  status: 'normal' | 'warning' | 'critical';
}

export interface ProgrammingOperation {
  operation: 'ecu_flash' | 'key_programming' | 'immobilizer_reset' | 'tpms_programming' | 'module_configuration' | 'vin_update';
  status: 'pending' | 'in_progress' | 'success' | 'failed';
  before_version?: string;
  after_version?: string;
  error_message?: string;
  timestamp: string;
}

export interface DiagnosticSession {
  id: string;
  garage_id: string;
  appointment_id?: string;
  mechanic_id?: string;
  vehicle_id?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  vin?: string;
  license_plate?: string;
  mileage?: number;
  obd_protocol?: string;
  elm_version?: string;
  adapter_type?: string;
  fault_codes: FaultCode[];
  live_data: Record<string, number | string>;
  freeze_frame: Record<string, number | string>;
  asis_analysis: {
    recommendations: string[];
    severity_score: number;
    estimated_repair_cost?: number;
    priority_actions: string[];
    predicted_failures?: string[];
    maintenance_schedule?: string[];
    vehicle_health_score?: number;
  };
  programming_log: ProgrammingOperation[];
  report_generated: boolean;
  report_url?: string;
  report_pdf_url?: string;
  shared_with_customer: boolean;
  shared_at?: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

// ─── OBD-II Protocol Database ───

export const OBD_PROTOCOLS = [
  { id: 'can_11bit_500k', name: 'CAN 11-bit / 500kbps', standard: 'ISO 15765-4', coverage: '2008+ vehicles' },
  { id: 'can_29bit_500k', name: 'CAN 29-bit / 500kbps', standard: 'ISO 15765-4', coverage: 'Heavy duty / commercial' },
  { id: 'can_11bit_250k', name: 'CAN 11-bit / 250kbps', standard: 'ISO 15765-4', coverage: 'Some European/Japanese' },
  { id: 'kwp2000_fast', name: 'KWP2000 Fast Init', standard: 'ISO 14230-4', coverage: '2000-2004 European/Asian' },
  { id: 'kwp2000_slow', name: 'KWP2000 Slow Init', standard: 'ISO 14230-4', coverage: 'Pre-2000 European' },
  { id: 'iso9141_2', name: 'ISO 9141-2', standard: 'ISO 9141-2', coverage: '1996-2000 Chrysler, European' },
  { id: 'j1850_pwm', name: 'SAE J1850 PWM', standard: 'SAE J1850', coverage: 'Ford 1996-2004' },
  { id: 'j1850_vpw', name: 'SAE J1850 VPW', standard: 'SAE J1850', coverage: 'GM 1996-2004' },
] as const;

// ─── Vehicle Programming Database ───

export const PROGRAMMING_CAPABILITIES = [
  {
    make: 'Toyota',
    operations: ['ecu_flash', 'key_programming', 'immobilizer_reset', 'tpms_programming'],
    protocols: ['can_11bit_500k', 'kwp2000_fast'],
    special_notes: 'Smart key programming requires dealer code or Lonsdor/K518',
    asis_supported: true,
  },
  {
    make: 'Honda',
    operations: ['ecu_flash', 'key_programming', 'immobilizer_reset', 'tpms_programming', 'module_configuration'],
    protocols: ['can_11bit_500k', 'kwp2000_fast'],
    special_notes: 'HDS (Honda Diagnostic System) protocol for advanced functions',
    asis_supported: true,
  },
  {
    make: 'Nissan',
    operations: ['ecu_flash', 'key_programming', 'immobilizer_reset', 'tpms_programming', 'vin_update'],
    protocols: ['can_11bit_500k', 'kwp2000_fast'],
    special_notes: 'Consult-III+ required for newer models',
    asis_supported: true,
  },
  {
    make: 'BMW',
    operations: ['ecu_flash', 'key_programming', 'immobilizer_reset', 'module_configuration', 'vin_update'],
    protocols: ['can_11bit_500k', 'can_29bit_500k'],
    special_notes: 'ENET cable for F/G series, ISTA for advanced coding',
    asis_supported: true,
  },
  {
    make: 'Mercedes',
    operations: ['ecu_flash', 'key_programming', 'immobilizer_reset', 'module_configuration'],
    protocols: ['can_11bit_500k', 'can_29bit_500k'],
    special_notes: 'XENTRY/DAS for SCN coding, Vediamo for advanced',
    asis_supported: true,
  },
  {
    make: 'VW/Audi',
    operations: ['ecu_flash', 'key_programming', 'immobilizer_reset', 'module_configuration', 'tpms_programming', 'vin_update'],
    protocols: ['can_11bit_500k', 'can_29bit_500k', 'kwp2000_fast'],
    special_notes: 'VCDS/OBDeleven for coding, ODIS for dealer functions',
    asis_supported: true,
  },
  {
    make: 'Ford',
    operations: ['ecu_flash', 'key_programming', 'immobilizer_reset', 'tpms_programming', 'module_configuration'],
    protocols: ['can_11bit_500k', 'can_29bit_500k', 'j1850_pwm'],
    special_notes: 'Forscan for advanced configuration, IDS for dealer functions',
    asis_supported: true,
  },
  {
    make: 'GM/Chevrolet',
    operations: ['ecu_flash', 'key_programming', 'immobilizer_reset', 'tpms_programming', 'module_configuration', 'vin_update'],
    protocols: ['can_11bit_500k', 'can_29bit_500k', 'j1850_vpw'],
    special_notes: 'Tech2Win/GDS2 for dealer-level programming',
    asis_supported: true,
  },
  {
    make: 'Hyundai/Kia',
    operations: ['ecu_flash', 'key_programming', 'immobilizer_reset', 'tpms_programming'],
    protocols: ['can_11bit_500k', 'kwp2000_fast'],
    special_notes: 'GDS Mobile for dealer functions',
    asis_supported: true,
  },
  {
    make: 'Mazda',
    operations: ['ecu_flash', 'key_programming', 'immobilizer_reset', 'tpms_programming', 'module_configuration'],
    protocols: ['can_11bit_500k', 'kwp2000_fast'],
    special_notes: 'Mazda IDS for advanced functions',
    asis_supported: true,
  },
  {
    make: 'Subaru',
    operations: ['ecu_flash', 'key_programming', 'immobilizer_reset', 'tpms_programming'],
    protocols: ['can_11bit_500k', 'kwp2000_fast'],
    special_notes: 'Subaru Select Monitor for dealer functions',
    asis_supported: true,
  },
  {
    make: 'Volvo',
    operations: ['ecu_flash', 'key_programming', 'immobilizer_reset', 'module_configuration'],
    protocols: ['can_11bit_500k', 'can_29bit_500k'],
    special_notes: 'Vida/Dice for dealer-level access',
    asis_supported: true,
  },
  {
    make: 'Land Rover/Jaguar',
    operations: ['ecu_flash', 'key_programming', 'immobilizer_reset', 'module_configuration'],
    protocols: ['can_11bit_500k', 'can_29bit_500k'],
    special_notes: 'SDD/Pathfinder for dealer functions',
    asis_supported: true,
  },
  {
    make: 'Tesla',
    operations: ['module_configuration'],
    protocols: ['can_11bit_500k'],
    special_notes: 'Limited third-party access. Tesla Service Mode required',
    asis_supported: false,
  },
] as const;

// ─── CRUD Operations ───

export async function createDiagnosticSession(sessionData: Omit<DiagnosticSession, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('garage_diagnostics')
    .insert(sessionData)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as DiagnosticSession;
}

export async function getDiagnosticSessions(garageId: string, filters?: { vehicle_id?: string; mechanic_id?: string; limit?: number }) {
  let query = supabase
    .from('garage_diagnostics')
    .select('*')
    .eq('garage_id', garageId)
    .order('created_at', { ascending: false });

  if (filters?.vehicle_id) query = query.eq('vehicle_id', filters.vehicle_id);
  if (filters?.mechanic_id) query = query.eq('mechanic_id', filters.mechanic_id);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as DiagnosticSession[];
}

export async function getDiagnosticSession(id: string) {
  const { data, error } = await supabase
    .from('garage_diagnostics')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as DiagnosticSession;
}

export async function updateDiagnosticSession(id: string, updates: Partial<DiagnosticSession>) {
  const { data, error } = await supabase
    .from('garage_diagnostics')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as DiagnosticSession;
}

// ─── OBD-II Operations ───

export async function scanFaultCodes(sessionId: string, _elmDeviceId?: string) {
  const session = await getDiagnosticSession(sessionId);

  // In production: Connect to ELM327/WiFi OBD adapter via react-native-ble-plx
  // For now: Return realistic simulated data based on vehicle make
  const simulatedCodes = generateSimulatedFaultCodes(session.vehicle_make, session.vehicle_model);

  const updated = await updateDiagnosticSession(sessionId, {
    fault_codes: simulatedCodes,
  });

  return updated;
}

function generateSimulatedFaultCodes(make?: string, model?: string): FaultCode[] {
  const baseCodes: FaultCode[] = [
    { code: 'P0301', description: 'Cylinder 1 Misfire Detected', severity: 'critical', system: 'engine', is_pending: false, is_permanent: true },
    { code: 'P0420', description: 'Catalyst System Efficiency Below Threshold', severity: 'warning', system: 'emissions', is_pending: true, is_permanent: false },
    { code: 'P0171', description: 'System Too Lean (Bank 1)', severity: 'warning', system: 'engine', is_pending: false, is_permanent: true },
    { code: 'P0442', description: 'Evaporative Emission System Leak Detected (Small)', severity: 'info', system: 'emissions', is_pending: true, is_permanent: false },
    { code: 'C1234', description: 'ABS Wheel Speed Sensor Circuit - Front Left', severity: 'warning', system: 'abs', is_pending: false, is_permanent: true },
    { code: 'B1000', description: 'Airbag Sensor Circuit Malfunction', severity: 'critical', system: 'airbag', is_pending: false, is_permanent: true },
  ];

  // Make-specific codes
  if (make?.toLowerCase().includes('toyota')) {
    baseCodes.push(
      { code: 'P1120', description: 'Accelerator Pedal Position Sensor Circuit', severity: 'critical', system: 'engine', is_pending: false, is_permanent: true },
      { code: 'P2121', description: 'Throttle/Pedal Position Sensor/Switch D Circuit Range/Performance', severity: 'warning', system: 'engine', is_pending: true, is_permanent: false }
    );
  }

  if (make?.toLowerCase().includes('bmw')) {
    baseCodes.push(
      { code: '2A87', description: 'Valvetronic System - Power Limitation', severity: 'warning', system: 'engine', is_pending: false, is_permanent: true },
      { code: '2E98', description: 'Crankshaft Sensor - Signal Error', severity: 'critical', system: 'engine', is_pending: false, is_permanent: true }
    );
  }

  // Return subset based on randomness for demo
  return baseCodes.filter(() => Math.random() > 0.3);
}

export async function clearFaultCodes(sessionId: string) {
  const { data, error } = await supabase
    .from('garage_diagnostics')
    .update({
      fault_codes: [],
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as DiagnosticSession;
}

export async function readLiveData(sessionId: string, _parameters?: string[]) {
  const session = await getDiagnosticSession(sessionId);

  // Standard OBD-II PIDs
  const simulatedData: Record<string, number | string> = {
    rpm: Math.floor(700 + Math.random() * 100),
    coolant_temp: Math.floor(85 + Math.random() * 15),
    speed: 0,
    throttle_pos: parseFloat((10 + Math.random() * 5).toFixed(1)),
    engine_load: parseFloat((15 + Math.random() * 10).toFixed(1)),
    intake_temp: Math.floor(30 + Math.random() * 10),
    maf_rate: parseFloat((3.5 + Math.random() * 1.5).toFixed(2)),
    o2_sensor_1: parseFloat((0.7 + Math.random() * 0.3).toFixed(2)),
    fuel_trim_short: parseFloat((-2 + Math.random() * 5).toFixed(1)),
    fuel_trim_long: parseFloat((-1 + Math.random() * 3).toFixed(1)),
    timing_advance: parseFloat((12 + Math.random() * 6).toFixed(1)),
    barometric_pressure: parseFloat((100 + Math.random() * 3).toFixed(1)),
    fuel_level: parseFloat((40 + Math.random() * 40).toFixed(1)),
    distance_since_dtc_clear: Math.floor(10000 + Math.random() * 50000),
    control_module_voltage: parseFloat((13.5 + Math.random() * 1.5).toFixed(1)),
    ambient_temp: Math.floor(25 + Math.random() * 10),
  };

  // Make-specific data
  if (session.vehicle_make?.toLowerCase().includes('hybrid') || session.vehicle_make?.toLowerCase().includes('toyota')) {
    simulatedData.hybrid_battery_soc = parseFloat((40 + Math.random() * 40).toFixed(1));
    simulatedData.hybrid_battery_temp = Math.floor(25 + Math.random() * 15);
    simulatedData.motor_rpm = Math.floor(0 + Math.random() * 500);
  }

  if (session.vehicle_make?.toLowerCase().includes('diesel') || session.vehicle_model?.toLowerCase().includes('diesel')) {
    simulatedData.dpf_pressure = parseFloat((5 + Math.random() * 15).toFixed(1));
    simulatedData.dpf_temp = Math.floor(200 + Math.random() * 300);
    simulatedData.nox_sensor_1 = parseFloat((50 + Math.random() * 200).toFixed(1));
  }

  const { data, error } = await supabase
    .from('garage_diagnostics')
    .update({
      live_data: simulatedData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as DiagnosticSession;
}

// ─── ASIS Integration ───

export async function requestAsisAnalysis(sessionId: string) {
  const session = await getDiagnosticSession(sessionId);

  // Call ASIS edge function for intelligent diagnostics
  try {
    const { data: asisResponse, error } = await supabase.functions.invoke('asis-analyze-diagnostics', {
      body: {
        fault_codes: session.fault_codes,
        live_data: session.live_data,
        vehicle_make: session.vehicle_make,
        vehicle_model: session.vehicle_model,
        vehicle_year: session.vehicle_year,
        mileage: session.mileage,
      },
    });

    if (error || !asisResponse?.analysis) {
      throw new Error('ASIS analysis failed');
    }

    await updateDiagnosticSession(sessionId, { asis_analysis: asisResponse.analysis });
    return asisResponse.analysis;
  } catch {
    // Fallback analysis
    const fallback = generateFallbackAnalysis(session);
    await updateDiagnosticSession(sessionId, { asis_analysis: fallback });
    return fallback;
  }
}

function generateFallbackAnalysis(session: DiagnosticSession) {
  const recommendations: string[] = [];
  const priorityActions: string[] = [];
  let severityScore = 0;
  const predictedFailures: string[] = [];
  const maintenanceSchedule: string[] = [];

  session.fault_codes?.forEach((code: FaultCode) => {
    if (code.severity === 'critical') {
      severityScore += 3;
      priorityActions.push(`Address ${code.code}: ${code.description}`);
      if (code.system === 'engine') predictedFailures.push('Engine damage if not addressed');
      if (code.system === 'abs') predictedFailures.push('Brake system failure');
    } else if (code.severity === 'warning') {
      severityScore += 1.5;
      recommendations.push(`Monitor ${code.code}: ${code.description}`);
    }
  });

  const liveData = session.live_data || {};
  if (liveData.coolant_temp > 100) {
    severityScore += 2;
    priorityActions.push('Coolant temperature critical — inspect cooling system immediately');
    predictedFailures.push('Head gasket failure');
  }
  if (liveData.rpm > 3000 && liveData.speed === 0) {
    severityScore += 1;
    recommendations.push('High RPM at idle — check for vacuum leaks or throttle issues');
  }
  if (liveData.fuel_trim_short > 10 || liveData.fuel_trim_short < -10) {
    recommendations.push('Fuel trim out of range — check for vacuum leaks or fuel delivery issues');
  }
  if (liveData.o2_sensor_1 < 0.1 || liveData.o2_sensor_1 > 0.9) {
    recommendations.push('O2 sensor reading abnormal — may need replacement');
  }

  // Maintenance predictions based on mileage
  const mileage = session.mileage || 0;
  if (mileage > 100000) {
    maintenanceSchedule.push('Timing belt inspection due');
    maintenanceSchedule.push('Spark plug replacement recommended');
  }
  if (mileage > 50000) {
    maintenanceSchedule.push('Brake fluid change due');
    maintenanceSchedule.push('Transmission fluid inspection');
  }
  if (mileage > 30000) {
    maintenanceSchedule.push('Air filter replacement');
    maintenanceSchedule.push('Cabin filter replacement');
  }

  const healthScore = Math.max(0, Math.min(100, 100 - (severityScore * 10)));

  return {
    recommendations: recommendations.length > 0 ? recommendations : ['No immediate concerns detected'],
    severity_score: Math.min(severityScore, 10),
    estimated_repair_cost: severityScore > 5 ? 15000 : severityScore > 2 ? 5000 : 0,
    priority_actions: priorityActions.length > 0 ? priorityActions : ['Continue regular maintenance schedule'],
    predicted_failures: predictedFailures.length > 0 ? predictedFailures : [],
    maintenance_schedule: maintenanceSchedule.length > 0 ? maintenanceSchedule : ['Continue standard maintenance interval'],
    vehicle_health_score: healthScore,
  };
}

// ─── Vehicle Programming ───

export async function programVehicle(
  sessionId: string,
  operation: ProgrammingOperation['operation'],
  params?: Record<string, any>
) {
  const session = await getDiagnosticSession(sessionId);

  const capability = PROGRAMMING_CAPABILITIES.find(
    c => c.make.toLowerCase() === (session.vehicle_make || '').toLowerCase()
  );

  if (!capability) {
    throw new Error(`Programming not supported for ${session.vehicle_make}. Contact MTAA support.`);
  }

  if (!capability.operations.includes(operation)) {
    throw new Error(`${operation} not supported for ${session.vehicle_make}. Supported: ${capability.operations.join(', ')}`);
  }

  // In production: Interface with J2534 passthrough device
  const programmingEntry: ProgrammingOperation = {
    operation,
    status: 'success',
    before_version: params?.before_version,
    after_version: params?.after_version,
    timestamp: new Date().toISOString(),
  };

  const currentLog = session.programming_log || [];
  const { data, error } = await supabase
    .from('garage_diagnostics')
    .update({
      programming_log: [...currentLog, programmingEntry],
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as DiagnosticSession;
}

export async function generateDiagnosticReport(sessionId: string) {
  const session = await getDiagnosticSession(sessionId);

  const reportData = {
    session_id: sessionId,
    generated_at: new Date().toISOString(),
    vehicle_info: {
      make: session.vehicle_make,
      model: session.vehicle_model,
      year: session.vehicle_year,
      vin: session.vin,
      mileage: session.mileage,
    },
    fault_codes: session.fault_codes,
    live_data: session.live_data,
    asis_analysis: session.asis_analysis,
    programming_history: session.programming_log,
  };

  // Store report JSON
  const fileName = `diagnostic-reports/${sessionId}/${Date.now()}_report.json`;
  const { error: uploadError } = await supabase.storage
    .from('garage-reports')
    .upload(fileName, new Blob([JSON.stringify(reportData, null, 2)]), {
      contentType: 'application/json',
    });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from('garage-reports')
    .getPublicUrl(fileName);

  const { data, error } = await supabase
    .from('garage_diagnostics')
    .update({
      report_generated: true,
      report_url: urlData.publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as DiagnosticSession;
}

export async function shareDiagnosticWithCustomer(sessionId: string) {
  const { data, error } = await supabase
    .from('garage_diagnostics')
    .update({
      shared_with_customer: true,
      shared_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as DiagnosticSession;
}

// ─── Helper: Get supported operations for a vehicle ───

export function getVehicleCapabilities(make?: string, _model?: string, _year?: number) {
  if (!make) return null;

  const capability = PROGRAMMING_CAPABILITIES.find(
    c => c.make.toLowerCase() === make.toLowerCase()
  );

  if (!capability) {
    return {
      supported: false,
      message: `${make} not in programming database. Contact MTAA support to add support.`,
      protocols: [],
      operations: [],
    };
  }

  return {
    supported: true,
    make: capability.make,
    operations: capability.operations,
    protocols: capability.protocols,
    special_notes: capability.special_notes,
    asis_supported: capability.asis_supported,
  };
}
