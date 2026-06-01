import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  getPinState,
  setPin,
  verifyPin,
  changePin,
  removePin,
  PinState,
} from '@/lib/security/pin-engine';

export default function SettingsPinScreen() {
  const router = useRouter();

  const [pinState, setPinState] = useState<PinState | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<'none' | 'create' | 'change' | 'remove'>('none');

  // Form states
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Load PIN state
  useEffect(() => {
    loadPinState();
  }, []);

  const loadPinState = async () => {
    setLoading(true);
    try {
      const state = await getPinState();
      setPinState(state);
    } catch (err) {
      console.error('[SettingsPin] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Create PIN ──────────────────────────────────────────────────────────────
  const handleCreate = useCallback(async () => {
    if (newPin !== confirmPin) {
      setFormError('PINs do not match');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      const result = await setPin(newPin);
      if (result.success) {
        Alert.alert('Success', 'PIN has been set successfully');
        setAction('none');
        setNewPin('');
        setConfirmPin('');
        await loadPinState();
      } else {
        setFormError(result.error || 'Failed to set PIN');
      }
    } catch (err: any) {
      setFormError(err.message || 'An error occurred');
    } finally {
      setFormLoading(false);
    }
  }, [newPin, confirmPin]);

  // ── Change PIN ──────────────────────────────────────────────────────────────
  const handleChange = useCallback(async () => {
    if (newPin !== confirmPin) {
      setFormError('New PINs do not match');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      const result = await changePin(currentPin, newPin);
      if (result.success) {
        Alert.alert('Success', 'PIN has been changed successfully');
        setAction('none');
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
        await loadPinState();
      } else {
        setFormError(result.error || 'Failed to change PIN');
      }
    } catch (err: any) {
      setFormError(err.message || 'An error occurred');
    } finally {
      setFormLoading(false);
    }
  }, [currentPin, newPin, confirmPin]);

  // ── Remove PIN ──────────────────────────────────────────────────────────────
  const handleRemove = useCallback(async () => {
    setFormLoading(true);
    setFormError('');

    try {
      // Verify current PIN first
      const verify = await verifyPin(currentPin);
      if (!verify.valid) {
        setFormError('Current PIN is incorrect');
        setFormLoading(false);
        return;
      }

      await removePin();
      Alert.alert('Success', 'PIN has been removed');
      setAction('none');
      setCurrentPin('');
      await loadPinState();
    } catch (err: any) {
      setFormError(err.message || 'An error occurred');
    } finally {
      setFormLoading(false);
    }
  }, [currentPin]);

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="shield-checkmark" size={40} color="#4F46E5" />
        <Text style={styles.title}>Device Security</Text>
        <Text style={styles.subtitle}>
          {pinState?.isSet
            ? 'Your device is protected with a PIN'
            : 'No PIN set — your device is not protected'}
        </Text>
      </View>

      {/* Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Ionicons
            name={pinState?.isSet ? 'lock-closed' : 'lock-open'}
            size={24}
            color={pinState?.isSet ? '#10B981' : '#F59E0B'}
          />
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusTitle}>
              {pinState?.isSet ? 'PIN Active' : 'No PIN'}
            </Text>
            <Text style={styles.statusDescription}>
              {pinState?.isSet
                ? `${pinState.attemptsRemaining} attempts remaining`
                : 'Set a PIN to protect your device'}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      {action === 'none' && (
        <View style={styles.actionsContainer}>
          {!pinState?.isSet && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setAction('create')}
            >
              <Ionicons name="add-circle" size={20} color="#4F46E5" />
              <Text style={styles.actionButtonText}>Set PIN</Text>
            </TouchableOpacity>
          )}

          {pinState?.isSet && (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setAction('change')}
              >
                <Ionicons name="refresh" size={20} color="#4F46E5" />
                <Text style={styles.actionButtonText}>Change PIN</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.dangerButton]}
                onPress={() => setAction('remove')}
              >
                <Ionicons name="trash" size={20} color="#DC2626" />
                <Text style={[styles.actionButtonText, styles.dangerText]}>
                  Remove PIN
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* Form */}
      {action !== 'none' && (
        <View style={styles.formContainer}>
          {formError ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color="#DC2626" />
              <Text style={styles.errorText}>{formError}</Text>
            </View>
          ) : null}

          {/* Current PIN (for change/remove) */}
          {(action === 'change' || action === 'remove') && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current PIN</Text>
              <TextInput
                style={styles.input}
                value={currentPin}
                onChangeText={setCurrentPin}
                placeholder="Enter current PIN"
                keyboardType="number-pad"
                secureTextEntry
                maxLength={8}
              />
            </View>
          )}

          {/* New PIN (for create/change) */}
          {(action === 'create' || action === 'change') && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {action === 'change' ? 'New PIN' : 'PIN'}
                </Text>
                <TextInput
                  style={styles.input}
                  value={newPin}
                  onChangeText={setNewPin}
                  placeholder="Enter 4+ digit PIN"
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={8}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm PIN</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPin}
                  onChangeText={setConfirmPin}
                  placeholder="Re-enter PIN"
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={8}
                />
              </View>
            </>
          )}

          {/* Form Actions */}
          <View style={styles.formActions}>
            <TouchableOpacity
              style={[styles.formButton, styles.primaryFormButton]}
              onPress={
                action === 'create'
                  ? handleCreate
                  : action === 'change'
                  ? handleChange
                  : handleRemove
              }
              disabled={formLoading}
            >
              {formLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryFormButtonText}>
                  {action === 'create'
                    ? 'Set PIN'
                    : action === 'change'
                    ? 'Change PIN'
                    : 'Remove PIN'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.formButton, styles.secondaryFormButton]}
              onPress={() => {
                setAction('none');
                setCurrentPin('');
                setNewPin('');
                setConfirmPin('');
                setFormError('');
              }}
              disabled={formLoading}
            >
              <Text style={styles.secondaryFormButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statusDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dangerButton: {
    borderColor: '#FECACA',
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  dangerText: {
    color: '#DC2626',
  },
  formContainer: {
    gap: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    flex: 1,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  formActions: {
    gap: 12,
    marginTop: 8,
  },
  formButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryFormButton: {
    backgroundColor: '#4F46E5',
  },
  primaryFormButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryFormButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryFormButtonText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '600',
  },
});
