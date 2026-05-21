
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { useConversionQuote, useCreateConversion } from '../../hooks/useBinanceConversions';
import QuoteDisplay from '../../components/QuoteDisplay';
import { Wallet, ArrowRight } from 'lucide-react-native';

export default function ConvertPage() {
  const [amount, setAmount] = useState('');
  const [binanceEmail, setBinanceEmail] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');

  const quoteMutation = useConversionQuote();
  const createMutation = useCreateConversion();

  const handleGetQuote = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 100) {
      Alert.alert('Error', 'Minimum amount is 100 KES');
      return;
    }
    quoteMutation.mutate({ amount: numAmount });
  };

  const handleConvert = () => {
    if (!quoteMutation.data) return;
    // In real app, get userId and walletId from auth context
    createMutation.mutate({
      userId: 'placeholder',
      walletId: 'placeholder',
      fromAmount: parseFloat(amount),
      binanceEmail,
      destinationAddress,
    });
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 16 }}>
          Convert to USDT
        </Text>

        <View style={{ backgroundColor: '#1e293b', borderRadius: 16, padding: 16 }}>
          <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 8 }}>Amount (KES)</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Wallet size={20} color="#f0b90b" />
            <TextInput
              placeholder="Enter amount in KES"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              style={{ color: '#fff', fontSize: 18, marginLeft: 12, flex: 1 }}
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleGetQuote}
          disabled={quoteMutation.isPending}
          style={{
            backgroundColor: '#f0b90b',
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
            marginTop: 16,
          }}
        >
          <Text style={{ color: '#000', fontSize: 16, fontWeight: '700' }}>
            {quoteMutation.isPending ? 'Getting Quote...' : 'Get Quote'}
          </Text>
        </TouchableOpacity>

        {quoteMutation.data && (
          <>
            <QuoteDisplay quote={quoteMutation.data} />

            <View style={{ backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 16 }}>
              <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 8 }}>Binance Email</Text>
              <TextInput
                placeholder="your@email.com"
                placeholderTextColor="#64748b"
                value={binanceEmail}
                onChangeText={setBinanceEmail}
                style={{ color: '#fff', fontSize: 14 }}
              />
            </View>

            <View style={{ backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 16 }}>
              <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 8 }}>USDT Address (TRC20)</Text>
              <TextInput
                placeholder="T..."
                placeholderTextColor="#64748b"
                value={destinationAddress}
                onChangeText={setDestinationAddress}
                style={{ color: '#fff', fontSize: 14 }}
              />
            </View>

            <TouchableOpacity
              onPress={handleConvert}
              disabled={createMutation.isPending}
              style={{
                backgroundColor: '#10b981',
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
              }}
            >
              <ArrowRight size={20} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginLeft: 8 }}>
                {createMutation.isPending ? 'Processing...' : 'Confirm Conversion'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}
