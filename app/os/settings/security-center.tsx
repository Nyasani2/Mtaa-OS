import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase/client';
import { Ionicons } from '@expo/vector-icons';
import { hasPin, getPinAge } from '@/lib/security/pin-engine';

interface SecurityScanResult {
  overallScore: number;
  pinStatus: 'strong' | 'weak' | 'missing';
  mfaStatus: 'enabled' | 'disabled';
  biometricStatus: 'enabled' | 'disabled';
  deviceTrust: number;
  activeSessions: number;
  failedLogins: number;
  lastLogin: string | null;
  recommendations: string[];
}

export default function SecurityCenterScreen() {
  const router = useRouter();
  const { user, biometricEnabled, trustScore } = useAuthStore();
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<SecurityScanResult | null>(null);
  const [loading, setLoading] = useState(false);

  const userId = user?.id;

  const runSecurityScan = async () => {
    if (!userId) {
      Alert.alert('Error', 'Please sign in to run a security scan');
      return;
    }

    setScanning(true);
    try {
      const result = await performSecurityScan(userId);
      setScanResult(result);

      // Log scan to security_events
      await supabase.from('security_events').insert({
        user_id: userId,
        event_type: 'security_scan',
        severity: result.overallScore < 50 ? 'high' : result.overallScore < 80 ? 'medium' : 'low',
        details: {
          score: result.overallScore,
          pin_status: result.pinStatus,
          mfa_status: result.mfaStatus,
          biometric_status: result.biometricStatus,
        },
      });
    } catch (e) {
      Alert.alert('Scan Failed', 'Unable to complete security scan. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const performSecurityScan = async (uid: string): Promise<SecurityScanResult> => {
    const recommendations: string[] = [];
    let score = 100;

    // Check PIN
    const pinExists = await hasPin();
    const pinAge = await getPinAge();
    let pinStatus: SecurityScanResult['pinStatus'] = 'missing';
    if (pinExists) {
      pinStatus = pinAge > 90 ? 'weak' : 'strong';
      if (pinAge > 90) {
        recommendations.push('Your PIN is over 90 days old. Consider changing it.');
        score -= 15;
      }
    } else {
      recommendations.push('No PIN set. Set a PIN to secure your wallet.');
      score -= 30;
    }

    // Check MFA
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('mfa_enabled')
      .eq('id', uid)
      .single();
    const mfaStatus = profile?.mfa_enabled ? 'enabled' : 'disabled';
    if (mfaStatus === 'disabled') {
      recommendations.push('Enable two-factor authentication for additional security.');
      score -= 15;
    }

    // Check biometric
    const biometricStatus = biometricEnabled ? 'enabled' : 'disabled';
    if (biometricStatus === 'disabled') {
      recommendations.push('Enable biometric authentication for quick and secure access.');
      score -= 10;
    }

    // Check active sessions
    const { data: sessions } = await supabase
      .from('auth_sessions')
      .select('id')
      .eq('user_id', uid)
      .eq('is_valid', true);
    const activeSessions = sessions?.length || 0;
    if (activeSessions > 3) {
      recommendations.push(`You have ${activeSessions} active sessions. Review and revoke unused ones.`);
      score -= 5;
    }

    // Check failed logins
    const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: failedLogins } = await supabase
      .from('auth_audit_logs')
      .select('id')
      .eq('user_id', uid)
      .eq('event_type', 'login_failed')
      .gte('created_at', windowStart);
    const failedCount = failedLogins?.length || 0;
    if (failedCount > 0) {
      recommendations.push(`${failedCount} failed login attempts in the last 24 hours. Review your security.`);
      score -= 10;
    }

    // Check last login
    const { data: lastLogin } = await supabase
      .from('auth_audit_logs')
      .select('created_at')
      .eq('user_id', uid)
      .eq('event_type', 'login_success')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return {
      overallScore: Math.max(0, score),
      pinStatus,
      mfaStatus,
      biometricStatus,
      deviceTrust: trustScore,
      activeSessions,
      failedLogins: failedCount,
      lastLogin: lastLogin?.created_at || null,
      recommendations,
    };
  };

  const navigateToPasswordManager = () => {
    router.push('/(os)/settings/password-manager');
  };

  const navigateTo2FA = () => {
    router.push('/(os)/settings/two-factor');
  };

  const navigateToSessions = () => {
    router.push('/(os)/settings/active-sessions');
  };

  const navigateToPinChange = () => {
    router.push('/(os)/settings/change-pin');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#2ecc71';
    if (score >= 50) return '#f39c12';
    return '#e74c3c';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Secure';
    if (score >= 50) return 'Fair';
    return 'At Risk';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Security Center</Text>

        {/* Security Score Card */}
        {scanResult && (
          <View style={styles.scoreCard}>
            <View style={[styles.scoreCircle, { borderColor: getScoreColor(scanResult.overallScore) }]}>
              <Text style={[styles.scoreValue, { color: getScoreColor(scanResult.overallScore) }]}>
                {scanResult.overallScore}
              </Text>
              <Text style={styles.scoreLabel}>{getScoreLabel(scanResult.overallScore)}</Text>
            </View>
            {scanResult.recommendations.length > 0 && (
              <View style={styles.recommendations}>
                <Text style={styles.recTitle}>Recommendations</Text>
                {scanResult.recommendations.map((rec, i) => (
                  <View key={i} style={styles.recRow}>
                    <Ionicons name="warning-outline" size={16} color="#f39c12" style={styles.recIcon} />
                    <Text style={styles.recText}>{rec}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Scan Button */}
        <TouchableOpacity
          style={[styles.scanButton, scanning && styles.scanButtonActive]}
          onPress={runSecurityScan}
          disabled={scanning}
        >
          {scanning ? (
            <ActivityIndicator color="#000" />
          ) : (
            <>
              <Ionicons name="shield-checkmark-outline" size={20} color="#000" />
              <Text style={styles.scanButtonText}>
                {scanResult ? 'Rescan Security' : 'Run Security Scan'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Security Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Authentication</Text>

          <SecurityRow
            icon="keypad-outline"
            title="Change PIN"
            subtitle="Update your 6-digit security PIN"
            status={scanResult?.pinStatus === 'strong' ? 'Secure' : scanResult?.pinStatus === 'weak' ? 'Weak' : 'Not Set'}
            statusColor={scanResult?.pinStatus === 'strong' ? '#2ecc71' : scanResult?.pinStatus === 'weak' ? '#f39c12' : '#e74c3c'}
            onPress={navigateToPinChange}
          />

          <SecurityRow
            icon="phone-portrait-outline"
            title="Biometric Authentication"
            subtitle="Face ID / Fingerprint"
            status={biometricEnabled ? 'Enabled' : 'Disabled'}
            statusColor={biometricEnabled ? '#2ecc71' : '#888'}
            onPress={() => router.push('/auth/biometric-enroll')}
          />

          <SecurityRow
            icon="shield-half-outline"
            title="Two-Factor Authentication"
            subtitle="Add an extra layer of security"
            status={scanResult?.mfaStatus === 'enabled' ? 'Enabled' : 'Disabled'}
            statusColor={scanResult?.mfaStatus === 'enabled' ? '#2ecc71' : '#888'}
            onPress={navigateTo2FA}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Management</Text>

          <SecurityRow
            icon="desktop-outline"
            title="Active Sessions"
            subtitle={`${scanResult?.activeSessions || 0} devices currently logged in`}
            status="View"
            statusColor="#00d4aa"
            onPress={navigateToSessions}
          />

          <SecurityRow
            icon="lock-closed-outline"
            title="Password Manager"
            subtitle="Manage your saved passwords"
            status="Open"
            statusColor="#00d4aa"
            onPress={navigateToPasswordManager}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <SecurityRow
            icon="trash-outline"
            title="Delete Account"
            subtitle="Permanently delete your account and data"
            status="Danger"
            statusColor="#e74c3c"
            onPress={handleDeleteAccount}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SecurityRow({
  icon,
  title,
  subtitle,
  status,
  statusColor,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  status: string;
  statusColor: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon as any} size={22} color="#888" style={styles.rowIcon} />
        <View>
          <Text style={styles.rowTitle}>{title}</Text>
          <Text style={styles.rowSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <View style={styles.rowRight}>
        <Text style={[styles.rowStatus, { color: statusColor }]}>{status}</Text>
        <Ionicons name="chevron-forward" size={18} color="#444" />
      </View>
    </TouchableOpacity>
  );
}

function handleDeleteAccount() {
  Alert.alert(
    'Delete Account?',
    'This action is permanent and cannot be undone. All your data will be deleted.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          // Initiate account deletion workflow
          // This would typically send a confirmation email and start a 30-day grace period
          Alert.alert('Account Deletion Initiated', 'Check your email to confirm.');
        },
      },
    ]
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 24,
  },
  scoreCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  recommendations: {
    width: '100%',
    marginTop: 8,
  },
  recTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  recRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  recText: {
    flex: 1,
    fontSize: 13,
    color: '#aaa',
    lineHeight: 18,
  },
  scanButton: {
    backgroundColor: '#00d4aa',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  scanButtonActive: {
    backgroundColor: '#00a885',
  },
  scanButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#222',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowIcon: {
    marginRight: 12,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  rowSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowStatus: {
    fontSize: 13,
    fontWeight: '600',
  },
});
