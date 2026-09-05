import React, { useEffect, useState } from 'react';
import { Alert, View, Text, TouchableOpacity, FlatList } from 'react-native';
import { useMPairing } from '@/lib/services/mstudio-hooks';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function StudioDirectorScreen() {
  const { user } = useAuthStore();
  const { session, devices, createSession, loadDevices } = useMPairing();
  const [activeDevice, setActiveDevice] = useState<string | null>(null);

  useEffect(() => {
    if (session?.session_code) {
      const interval = setInterval(() => loadDevices(session.session_code), 3000);
      return () => clearInterval(interval);
    }
  }, [session?.session_code]);

  const handleCreate = async () => {
    if (!user?.id) return;
    await createSession(user.id, 'Director Control');
  };

  const sendControl = async (deviceId: string, action: string) => {
    // In production, this would call a director control RPC
    Alert.alert('Control Sent', `${action} to ${deviceId}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a', padding: 16, paddingTop: 48 }}>
      <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>Director Control</Text>

      {!session ? (
        <TouchableOpacity onPress={handleCreate} style={{ backgroundColor: '#ff0000', borderRadius: 12, padding: 16, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Start Director Session</Text>
        </TouchableOpacity>
      ) : (
        <View style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: '#888', fontSize: 12 }}>SESSION</Text>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', letterSpacing: 4 }}>{session.session_code}</Text>
          <Text style={{ color: '#888', marginTop: 4 }}>{devices.length} device(s) connected</Text>
        </View>
      )}

      <FlatList
        data={devices}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setActiveDevice(item.id)}
            style={{
              backgroundColor: activeDevice === item.id ? '#ff000022' : '#1a1a1a',
              borderRadius: 12, padding: 16, marginBottom: 12,
              borderWidth: 1, borderColor: activeDevice === item.id ? '#ff0000' : '#222'
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>{item.device_name || item.device_id}</Text>
                <Text style={{ color: '#888', fontSize: 12, marginTop: 2 }}>{item.device_role} • {item.is_connected ? 'Online' : 'Offline'}</Text>
              </View>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: item.is_connected ? '#00ff00' : '#ff0000' }} />
            </View>

            {activeDevice === item.id && (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <ControlBtn label="Record" onPress={() => sendControl(item.id, 'record')} />
                <ControlBtn label="Stop" onPress={() => sendControl(item.id, 'stop')} />
                <ControlBtn label="Switch" onPress={() => sendControl(item.id, 'switch_camera')} />
                <ControlBtn label="Zoom +" onPress={() => sendControl(item.id, 'zoom_in')} />
              </View>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ color: '#666', textAlign: 'center', padding: 32 }}>No devices connected</Text>}
      />
    </View>
  );
}

function ControlBtn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ flex: 1, backgroundColor: '#ff0000', borderRadius: 8, paddingVertical: 10, alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );
}
