import AsyncStorage from '@react-native-async-storage/async-storage';

const PIN_KEY = '@mtaa_pin';
const LOCKOUT_KEY = '@mtaa_pin_lockout';

export interface PinState {
  isSet: boolean;
  isLocked: boolean;
  attemptsRemaining: number;
  lockoutEnd: number | null;
}

export interface SetPinResult {
  success: boolean;
  error?: string;
}

export async function getPinState(): Promise<PinState> {
  try {
    const [pin, lockout] = await Promise.all([
      AsyncStorage.getItem(PIN_KEY),
      AsyncStorage.getItem(LOCKOUT_KEY),
    ]);
    const lockoutEnd = lockout ? parseInt(lockout, 10) : null;
    const isLocked = lockoutEnd ? Date.now() < lockoutEnd : false;
    return { isSet: !!pin, isLocked, attemptsRemaining: 5, lockoutEnd };
  } catch {
    return { isSet: false, isLocked: false, attemptsRemaining: 5, lockoutEnd: null };
  }
}

export async function verifyPin(input: string): Promise<boolean> {
  const stored = await AsyncStorage.getItem(PIN_KEY);
  return stored === input;
}

export async function setPin(pin: string): Promise<SetPinResult> {
  try {
    if (!pin || pin.length < 4) {
      return { success: false, error: 'PIN must be at least 4 digits' };
    }
    await AsyncStorage.setItem(PIN_KEY, pin);
    await AsyncStorage.removeItem(LOCKOUT_KEY);
    return { success: true };
  } catch (err) {
    return { success: false, error: 'Failed to save PIN' };
  }
}

export async function clearPin(): Promise<void> {
  await AsyncStorage.multiRemove([PIN_KEY, LOCKOUT_KEY]);
}

export async function isPinSet(): Promise<boolean> {
  const pin = await AsyncStorage.getItem(PIN_KEY);
  return !!pin;
}
