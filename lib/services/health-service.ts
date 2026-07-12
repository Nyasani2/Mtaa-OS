
  if (error) return handleError(error, []);
  return data || [];
}

export async function createSHAClaim(data: Partial<SHAClaim>): Promise<SHAClaim | null> {
  const { data: result, error } = await supabase.from('health_sha_claims').insert(data).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function updateSHAClaim(id: string, data: Partial<SHAClaim>): Promise<SHAClaim | null> {
  const { data: result, error } = await supabase.from('health_sha_claims').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteSHAClaim(id: string): Promise<boolean> {
  const { error } = await supabase.from('health_sha_claims').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

// ─── SHA CONTRIBUTORS ───

export async function getSHAContributors(): Promise<SHAContributor[]> {
  const { data, error } = await supabase.from('health_sha_contributors').select('*');
  if (error) return handleError(error, []);
  return data || [];
}

export async function createSHAContributor(data: Partial<SHAContributor>): Promise<SHAContributor | null> {
  const { data: result, error } = await supabase.from('health_sha_contributors').insert(data).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function updateSHAContributor(id: string, data: Partial<SHAContributor>): Promise<SHAContributor | null> {
  const { data: result, error } = await supabase.from('health_sha_contributors').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteSHAContributor(id: string): Promise<boolean> {
  const { error } = await supabase.from('health_sha_contributors').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

// ─── AMBULANCE ───

export async function getAmbulanceVehicles(): Promise<AmbulanceVehicle[]> {
  const { data, error } = await supabase.from('health_ambulance_vehicles').select('*');
  if (error) return handleError(error, []);
  return data || [];
}

export async function getAmbulanceVehicleById(id: string): Promise<AmbulanceVehicle | null> {
  const { data, error } = await supabase.from('health_ambulance_vehicles').select('*').eq('id', id).single();
  if (error) return handleError(error, null);
  return data;
}

export async function createAmbulanceVehicle(data: Partial<AmbulanceVehicle>): Promise<AmbulanceVehicle | null> {
  const { data: result, error } = await supabase.from('health_ambulance_vehicles').insert(data).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function updateAmbulanceVehicle(id: string, data: Partial<AmbulanceVehicle>): Promise<AmbulanceVehicle | null> {
  const { data: result, error } = await supabase.from('health_ambulance_vehicles').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteAmbulanceVehicle(id: string): Promise<boolean> {
  const { error } = await supabase.from('health_ambulance_vehicles').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

export async function getAmbulanceRequests(): Promise<AmbulanceRequest[]> {
  const { data, error } = await supabase.from('health_ambulance_requests').select('*').order('created_at', { ascending: false });
  if (error) return handleError(error, []);
  return data || [];
}

export async function getAmbulanceRequestById(id: string): Promise<AmbulanceRequest | null> {
  const { data, error } = await supabase.from('health_ambulance_requests').select('*').eq('id', id).single();
  if (error) return handleError(error, null);
  return data;
}

export async function createAmbulanceRequest(data: Partial<AmbulanceRequest>): Promise<AmbulanceRequest | null> {
  const { data: result, error } = await supabase.from('health_ambulance_requests').insert(data).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function updateAmbulanceRequest(id: string, data: Partial<AmbulanceRequest>): Promise<AmbulanceRequest | null> {
  const { data: result, error } = await supabase.from('health_ambulance_requests').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteAmbulanceRequest(id: string): Promise<boolean> {
  const { error } = await supabase.from('health_ambulance_requests').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

export async function getAmbulanceDispatches(): Promise<AmbulanceDispatch[]> {
  const { data, error } = await supabase.from('health_ambulance_dispatches').select('*');
  if (error) return handleError(error, []);
  return data || [];
}

export async function createAmbulanceDispatch(data: Partial<AmbulanceDispatch>): Promise<AmbulanceDispatch | null> {
  const { data: result, error } = await supabase.from('health_ambulance_dispatches').insert(data).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function updateAmbulanceDispatch(id: string, data: Partial<AmbulanceDispatch>): Promise<AmbulanceDispatch | null> {
  const { data: result, error } = await supabase.from('health_ambulance_dispatches').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteAmbulanceDispatch(id: string): Promise<boolean> {
  const { error } = await supabase.from('health_ambulance_dispatches').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

export async function getAmbulanceLogs(): Promise<AmbulanceLog[]> {
  const { data, error } = await supabase.from('health_ambulance_logs').select('*');
  if (error) return handleError(error, []);
  return data || [];
}

export async function createAmbulanceLog(data: Partial<AmbulanceLog>): Promise<AmbulanceLog | null> {
  const { data: result, error } = await supabase.from('health_ambulance_logs').insert(data).select().single();
  if (error) return handleError(error, null);
  return result;
}

// ─── QUEUES ───

export async function getPatientQueues(): Promise<PatientQueue[]> {
  const { data, error } = await supabase.from('health_patient_queues').select('*').order('priority', { ascending: true });
  if (error) return handleError(error, []);
  return data || [];
}

export async function getPatientQueueById(id: string): Promise<PatientQueue | null> {
  const { data, error } = await supabase.from('health_patient_queues').select('*').eq('id', id).single();
  if (error) return handleError(error, null);
  return data;
}

export async function createPatientQueue(data: Partial<PatientQueue>): Promise<PatientQueue | null> {
  const { data: result, error } = await supabase.from('health_patient_queues').insert(data).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function updatePatientQueue(id: string, data: Partial<PatientQueue>): Promise<PatientQueue | null> {
  const { data: result, error } = await supabase.from('health_patient_queues').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function deletePatientQueue(id: string): Promise<boolean> {
  const { error } = await supabase.from('health_patient_queues').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

export async function getQueues(): Promise<Queue[]> {
  const { data, error } = await supabase.from('health_queues').select('*');
  if (error) return handleError(error, []);
  return data || [];
}

export async function createQueue(data: Partial<Queue>): Promise<Queue | null> {
  const { data: result, error } = await supabase.from('health_queues').insert(data).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function updateQueue(id: string, data: Partial<Queue>): Promise<Queue | null> {
  const { data: result, error } = await supabase.from('health_queues').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteQueue(id: string): Promise<boolean> {
  const { error } = await supabase.from('health_queues').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

// ─── CHECK INS ───

export async function getCheckIns(): Promise<CheckIn[]> {
  const { data, error } = await supabase.from('health_check_ins').select('*');
  if (error) return handleError(error, []);
  return data || [];
}

export async function getPatientCheckIns(patientId: string): Promise<CheckIn[]> {
  const { data, error } = await supabase.from('health_check_ins').select('*').eq('patient_id', patientId);
  if (error) return handleError(error, []);
  return data || [];
}

export async function createCheckIn(data: Partial<CheckIn>): Promise<CheckIn | null> {
  const { data: result, error } = await supabase.from('health_check_ins').insert(data).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function updateCheckIn(id: string, data: Partial<CheckIn>): Promise<CheckIn | null> {
  const { data: result, error } = await supabase.from('health_check_ins').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteCheckIn(id: string): Promise<boolean> {
  const { error } = await supabase.from('health_check_ins').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

// ─── FACILITIES ───

export async function getFacilities(): Promise<Facility[]> {
  const { data, error } = await supabase.from('health_facilities').select('*');
  if (error) return handleError(error, []);
  return data || [];
}

export async function getFacilityById(id: string): Promise<Facility | null> {
  const { data, error } = await supabase.from('health_facilities').select('*').eq('id', id).single();
  if (error) return handleError(error, null);
  return data;
}

export async function createFacility(data: Partial<Facility>): Promise<Facility | null> {
  const { data: result, error } = await supabase.from('health_facilities').insert(data).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function updateFacility(id: string, data: Partial<Facility>): Promise<Facility | null> {
  const { data: result, error } = await supabase.from('health_facilities').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteFacility(id: string): Promise<boolean> {
  const { error } = await supabase.from('health_facilities').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

export async function getFacilityAdmins(): Promise<FacilityAdmin[]> {
  const { data, error } = await supabase.from('health_facility_admins').select('*');
  if (error) return handleError(error, []);
  return data || [];
}

export async function createFacilityAdmin(data: Partial<FacilityAdmin>): Promise<FacilityAdmin | null> {
  const { data: result, error } = await supabase.from('health_facility_admins').insert(data).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function updateFacilityAdmin(id: string, data: Partial<FacilityAdmin>): Promise<FacilityAdmin | null> {
  const { data: result, error } = await supabase.from('health_facility_admins').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteFacilityAdmin(id: string): Promise<boolean> {
  const { error } = await supabase.from('health_facility_admins').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

// ─── ALERTS ───

export async function getAlerts(): Promise<Alert[]> {
  const { data, error } = await supabase.from('health_alerts').select('*').eq('status', 'active').order('created_at', { ascending: false });
  if (error) return handleError(error, []);
  return data || [];
}

export async function getAlertById(id: string): Promise<Alert | null> {
  const { data, error } = await supabase.from('health_alerts').select('*').eq('id', id).single();
  if (error) return handleError(error, null);
  return data;
}

export async function createAlert(data: Partial<Alert>): Promise<Alert | null> {
  const { data: result, error } = await supabase.from('health_alerts').insert(data).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function updateAlert(id: string, data: Partial<Alert>): Promise<Alert | null> {
  const { data: result, error } = await supabase.from('health_alerts').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function resolveAlert(id: string): Promise<Alert | null> {
  return updateAlert(id, { status: 'resolved', resolved_at: new Date().toISOString() });
}

export async function deleteAlert(id: string): Promise<boolean> {
  const { error } = await supabase.from('health_alerts').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

// ─── AUDIT LOGS ───

export async function getAuditLogs(): Promise<AuditLog[]> {
  const { data, error } = await supabase.from('health_audit_log').select('*').order('created_at', { ascending: false });
  if (error) return handleError(error, []);
  return data || [];
}

export async function createAuditLog(data: Partial<AuditLog>): Promise<AuditLog | null> {
  const { data: result, error } = await supabase.from('health_audit_log').insert(data).select().single();
  if (error) return handleError(error, null);
  return result;
}

// ─── PRACTITIONERS ───

export async function getPractitioners(): Promise<Practitioner[]> {
  const { data, error } = await supabase.from('health_practitioners').select('*');
  if (error) return handleError(error, []);
  return data || [];
}

export async function getPractitionerById(id: string): Promise<Practitioner | null> {
  const { data, error } = await supabase.from('health_practitioners').select('*').eq('id', id).single();
  if (error) return handleError(error, null);
  return data;
}

export async function createPractitioner(data: Partial<Practitioner>): Promise<Practitioner | null> {
  const { data: result, error } = await supabase.from('health_practitioners').insert(data).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function updatePractitioner(id: string, data: Partial<Practitioner>): Promise<Practitioner | null> {
  const { data: result, error } = await supabase.from('health_practitioners').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function deletePractitioner(id: string): Promise<boolean> {
  const { error } = await supabase.from('health_practitioners').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

// ─── WALLET TRANSACTIONS ───

export async function getHealthWalletTransactions(): Promise<WalletTransaction[]> {
  const { data, error } = await supabase.from('health_wallet_transactions').select('*');
  if (error) return handleError(error, []);
  return data || [];
}

export async function createHealthWalletTransaction(data: Partial<WalletTransaction>): Promise<WalletTransaction | null> {
  const { data: result, error } = await supabase.from('health_wallet_transactions').insert(data).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function updateHealthWalletTransaction(id: string, data: Partial<WalletTransaction>): Promise<WalletTransaction | null> {
  const { data: result, error } = await supabase.from('health_wallet_transactions').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null);
  return result;
}

export async function deleteHealthWalletTransaction(id: string): Promise<boolean> {
  const { error } = await supabase.from('health_wallet_transactions').delete().eq('id', id);
  if (error) return handleError(error, false);
  return true;
}

// ─── STATS ───

export async function getHealthStats(): Promise<any> {
  const { count: patients } = await supabase.from('health_patients').select('*', { count: 'exact', head: true });
  const { count: doctors } = await supabase.from('health_doctors').select('*', { count: 'exact', head: true });
  const { count: hospitals } = await supabase.from('health_hospitals').select('*', { count: 'exact', head: true });
  const { count: appointments } = await supabase.from('health_appointments').select('*', { count: 'exact', head: true });
  const { count: admissions } = await supabase.from('health_admissions').select('*', { count: 'exact', head: true });
  return { patients, doctors, hospitals, appointments, admissions };
}
