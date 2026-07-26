import { Platform } from 'react-native';

// Lazy-load SecureStore to prevent web crash on module import
let SecureStore: any = null;
try {
// eslint-disable-next-line @typescript-eslint/no-var-requires
  SecureStore = require('expo-secure-store');
} catch {
  // Web or missing module
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface EmergencyData {
  fullName: string;
  bloodGroup: string;
  allergies: string[];
  chronicConditions: string[];
  currentCriticalMedications: string[];
  emergencyContacts: EmergencyContact[];
  organDonor: boolean;
  heightCm?: number;
  weightKg?: number;
}

const EMERGENCY_DATA_KEY = 'health_emergency_data';

// Unified storage
const webStore = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try { return localStorage.getItem(key); } catch (e: any) { console.error("[EmergencyCard] Storage read failed:", e?.message || e); return null; }
    }
    if (SecureStore?.getItemAsync) {
      try { return await SecureStore.getItemAsync(key); } catch (e: any) { console.error("[EmergencyCard] Storage read failed:", e?.message || e); return null; }
    }
    return null;
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try { localStorage.setItem(key, value); } catch (e: any) { console.error("[EmergencyCard] Storage write failed:", e?.message || e); }
      return;
    }
    if (SecureStore?.setItemAsync) {
      try { await SecureStore.setItemAsync(key, value); } catch (e: any) { console.error("[EmergencyCard] Storage write failed:", e?.message || e); }
    }
  },
  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try { localStorage.removeItem(key); } catch (e: any) { console.error("[EmergencyCard] Storage delete failed:", e?.message || e); }
      return;
    }
    if (SecureStore?.deleteItemAsync) {
      try { await SecureStore.deleteItemAsync(key); } catch (e: any) { console.error("[EmergencyCard] Storage delete failed:", e?.message || e); }
    }
  },
};

export async function getEmergencyData(): Promise<EmergencyData | null> {
  try {
    const raw = await webStore.getItem(EMERGENCY_DATA_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e: any) { console.error("[EmergencyCard] Operation failed:", e?.message || e); }
  return null;
}

export async function updateEmergencyData(data: EmergencyData): Promise<void> {
  await webStore.setItem(EMERGENCY_DATA_KEY, JSON.stringify(data));
}

export async function hasEmergencyData(): Promise<boolean> {
  const data = await getEmergencyData();
  return !!data && !!data.fullName && !!data.bloodGroup;
}

export async function clearEmergencyData(): Promise<void> {
  await webStore.deleteItem(EMERGENCY_DATA_KEY);
}

export function validateEmergencyData(data: Partial<EmergencyData>): string[] {
  const errors: string[] = [];
  if (!data.fullName?.trim()) errors.push('Full name is required');
  if (!data.bloodGroup?.trim()) errors.push('Blood group is required');
  if (!data.emergencyContacts?.length) errors.push('At least one emergency contact is required');
  for (const contact of data.emergencyContacts || []) {
    if (!contact.name?.trim()) errors.push('Contact name is required');
    if (!contact.phone?.trim()) errors.push('Contact phone is required');
  }
  return errors;
}