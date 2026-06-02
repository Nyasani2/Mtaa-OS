/**
 * ASIS Layer 5 — QR Claim Screen
 * Scan QR → preview claim → guided acceptance
 */

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { ClaimLink } from '../types';
import { ClaimPreviewCard } from './claim-preview-card';

interface QRClaimScreenProps {
  onScan: () => Promise<string>;
  onValidate: (qrData: string) => Promise<{ valid: boolean; claim?: ClaimLink; error?: string }>;
  onClaim: (token: string) => Promise<void>;
}

export const QRClaimScreen: React.FC<QRClaimScreenProps> = ({ onScan, onValidate, onClaim }) => {
  const [scanning, setScanning] = useState(false);
  const [claim, setClaim] = useState<ClaimLink | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = useCallback(async () => {
    setScanning(true);
    setError(null);
    setClaim(null);

    try {
      const qrData = await onScan();
      const validation = await onValidate(qrData);

      if (validation.valid && validation.claim) {
        setClaim(validation.claim);
      } else {
        setError(validation.error || 'Invalid QR code');
      }
    } catch (err) {
      setError('Failed to scan or validate QR code');
    } finally {
      setScanning(false);
    }
  }, [onScan, onValidate]);

  const handleClaim = useCallback(async () => {
    if (!claim) return;

    try {
      await onClaim(claim.token);
      Alert.alert('Success', 'Money claimed successfully!', [{ text: 'OK' }]);
      setClaim(null);
    } catch (err) {
      Alert.alert('Error', 'Failed to claim money. Please try again.');
    }
  }, [claim, onClaim]);

  if (scanning) {
    return (
      <View style={styles.centered}>
        <View style={styles.scannerFrame}>
          <Text style={styles.scannerText}>Position QR code within frame</Text>
          <View style={styles.cornerTL} />
          <View style={styles.cornerTR} />
          <View style={styles.cornerBL} />
          <View style={styles.cornerBR} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Couldn't read QR</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleScan}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (claim) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Money Found!</Text>
        <ClaimPreviewCard
          claim={claim}
          onClaim={handleClaim}
          onDismiss={() => setClaim(null)}
        />
      </View>
    );
  }

  return (
    <View style={styles.centered}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>📷</Text>
      </View>
      <Text style={styles.title}>Scan to Claim</Text>
      <Text style={styles.subtitle}>
        Scan a QR code from a friend to receive money instantly
      </Text>
      <TouchableOpacity style={styles.scanButton} onPress={handleScan}>
        <Text style={styles.scanButtonText}>Scan QR Code</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingTop: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 24,
  },
  header: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  scanButton: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderRadius: 16,
    backgroundColor: '#00000020',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  scannerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  cornerTL: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#059669',
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#059669',
    borderTopRightRadius: 8,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#059669',
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#059669',
    borderBottomRightRadius: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
});
