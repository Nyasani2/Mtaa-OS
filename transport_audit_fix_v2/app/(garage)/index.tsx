import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
  ActivityIndicator, Modal, TextInput, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import {
  getGarageByOwner,
  getGarageDevices,
  registerGarageDevice,
  getGarageInspections,
  createInspection,
} from '@/lib/transport/services/ride.service';

export default function GarageScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [garage, setGarage] = useState<any>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [tab, setTab] = useState<'overview' | 'devices' | 'inspections'>('overview');
  const [loading, setLoading] = useState(true);

  // Device modal
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [devName, setDevName] = useState('');
  const [devType, setDevType] = useState('');
  const [devSerial, setDevSerial] = useState('');

  // Inspection modal
  const [showInspectModal, setShowInspectModal] = useState(false);
  const [inspectVehicleId, setInspectVehicleId] = useState('');
  const [inspectType, setInspectType] = useState('routine');
  const [inspectResult, setInspectResult] = useState('pending');
  const [inspectNotes, setInspectNotes] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    loadAll();
  }, [user?.id]);

  async function loadAll() {
    setLoading(true);
    try {
      const g = await getGarageByOwner(user!.id);
      setGarage(g);
      if (g?.id) {
        const [d, i] = await Promise.all([
          getGarageDevices(g.id),
          getGarageInspections(g.id),
        ]);
        setDevices(d);
        setInspections(i);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
    setLoading(false);
  }

  const quickActions = [
    { label: 'Dashboard', icon: '📊', onPress: () => setTab('overview') },
    { label: 'Devices', icon: '📹', onPress: () => setTab('devices') },
    { label: 'Inspections', icon: '🔍', onPress: () => setTab('inspections') },
    { label: 'Diagnostics', icon: '🔧', onPress: () => Alert.alert('Diagnostics', 'Connect OBD scanner to begin.') },
    { label: 'Inventory', icon: '📦', onPress: () => Alert.alert('Inventory', 'Inventory management coming soon.') },
    { label: 'Fleet', icon: '🚗', onPress: () => Alert.alert('Fleet', 'Fleet overview coming soon.') },
  ];

  const handleRegisterDevice = async () => {
    if (!garage?.id) { Alert.alert('No garage found'); return; }
    if (!devName || !devType) { Alert.alert('Name and type required'); return; }
    try {
      await registerGarageDevice({
        garage_id: garage.id,
        device_name: devName,
        device_type: devType,
        serial_number: devSerial,
      });
      setShowDeviceModal(false);
      setDevName(''); setDevType(''); setDevSerial('');
      loadAll();
      Alert.alert('Device Registered');
    } catch (err: any) {
      Alert.alert('Failed', err.message);
    }
  };

  const handleCreateInspection = async () => {
    if (!garage?.id) { Alert.alert('No garage found'); return; }
    if (!inspectVehicleId) { Alert.alert('Vehicle ID required'); return; }
    try {
      await createInspection({
        garage_id: garage.id,
        vehicle_id: inspectVehicleId,
        inspector_id: user!.id,
        inspection_type: inspectType,
        result: inspectResult,
        notes: inspectNotes,
      });
      setShowInspectModal(false);
      setInspectVehicleId(''); setInspectNotes('');
      loadAll();
      Alert.alert('Inspection Recorded');
    } catch (err: any) {
      Alert.alert('Failed', err.message);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color="#e94560" /></View>;

  if (!garage) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>No garage registered.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.push('/(garage)/register' as any)}>
          <Text style={styles.btnText}>Register Garage</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.header}>🔧 {garage.business_name}</Text>
      <Text style={styles.meta}>{garage.city}, {garage.county} • {garage.status}</Text>

      {/* Quick Actions */}
      <View style={styles.grid}>
        {quickActions.map((a) => (
          <TouchableOpacity key={a.label} style={styles.tile} onPress={a.onPress}>
            <Text style={styles.tileIcon}>{a.icon}</Text>
            <Text style={styles.tileText}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Register Device Button */}
      <TouchableOpacity style={styles.btn} onPress={() => setShowDeviceModal(true)}>
        <Text style={styles.btnText}>+ Register Device</Text>
      </TouchableOpacity>

      {/* Tab Content */}
      {tab === 'overview' && (
        <View style={styles.card}>
          <Text style={styles.label}>Overview</Text>
          <Text style={styles.value}>Revenue: KES {garage.total_revenue}</Text>
          <Text style={styles.value}>Jobs: {garage.total_jobs} (Active: {garage.active_jobs})</Text>
          <Text style={styles.value}>Rating: {garage.rating} ⭐ ({garage.review_count} reviews)</Text>
          <Text style={styles.value}>Bays: {garage.number_of_bays}</Text>
          <Text style={styles.value}>Emergency: {garage.emergency_service ? 'Yes' : 'No'}</Text>
        </View>
      )}

      {tab === 'devices' && (
        <View>
          <Text style={styles.section}>Devices ({devices.length})</Text>
          {devices.length === 0 ? (
            <Text style={styles.empty}>No devices registered.</Text>
          ) : (
            devices.map((d) => (
              <View key={d.id} style={styles.card}>
                <Text style={styles.value}>{d.device_name}</Text>
                <Text style={styles.meta}>Type: {d.device_type} • Serial: {d.serial_number || 'N/A'}</Text>
                <Text style={styles.meta}>Status: {d.status}</Text>
              </View>
            ))
          )}
        </View>
      )}

      {tab === 'inspections' && (
        <View>
          <Text style={styles.section}>Inspections ({inspections.length})</Text>
          <TouchableOpacity style={[styles.btn, { marginBottom: 12 }]} onPress={() => setShowInspectModal(true)}>
            <Text style={styles.btnText}>+ New Inspection</Text>
          </TouchableOpacity>
          {inspections.length === 0 ? (
            <Text style={styles.empty}>No inspections recorded.</Text>
          ) : (
            inspections.map((i) => (
              <View key={i.id} style={styles.card}>
                <Text style={styles.value}>Vehicle: {i.mtaxi_vehicles?.plate_number || i.vehicle_id}</Text>
                <Text style={styles.meta}>Type: {i.inspection_type} • Result: {i.result}</Text>
                <Text style={styles.meta}>{i.notes}</Text>
                <Text style={styles.date}>{new Date(i.inspected_at).toLocaleString()}</Text>
              </View>
            ))
          )}
        </View>
      )}

      {/* Device Modal */}
      <Modal visible={showDeviceModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Register Device</Text>
            <TextInput style={styles.input} placeholder="Device Name" placeholderTextColor="#555" value={devName} onChangeText={setDevName} />
            <TextInput style={styles.input} placeholder="Device Type (e.g. dashcam, scanner)" placeholderTextColor="#555" value={devType} onChangeText={setDevType} />
            <TextInput style={styles.input} placeholder="Serial Number (optional)" placeholderTextColor="#555" value={devSerial} onChangeText={setDevSerial} />
            <TouchableOpacity style={styles.btn} onPress={handleRegisterDevice}>
              <Text style={styles.btnText}>Save Device</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, { backgroundColor: '#333', marginTop: 8 }]} onPress={() => setShowDeviceModal(false)}>
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Inspection Modal */}
      <Modal visible={showInspectModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>New Inspection</Text>
            <TextInput style={styles.input} placeholder="Vehicle ID (UUID)" placeholderTextColor="#555" value={inspectVehicleId} onChangeText={setInspectVehicleId} />
            <TextInput style={styles.input} placeholder="Inspection Type (routine, annual, pre-trip)" placeholderTextColor="#555" value={inspectType} onChangeText={setInspectType} />
            <TextInput style={styles.input} placeholder="Result (pending, pass, fail)" placeholderTextColor="#555" value={inspectResult} onChangeText={setInspectResult} />
            <TextInput style={styles.input} placeholder="Notes" placeholderTextColor="#555" value={inspectNotes} onChangeText={setInspectNotes} multiline />
            <TouchableOpacity style={styles.btn} onPress={handleCreateInspection}>
              <Text style={styles.btnText}>Record Inspection</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, { backgroundColor: '#333', marginTop: 8 }]} onPress={() => setShowInspectModal(false)}>
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  header: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 4 },
  meta: { color: '#8892b0', fontSize: 13, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  tile: { width: '30%', backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, alignItems: 'center' },
  tileIcon: { fontSize: 24, marginBottom: 6 },
  tileText: { color: '#fff', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  btn: { backgroundColor: '#e94560', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 12 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  card: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 10 },
  label: { color: '#8892b0', fontSize: 11, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' },
  value: { color: '#fff', fontSize: 15, marginBottom: 4 },
  section: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 10 },
  empty: { color: '#555', fontSize: 14, textAlign: 'center', marginVertical: 20 },
  date: { color: '#555', fontSize: 11, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalBox: { backgroundColor: '#1a1a2e', borderRadius: 16, padding: 20 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 14 },
  input: { color: '#fff', fontSize: 15, borderBottomWidth: 1, borderBottomColor: '#333', paddingVertical: 8, marginBottom: 12 },
});
