import { View, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CashpointScanScreen() {
  const router = useRouter();
  const { cashpointId, qrCode, serviceType } = useLocalSearchParams();
  return (
    <SafeAreaView style={{ flex:1, backgroundColor:'#f8fafc', padding:20 }}>
      <TouchableOpacity onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color="#0f172a" />
      </TouchableOpacity>
      <Text style={{ fontSize:20, fontWeight:'700', color:'#0f172a', marginTop:20 }}>
        Scan Cashpoint QR
      </Text>
      <Text style={{ color:'#64748b', marginTop:10 }}>
        Cashpoint: {qrCode} | Service: {serviceType}
      </Text>
    </SafeAreaView>
  );
}
