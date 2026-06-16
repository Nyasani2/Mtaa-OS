import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface CameraOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  tier: 'free' | 'pro' | 'max';
  maxPhones: number;
}

const CAMERA_OPTIONS: CameraOption[] = [
  {
    id: 'standard',
    title: '📱 Standard Camera',
    description: '1080p recording, basic filters, MTAA watermark',
    icon: 'camera',
    color: '#3B82F6',
    tier: 'free',
    maxPhones: 2,
  },
  {
    id: 'selfie',
    title: '🤳 Selfie + Rear',
    description: 'Toggle front/back camera, basic beauty filters',
    icon: 'camera-reverse',
    color: '#22C55E',
    tier: 'free',
    maxPhones: 2,
  },
  {
    id: 'cinematic',
    title: '🎥 Cinematic',
    description: '4K, depth of field, color grading, no watermark',
    icon: 'film',
    color: '#A855F7',
    tier: 'pro',
    maxPhones: 4,
  },
  {
    id: 'multi',
    title: '📹 Multi-Angle',
    description: 'Picture-in-picture, split screen, 4 phone network',
    icon: 'grid',
    color: '#F59E0B',
    tier: 'pro',
    maxPhones: 4,
  },
  {
    id: 'livestream',
    title: '🔴 Live Stream',
    description: 'RTMP out, real-time chat overlay, donation alerts',
    icon: 'radio',
    color: '#EF4444',
    tier: 'pro',
    maxPhones: 4,
  },
  {
    id: 'director',
    title: '🎬 Director Mode',
    description: '6 phone network, control panel, auto-switch feeds',
    icon: 'videocam',
    color: '#EC4899',
    tier: 'max',
    maxPhones: 6,
  },
];

export default function CameraLauncherScreen() {
  const router = useRouter();
  const [userTier, setUserTier] = useState<'free' | 'pro' | 'max'>('free');
  const [connectedPhones, setConnectedPhones] = useState(1);

  const handleSelect = (option: CameraOption) => {
    if (option.tier === 'pro' && userTier === 'free') {
      Alert.alert(
        'Pro Feature',
        'Upgrade to Pro for 10 KES/day to unlock this camera.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/(os)/studio/upgrade') },
        ]
      );
      return;
    }
    if (option.tier === 'max' && userTier !== 'max') {
      Alert.alert(
        'Max Feature',
        'Upgrade to Max for 20 KES/day to unlock Director Mode with 6 cameras.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/(os)/studio/upgrade') },
        ]
      );
      return;
    }

    // Navigate to recording with selected camera
    router.push({
      pathname: '/(os)/studio/record',
      params: { cameraMode: option.id, maxPhones: option.maxPhones },
    });
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'free': return { text: 'FREE', color: '#22C55E' };
      case 'pro': return { text: 'PRO', color: '#F59E0B' };
      case 'max': return { text: 'MAX', color: '#EF4444' };
      default: return { text: '', color: '#9CA3AF' };
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🎥 Camera</Text>
        <View style={[styles.tierBadge, { backgroundColor: getTierBadge(userTier).color + '20' }]}>
          <Text style={[styles.tierText, { color: getTierBadge(userTier).color }]}>
            {getTierBadge(userTier).text}
          </Text>
        </View>
      </View>

      <Text style={styles.subtitle}>Select your recording mode</Text>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {CAMERA_OPTIONS.map((option) => {
          const tierInfo = getTierBadge(option.tier);
          const isLocked = (option.tier === 'pro' && userTier === 'free') || (option.tier === 'max' && userTier !== 'max');

          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.optionCard, isLocked && styles.optionCardLocked]}
              onPress={() => handleSelect(option)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconWrap, { backgroundColor: option.color + '20' }]}>
                <Ionicons name={option.icon as any} size={26} color={option.color} />
              </View>
              <View style={styles.optionInfo}>
                <View style={styles.optionHeader}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <View style={[styles.tierBadgeSmall, { backgroundColor: tierInfo.color + '20' }]}>
                    <Text style={[styles.tierTextSmall, { color: tierInfo.color }]}>{tierInfo.text}</Text>
                  </View>
                </View>
                <Text style={styles.optionDesc}>{option.description}</Text>
                <View style={styles.optionMeta}>
                  <Ionicons name="phone-portrait" size={14} color="#64748B" />
                  <Text style={styles.optionMetaText}>Up to {option.maxPhones} phones</Text>
                </View>
              </View>
              {isLocked && <Ionicons name="lock-closed" size={20} color="#EF4444" />}
              {!isLocked && <Ionicons name="chevron-forward" size={20} color="#475569" />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Multi-phone pairing shortcut */}
      <TouchableOpacity
        style={styles.pairingBtn}
        onPress={() => router.push('/(os)/studio/pairing')}
      >
        <Ionicons name="phone-portrait-outline" size={18} color="#3B82F6" />
        <Text style={styles.pairingText}>Connect Additional Phones</Text>
        <Text style={styles.pairingCount}>{connectedPhones} connected</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8,
  },
  backBtn: { padding: 8, marginRight: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#F8FAFC', flex: 1 },
  tierBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tierText: { fontSize: 11, fontWeight: '800' },
  subtitle: { fontSize: 14, color: '#94A3B8', paddingHorizontal: 16, marginBottom: 12 },
  optionCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1E293B', marginHorizontal: 16, marginBottom: 10,
    padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#334155',
  },
  optionCardLocked: { opacity: 0.7, borderColor: '#EF444440' },
  iconWrap: {
    width: 50, height: 50, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  optionInfo: { flex: 1 },
  optionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  optionTitle: { fontSize: 15, fontWeight: '700', color: '#F1F5F9' },
  tierBadgeSmall: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tierTextSmall: { fontSize: 9, fontWeight: '800' },
  optionDesc: { fontSize: 13, color: '#94A3B8', lineHeight: 18 },
  optionMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  optionMetaText: { fontSize: 12, color: '#64748B' },
  pairingBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1E293B', marginHorizontal: 16, marginBottom: 20,
    padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#3B82F640',
    gap: 10,
  },
  pairingText: { flex: 1, fontSize: 14, color: '#3B82F6', fontWeight: '600' },
  pairingCount: { fontSize: 13, color: '#94A3B8' },
});
