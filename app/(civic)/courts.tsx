import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CourtsScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
      <Ionicons name="scale" size={64} color="#4338CA" />
      <Text style={styles.title}>Courts</Text>
      <Text style={styles.subtitle}>Case tracking and e-filing</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816', alignItems: 'center', justifyContent: 'center', padding: 20 },
  back: { position: 'absolute', top: 60, left: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: 'white', marginTop: 20 },
  subtitle: { fontSize: 14, color: '#94A3B8', marginTop: 8, textAlign: 'center' },
});
