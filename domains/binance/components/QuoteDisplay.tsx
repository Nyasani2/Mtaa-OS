
import { View, Text } from 'react-native';
import { TrendingUp, ArrowDown } from 'lucide-react-native';

interface Props {
  quote: any;
}

export default function QuoteDisplay({ quote }: Props) {
  if (!quote) return null;

  return (
    <View style={{
      backgroundColor: '#1e293b',
      borderRadius: 16,
      padding: 20,
      marginVertical: 16,
    }}>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>
          {quote.fromAmount?.toLocaleString()} {quote.fromCurrency}
        </Text>
        <ArrowDown size={24} color="#94a3b8" style={{ marginVertical: 8 }} />
        <Text style={{ color: '#10b981', fontSize: 28, fontWeight: 'bold' }}>
          {quote.toAmount?.toFixed(2)} {quote.toCurrency}
        </Text>
      </View>

      <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#334155' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ color: '#94a3b8', fontSize: 12 }}>Exchange Rate</Text>
          <Text style={{ color: '#fff', fontSize: 12 }}>
            1 {quote.toCurrency} = {quote.exchangeRate?.toFixed(2)} {quote.fromCurrency}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ color: '#94a3b8', fontSize: 12 }}>Conversion Fee ({(quote.conversionFee / quote.toAmount * 100).toFixed(1)}%)</Text>
          <Text style={{ color: '#f59e0b', fontSize: 12 }}>
            -{quote.conversionFee?.toFixed(2)} {quote.toCurrency}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ color: '#94a3b8', fontSize: 12 }}>Network Fee</Text>
          <Text style={{ color: '#f59e0b', fontSize: 12 }}>
            -{quote.networkFee?.toFixed(2)} {quote.toCurrency}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#334155' }}>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>You Receive</Text>
          <Text style={{ color: '#10b981', fontSize: 14, fontWeight: '600' }}>
            {quote.netAmount?.toFixed(2)} {quote.toCurrency}
          </Text>
        </View>
      </View>
    </View>
  );
}
