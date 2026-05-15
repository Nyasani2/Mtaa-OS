import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView 
} from 'react-native';
import { router } from 'expo-router';

const licenses = [
  { name: 'React Native', license: 'MIT', author: 'Meta' },
  { name: 'Expo', license: 'MIT', author: 'Expo Team' },
  { name: 'Supabase', license: 'Apache-2.0', author: 'Supabase Inc' },
  { name: 'Zustand', license: 'MIT', author: 'Poimandres' },
  { name: 'React Native Reanimated', license: 'MIT', author: 'Software Mansion' },
  { name: 'React Navigation', license: 'MIT', author: 'React Navigation Team' },
  { name: 'TypeScript', license: 'Apache-2.0', author: 'Microsoft' },
  { name: 'React Native QRCode SVG', license: 'MIT', author: 'AwesomeProject' },
  { name: 'Expo Image Picker', license: 'MIT', author: 'Expo Team' },
  { name: 'NetInfo', license: 'MIT', author: 'React Native Community' },
];

export default function LicensesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Open Source Licenses</Text>
      <Text style={styles.subtitle}>MTAA OS is built on open source software</Text>
      
      <ScrollView style={styles.content}>
        {licenses.map((lib, index) => (
          <View key={index} style={styles.licenseRow}>
            <View style={styles.licenseInfo}>
              <Text style={styles.libName}>{lib.name}</Text>
              <Text style={styles.libAuthor}>by {lib.author}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{lib.license}</Text>
            </View>
          </View>
        ))}

        <Text style={styles.footer}>
          Full license texts are available at github.com/mtaa-afriq/licenses{'\n\n'}
          MTAA OS v1.0.0 © 2026 MTAA AFRIQ. All rights reserved.
        </Text>
      </ScrollView>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', padding: 16, paddingTop: 48 },
  subtitle: { fontSize: 14, color: '#888', paddingHorizontal: 16, marginBottom: 16 },
  content: { flex: 1, paddingHorizontal: 16 },
  licenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 1,
    borderRadius: 8,
  },
  licenseInfo: { flex: 1 },
  libName: { color: '#fff', fontSize: 15, fontWeight: '500' },
  libAuthor: { color: '#888', fontSize: 12, marginTop: 2 },
  badge: {
    backgroundColor: '#6366f120',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: { color: '#6366f1', fontSize: 11, fontWeight: '600' },
  footer: { color: '#666', fontSize: 12, marginTop: 24, marginBottom: 40, lineHeight: 20, textAlign: 'center' },
  backButton: { padding: 16, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#1a1a1a' },
  backText: { color: '#6366f1', fontSize: 14 },
});
