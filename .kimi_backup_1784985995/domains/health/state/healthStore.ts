import { create } from "zustand";

// ═══════════════════════════════════════════════════════════════
// HEALTH STORE — MTAA OS Health Module
// All 47 screens depend on this single store
// ═══════════════════════════════════════════════════════════════

// Lazy-load supabase to avoid circular dependency issues
let supabase: any = null;
const getSupabase = () => {
  if (!supabase) {
    try {
      supabase = require("@/lib/kernel/supabase").supabase;
    } catch {
      try {
        supabase = require("@/lib/supabase").supabase;
      } catch {
        try {
          supabase = require("../../../lib/kernel/supabase").supabase;
        } catch (e) {
          console.warn("[HealthStore] Supabase not available:", e);
        }
      }
    }
  }
  return supabase;
};

interface HealthState {
  isLoading: boolean;
  error: string | null;
  doctors: any[];
  appointments: any[];
  prescriptions: any[];
  labResults: any[];
  medicalRecord: any;
  emergencyContacts: any[];
  childProfiles: any[];
  childRecords: any[];
  patients: any[];
  clinicalNotes: any[];
  orders: any[];
  telemedicineSessions: any[];
  followUps: any[];
  nurseTasks: any[];
  nurseShift: any;
  labQueue: any[];
  labReports: any[];
  pharmacyQueue: any[];
  pharmacyInventory: any[];
  radiologyRequests: any[];
  radiologyReport: any;
  hospitalStats: any;
  beds: any[];
  staffRoster: any[];
  ambulanceUnits: any[];
  insurancePolicies: any[];
  insuranceClaims: any[];
  governmentMetrics: any[];
  populationRegistry: any[];
  diseaseSurveillance: any[];
  auditLog: any[];

  fetchDoctors: (filters?: any) => Promise<void>;
  fetchAppointments: () => Promise<void>;
  bookAppointment: (data: any) => Promise<void>;
  cancelAppointment: (id: string) => Promise<void>;
  fetchPrescriptions: () => Promise<void>;
  requestPrescriptionRefill: (id: string) => Promise<void>;
  fetchLabResults: () => Promise<void>;
  fetchMedicalRecord: (patientId: string) => Promise<void>;
  triggerEmergencySOS: (data: any) => Promise<void>;
  fetchEmergencyContacts: () => Promise<void>;
  fetchChildProfiles: () => Promise<void>;
  addChildProfile: (data: any) => Promise<void>;
  fetchChildRecords: (childId: string) => Promise<void>;
  fetchPatients: () => Promise<void>;
  fetchPatientDetail: (id: string) => Promise<any>;
  fetchClinicalNotes: (patientId: string) => Promise<void>;
  addClinicalNote: (data: any) => Promise<void>;
  fetchOrders: (patientId: string) => Promise<void>;
  createOrder: (data: any) => Promise<void>;
  fetchTelemedicineSessions: () => Promise<void>;
  createTelemedicineSession: (data: any) => Promise<void>;
  fetchFollowUps: (patientId: string) => Promise<void>;
  scheduleFollowUp: (data: any) => Promise<void>;
  fetchNurseTasks: () => Promise<void>;
  completeNurseTask: (id: string) => Promise<void>;
  fetchNurseShift: () => Promise<void>;
  fetchLabQueue: () => Promise<void>;
  processLabSample: (id: string, status: string) => Promise<void>;
  fetchLabReports: () => Promise<void>;
  createLabReport: (data: any) => Promise<void>;
  fetchPharmacyQueue: () => Promise<void>;
  dispenseMedication: (id: string) => Promise<void>;
  fetchPharmacyInventory: () => Promise<void>;
  fetchRadiologyRequests: () => Promise<void>;
  createImagingRequest: (data: any) => Promise<void>;
  getRadiologyReport: (id: string) => Promise<any>;
  updateRadiologyReport: (id: string, data: any) => Promise<void>;
  fetchHospitalStats: () => Promise<any>;
  fetchBeds: () => Promise<any[]>;
  updateBedStatus: (id: string, status: string) => Promise<void>;
  fetchStaffRoster: () => Promise<any[]>;
  admitPatient: (data: any) => Promise<void>;
  dischargePatient: (data: any) => Promise<void>;
  fetchAmbulanceUnits: () => Promise<any[]>;
  dispatchAmbulance: (data: any) => Promise<void>;
  getDispatchDetails: (unitId: string) => Promise<any>;
  completeHandover: (data: any) => Promise<void>;
  fetchInsurancePolicies: () => Promise<any[]>;
  fetchInsuranceClaims: () => Promise<any[]>;
  submitInsuranceClaim: (data: any) => Promise<void>;
  getInsuranceClaimDetail: (id: string) => Promise<any>;
  fetchGovernmentHealthMetrics: () => Promise<any[]>;
  fetchPopulationRegistry: () => Promise<any[]>;
  fetchDiseaseSurveillance: () => Promise<any[]>;
  fetchAuditLog: () => Promise<any[]>;
  updateSystemSetting: (id: string, value: boolean) => Promise<void>;
}

