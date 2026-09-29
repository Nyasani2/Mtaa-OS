// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const MODULES = [
  { id: 'streets', name: 'Streets', icon: 'globe', color: '#EF4444' },
  { id: 'tribes', name: 'Tribes', icon: 'people', color: '#10B981' },
  { id: 'mstudio', name: 'MStudio', icon: 'videocam', color: '#F59E0B' },
  { id: 'education', name: 'Education', icon: 'school', color: '#3B82F6' },
  { id: 'health', name: 'Health', icon: 'medical', color: '#8B5CF6' },
];

export default function ModulePermissionsScreen() {
  const router = useRouter();
  
  // Mock state (in production, tie this to AsyncStorage or Supabase user_preferences)
  const [permissions, setPermissions] = useState({
    streets: { location: true, backgroundData: false, notifications: true },
    tribes: { location: true, backgroundData: true, notifications: true },
    mstudio: { location: false, backgroundData: false, notifications: false },
    education: { location: true, backgroundData: true, notifications: true },
    health: { location: true, backgroundData: true, notifications: true },
  });

  const togglePermission = (moduleId: string, key: string) => {
    if (moduleId === 'health' && key === 'location' && !permissions[moduleId][key]) {
      Alert.alert('Warning', 'Health module requires location for emergency services.');
    }
    
    setPermissions(prev => ({
      ...prev,
      [moduleId]: { ...prev[moduleId], [key]: !prev[moduleId][key] }
    }));
  };

  const PermRow = ({ label, value, onToggle, disabled = false }: any) => (
    <View style={styles.permRow}>
      <Text style={[styles.permLabel, disabled && { color: '#6B7280' }]}>{label}</Text>
      <Switch 
        value={value} 
        onValueChange={onToggle} 
        disabled={disabled}
        trackColor={{ false: '#3A3A3C', true: '#34C759' }} 
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Module Permissions</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark" size={20} color="#34C759" />
          <Text style={styles.infoText}>
            GrapheneOS-inspired privacy: Restrict sensors and data access per module. Changes take effect immediately.
          </Text>
        </View>

        {MODULES.map(mod => (
          <View key={mod.id} style={styles.moduleCard}>
            <View style={styles.moduleHeader}>
              <View style={[styles.moduleIcon, { backgroundColor: mod.color + '20' }]}>
                <Ionicons name={mod.icon as any} size={22} color={mod.color} />
              </View>
              <Text style={styles.moduleName}>{mod.name}</Text>
            </View>
            
            <View style={styles.divider} />
            
            <PermRow 
              label="Location Access" 
              value={permissions[mod.id].location} 
              onToggle={() => togglePermission(mod.id, 'location')} 
              disabled={mod.id === 'health'}
            />
            <View style={styles.rowDivider} />
            <PermRow 
              label="Background Data" 
              value={permissions[mod.id].backgroundData} 
              onToggle={() => togglePermission(mod.id, 'backgroundData')} 
            />
            <View style={styles.rowDivider} />
            <PermRow 
              label="Notifications" 
              value={permissions[mod.id].notifications} 
              onToggle={() => togglePermission(mod.id, 'notifications')} 
            />
          </View>
        ))}
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  scrollContent: { padding: 16 },
  infoBox: { flexDirection: 'row', backgroundColor: '#1C1C1E', borderRadius: 12, padding: 14, marginBottom: 20, gap: 12, borderWidth: 1, borderColor: '#2C2C2E' },
  infoText: { flex: 1, fontSize: 13, color: '#9CA3AF', lineHeight: 18 },
  moduleCard: { backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, marginBottom: 16 },
  moduleHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  moduleIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  moduleName: { fontSize: 18, fontWeight: '700', color: '#fff' },
  divider: { height: 1, backgroundColor: '#2C2C2E', marginBottom: 12 },
  rowDivider: { height: 1, backgroundColor: '#2C2C2E', marginVertical: 12 },
  permRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  permLabel: { fontSize: 15, color: '#E5E7EB', fontWeight: '500' },
});
