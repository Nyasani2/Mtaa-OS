import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/kernel/auth/useAuthStore';
import { supabase } from '@/lib/integrations/supabase/client';

interface KYCLevel {
  level: number;
  name: string;
  description: string;
  requirements: string[];
  status: 'locked' | 'pending' | 'approved' | 'rejected';
  reward?: string;
}

export default function KYCReviewScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [activeLevel, setActiveLevel] = useState(1);

  const kycLevels: KYCLevel[] = [
    {
      level: 1,
      name: 'Phone Verification',
      description: 'Verify your phone number with OTP',
      requirements: [
        'Active phone number',
        'SMS verification code',
      ],
      status: 'approved',
    },
    {
      level: 2,
      name: 'Identity Verification',
      description: 'Government ID + selfie verification',
      requirements: [
        "Government-issued ID (National ID, Passport, Driver's License)",
        'Live selfie photo for face matching',
        'Phone number verification',
      ],
      status: 'pending',
    },
    {
      level: 3,
      name: 'Address Verification',
      description: 'Proof of residence',
      requirements: [
        'Utility bill or bank statement (last 3 months)',
        'Proof of address matching ID',
      ],
      status: 'locked',
    },
    {
      level: 4,
      name: 'Biometric Verification',
      description: 'Advanced biometric checks',
      requirements: [
        'Fingerprint scan',
        'Liveness detection video',
        'Background check consent',
      ],
      status: 'locked',
      reward: 'Access to all MTAA features + higher limits',
    },
  ];

  const handleSubmitKYC = async (level: number) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('kyc_submissions')
        .upsert({
          user_id: user?.id,
          level,
          status: 'pending',
          submitted_at: new Date().toISOString(),
        });

      if (error) throw error;

      Alert.alert(
        'KYC Submitted',
        `Level ${level} verification is now under review. You'll be notified within 24 hours.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to submit KYC. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: KYCLevel['status']) => {
    switch (status) {
      case 'approved': return '#22c55e';
      case 'pending': return '#f59e0b';
      case 'rejected': return '#ef4444';
      case 'locked': return '#6b7280';
    }
  };

  const getStatusIcon = (status: KYCLevel['status']) => {
    switch (status) {
      case 'approved': return 'checkmark-circle';
      case 'pending': return 'time';
      case 'rejected': return 'close-circle';
      case 'locked': return 'lock-closed';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>KYC Verification</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>Verification Progress</Text>
          <View style={styles.progressRow}>
            {kycLevels.map((level, idx) => (
              <View key={level.level} style={styles.progressItem}>
                <View
                  style={[
                    styles.progressDot,
                    {
                      backgroundColor: getStatusColor(level.status),
                      borderColor:
                        level.status === 'locked' ? '#374151' : getStatusColor(level.status),
                    },
                  ]}
                >
                  <Ionicons
                    name={getStatusIcon(level.status)}
                    size={14}
                    color="#fff"
                  />
                </View>
                {idx < kycLevels.length - 1 && (
                  <View
                    style={[
                      styles.progressLine,
                      {
                        backgroundColor:
                          level.status === 'approved' ? '#22c55e' : '#374151',
                      },
                    ]}
                  />
                )}
              </View>
            ))}
          </View>
          <Text style={styles.progressText}>
            {kycLevels.filter((l) => l.status === 'approved').length} of {kycLevels.length} levels completed
          </Text>
        </View>

        {kycLevels.map((level) => (
          <TouchableOpacity
            key={level.level}
            style={[
              styles.levelCard,
              activeLevel === level.level && styles.levelCardActive,
              level.status === 'locked' && styles.levelCardLocked,
            ]}
            onPress={() => setActiveLevel(level.level)}
            disabled={level.status === 'locked'}
          >
            <View style={styles.levelHeader}>
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>L{level.level}</Text>
              </View>
              <View style={styles.levelInfo}>
                <Text style={styles.levelName}>{level.name}</Text>
                <Text style={styles.levelDescription}>{level.description}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(level.status) + '20' },
                ]}
              >
                <Text style={[styles.statusText, { color: getStatusColor(level.status) }]}>
                  {level.status.toUpperCase()}
                </Text>
              </View>
            </View>

            {activeLevel === level.level && level.status !== 'locked' && (
              <View style={styles.levelDetails}>
                <Text style={styles.requirementsTitle}>Requirements:</Text>
                {level.requirements.map((req, idx) => (
                  <View key={idx} style={styles.requirementItem}>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#6366f1" />
                    <Text style={styles.requirementText}>{req}</Text>
                  </View>
                ))}

                {level.reward && (
                  <View style={styles.rewardBox}>
                    <Ionicons name="gift" size={16} color="#f59e0b" />
                    <Text style={styles.rewardText}>{level.reward}</Text>
                  </View>
                )}

                {level.status === 'pending' && (
                  <View style={styles.pendingBox}>
                    <ActivityIndicator size="small" color="#f59e0b" />
                    <Text style={styles.pendingText}>Under review by MTAA team</Text>
                  </View>
                )}

                {level.status !== 'approved' && level.status !== 'pending' && (
                  <TouchableOpacity
                    style={styles.submitBtn}
                    onPress={() => handleSubmitKYC(level.level)}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <MaterialIcons name="verified-user" size={18} color="#fff" />
                        <Text style={styles.submitBtnText}>Submit for Verification</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  content: { flex: 1 },
  contentPadding: { padding: 16, paddingBottom: 40 },
  overviewCard: {
    backgroundColor: '#111118',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1e1e2e',
  },
  overviewTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 16 },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  progressItem: { flexDirection: 'row', alignItems: 'center' },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  progressLine: { width: 40, height: 2, marginHorizontal: 4 },
  progressText: { textAlign: 'center', color: '#9ca3af', fontSize: 13 },
  levelCard: {
    backgroundColor: '#111118',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e1e2e',
  },
  levelCardActive: { borderColor: '#6366f1' },
  levelCardLocked: { opacity: 0.6 },
  levelHeader: { flexDirection: 'row', alignItems: 'center' },
  levelBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  levelBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  levelInfo: { flex: 1 },
  levelName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  levelDescription: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  levelDetails: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#1e1e2e' },
  requirementsTitle: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 10 },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  requirementText: { color: '#d1d5db', fontSize: 13, flex: 1 },
  rewardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f59e0b15',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  rewardText: { color: '#f59e0b', fontSize: 13, fontWeight: '600', flex: 1 },
  pendingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f59e0b15',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  pendingText: { color: '#f59e0b', fontSize: 13, fontWeight: '600' },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