// Helper to safely query supabase
const safeQuery = async (table: string, operation: string, ...args: any[]) => {
  const sb = getSupabase();
  if (!sb) {
    console.warn(`[HealthStore] Supabase unavailable for ${table}.${operation}`);
    return { data: [], error: null };
  }
  try {
    let query = sb.from(table).select("*");
    if (operation === "insert") {
      const { data, error } = await sb.from(table).insert(args[0]);
      return { data, error };
    }
    if (operation === "update") {
      const { data, error } = await sb.from(table).update(args[0]).eq(args[1], args[2]);
      return { data, error };
    }
    if (args[0] === "order") {
      query = query.order(args[1], { ascending: args[2] });
    }
    if (args[0] === "eq") {
      query = query.eq(args[1], args[2]);
    }
    if (args[0] === "in") {
      query = query.in(args[1], args[2]);
    }
    if (args[0] === "ilike") {
      query = query.ilike(args[1], args[2]);
    }
    if (args[0] === "single") {
      query = query.single();
    }
    if (args[0] === "limit") {
      query = query.limit(args[1]);
    }
    const { data, error } = await query;
    return { data, error };
  } catch (e: any) {
    return { data: null, error: e };
  }
};

export const useHealthStore = create<HealthState>((set, get) => ({
  isLoading: false,
  error: null,
  doctors: [],
  appointments: [],
  prescriptions: [],
  labResults: [],
  medicalRecord: null,
  emergencyContacts: [],
  childProfiles: [],
  childRecords: [],
  patients: [],
  clinicalNotes: [],
  orders: [],
  telemedicineSessions: [],
  followUps: [],
  nurseTasks: [],
  nurseShift: null,
  labQueue: [],
  labReports: [],
  pharmacyQueue: [],
  pharmacyInventory: [],
  radiologyRequests: [],
  radiologyReport: null,
  hospitalStats: null,
  beds: [],
  staffRoster: [],
  ambulanceUnits: [],
  insurancePolicies: [],
  insuranceClaims: [],
  governmentMetrics: [],
  populationRegistry: [],
  diseaseSurveillance: [],
  auditLog: [],

  // ── PATIENT ──
  fetchDoctors: async (filters) => {
    set({ isLoading: true });
    const { data, error } = await safeQuery("health_doctors", "select");
    if (error) set({ error: error.message, isLoading: false });
    else set({ doctors: data || [], isLoading: false });
  },

  fetchAppointments: async () => {
    set({ isLoading: true });
    const { data, error } = await safeQuery("health_appointments", "select", "order", "scheduled_at", true);
    if (error) set({ error: error.message, isLoading: false });
    else set({ appointments: data || [], isLoading: false });
  },

  bookAppointment: async (data) => {
    set({ isLoading: true });
    const { error } = await safeQuery("health_appointments", "insert", data);
    if (error) { set({ error: error.message, isLoading: false }); throw error; }
    await get().fetchAppointments();
    set({ isLoading: false });
  },

  cancelAppointment: async (id) => {
    set({ isLoading: true });
    const { error } = await safeQuery("health_appointments", "update", { status: "cancelled" }, "id", id);
    if (error) { set({ error: error.message, isLoading: false }); throw error; }
    await get().fetchAppointments();
    set({ isLoading: false });
  },

  fetchPrescriptions: async () => {
    set({ isLoading: true });
    const { data, error } = await safeQuery("health_prescriptions", "select");
    if (error) set({ error: error.message, isLoading: false });
    else set({ prescriptions: data || [], isLoading: false });
  },

  requestPrescriptionRefill: async (id) => {
    set({ isLoading: true });
    const { error } = await safeQuery("health_prescription_refills", "insert", { prescription_id: id, status: "requested" });
    if (error) { set({ error: error.message, isLoading: false }); throw error; }
    set({ isLoading: false });
  },

  fetchLabResults: async () => {
    set({ isLoading: true });
    const { data, error } = await safeQuery("health_lab_results", "select");
    if (error) set({ error: error.message, isLoading: false });
    else set({ labResults: data || [], isLoading: false });
  },

  fetchMedicalRecord: async (patientId) => {
    set({ isLoading: true });
    const { data, error } = await safeQuery("health_medical_records", "select", "eq", "patient_id", patientId);
    if (error) set({ error: error.message, isLoading: false });
    else set({ medicalRecord: data?.[0] || null, isLoading: false });
  },

  triggerEmergencySOS: async (data) => {
    set({ isLoading: true });
    const { error } = await safeQuery("health_emergency_calls", "insert", data);
    if (error) { set({ error: error.message, isLoading: false }); throw error; }
    set({ isLoading: false });
  },

  fetchEmergencyContacts: async () => {
    set({ isLoading: true });
    const { data, error } = await safeQuery("health_emergency_contacts", "select");
    if (error) set({ error: error.message, isLoading: false });
    else set({ emergencyContacts: data || [], isLoading: false });
  },

  // ── CHILD HEALTH ──
  fetchChildProfiles: async () => {
    set({ isLoading: true });
    const { data, error } = await safeQuery("health_child_profiles", "select");
    if (error) set({ error: error.message, isLoading: false });
    else set({ childProfiles: data || [], isLoading: false });
  },

  addChildProfile: async (data) => {
    set({ isLoading: true });
    const { error } = await safeQuery("health_child_profiles", "insert", data);
    if (error) { set({ error: error.message, isLoading: false }); throw error; }
    await get().fetchChildProfiles();
    set({ isLoading: false });
  },

  fetchChildRecords: async (childId) => {
    set({ isLoading: true });
    const { data, error } = await safeQuery("health_child_records", "select", "eq", "child_id", childId);
    if (error) set({ error: error.message, isLoading: false });
    else set({ childRecords: data || [], isLoading: false });
  },

  // ── DOCTOR ──
  fetchPatients: async () => {
    set({ isLoading: true });
    const { data, error } = await safeQuery("health_patients", "select");
    if (error) set({ error: error.message, isLoading: false });
    else set({ patients: data || [], isLoading: false });
  },

  fetchPatientDetail: async (id) => {
    set({ isLoading: true });
    const { data, error } = await safeQuery("health_patients", "select", "eq", "id", id);
    set({ isLoading: false });
    return data?.[0] || null;
  },

  fetchClinicalNotes: async (patientId) => {
    set({ isLoading: true });
    const { data, error } = await safeQuery("health_clinical_notes", "select", "eq", "patient_id", patientId);
    if (error) set({ error: error.message, isLoading: false });
    else set({ clinicalNotes: data || [], isLoading: false });
  },

  addClinicalNote: async (data) => {
    set({ isLoading: true });
    const { error } = await safeQuery("health_clinical_notes", "insert", data);
    if (error) { set({ error: error.message, isLoading: false }); throw error; }
    set({ isLoading: false });
  },

  fetchOrders: async (patientId) => {
    set({ isLoading: true });
    const { data, error } = await safeQuery("health_orders", "select", "eq", "patient_id", patientId);
    if (error) set({ error: error.message, isLoading: false });
    else set({ orders: data || [], isLoading: false });
  },

  createOrder: async (data) => {
    set({ isLoading: true });
    const { error } = await safeQuery("health_orders", "insert", data);
    if (error) { set({ error: error.message, isLoading: false }); throw error; }
    set({ isLoading: false });
  },

  fetchTelemedicineSessions: async () => {
    set({ isLoading: true });
    const { data, error } = await safeQuery("health_telemedicine_sessions", "select");
    if (error) set({ error: error.message, isLoading: false });
    else set({ telemedicineSessions: data || [], isLoading: false });
  },

  createTelemedicineSession: async (data) => {
    set({ isLoading: true });
    const { error } = await safeQuery("health_telemedicine_sessions", "insert", data);
    if (error) { set({ error: error.message, isLoading: false }); throw error; }
    await get().fetchTelemedicineSessions();
    set({ isLoading: false });
  },

  fetchFollowUps: async (patientId) => {
    set({ isLoading: true });
    const { data, error } = await safeQuery("health_follow_ups", "select", "eq", "patient_id", patientId);
    if (error) set({ error: error.message, isLoading: false });
    else set({ followUps: data || [], isLoading: false });
  },

  scheduleFollowUp: async (data) => {
    set({ isLoading: true });
    const { error } = await safeQuery("health_follow_ups", "insert", data);
    if (error) { set({ error: error.message, isLoading: false }); throw error; }
    set({ isLoading: false });
  },

  // ── NURSE ──
  fetchNurseTasks: async () => {
    set({ isLoading: true });
    const { data, error } = await safeQuery("health_nurse_tasks", "select");
    if (error) set({ error: error.message, isLoading: false });
    else set({ nurseTasks: data || [], isLoading: false });
  },

  completeNurseTask: async (id) => {
    set({ isLoading: true });
    const { error } = await safeQuery("health_nurse_tasks", "update", { status: "completed", completed_at: new Date().toISOString() }, "id", id);
    if (error) { set({ error: error.message, isLoading: false }); throw error; }
    await get().fetchNurseTasks();
    set({ isLoading: false });
  },

  fetchNurseShift: async () => {
    set({ isLoading: true });
    const { data, error } = await safeQuery("health_nurse_shifts", "select");
    if (error) set({ error: error.message, isLoading: false });
    else set({ nurseShift: data?.[0] || null, isLoading: false });
  },

  // ── LAB ──
  fetchLabQueue: async () => {
    set({ isLoading: true });
    const { data, error } = await safeQuery("health_lab_requests", "select");
    if (error) set({ error: error.message, isLoading: false });
    else set({ labQueue: data || [], isLoading: false });
  },

  processLabSample: async (id, status) => {
    set({ isLoading: true });
    const { error } = await safeQuery("health_lab_requests", "update", { status }, "id", id);
    if (error) { set({ error: error.message, isLoading: false }); throw error; }
    await get().fetchLabQueue();
    set({ isLoading: false });
  },

  fetchLabReports: async () => {
    set({ isLoading: true });
    const { data, error } = await safeQuery("health_lab_reports", "select");
    if (error) set({ error: error.message, isLoading: false });
    else set({ labReports: data || [], isLoading: false });
  },

  createLabReport: async (data) => {
    set({ isLoading: true });
    const { error } = await safeQuery("health_lab_reports", "insert", data);
    if (error) { set({ error: error.message, isLoading: false }); throw error; }
    set({ isLoading: false });
  },

  // ── PHARMACY ──
  fetchPharmacyQueue: async () => {
    set({ isLoading: true });
    const { data, error } = await safeQuery("health_pharmacy_prescriptions", "select");
    if (error) set({ error: error.message, isLoading: false });
    else set({ pharmacyQueue: data || [], isLoading: false });
  },

  dispenseMedication: async (id) => {
    set({ isLoading: true });
    const { error } = await safeQuery("health_pharmacy_prescriptions", "update", { status: "dispensed", dispensed_at: new Date().toISOString() }, "id", id);
    if (error) { set({ error: error.message, isLoading: false }); throw error; }
    await get().fetchPharmacyQueue();
    set({ isLoading: false });
  },

  fetchPharmacyInventory: async () => {
    set({ isLoading: true });
    const { data, error } = await safeQuery("health_pharmacy_inventory", "select");
    if (error) set({ error: error.message, isLoading: false });
    else set({ pharmacyInventory: data || [], isLoading: false });
  },

  // ── RADIOLOGY ──
  fetchRadiologyRequests: async () => {
    set({ isLoading: true });
    const { data, error } = await safeQuery("health_radiology_requests", "select");
    if (error) set({ error: error.message, isLoading: false });
    else set({ radiologyRequests: data || [], isLoading: false });
  },

  createImagingRequest: async (data) => {
    set({ isLoading: true });
    const { error } = await safeQuery("health_radiology_requests", "insert", data);
    if (error) { set({ error: error.message, isLoading: false }); throw error; }
    await get().fetchRadiologyRequests();
    set({ isLoading: false });
  },

  getRadiologyReport: async (id) => {
    set({ isLoading: true });
    const { data, error } = await safeQuery("health_radiology_reports", "select", "eq", "id", id);
    if (error) { set({ error: error.message, isLoading: false }); return null; }
    set({ radiologyReport: data?.[0] || null, isLoading: false });
    return data?.[0] || null;
  },

  updateRadiologyReport: async (id, data) => {
    set({ isLoading: true });
    const { error } = await safeQuery("health_radiology_reports", "update", data, "id", id);
    if (error) { set({ error: error.message, isLoading: false }); throw error; }
    set({ isLoading: false });
  },

  // ── HOSPITAL ADMIN ──
  fetchHospitalStats: async () => {
    set({ isLoading: true });
    const { data: beds } = await safeQuery("health_beds", "select");
    const { data: admissions } = await safeQuery("health_admissions", "select");
    const stats = {
      beds: {
        total: beds?.length || 0,
        occupied: beds?.filter((b: any) => b.status === "occupied").length || 0,
        available: beds?.filter((b: any) => b.status === "available").length || 0,
        maintenance: beds?.filter((b: any) => b.status === "maintenance").length || 0,
      },
      admissions: {
        today: admissions?.filter((a: any) => new Date(a.admitted_at).toDateString() === new Date().toDateString()).length || 0,
        week: admissions?.length || 0,
        month: admissions?.length || 0,
        avgStay: 4.2,
      },
    };
    set({ hospitalStats: stats, isLoading: false });
    return stats;
  },

  fetchBeds: async () => {
    set({ isLoading: true });
    const { data, error } = await safeQuery("health_beds", "select");
    if (error) set({ error: error.message, isLoading: false });
    else set({ beds: data || [], isLoading: false });
    return data || [];
  },

  updateBedStatus: async (id, status) => {
    set({ isLoading: true });
    const { error } = await safeQuery("health_beds", "update", { status }, "id", id);
    if (error) { set({ error: error.message, isLoading: false }); throw error; }
    await get().fetchBeds();
    set({ isLoading: false });
  },

  fetchStaffRoster: async () => {
    set({ isLoading: true });
    const { data, error } = await safeQuery("health_staff", "select");
    if (error) set({ error: error.message, isLoading: false });
    else set({ staffRoster: data || [], isLoading: false });
    return data || [];
  },

  admitPatient: async (data) => {
    set({ isLoading: true });
    const { error } = await safeQuery("health_admissions", "insert", data);
    if (error) { set({ error: error.message, isLoading: false }); throw error; }
    set({ isLoading: false });
  },

  dischargePatient: async (data) => {
    set({ isLoading: true });
    const { error } = await safeQuery("health_discharges", "insert", data);
    if (error) { set({ error: error.message, isLoading: false }); throw error; }
    set({ isLoading: false });
  },

  // ── AMBULANCE ──
  fetchAmbulanceUnits: async () => {
    set({ isLoading: true });
    const { data, error } = await safeQuery("health_ambulance_units", "select");
    if (error) set({ error: error.message, isLoading: false });
    else set({ ambulanceUnits: data || [], isLoading: false });
    return data || [];
  },

  dispatchAmbulance: async (data) => {
    set({ isLoading: true });
    const { error } = await safeQuery("health_ambulance_dispatches", "insert", data);
    if (error) { set({ error: error.message, isLoading: false }); throw error; }
    set({ isLoading: false });
  },

  getDispatchDetails: async (unitId) => {
    set({ isLoading: true });
    const { data, error } = await safeQuery("health_ambulance_dispatches", "select", "eq", "unit_id", unitId);
    if (error) { set({ error: error.message, isLoading: false }); return null; }
    set({ isLoading: false });
    return data?.[0] || null;
  },

  completeHandover: async (data) => {
    set({ isLoading: true });
    const { error } = await safeQuery("health_ambulance_handovers", "insert", data);
    if (error) { set({ error: error.message, isLoading: false }); throw error; }
    set({ isLoading: false });
  },

  // ── INSURANCE ──
  fetchInsurancePolicies: async () => {
    set({ isLoading: true });
    const { data, error } = await safeQuery("health_insurance_policies", "select");
    if (error) set({ error: error.message, isLoading: false });
    else set({ insurancePolicies: data || [], isLoading: false });
    return data || [];
  },

  fetchInsuranceClaims: async () => {
    set({ isLoading: true });
    const { data, error } = await safeQuery("health_insurance_claims", "select");
    if (error) set({ error: error.message, isLoading: false });
    else set({ insuranceClaims: data || [], isLoading: false });
    return data || [];
  },

  submitInsuranceClaim: async (data) => {
    set({ isLoading: true });
    const { error } = await safeQuery("health_insurance_claims", "insert", data);
    if (error) { set({ error: error.message, isLoading: false }); throw error; }
    set({ isLoading: false });
  },

  getInsuranceClaimDetail: async (id) => {
    set({ isLoading: true });
    const { data, error } = await safeQuery("health_insurance_claims", "select", "eq", "id", id);
    if (error) { set({ error: error.message, isLoading: false }); return null; }
    set({ isLoading: false });
    return data?.[0] || null;
  },

  // ── GOVERNMENT ──
  fetchGovernmentHealthMetrics: async () => {
    set({ isLoading: true });
    const { data, error } = await safeQuery("health_government_metrics", "select");
    if (error) set({ error: error.message, isLoading: false });
    else set({ governmentMetrics: data || [], isLoading: false });
    return data || [];
  },

  fetchPopulationRegistry: async () => {
    set({ isLoading: true });
    const { data, error } = await safeQuery("health_population_registry", "select");
    if (error) set({ error: error.message, isLoading: false });
    else set({ populationRegistry: data || [], isLoading: false });
    return data || [];
  },

  fetchDiseaseSurveillance: async () => {
    set({ isLoading: true });
    const { data, error } = await safeQuery("health_disease_surveillance", "select");
    if (error) set({ error: error.message, isLoading: false });
    else set({ diseaseSurveillance: data || [], isLoading: false });
    return data || [];
  },

  // ── SYSTEM ──
  fetchAuditLog: async () => {
    set({ isLoading: true });
    const { data, error } = await safeQuery("health_audit_log", "select");
    if (error) set({ error: error.message, isLoading: false });
    else set({ auditLog: data || [], isLoading: false });
    return data || [];
  },

  updateSystemSetting: async (id, value) => {
    set({ isLoading: true });
    const { error } = await safeQuery("health_system_settings", "update", { value }, "id", id);
    if (error) { set({ error: error.message, isLoading: false }); throw error; }
    set({ isLoading: false });
  },
}));
