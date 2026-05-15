/**
 * MTAA OS — System Status Page (Expo Router)
 */

import React from 'react';
import { View } from 'react-native';
import { SystemHealthDashboard } from '@/components/system/SystemHealthDashboard';

export default function SystemStatusPage() {
  return (
    <View style={{ flex: 1 }}>
      <SystemHealthDashboard />
    </View>
  );
}
