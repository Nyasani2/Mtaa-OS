export type DeviceRequirement = 'standard' | 'kamo_hardware' | 'kamo_firmware';
export type FeatureStatus = 'live' | 'beta' | 'kamo_planned';

export interface FeatureCapability {
  id: string;
  name: string;
  description: string;
  requiredDevice: DeviceRequirement;
  status: FeatureStatus;
  fallbackMessage: string;
}

export const FEATURE_REGISTRY: Record<string, FeatureCapability> = {
  // --- EDUCATION FEATURES ---
  edu_feed: {
    id: 'edu_feed',
    name: 'Education Feed',
    description: 'View school announcements, homework, and class updates.',
    requiredDevice: 'standard',
    status: 'live',
    fallbackMessage: '',
  },
  edu_qr_checkin: {
    id: 'edu_qr_checkin',
    name: 'QR Attendance Check-in',
    description: 'Scan student QR codes for instant attendance tracking.',
    requiredDevice: 'standard',
    status: 'live',
    fallbackMessage: '',
  },
  edu_biometric_locker: {
    id: 'edu_biometric_locker',
    name: 'Biometric Exam Locker',
    description: 'Secure exam materials using advanced biometric verification.',
    requiredDevice: 'kamo_hardware',
    status: 'kamo_planned',
    fallbackMessage: 'This feature uses hardware that is not available on your current device. Availability: Planned for supported Kamo devices.',
  },

  // --- HEALTH FEATURES ---
  health_patient_dashboard: {
    id: 'health_patient_dashboard',
    name: 'Patient Dashboard',
    description: 'View medical records, bills, and dependents.',
    requiredDevice: 'standard',
    status: 'live',
    fallbackMessage: '',
  },
  health_vital_sync: {
    id: 'health_vital_sync',
    name: 'Continuous Vital Sync',
    description: 'Real-time heart rate and oxygen monitoring.',
    requiredDevice: 'kamo_hardware',
    status: 'kamo_planned',
    fallbackMessage: 'This feature uses hardware that is not available on your current device. Availability: Planned for supported Kamo devices.',
  },
  health_e2e_vault: {
    id: 'health_e2e_vault',
    name: 'End-to-End Encrypted Vault',
    description: 'Ultra-secure storage for sensitive medical records.',
    requiredDevice: 'kamo_firmware',
    status: 'kamo_planned',
    fallbackMessage: 'This feature requires Kamo secure firmware. Availability: Planned for supported Kamo devices.',
  },
};

export function isFeatureAvailable(featureId: string, isKamoDevice: boolean): { available: boolean; message?: string } {
  const feature = FEATURE_REGISTRY[featureId];
  if (!feature) return { available: false, message: 'Feature not configured.' };

  if (feature.requiredDevice === 'standard' || (feature.requiredDevice.startsWith('kamo') && isKamoDevice)) {
    return { available: true };
  }

  return { 
    available: false, 
    message: feature.fallbackMessage || 'This feature is not available on your current device.' 
  };
}
