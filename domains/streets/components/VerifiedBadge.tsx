import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type VerificationType = 'creator' | 'business' | 'government' | null;

interface VerifiedBadgeProps {
  type: VerificationType;
  size?: number;
}

const BADGE_CONFIG = {
  creator: { color: '#00d4ff', icon: 'checkmark-circle', label: 'Creator' },
  business: { color: '#ffaa00', icon: 'briefcase', label: 'Business' },
  government: { color: '#00ff88', icon: 'shield-checkmark', label: 'Official' },
};

export default function VerifiedBadge({ type, size = 14 }: VerifiedBadgeProps) {
  if (!type || !BADGE_CONFIG[type]) return null;

  const config = BADGE_CONFIG[type];

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 4 }}>
      <Ionicons name={config.icon as any} size={size} color={config.color} />
    </View>
  );
}

export function VerificationTypeLabel({ type }: { type: VerificationType }) {
  if (!type || !BADGE_CONFIG[type]) return null;
  return (
    <View style={{ backgroundColor: BADGE_CONFIG[type].color + '20', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Ionicons name={BADGE_CONFIG[type].icon as any} size={12} color={BADGE_CONFIG[type].color} />
      <Text style={{ color: BADGE_CONFIG[type].color, fontSize: 11, fontWeight: '700' }}>{BADGE_CONFIG[type].label}</Text>
    </View>
  );
}
