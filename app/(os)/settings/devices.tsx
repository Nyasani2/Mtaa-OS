import React, { useState, useEffect, useCallback } from 'react';

import { Alert, View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { deviceEngine } from '@/lib/security/device-engine';
import { Ionicons } from '@expo/vector-icons';

interface Device {
  id: string;
  device_name: string;
  platform: string;
  device_model: string | null;
  os_version: string | null;
  app_version: string | null;
  registered_at: string;
  last_active_at: string;
  is_trusted: boolean;
  is_current: boolean;
  revoked_at: string | null;
}

export default function DevicesScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    try {
      const data = await deviceEngine.getMyDevices();
      setDevices(data);
    } catch (err) {
      console.error('Failed to fetch devices:', err);
    }
  }, []);

  useEffect(() => {
    fetchDevices().finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDevices();
    setRefreshing(false);
  };

  const handleTrust = async (deviceId: string) => {
    setActionLoading(deviceId);
    const result = await deviceEngine.trustDevice(deviceId);
    setActionLoading(null);
    if (result.success) {
      Alert.alert('Device Trusted', 'This device is now trusted for transactions.');
      fetchDevices();
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleRevoke = (deviceId: string, deviceName: string) => {
    Alert.alert(
      'Revoke Device',
      `Remove "${deviceName}"? This device will be signed out immediately.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(deviceId);
            const result = await deviceEngine.revokeDevice(deviceId, 'User revoked from settings');
            setActionLoading(null);
            if (result.success) {
              Alert.alert('Device Revoked', 'The device has been removed.');
              fetchDevices();
            } else {
              Alert.alert('Error', result.message);
            }
          },
        },
      ]
    );
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'ios': return 'phone-portrait-outline';
      case 'android': return 'logo-android';
      case 'web': return 'globe-outline';
      default: return 'hardware-chip-outline';
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Trusted Devices</Text>
        <Text style={styles.subtitle}>
          Manage devices that can access your MTAA account
        </Text>
      </View>

      <View style={styles.devicesList}>
        {devices.map((device) => (
          <View key={device.id} style={[styles.deviceCard, device.is_current && styles.currentCard]}>
            <View style={styles.deviceHeader}>
              <View style={styles.deviceIcon}>
                <Ionicons
                  name={getPlatformIcon(device.platform) as any}
                  size={24}
                  color={device.is_current ? '#3b82f6' : '#ffffff'}
                />
              </View>
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>
                  {device.device_name}
                  {device.is_current && <Text style={styles.currentBadge}>  (This Device)</Text>}
                </Text>
                <Text style={styles.deviceMeta}>
                  {device.device_model || device.platform} · {formatDate(device.registered_at)}
                </Text>
                <Text style={styles.deviceMeta}>
                  Last active: {formatDate(device.last_active_at)}
                </Text>
                {device.revoked_at && (
                  <Text style={styles.revokedBadge}>Revoked</Text>
                )}
                {device.is_trusted && !device.revoked_at && (
                  <Text style={styles.trustedBadge}>Trusted</Text>
                )}
                {!device.is_trusted && !device.revoked_at && (
                  <Text style={styles.pendingBadge}>Pending Trust</Text>
                )}
              </View>
            </View>

            {!device.revoked_at && !device.is_current && (
              <View style={styles.actions}>
                {!device.is_trusted ? (
                  <TouchableOpacity
                    style={styles.trustButton}
                    onPress={() => handleTrust(device.id)}
                    disabled={actionLoading === device.id}
                  >
                    {actionLoading === device.id ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.trustText}>Trust Device</Text>
                    )}
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  style={styles.revokeButton}
                  onPress={() => handleRevoke(device.id, device.device_name)}
                  disabled={actionLoading === device.id}
                >
                  <Text style={styles.revokeText}>Revoke</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}

        {devices.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="phone-portrait-outline" size={48} color="rgba(255,255,255,0.2)" />
            <Text style={styles.emptyText}>No devices registered yet</Text>
            <Text style={styles.emptySubtext}>
              Your devices will appear here after you sign in
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Revoking a device will immediately sign it out. Trusting a device allows it to authorize payments without additional email verification.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0f',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  devicesList: {
    padding: 16,
    gap: 12,
  },
  deviceCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  currentCard: {
    borderColor: 'rgba(59,130,246,0.3)',
    backgroundColor: 'rgba(59,130,246,0.06)',
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  deviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  currentBadge: {
    color: '#3b82f6',
    fontWeight: '700',
  },
  deviceMeta: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 2,
  },
  trustedBadge: {
    fontSize: 11,
    color: '#22c55e',
    fontWeight: '600',
    marginTop: 4,
  },
  pendingBadge: {
    fontSize: 11,
    color: '#f59e0b',
    fontWeight: '600',
    marginTop: 4,
  },
  revokedBadge: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '600',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  trustButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  trustText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  revokeButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  revokeText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 4,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    lineHeight: 18,
  },
});
