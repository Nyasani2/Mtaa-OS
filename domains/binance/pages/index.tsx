
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRightLeft, History, Link, Settings, TrendingUp } from 'lucide-react-native';

export default function BinanceBridgeHome() {
  const router = useRouter();

  const modules = [
    { icon: ArrowRightLeft, label: 'Convert', route: '/binance/convert', color: '#f59e0b' },
    { icon: History, label: 'History', route: '/binance/history', color: '#3b82f6' },
    { icon: Link, label: 'Link Account', route: '/binance/link', color: '#10b981' },
    { icon: Settings, label: 'Settings', route: '/binance/settings', color: '#8b5cf6' },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <View style={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <TrendingUp size={32} color="#f0b90b" />
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#fff', marginLeft: 12 }}>
            Binance Bridge
          </Text>
        </View>
        <Text style={{ fontSize: 14, color: '#94a3b8', marginBottom: 24 }}>
          Convert KES to USDT and trade on Binance
        </Text>

        <View style={{ backgroundColor: '#1e293b', borderRadius: 16, padding: 20, marginBottom: 24 }}>
          <Text style={{ color: '#94a3b8', fontSize: 12 }}>Current Rate</Text>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 4 }}>
            1 USDT ≈ 130 KES
          </Text>
          <Text style={{ color: '#f59e0b', fontSize: 12, marginTop: 4 }}>
            Fee: 1.5% + 1 USDT network fee
          </Text>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {modules.map((m, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => router.push(m.route as any)}
              style={{
                width: '47%',
                backgroundColor: '#1e293b',
                borderRadius: 16,
                padding: 20,
                alignItems: 'center',
                borderLeftWidth: 4,
                borderLeftColor: m.color,
              }}
            >
              <m.icon size={32} color={m.color} />
              <Text style={{ color: '#fff', marginTop: 12, fontSize: 16, fontWeight: '600' }}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
