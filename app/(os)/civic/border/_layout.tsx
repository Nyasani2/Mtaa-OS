import { Stack } from 'expo-router';
import { View } from 'react-native';
import { BorderNav } from '@/lib/domains/civic/border/components/BorderNav';
import { useState } from 'react';

export default function BorderLayout() {
  const [alertCount, setAlertCount] = useState(0);
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0f172a' } }} />
      <BorderNav alertCount={alertCount} />
    </View>
  );
}
