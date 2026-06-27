import AsyncStorage from '@react-native-async-storage/async-storage';

const PIN_KEY = '@mtaa_pin';
const LOCKOUT_KEY = '@mtaa_pin_lockout';
const ATTEMPTS_KEY = '@mtaa_pin_attempts';

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

export interface VerifyPinResult {
  valid: boolean;
  state: PinState;
}

export async function getPinState(): Promise<PinState> {
  try {
    const [pin, lockout, attemptsStr] = await Promise.all([
      AsyncStorage.getItem(PIN_KEY),
      AsyncStorage.getItem(LOCKOUT_KEY),
      AsyncStorage.getItem(ATTEMPTS_KEY),
    ]);
    const lockoutEnd = lockout ? parseInt(lockout, 10) : null;
    const isLocked = lockoutEnd ? Date.now() < lockoutEnd : false;
    const attemptsRemaining = attemptsStr ? parseInt(attemptsStr, 10) : 5;
    return { isSet: !!pin, isLocked, attemptsRemaining: Math.max(0, attemptsRemaining), lockoutEnd };
  } catch {
    return { isSet: false, isLocked: false, attemptsRemaining: 5, lockoutEnd: null };
  }
}

export async function verifyPin(input: string): Promise<VerifyPinResult> {
  const state = await getPinState();

  if (state.isLocked) {
    return { valid: false, state };
  }

  const stored = await AsyncStorage.getItem(PIN_KEY);
  const valid = stored === input;

  if (!valid) {
    const newAttempts = state.attemptsRemaining - 1;
    await AsyncStorage.setItem(ATTEMPTS_KEY, String(newAttempts));

    if (newAttempts <= 0) {
      const lockoutEnd = Date.now() + 30 * 60 * 1000; // 30 min lockout
      await AsyncStorage.setItem(LOCKOUT_KEY, String(lockoutEnd));
      state.isLocked = true;
      state.lockoutEnd = lockoutEnd;
    }
    state.attemptsRemaining = newAttempts;
    return { valid: false, state };
  }

  // Success — reset attempts
  await AsyncStorage.setItem(ATTEMPTS_KEY, '5');
  await AsyncStorage.removeItem(LOCKOUT_KEY);
  state.attemptsRemaining = 5;
  return { valid: true, state };
}

export async function setPin(pin: string): Promise<SetPinResult> {
  try {
    if (!pin || pin.length < 4) {
      return { success: false, error: 'PIN must be at least 4 digits' };
    }
    await AsyncStorage.setItem(PIN_KEY, pin);
    await AsyncStorage.removeItem(LOCKOUT_KEY);
    await AsyncStorage.setItem(ATTEMPTS_KEY, '5');
    return { success: true };
  } catch (err) {
    return { success: false, error: 'Failed to save PIN' };
  }
}

export async function clearPin(): Promise<void> {
  await AsyncStorage.multiRemove([PIN_KEY, LOCKOUT_KEY, ATTEMPTS_KEY]);
}

export async function isPinSet(): Promise<boolean> {
  const pin = await AsyncStorage.getItem(PIN_KEY);
  return !!pin;
}
