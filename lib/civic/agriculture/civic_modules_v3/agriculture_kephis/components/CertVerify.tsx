import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, ScrollView } from 'react-native';
import CertificateCard from './CertificateCard';
import { kephisService } from '../services/kephisService';

const CertVerify: React.FC = () => {
  const [certNumber, setCertNumber] = useState('');
  const [certificate, setCertificate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!certNumber.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await kephisService.verifyCertificate(certNumber);
      setCertificate(result);
    } catch (err: any) {
      setError(err.message || 'Certificate not found');
      setCertificate(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Certificate Verification</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter certificate number"
        value={certNumber}
        onChangeText={setCertNumber}
      />
      <Button title={loading ? 'Verifying...' : 'Verify'} onPress={handleVerify} disabled={loading} />
      {error && <Text style={styles.error}>{error}</Text>}
      {certificate && <CertificateCard certificate={certificate} />}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: '#fff' },
  error: { color: '#ef4444', marginTop: 12 },
});

export default CertVerify;
