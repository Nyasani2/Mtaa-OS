import React from 'react';
import { View } from 'react-native';
import { useAuthStore } from '@/hooks/useAuthStore';

interface OSGateProps {
  children: React.ReactNode;
}

export function OSGate({ children }: OSGateProps) {
  const { user } = useAuthStore();
  if (!user) return null;
  return <View style={{ flex: 1 }}>{children}</View>;
}

export default OSGate;
