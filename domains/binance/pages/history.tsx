
import { View, Text, ScrollView } from 'react-native';
import { useBinanceConversions } from '../../hooks/useBinanceConversions';
import ConversionCard from '../../components/ConversionCard';

export default function HistoryPage() {
  // In real app, get userId from auth
  const userId = 'placeholder';
  const { data: conversions, isLoading } = useBinanceConversions(userId);

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 16 }}>
          Conversion History
        </Text>
      </View>

      <ScrollView style={{ paddingHorizontal: 20 }}>
        {isLoading ? (
          <Text style={{ color: '#94a3b8', textAlign: 'center', marginTop: 40 }}>Loading...</Text>
        ) : conversions?.length === 0 ? (
          <Text style={{ color: '#94a3b8', textAlign: 'center', marginTop: 40 }}>No conversions yet</Text>
        ) : (
          conversions?.map(conv => (
            <ConversionCard key={conv.id} conversion={conv} />
          ))
        )}
      </ScrollView>
    </View>
  );
}
