import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PinCreateScreen() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleKeyPress = (key: string) => {
    if (pin.length < 6) {
      const newPin = pin + key;
      setPin(newPin);
      setError('');

      if (newPin.length === 6) {
        setTimeout(() => {
          router.push({
            pathname: '/wallet/onboarding/pin-confirm',
            params: { initialPin: newPin }
          });
        }, 200);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>Step 2 of 3</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Create Your PIN</Text>
        <Text style={styles.subtitle}>
          This PIN will secure your wallet. Do not share it with anyone.
        </Text>

        <View style={styles.pinDisplay}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={[styles.pinDot, pin.length > i && styles.pinDotFilled]} />
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <View style={styles.keypad}>
        {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['', '0', '⌫']].map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {row.map((key) => (
              <TouchableOpacity
                key={key}
                style={[styles.keypadButton, key === '' && styles.keypadButtonEmpty]}
                onPress={() => key === '⌫' ? handleDelete() : key && handleKeyPress(key)}
                disabled={key === ''}
              >
                <Text style={styles.keypadText}>{key}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16 },
  backButton: { color: '#00D68F', fontSize: 16, fontWeight: '500' },
  stepIndicator: { color: '#888888', fontSize: 14 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#888888', textAlign: 'center', marginBottom: 40, lineHeight: 24 },
  pinDisplay: { flexDirection: 'row', gap: 16, marginBottom: 40 },
  pinDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#333333' },
  pinDotFilled: { backgroundColor: '#00D68F', borderColor: '#00D68F' },
  errorText: { color: '#FF4444', fontSize: 14, marginTop: 16 },
  keypad: { paddingHorizontal: 24, paddingBottom: 32 },
  keypadRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  keypadButton: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center' },
  keypadButtonEmpty: { backgroundColor: 'transparent' },
  keypadText: { color: '#FFFFFF', fontSize: 24, fontWeight: '600' },
});

