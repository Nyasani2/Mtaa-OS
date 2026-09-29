import * as Application from 'expo-application';
import * as Device from 'expo-device';

export interface SecurityStatus {
  isPhysicalDevice: boolean;
  isExpoGo: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  message: string;
}

// GrapheneOS-inspired: Verify the environment before allowing high-value transactions
export const getDeviceSecurityStatus = async (): Promise<SecurityStatus> => {
  const isPhysical = Device.isDevice;
  const isExpoGo = (Application as any).appOwnership === 'expo';
  
  // High risk: Running in a web browser or emulator
  if (!isPhysical) {
    return {
      isPhysicalDevice: false,
      isExpoGo,
      riskLevel: 'high',
      message: 'Security Warning: App is running in a browser or emulator. Financial features restricted.'
    };
  }

  // Medium risk: Running in Expo Go (Development mode) instead of a compiled standalone app
  if (isExpoGo) {
    return {
      isPhysicalDevice: true,
      isExpoGo: true,
      riskLevel: 'medium',
      message: 'Dev Mode: Running in Expo Go. Compile to standalone for full security.'
    };
  }

  // Low risk: Physical device, standalone app
  return {
    isPhysicalDevice: true,
    isExpoGo: false,
    riskLevel: 'low',
    message: 'Device Verified: Secure environment detected.'
  };
};
