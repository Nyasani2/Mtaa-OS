import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { qrIdentityService, QrIdentityData } from '@/lib/services/qr-identity';
import { Ionicons } from '@expo/vector-icons';

export default function ScanQrScreen() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [resolvedUser, setResolvedUser] = useState<QrIdentityData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);

    try {
      const resolved = await qrIdentityService.resolveQrIdentity(data);
      if (resolved) {
        setResolvedUser(resolved);
      } else {
        Alert.alert('Invalid QR', 'This QR code does not resolve to a valid MTAA user.', [
          { text: 'OK', onPress: () => setScanned(false) },
        ]);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to resolve QR code', [
        { text: 'OK', onPress: () => setScanned(false) },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    if (!resolvedUser) return;
    router.push({
      pathname: '/wallet/send',
      params: {
        recipientId: resolvedUser.userId,
        recipientName: resolvedUser.displayName,
      },
    });
  };

  const handleViewProfile = () => {
    if (!resolvedUser) return;
    router.push(`/profile/${resolvedUser.userId}` as any);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.statusText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <Ionicons name="camera-outline" size={48} color="rgba(255,255,255,0.3)" />
        <Text style={styles.statusText}>Camera permission denied</Text>
        <Text style={styles.statusSubtext}>
          Go to Settings → MTAA → Camera to enable QR scanning
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!resolvedUser ? (
        <>
          <View style={styles.scannerContainer}>
            <BarCodeScanner
              onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.overlay}>
              <View style={styles.scanFrame} />
              <Text style={styles.scanText}>Align QR code within frame</Text>
            </View>
          </View>

          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.loadingText}>Resolving...</Text>
            </View>
          )}
        </>
      ) : (
        <View style={styles.resultContainer}>
          <View style={styles.resultCard}>
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={32} color="rgba(255,255,255,0.3)" />
            </View>
            <Text style={styles.resultName}>{resolvedUser.displayName}</Text>
            {resolvedUser.username && (
              <Text style={styles.resultHandle}>@{resolvedUser.username}</Text>
            )}

            <View style={styles.resultActions}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleSend}>
                <Ionicons name="send-outline" size={18} color="#ffffff" />
                <Text style={styles.primaryText}>Send Money</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={handleViewProfile}>
                <Ionicons name="person-outline" size={18} color="#ffffff" />
                <Text style={styles.secondaryText}>View Profile</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.scanAgainButton} onPress={() => { setScanned(false); setResolvedUser(null); }}>
            <Text style={styles.scanAgainText}>Scan Another</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
    paddingHorizontal: 24,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    marginTop: 12,
  },
  statusSubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 6,
    textAlign: 'center',
  },
  scannerContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  scanText: {
    marginTop: 20,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#ffffff',
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  resultCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  resultHandle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 20,
  },
  resultActions: {
    width: '100%',
    gap: 10,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#2563eb',
  },
  primaryText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  secondaryText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  scanAgainButton: {
    marginTop: 20,
    paddingVertical: 10,
  },
  scanAgainText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
});
