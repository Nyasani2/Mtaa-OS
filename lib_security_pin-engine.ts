// MTAA PIN Engine — biometric + PIN security layer
import * as SecureStore from 'expo-secure-store';

const PIN_KEY = 'mtaa_pin_hash';

export const pinEngine = {
  async setPin(pin: string): Promise<boolean> {
    await SecureStore.setItemAsync(PIN_KEY, pin);
    return true;
  },
  async verifyPin(pin: string): Promise<boolean> {
    const stored = await SecureStore.getItemAsync(PIN_KEY);
    return stored === pin;
  },
  async hasPin(): Promise<boolean> {
    const stored = await SecureStore.getItemAsync(PIN_KEY);
    return stored !== null;
  },
  async clearPin(): Promise<void> {
    await SecureStore.deleteItemAsync(PIN_KEY);
  },
};

export default pinEngine;
