import { useState } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView 
} from 'react-native';
import { router } from 'expo-router';

export default function TermsScreen() {
  const [accepted, setAccepted] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Terms of Service</Text>
      
      <ScrollView style={styles.content}>
        <Text style={styles.heading}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By accessing or using MTAA OS, you agree to be bound by these Terms of Service. 
          If you do not agree, you may not use the platform.
        </Text>

        <Text style={styles.heading}>2. Services</Text>
        <Text style={styles.paragraph}>
          civic services, and financial tools. All services are subject to availability and 
          regulatory compliance in your jurisdiction.
        </Text>

        <Text style={styles.heading}>3. Account Security</Text>
        <Text style={styles.paragraph}>
          You are responsible for maintaining the confidentiality of your account credentials. 
          Notify us immediately of any unauthorized access. MTAA is not liable for losses 
          due to your failure to secure your account.
        </Text>

        <Text style={styles.heading}>4. Financial Services</Text>
        <Text style={styles.paragraph}>
          Wallet balances are held in regulated financial institutions. Transactions are 
          final once confirmed. MTAA reserves the right to hold funds pending compliance review.
        </Text>

        <Text style={styles.heading}>5. Prohibited Activities</Text>
        <Text style={styles.paragraph}>
          You may not use MTAA for illegal activities, fraud, money laundering, or to 
          circumvent sanctions. Violation will result in account termination and legal action.
        </Text>

        <Text style={styles.heading}>6. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          MTAA's liability is limited to the amount of fees paid by you in the 12 months 
          preceding the claim. We are not liable for indirect, incidental, or consequential damages.
        </Text>

        <Text style={styles.heading}>7. Changes to Terms</Text>
        <Text style={styles.paragraph}>
          We may update these terms at any time. Continued use after changes constitutes acceptance. 
          Material changes will be notified via email or in-app alert.
        </Text>

        <Text style={styles.heading}>8. Governing Law</Text>
        <Text style={styles.paragraph}>
          These terms are governed by the laws of the Republic of Kenya. Disputes shall be 
          resolved through arbitration in Nairobi.
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
