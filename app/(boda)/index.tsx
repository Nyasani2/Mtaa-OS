import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

export default function BodaRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/(mtaxi)?serviceType=boda'); }, [router]);
  return (
    <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#000' }}>
      <ActivityIndicator size="large" color="#10B981" />
    </View>
  );
}
