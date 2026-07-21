import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function DeveloperOptionsScreen() {
  const router = useRouter();
  const [usbDebugging, setUsbDebugging] = useState(false);
  const [stayAwake, setStayAwake] = useState(false);
  const [showTouches, setShowTouches] = useState(false);
  const [gpuProfiling, setGpuProfiling] = useState(false);
  const [strictMode, setStrictMode] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [loggerEnabled, setLoggerEnabled] = useState(true);

  const handleReset = () => {
    Alert.alert('Reset to Defaults', 'All developer settings will be reset.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => {
        setUsbDebugging(false); setStayAwake(false); setShowTouches(false);
        setGpuProfiling(false); setStrictMode(false); setDemoMode(false);
        Alert.alert('Reset', 'Developer options reset to defaults');
      }},
    ]);
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Developer Options</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.warningCard}>
          <Ionicons name="warning-outline" size={24} color="#F59E0B" />
          <Text style={{ color: '#F59E0B', fontSize: 14, marginLeft: 12, flex: 1 }}>
            These settings are intended for development use only. Changing them may affect device performance.
          </Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>DEBUGGING</Text>
          <View style={s.card}>
            <View style={s.row}>
              <Text style={s.rowText}>USB Debugging</Text>
              <Switch value={usbDebugging} onValueChange={setUsbDebugging}
                trackColor={{ false: '#334155', true: '#6366f1' }} thumbColor="#fff" />
            </View>
            <View style={s.row}>
              <Text style={s.rowText}>Logger</Text>
              <Switch value={loggerEnabled} onValueChange={setLoggerEnabled}
                trackColor={{ false: '#334155', true: '#6366f1' }} thumbColor="#fff" />
            </View>
            <View style={[s.row, { borderBottomWidth: 0 }]}>
              <Text style={s.rowText}>Strict Mode</Text>
              <Switch value={strictMode} onValueChange={setStrictMode}
                trackColor={{ false: '#334155', true: '#6366f1' }} thumbColor="#fff" />
            </View>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>DRAWING</Text>
          <View style={s.card}>
            <View style={s.row}>
              <Text style={s.rowText}>Show Touches</Text>
              <Switch value={showTouches} onValueChange={setShowTouches}
                trackColor={{ false: '#334155', true: '#6366f1' }} thumbColor="#fff" />
            </View>
            <View style={s.row}>
              <Text style={s.rowText}>GPU Profiling</Text>
              <Switch value={gpuProfiling} onValueChange={setGpuProfiling}
                trackColor={{ false: '#334155', true: '#6366f1' }} thumbColor="#fff" />
            </View>
            <View style={[s.row, { borderBottomWidth: 0 }]}>
              <Text style={s.rowText}>Demo Mode</Text>
              <Switch value={demoMode} onValueChange={setDemoMode}
                trackColor={{ false: '#334155', true: '#6366f1' }} thumbColor="#fff" />
            </View>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>DEVICE</Text>
          <View style={s.card}>
            <View style={[s.row, { borderBottomWidth: 0 }]}>
              <Text style={s.rowText}>Stay Awake</Text>
              <Switch value={stayAwake} onValueChange={setStayAwake}
                trackColor={{ false: '#334155', true: '#6366f1' }} thumbColor="#fff" />
            </View>
          </View>
        </View>

        <View style={s.section}>
          <TouchableOpacity style={[s.card, { padding: 16, alignItems: 'center' }]} onPress={handleReset}>
            <Text style={{ color: '#EF4444', fontSize: 16, fontWeight: '600' }}>Reset to Defaults</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  warningCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 8, padding: 16, backgroundColor: '#F59E0B15', borderRadius: 12, borderWidth: 1, borderColor: '#F59E0B30' },
  section: { marginBottom: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
  card: { backgroundColor: '#1E293B', borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: '#334155' },
  rowText: { flex: 1, fontSize: 16, color: '#fff' },
});
