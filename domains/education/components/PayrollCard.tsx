
import { View, Text } from 'react-native';
import { Wallet, Calendar } from 'lucide-react-native';

interface Props {
  record: any;
}

export default function PayrollCard({ record }: Props) {
  const statusColor = {
    pending: '#f59e0b',
    processed: '#3b82f6',
    paid: '#10b981',
  }[record.status] || '#94a3b8';

  return (
    <View style={{
      backgroundColor: '#1e293b',
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Calendar size={16} color="#94a3b8" />
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginLeft: 8 }}>
            {record.month}
          </Text>
        </View>
        <View style={{
          backgroundColor: statusColor + '20',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 8,
        }}>
          <Text style={{ color: statusColor, fontSize: 10, fontWeight: '600', textTransform: 'uppercase' }}>
            {record.status}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
        <View>
          <Text style={{ color: '#94a3b8', fontSize: 11 }}>Gross Pay</Text>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
            KES {record.gross_pay?.toLocaleString()}
          </Text>
        </View>
        <View>
          <Text style={{ color: '#94a3b8', fontSize: 11 }}>Net Pay</Text>
          <Text style={{ color: '#10b981', fontSize: 14, fontWeight: '600' }}>
            KES {record.net_pay?.toLocaleString()}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Wallet size={14} color="#94a3b8" />
          <Text style={{ color: '#94a3b8', fontSize: 11, marginLeft: 4 }}>
            {record.paid_via}
          </Text>
        </View>
      </View>
    </View>
  );
}
