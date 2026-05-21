import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView 
} from 'react-native';
import { router } from 'expo-router';

export default function PrivacyPolicyScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Privacy Policy</Text>
      
      <ScrollView style={styles.content}>
        <Text style={styles.heading}>1. Information We Collect</Text>
        <Text style={styles.paragraph}>
          We collect information you provide (name, email, phone, KYC documents), 
          transaction data, device information, and usage patterns. This is necessary 
          to provide secure financial services.
        </Text>

        <Text style={styles.heading}>2. How We Use Your Data</Text>
        <Text style={styles.paragraph}>
          Your data is used to process transactions, prevent fraud, comply with regulations, 
          and improve our services. We do not sell your personal information to third parties.
        </Text>

        <Text style={styles.heading}>3. Data Sharing</Text>
        <Text style={styles.paragraph}>
          We share data only with: (a) regulated financial partners for transaction processing, 
          (b) law enforcement when legally required, (c) service providers under strict confidentiality.
        </Text>

        <Text style={styles.heading}>4. Data Security</Text>
        <Text style={styles.paragraph}>
          We use AES-256 encryption, TLS 1.3 for transmission, and multi-factor authentication. 
          Access is logged and audited. Data is stored in ISO 27001 certified facilities.
        </Text>

        <Text style={styles.heading}>5. Your Rights</Text>
        <Text style={styles.paragraph}>
          You have the right to access, correct, delete, or export your data. Contact 
          privacy@mtaa-afriq.com for data subject requests. Response time is 30 days.
        </Text>

        <Text style={styles.heading}>6. Cookies & Tracking</Text>
        <Text style={styles.paragraph}>
          We use essential cookies for session management and optional analytics cookies 
          to improve the app. You can disable analytics in Settings → Privacy.
        </Text>

        <Text style={styles.heading}>7. Children's Privacy</Text>
        <Text style={styles.paragraph}>
          MTAA OS is not intended for users under 18. We do not knowingly collect data from minors. 
          If discovered, such accounts are terminated and data deleted.
        </Text>

        <Text style={styles.heading}>8. Contact</Text>
        <Text style={styles.paragraph}>
          Data Protection Officer: dpo@mtaa-afriq.com{'\n'}
          Address: Nairobi, Kenya{'\n'}
          Phone: +254 700 000 000
        </Text>

        <Text style={styles.date}>Last updated: May 10, 2026</Text>
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
  content: { flex: 1, paddingHorizontal: 16 },
  heading: { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 20, marginBottom: 8 },
  paragraph: { color: '#aaa', fontSize: 14, lineHeight: 22, marginBottom: 12 },
  date: { color: '#666', fontSize: 12, marginTop: 24, marginBottom: 40 },
  backButton: { padding: 16, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#1a1a1a' },
  backText: { color: '#6366f1', fontSize: 14 },
});
