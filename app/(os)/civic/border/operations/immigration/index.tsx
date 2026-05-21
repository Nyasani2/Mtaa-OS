import { View, ScrollView, StyleSheet, TextInput } from 'react-native';
import { useState } from 'react';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SafeAreaWrapper } from '@/components/ui/SafeAreaWrapper';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { Text } from 'react-native';

export default function ImmigrationProcessing() {
  const [passportNumber, setPassportNumber] = useState('');
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSearch = async () => {
    setSearching(true);
    setTimeout(() => {
      setResult({ status: 'valid', name: 'John Doe', nationality: 'Kenya', visaType: 'Business', expiry: '2027-03-15', entries: 3 });
      setSearching(false);
    }, 1500);
  };

  return (
    <SafeAreaWrapper>
      <ScreenHeader title="Immigration" subtitle="Passport & visa verification" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Card style={styles.searchCard}>
          <Text style={styles.label}>Passport / ID Number</Text>
          <TextInput style={styles.input} placeholder="Enter passport number..." placeholderTextColor="#64748b" value={passportNumber} onChangeText={setPassportNumber} autoCapitalize="characters" />
          <Button title={searching ? "Searching..." : "Verify"} onPress={handleSearch} disabled={!passportNumber || searching} />
        </Card>
        {searching && <LoadingState message="Verifying passport..." />}
        {result && (
          <Card style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultStatus}>✅ {result.status.toUpperCase()}</Text>
            </View>
            <Text style={styles.resultDetail}>Name: {result.name}</Text>
            <Text style={styles.resultDetail}>Nationality: {result.nationality}</Text>
            <Text style={styles.resultDetail}>Visa Type: {result.visaType}</Text>
            <Text style={styles.resultDetail}>Entries Used: {result.entries}</Text>
            <Text style={styles.resultDetail}>Expires: {result.expiry}</Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  searchCard: { padding: 16, marginBottom: 16 },
  label: { color: '#94a3b8', fontSize: 13, marginBottom: 8 },
  input: { backgroundColor: '#1e293b', color: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 12 },
  resultCard: { padding: 16 },
  resultHeader: { marginBottom: 12 },
  resultStatus: { color: '#10b981', fontSize: 16, fontWeight: '700' },
  resultDetail: { color: '#e2e8f0', fontSize: 14, marginBottom: 6 },
});
