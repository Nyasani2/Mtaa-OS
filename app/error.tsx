import { View, Text, StyleSheet, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export default function ErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  const [details, setDetails] = useState('Loading error...');

  useEffect(() => {
    const errorMsg = error.toString() + '\n\n' + (error.stack || 'No stack trace');
    AsyncStorage.setItem('LAST_APP_ERROR', errorMsg);
    setDetails(errorMsg);
  }, [error]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>⚠️ App Error Detected</Text>
      <View style={styles.box}>
        <Text style={styles.errorText}>{details}</Text>
      </View>
      <Button title="Copy to Clipboard (if possible)" onPress={() => {}} />
      <View style={{height: 10}} />
      <Button title="Try Again" onPress={retry} color="#3b82f6" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', padding: 20 },
  title: { color: '#ef4444', fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  box: { backgroundColor: '#1e293b', padding: 15, borderRadius: 8, marginBottom: 20 },
  errorText: { color: '#f8fafc', fontSize: 12, fontFamily: 'monospace' },
});
