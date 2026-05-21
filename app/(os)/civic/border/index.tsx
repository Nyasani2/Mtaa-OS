import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { LoadingState } from '@/components/ui/LoadingState';

export default function BorderHome() {
  const router = useRouter();
  useEffect(() => { router.replace('/(os)/civic/border/dashboard'); }, [router]);
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
      <LoadingState message="Loading Border Control..." />
    </View>
  );
}
