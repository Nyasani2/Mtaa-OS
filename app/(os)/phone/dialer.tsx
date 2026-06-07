import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';

export default function DialerScreen() {
  const router = useRouter();
  const [number, setNumber] = useState('');

  const dial = (digit: string) => setNumber((prev) => prev + digit);
  const clear = () => setNumber((prev) => prev.slice(0, -1));
  const call = () => {
    if (number) {
      // Route to call screen
      router.push(`/phone/call?number=${encodeURIComponent(number)}` as any);
    }
  };

  const keys = ['1','2','3','4','5','6','7','8','9','*','0','#'];

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.display}
        value={number}
        editable={false}
        placeholder="Enter number"
        placeholderTextColor="#666"
      />
      <View style={styles.pad}>
        {keys.map((k) => (
          <Pressable key={k} style={styles.key} onPress={() => dial(k)}>
            <Text style={styles.keyText}>{k}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.actions}>
        <Pressable style={styles.callBtn} onPress={call}>
          <Text style={styles.callText}>Call</Text>
        </Pressable>
        <Pressable style={styles.clearBtn} onPress={clear}>
          <Text style={styles.clearText}>Clear</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#000', alignItems: 'center' },
  display: { color: '#fff', fontSize: 28, textAlign: 'center', marginBottom: 24, minWidth: 200 },
  pad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', width: 240 },
  key: { width: 70, height: 70, backgroundColor: '#1a1a1a', margin: 4, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
  keyText: { color: '#fff', fontSize: 24 },
  actions: { flexDirection: 'row', gap: 16, marginTop: 24 },
  callBtn: { backgroundColor: '#0f0', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 8 },
  callText: { color: '#000', fontWeight: 'bold', fontSize: 18 },
  clearBtn: { backgroundColor: '#f00', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 8 },
  clearText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});
