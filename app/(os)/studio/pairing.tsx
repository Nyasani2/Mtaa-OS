import React, { useState } from 'react';
import { Alert, View, Text, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { useMPairing } from '@/lib/services/mstudio-hooks';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function StudioPairingScreen() {
  const { user } = useAuthStore();
  const { session, devices, createSession, loadDevices, joinSession, loading } = useMPairing();
  const [sessionCode, setSessionCode] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [mode, setMode] = useState<'director' | 'device'>('director');

  const handleCreate = async () => {
    if (!user?.id) return;
    const s = await createSession(user.id, 'Multi-Cam Session');
    if (s) Alert.alert('Session Created', `Code: ${s.session_code}`);
  };

  const handleJoin = async () => {
    if (!sessionCode.trim() || !deviceName.trim()) return;
    const d = await joinSession(sessionCode.trim().toUpperCase(), `${user?.id}_${Date.now()}`, deviceName, 'camera');
    if (d) Alert.alert('Connected', `Joined as ${deviceName}`);
  };

  const handleLoad = async () => {
    if (!sessionCode.trim()) return;
    await loadDevices(sessionCode.trim().toUpperCase());
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a', padding: 16, paddingTop: 48 }}>
      <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>Multi-Camera Pairing</Text>

      <View style={{ flexDirection: 'row', marginBottom: 16, backgroundColor: '#1a1a1a', borderRadius: 10, padding: 4 }}>
        <TouchableOpacity onPress={() => setMode('director')} style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: mode === 'director' ? '#ff0000' : 'transparent', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Director</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMode('device')} style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: mode === 'device' ? '#ff0000' : 'transparent', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Camera</Text>
        </TouchableOpacity>
      </View>

      {mode === 'director' ? (
        <>
          <TouchableOpacity onPress={handleCreate} style={{ backgroundColor: '#ff0000', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Create Session</Text>
          </TouchableOpacity>
          {session && (
            <View style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <Text style={{ color: '#888', fontSize: 12 }}>SESSION CODE</Text>
              <Text style={{ color: '#fff', fontSize: 32, fontWeight: 'bold', letterSpacing: 4 }}>{session.session_code}</Text>
            </View>
          )}
          <TextInput value={sessionCode} onChangeText={setSessionCode} placeholder="Enter code to monitor" placeholderTextColor="#555" style={input} />
          <TouchableOpacity onPress={handleLoad} style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 }}>
            <Text style={{ color: '#fff' }}>Load Devices</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput value={sessionCode} onChangeText={setSessionCode} placeholder="Session Code" placeholderTextColor="#555" style={input} />
          <TextInput value={deviceName} onChangeText={setDeviceName} placeholder="Device Name" placeholderTextColor="#555" style={input} />
          <TouchableOpacity onPress={handleJoin} style={{ backgroundColor: '#ff0000', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Join Session</Text>
          </TouchableOpacity>
        </>
      )}

      {devices.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Connected Devices</Text>
          <FlatList
            data={devices}
            keyExtractor={(item: any) => item.id}
            renderItem={({ item }) => (
              <View style={{ backgroundColor: '#1a1a1a', borderRadius: 8, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: item.is_connected ? '#00ff00' : '#ff0000', marginRight: 10 }} />
                <View>
                  <Text style={{ color: '#fff', fontWeight: '600' }}>{item.device_name || item.device_id}</Text>
                  <Text style={{ color: '#888', fontSize: 12 }}>{item.device_role}</Text>
                </View>
              </View>
            )}
          />
        </View>
      )}
    </View>
  );
}

const input = { backgroundColor: '#1a1a1a', borderRadius: 10, padding: 12, color: '#fff', fontSize: 14, marginBottom: 12 };
