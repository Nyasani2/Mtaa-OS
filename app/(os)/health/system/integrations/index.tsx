import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Plug,
  Link,
  Shield,
  Database,
  Cloud,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react-native';

const INTEGRATIONS = [
  { id: 'supabase', name: 'Supabase', desc: 'Primary database & auth', status: 'connected', icon: Database },
  { id: 'stripe', name: 'Stripe', desc: 'Payment processing', status: 'connected', icon: CreditCardIcon },
  { id: 'twilio', name: 'Twilio', desc: 'SMS notifications', status: 'disconnected', icon: MessageSquareIcon },
  { id: 'sendgrid', name: 'SendGrid', desc: 'Email delivery', status: 'connected', icon: MailIcon },
  { id: 'google', name: 'Google Health', desc: 'FHIR data sync', status: 'disconnected', icon: Cloud },
  { id: 'hl7', name: 'HL7 FHIR', desc: 'Interoperability standard', status: 'connected', icon: Link },
];

function CreditCardIcon(props: any) { return <Shield {...props} />; }
function MessageSquareIcon(props: any) { return <Plug {...props} />; }
function MailIcon(props: any) { return <Plug {...props} />; }

export default function IntegrationsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Integrations</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.desc}>Connect and manage external systems integrated with Health OS.</Text>

        {INTEGRATIONS.map((integration) => (
          <TouchableOpacity key={integration.id} style={styles.integrationCard} activeOpacity={0.7}>
            <View style={[styles.integrationIcon, { backgroundColor: integration.status === 'connected' ? '#22c55e15' : '#fef2f2' }]}>
              <integration.icon size={20} color={integration.status === 'connected' ? '#22c55e' : '#dc2626'} />
            </View>
            <View style={styles.integrationContent}>
              <Text style={styles.integrationName}>{integration.name}</Text>
              <Text style={styles.integrationDesc}>{integration.desc}</Text>
            </View>
            <View style={styles.integrationStatus}>
              {integration.status === 'connected' ? (
                <CheckCircle2 size={16} color="#22c55e" />
              ) : (
                <XCircle size={16} color="#dc2626" />
              )}
              <Text style={[styles.statusText, { color: integration.status === 'connected' ? '#22c55e' : '#dc2626' }]}>
                {integration.status === 'connected' ? 'Connected' : 'Disconnected'}
              </Text>
            </View>
            <ChevronRight size={16} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { backgroundColor: '#1e3a5f', paddingTop: 48, paddingHorizontal: 16, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  content: { padding: 16 },
  desc: { fontSize: 13, color: '#6b7280', marginBottom: 16, lineHeight: 18 },
  integrationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  integrationIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  integrationContent: { flex: 1 },
  integrationName: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  integrationDesc: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  integrationStatus: { flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 8 },
  statusText: { fontSize: 11, fontWeight: '600' },
});
