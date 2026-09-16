import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import * as Location from 'expo-location';
export default function AmbulanceRequest() {
const router = useRouter();
const [loading, setLoading] = useState(false);
const [formData, setFormData] = useState({
patientName: '',
patientPhone: '',
pickupAddress: '',
emergencyType: 'critical',
notes: '',
});
const requestAmbulance = async () => {
if (!formData.patientName || !formData.patientPhone || !formData.pickupAddress) {
Alert.alert('Missing Information', 'Please fill in all required fields');
return;
}
setLoading(true);
try {
let location = null;
try {
const { status } = await Location.requestForegroundPermissionsAsync();
if (status === 'granted') {
location = await Location.getCurrentPositionAsync({});
}
} catch (e) {
console.log('Location permission denied');
}
const { data: { user } } = await supabase.auth.getUser();
const { data, error } = await supabase
.from('health_dispatches')
.insert({
patient_name: formData.patientName,
patient_phone: formData.patientPhone,
pickup_address: formData.pickupAddress,
destination_address: 'Nearest Hospital',
notes: formData.notes,
emergency_type: formData.emergencyType,
status: 'pending',
user_id: user?.id,
location_lat: location?.coords.latitude,
location_lng: location?.coords.longitude,
})
.select()
.single();
if (error) throw error;
Alert.alert('🚨 Ambulance Dispatched', 'Help is on the way! Billing has been initiated to your account.', [
{ text: 'OK', onPress: () => router.push('/health') }
]);
} catch (err: any) {
Alert.alert('Error', err.message);
} finally {
setLoading(false);
}
};
return (
<ScrollView style={styles.container}>
<View style={styles.header}>
<TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
<Ionicons name="arrow-back" size={24} color="#fff" />
</TouchableOpacity>
<Text style={styles.title}>🚨 Emergency Dispatch</Text>
</View>
<View style={styles.content}>
<View style={styles.warningBox}>
<Ionicons name="warning" size={32} color="#dc2626" />
<Text style={styles.warningText}>For life-threatening emergencies only. False calls may incur penalties.</Text>
</View>
<View style={styles.section}>
<Text style={styles.sectionTitle}>Who needs the ambulance?</Text>
<View style={styles.radioGroup}>
<TouchableOpacity style={[styles.radioCard, formData.emergencyType === 'self' && styles.radioActive]} onPress={() => setFormData({...formData, emergencyType: 'self'})}>
<Ionicons name="person" size={24} color={formData.emergencyType === 'self' ? '#dc2626' : '#6b7280'} />
<Text style={[styles.radioText, formData.emergencyType === 'self' && styles.radioTextActive]}>Myself</Text>
</TouchableOpacity>
<TouchableOpacity style={[styles.radioCard, formData.emergencyType === 'other' && styles.radioActive]} onPress={() => setFormData({...formData, emergencyType: 'other'})}>
<Ionicons name="people" size={24} color={formData.emergencyType === 'other' ? '#dc2626' : '#6b7280'} />
<Text style={[styles.radioText, formData.emergencyType === 'other' && styles.radioTextActive]}>Someone Else</Text>
</TouchableOpacity>
</View>
</View>
{formData.emergencyType === 'other' && (
<View style={styles.section}>
<Text style={styles.label}>Patient Name</Text>
<TextInput style={styles.input} placeholder="Enter patient name" value={formData.patientName} onChangeText={(t) => setFormData({...formData, patientName: t})} />
</View>
)}
<View style={styles.section}>
<Text style={styles.sectionTitle}>Your Location</Text>
<TouchableOpacity style={styles.locateBtn} onPress={() => Alert.alert('Location', 'Location services would activate here.')}>
<Text style={styles.locateBtnText}>📍 Get My Location</Text>
</TouchableOpacity>
</View>
<View style={styles.billingBox}>
<Text style={styles.billingTitle}>💳 Billing Information</Text>
<Text style={styles.billingDesc}>Ambulance dispatch fee: <Text style={styles.billingAmount}>KES 5,000</Text></Text>
<Text style={styles.billingNote}>Payment will be processed via your MTAA Wallet</Text>
</View>
<TouchableOpacity style={styles.dispatchBtn} onPress={requestAmbulance} disabled={loading}>
{loading ? <ActivityIndicator color="#fff" /> : (
<>
<Ionicons name="car" size={24} color="#fff" />
<Text style={styles.dispatchBtnText}>DISPATCH AMBULANCE NOW</Text>
</>
)}
</TouchableOpacity>
</View>
</ScrollView>
);
}
const styles = StyleSheet.create({
container: { flex: 1, backgroundColor: '#0f172a' },
header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#dc2626' },
backBtn: { marginRight: 16 }, title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
content: { padding: 20 },
warningBox: { flexDirection: 'row', backgroundColor: '#fef2f2', padding: 16, borderRadius: 12, marginBottom: 20, gap: 12 },
warningText: { flex: 1, color: '#dc2626', fontSize: 14, fontWeight: '600' },
section: { marginBottom: 20 }, sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 12 },
radioGroup: { flexDirection: 'row', gap: 12 },
radioCard: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 16, borderRadius: 12, gap: 12 },
radioActive: { backgroundColor: '#7f1d1d', borderWidth: 2, borderColor: '#dc2626' },
radioText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' }, radioTextActive: { color: '#fff' },
label: { fontSize: 14, color: '#94a3b8', marginBottom: 8 },
input: { backgroundColor: '#1e293b', padding: 16, borderRadius: 12, color: '#fff', fontSize: 16 },
locateBtn: { backgroundColor: '#1e293b', padding: 16, borderRadius: 12, alignItems: 'center' },
locateBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
billingBox: { backgroundColor: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 20 },
billingTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 12 },
billingDesc: { fontSize: 14, color: '#94a3b8', marginBottom: 8 },
billingAmount: { color: '#f59e0b', fontWeight: '700' },
billingNote: { fontSize: 12, color: '#64748b', marginTop: 8 },
dispatchBtn: { flexDirection: 'row', backgroundColor: '#dc2626', padding: 20, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 12 },
dispatchBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
