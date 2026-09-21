// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { exchangeConnector } from '@/lib/services/exchange-connector';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function ConnectedAccountsScreen() {
  const { user } = useAuthStore();
  const [binanceKey, setBinanceKey] = useState('');
  const [binanceSecret, setBinanceSecret] = useState('');
  const [derivToken, setDerivToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSaveBinance = async () => {
    if (!binanceKey || !binanceSecret) return Alert.alert('Error', 'Both API Key and Secret are required');
    setLoading(true);
    try {
      await exchangeConnector.saveBinanceCredentials(user!.id, binanceKey, binanceSecret);
      Alert.alert('Success', 'Binance account connected securely');
      setBinanceKey(''); setBinanceSecret('');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDeriv = async () => {
    if (!derivToken) return Alert.alert('Error', 'Deriv token is required');
    setLoading(true);
    try {
      await exchangeConnector.saveDerivToken(user!.id, derivToken);
      Alert.alert('Success', 'Deriv account connected securely');
      setDerivToken('');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Connected Trading Accounts</Text>
      <Text style={styles.subheader}>Your keys are encrypted end-to-end. MTAA never stores them in plain text.</Text>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="logo-bitcoin" size={24} color="#F3BA2F" />
          <Text style={styles.cardTitle}>Binance</Text>
        </View>
        <TextInput style={styles.input} placeholder="API Key" value={binanceKey} onChangeText={setBinanceKey} secureTextEntry />
        <TextInput style={styles.input} placeholder="API Secret" value={binanceSecret} onChangeText={setBinanceSecret} secureTextEntry />
        <TouchableOpacity style={styles.btn} onPress={handleSaveBinance} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Saving...' : 'Connect Binance'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="trending-up" size={24} color="#ff4444" />
          <Text style={styles.cardTitle}>Deriv</Text>
        </View>
        <TextInput style={styles.input} placeholder="Deriv API Token" value={derivToken} onChangeText={setDerivToken} secureTextEntry />
        <TouchableOpacity style={styles.btn} onPress={handleSaveDeriv} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Saving...' : 'Connect Deriv'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  header: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 8 },
  subheader: { fontSize: 14, color: '#94a3b8', marginBottom: 24 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  input: { backgroundColor: '#0f172a', borderRadius: 8, padding: 12, color: '#fff', marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  btn: { backgroundColor: '#2563eb', borderRadius: 8, padding: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 }
});
