import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { pinEngine } from '@/lib/security/pin-engine';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';

interface AppLockContextType {
  isLocked: boolean;
  lock: () => void;
  unlock: () => void;
}

const AppLockContext = createContext<AppLockContextType | null>(null);

export const useAppLock = (): AppLockContextType => {
  const ctx = useContext(AppLockContext);
  if (!ctx) throw new Error('useAppLock must be inside AppLockProvider');
  return ctx;
};

interface AppLockProviderProps {
  children: React.ReactNode;
}

const LOCK_TIMEOUT_MS = 30000;

export const AppLockProvider: React.FC<AppLockProviderProps> = ({ children }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const appState = useRef(AppState.currentState);
  const backgroundTime = useRef<number | null>(null);
  const { user } = useAuthStore();

  const lock = useCallback(() => {
    setIsLocked(true);
    setShowOverlay(true);
    setPin('');
    setError('');
  }, []);

  const unlock = useCallback(() => {
    setIsLocked(false);
    setShowOverlay(false);
    setPin('');
    setError('');
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        backgroundTime.current = Date.now();
      } else if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        const elapsed = backgroundTime.current ? Date.now() - backgroundTime.current : 0;
        if (elapsed > LOCK_TIMEOUT_MS && user?.id) {
          lock();
        }
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, [lock, user?.id]);

  const handleBiometric = async () => {
    try {
      if (typeof window !== 'undefined') { window.alert('Biometric not available on web — use PIN.'); return; }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock MTAA',
        fallbackLabel: 'Use PIN',
      });
      if (result.success) unlock();
    } catch { /* ignore */ }
  };

  const handlePinSubmit = async () => {
    if (!user?.id) return;
    const valid = await pinEngine.verifyPin(user.id, pin);
    if (valid) {
      unlock();
    } else {
      setError('Incorrect PIN');
      setPin('');
    }
  };

  return (
    <AppLockContext.Provider value={{ isLocked, lock, unlock }}>
      {children}
      {showOverlay && (
        <View style={StyleSheet.absoluteFill} pointerEvents="auto">
          <View style={styles.overlay}>
            <Text style={styles.title}>App Locked</Text>
            <TouchableOpacity style={styles.btn} onPress={handleBiometric}>
              <Ionicons name="finger-print" size={32} color="#00d4ff" />
              <Text style={styles.btnText}>Unlock with Biometric</Text>
            </TouchableOpacity>
            <View style={styles.pinRow}>
              {Array.from({ length: 6 }).map((_, i) => (
                <View key={i} style={[styles.dot, pin.length > i && styles.dotFilled]} />
              ))}
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.numpad}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <TouchableOpacity key={n} style={styles.key} onPress={() => setPin((p) => p + String(n))}>
                  <Text style={styles.keyText}>{n}</Text>
                </TouchableOpacity>
              ))}
              <View style={styles.key} />
              <TouchableOpacity style={styles.key} onPress={() => setPin((p) => p + '0')}>
                <Text style={styles.keyText}>0</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.key} onPress={() => setPin((p) => p.slice(0, -1))}>
                <Text style={styles.keyText}>⌫</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={handlePinSubmit} style={styles.submit}>
              <Text style={styles.submitText}>Unlock</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </AppLockContext.Provider>
  );
};

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  title: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 24 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24, padding: 12, backgroundColor: '#1a1a1a', borderRadius: 12 },
  btnText: { color: '#00d4ff', fontSize: 16 },
  pinRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#555' },
  dotFilled: { backgroundColor: '#00d4ff', borderColor: '#00d4ff' },
  error: { color: '#ff4444', marginBottom: 12 },
  numpad: { flexDirection: 'row', flexWrap: 'wrap', width: 240, justifyContent: 'center' },
  key: { width: 70, height: 70, justifyContent: 'center', alignItems: 'center', margin: 4 },
  keyText: { color: '#fff', fontSize: 24 },
  submit: { marginTop: 16, backgroundColor: '#00d4ff', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12 },
  submitText: { color: '#000', fontWeight: '700', fontSize: 16 },
});
