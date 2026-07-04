import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useHealthSharing } from '@/lib/health/hooks/useHealthSharing';
import { useHealthEmergency } from '@/lib/health/hooks/useHealthEmergency';
import { getEmergencyData } from '@/lib/health/security/emergency-card';

const SCOPE_OPTIONS = [
  { key: 'visits', label: 'Medical Visits' },
  { key: 'prescriptions', label: 'Prescriptions' },
  { key: 'lab_results', label: 'Lab Results' },
  { key: 'imaging', label: 'Imaging Reports' },
  { key: 'vaccinations', label: 'Vaccinations' },
  { key: 'allergies', label: 'Allergies' },
];

const EXPIRY_OPTIONS = [
  { label: '15 min', value: 15 },
  { label: '1 hour', value: 60 },
  { label: '4 hours', value: 240 },
  { label: '24 hours', value: 1440 },
];

export default function ShareScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const mtaaId = user?.id || '';
  const { shares, loadShares, createShareQR, createEmergencyQR, revoke, loading } = useHealthSharing(mtaaId);
  const [selectedScope, setSelectedScope] = useState<string[]>(['visits', 'prescriptions']);
  const [expiry, setExpiry] = useState(60);
  const [hospitalId, setHospitalId] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [emergencyQR, setEmergencyQR] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'share' | 'emergency' | 'active'>('share');

  async function generateShare() {
    if (!hospitalId || !hospitalName) return;
    const qr = await createShareQR(hospitalId, hospitalName, selectedScope, expiry);
    if (qr) setQrCode(qr);
  }

  async function generateEmergency() {
    const data = await getEmergencyData();
    if (data) {
      const qr = await createEmergencyQR(data);
      setEmergencyQR(qr);
    }
  }

  function toggleScope(key: string) {
    setSelectedScope(prev =>
      prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Share Health Data</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'share' && styles.tabActive]} onPress={() => setActiveTab('share')}>
          <Text style={[styles.tabText, activeTab === 'share' && styles.tabTextActive]}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'emergency' && styles.tabActive]} onPress={() => setActiveTab('emergency')}>
          <Text style={[styles.tabText, activeTab === 'emergency' && styles.tabTextActive]}>Emergency QR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'active' && styles.tabActive]} onPress={() => { setActiveTab('active'); loadShares(); }}>
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>Active ({shares.length})</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'share' && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>Hospital / Provider</Text>
          <TextInput style={styles.input} placeholder="Hospital ID" placeholderTextColor="#666" value={hospitalId} onChangeText={setHospitalId} />
          <TextInput style={styles.input} placeholder="Hospital Name" placeholderTextColor="#666" value={hospitalName} onChangeText={setHospitalName} />

          <Text style={styles.sectionTitle}>What to Share</Text>
          {SCOPE_OPTIONS.map(opt => (
            <TouchableOpacity key={opt.key} style={styles.scopeRow} onPress={() => toggleScope(opt.key)}>
              <View style={[styles.checkbox, selectedScope.includes(opt.key) && styles.checkboxChecked]}>
                {selectedScope.includes(opt.key) && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.scopeLabel}>{opt.label}</Text>
            </TouchableOpacity>
          ))}

          <Text style={styles.sectionTitle}>Access Duration</Text>
          <View style={styles.expiryRow}>
            {EXPIRY_OPTIONS.map(opt => (
              <TouchableOpacity key={opt.value} style={[styles.expiryChip, expiry === opt.value && styles.expiryChipActive]} onPress={() => setExpiry(opt.value)}>
                <Text style={[styles.expiryText, expiry === opt.value && styles.expiryTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.generateBtn} onPress={generateShare} disabled={loading}>
            <Text style={styles.generateText}>{loading ? 'Generating...' : 'Generate Share QR'}</Text>
          </TouchableOpacity>

          {qrCode && (
            <View style={styles.qrCard}>
              <Text style={styles.qrLabel}>Scan to request access</Text>
              <View style={styles.qrBox}>
                <Text style={styles.qrData}>{qrCode.slice(0, 50)}...</Text>
              </View>
              <Text style={styles.qrExpiry}>Expires in {expiry} minutes</Text>
            </View>
          )}
        </ScrollView>
      )}

      {activeTab === 'emergency' && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.infoText}>Emergency QR contains only essential info for first responders:</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Name</Text>
            <Text style={styles.bullet}>• Blood group</Text>
            <Text style={styles.bullet}>• Allergies</Text>
            <Text style={styles.bullet}>• Critical medications</Text>
            <Text style={styles.bullet}>• Emergency contact</Text>
          </View>
          <TouchableOpacity style={styles.generateBtn} onPress={generateEmergency}>
            <Text style={styles.generateText}>Generate Emergency QR</Text>
          </TouchableOpacity>
          {emergencyQR && (
            <View style={styles.qrCard}>
              <Text style={styles.qrLabel}>Emergency QR</Text>
              <View style={styles.qrBox}>
                <Text style={styles.qrData}>{emergencyQR.slice(0, 50)}...</Text>
              </View>
              <Text style={styles.qrExpiry}>Valid for 24 hours</Text>
            </View>
          )}
        </ScrollView>
      )}

      {activeTab === 'active' && (
        <ScrollView contentContainerStyle={styles.content}>
          {shares.length === 0 ? (
            <Text style={styles.empty}>No active shares</Text>
          ) : (
            shares.map(s => (
              <View key={s.id} style={styles.shareCard}>
                <Text style={styles.shareHospital}>{s.hospitalName}</Text>
                <Text style={styles.shareScope}>Access: {s.scope.join(', ')}</Text>
                <Text style={styles.shareExpiry}>Expires: {new Date(s.expiresAt).toLocaleString()}</Text>
                <TouchableOpacity style={styles.revokeBtn} onPress={() => revoke(s.id)}>
                  <Text style={styles.revokeText}>Revoke Access</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50 },
  back: { color: '#fff', fontSize: 22 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#007AFF' },
  tabText: { color: '#888', fontSize: 13 },
  tabTextActive: { color: '#fff', fontWeight: '600' },
  content: { padding: 16 },
  sectionTitle: { color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  input: { backgroundColor: '#1a1a1a', borderRadius: 10, padding: 12, color: '#fff', fontSize: 14, marginBottom: 8 },
  scopeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#555', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  scopeLabel: { color: '#ccc', fontSize: 14 },
  expiryRow: { flexDirection: 'row', gap: 8 },
  expiryChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#1a1a1a' },
  expiryChipActive: { backgroundColor: '#007AFF' },
  expiryText: { color: '#888', fontSize: 13 },
  expiryTextActive: { color: '#fff', fontWeight: '600' },
  generateBtn: { backgroundColor: '#007AFF', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20 },
  generateText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  qrCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 20, alignItems: 'center', marginTop: 16 },
  qrLabel: { color: '#888', fontSize: 12, marginBottom: 8 },
  qrBox: { backgroundColor: '#fff', padding: 20, borderRadius: 8 },
  qrData: { color: '#000', fontSize: 10, fontFamily: 'monospace' },
  qrExpiry: { color: '#FF9500', fontSize: 12, marginTop: 8 },
  infoText: { color: '#ccc', fontSize: 14, marginBottom: 12 },
  bulletList: { marginBottom: 16 },
  bullet: { color: '#888', fontSize: 14, marginBottom: 6 },
  empty: { color: '#666', textAlign: 'center', marginTop: 40 },
  shareCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 10 },
  shareHospital: { color: '#fff', fontSize: 15, fontWeight: '600' },
  shareScope: { color: '#888', fontSize: 12, marginTop: 4 },
  shareExpiry: { color: '#FF9500', fontSize: 12, marginTop: 2 },
  revokeBtn: { marginTop: 10, alignSelf: 'flex-start' },
  revokeText: { color: '#FF3B30', fontSize: 13, fontWeight: '600' },
});
