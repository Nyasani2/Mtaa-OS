import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

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

const webStore = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try { return localStorage.getItem(key); } catch { return null; }
    }
    try { return await SecureStore.getItemAsync(key); } catch { return null; }
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try { localStorage.setItem(key, value); } catch {}
      return;
    }
    try { await SecureStore.setItemAsync(key, value); } catch {}
  },
  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try { localStorage.removeItem(key); } catch {}
      return;
    }
    try { await SecureStore.deleteItemAsync(key); } catch {}
  },
};

export async function getEmergencyData(): Promise<EmergencyData | null> {
  try {
    const raw = await webStore.getItem(EMERGENCY_DATA_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
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
