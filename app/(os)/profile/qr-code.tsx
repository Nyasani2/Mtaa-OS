// @ts-nocheck
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Clipboard,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { qrIdentityService, QrIdentityData } from '@/lib/services/qr-identity';
import { Ionicons } from '@expo/vector-icons';

export default function QrCodeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [qrData, setQrData] = useState<QrIdentityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadQr();
  }, []);

  const loadQr = async () => {
    setLoading(true);
    const data = await qrIdentityService.getMyQrIdentity();
    setQrData(data);
    setLoading(false);
  };

  const handleShare = useCallback(async () => {
    if (!qrData?.qrUrl) return;
    if (Platform.OS === 'web') {
      try {
        await Clipboard.setString(qrData.qrUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        Alert.alert('Error', 'Could not copy to clipboard');
      }
    } else {
      try {
        const { Share } = await import('react-native');
        await Share.share({
          message: `Connect with me on MTAA: ${qrData.qrUrl}`,
          url: qrData.qrUrl,
        });
      } catch (err: any) {
        if (err.message !== 'User did not share') {
          Alert.alert('Error', 'Could not share QR code');
        }
      }
    }
  }, [qrData]);

  const handleCopyLink = useCallback(async () => {
    if (!qrData?.qrUrl) return;
    try {
      await Clipboard.setString(qrData.qrUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      Alert.alert('Error', 'Could not copy link');
    }
  }, [qrData]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (!qrData) {
    return (
      <View style={styles.center}>
        <Ionicons name="qr-code-outline" size={48} color="rgba(255,255,255,0.2)" />
        <Text style={styles.errorText}>Could not generate QR identity</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadQr}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your MTAA Identity</Text>
        <Text style={styles.subtitle}>Scan this QR code to connect</Text>
      </View>

      <View style={styles.qrContainer}>
        <View style={styles.qrCard}>
          <QRCode
            value={qrData.deepLink}
            size={200}
            backgroundColor="#ffffff"
            color="#0a0a0f"
          />
        </View>
        <Text style={styles.qrLabel}>{qrData.displayName}</Text>
        {qrData.username && (
          <Text style={styles.qrHandle}>@{qrData.username}</Text>
        )}
      </View>

      <View style={styles.linkSection}>
        <Text style={styles.linkLabel}>Your link</Text>
        <View style={styles.linkBox}>
          <Text style={styles.linkText} numberOfLines={1} ellipsizeMode="middle">
            {qrData.qrUrl}
          </Text>
          <TouchableOpacity onPress={handleCopyLink}>
            <Ionicons
              name={copied ? 'checkmark-circle' : 'copy-outline'}
              size={20}
              color={copied ? '#22c55e' : '#3b82f6'}
            />
          </TouchableOpacity>
        </View>
        {copied && <Text style={styles.copiedText}>Copied to clipboard</Text>}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={20} color="#ffffff" />
          <Text style={styles.actionText}>Share QR Code</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/wallet/scan-qr')}>
          <Ionicons name="scan-outline" size={20} color="#ffffff" />
          <Text style={styles.actionText}>Scan QR Code</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          This QR code contains only your public identity. It does not grant access to your account or wallet.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    alignItems: 'center',
    paddingTop: 24,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0f',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  qrLabel: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  qrHandle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  linkSection: {
    width: '90%',
    marginBottom: 24,
  },
  linkLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  linkText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginRight: 8,
  },
  copiedText: {
    fontSize: 12,
    color: '#22c55e',
    marginTop: 6,
    textAlign: 'center',
  },
  actions: {
    width: '90%',
    gap: 10,
  },
  actionButton: {
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
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  errorText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 12,
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#2563eb',
  },
  retryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    paddingHorizontal: 24,
  },
  footerText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    lineHeight: 16,
  },
});
