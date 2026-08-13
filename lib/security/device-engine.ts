import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase/client';

export interface DeviceInfo {
  deviceName: string;
  platform: 'ios' | 'android' | 'web' | 'unknown';
  model: string | null;
  osVersion: string | null;
  appVersion: string;
}

const DEVICE_ENDPOINT = 'device-register'; // Single merged endpoint

export const deviceEngine = {
  async getDeviceInfo(): Promise<DeviceInfo> {
    const platform = Platform.OS as 'ios' | 'android' | 'web';
    return {
      deviceName: await Device.deviceName || 'Unknown Device',
      platform: platform || 'unknown',
      model: Device.modelName || null,
      osVersion: Device.osVersion || null,
      appVersion: Constants.expoConfig?.version || '1.0.0',
    };
  },

  async callDeviceApi(action: string, payload: Record<string, any> = {}): Promise<any> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/${DEVICE_ENDPOINT}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action, ...payload }),
      }
    );

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }
    return result;
  },

  async registerDevice(): Promise<{ success: boolean; isTrusted: boolean; message: string }> {
    const info = await this.getDeviceInfo();
    try {
      const result = await this.callDeviceApi('register', {
        device_name: info.deviceName,
        platform: info.platform,
        device_model: info.model,
        os_version: info.osVersion,
        app_version: info.appVersion,
        public_key: null,
      });
      return {
        success: result.success,
        isTrusted: result.is_trusted,
        message: result.message,
      };
    } catch (err: any) {
      return { success: false, isTrusted: false, message: err.message };
    }
  },

  async trustDevice(deviceId: string): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.callDeviceApi('trust', { device_id: deviceId });
      return { success: result.success, message: result.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  async revokeDevice(deviceId: string, reason?: string): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.callDeviceApi('revoke', { device_id: deviceId, reason });
      return { success: result.success, message: result.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  async getMyDevices() {
    const { data, error } = await supabase
      .from('user_devices')
      .select('*')
      .order('last_active_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};
