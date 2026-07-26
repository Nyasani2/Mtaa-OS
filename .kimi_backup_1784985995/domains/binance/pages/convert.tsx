import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

export default function ConvertPage() {
  const [amount, setAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState('BTC');
  const [toCurrency, setToCurrency] = useState('USDT');
  const [quote, setQuote] = useState<any>(null);

  const getQuote = () => {
    setQuote({ rate: 65000, estimated: parseFloat(amount) * 65000 });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Convert</Text>
      <TextInput style={styles.input} placeholder="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="From" value={fromCurrency} onChangeText={setFromCurrency} />
      <TextInput style={styles.input} placeholder="To" value={toCurrency} onChangeText={setToCurrency} />
      <Button title="Get Quote" onPress={getQuote} />
      {quote && <Text>Rate: {quote.rate} = {quote.estimated}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 8, marginBottom: 8 }
});
