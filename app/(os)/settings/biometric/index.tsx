import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { checkBiometricAvailability, getBiometricStatus, enrollBiometric, revokeAllBiometric, removeThisDevice, authenticateWithBiometric, BiometricDevice } from '@/lib/security/biometric-service';

export default function BiometricScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');
  const [enrolledAnywhere, setEnrolledAnywhere] = useState(false);
  const [thisDeviceEnrolled, setThisDeviceEnrolled] = useState(false);
  const [devices, setDevices] = useState<BiometricDevice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStatus(); }, []);

  const loadStatus = async () => {
    if (!user?.id) { setLoading(false); return; }
    setLoading(true);
    const hw = await checkBiometricAvailability();
    setIsAvailable(hw.available);
    setBiometricType(hw.types[0] || 'Biometric');
    const status = await getBiometricStatus(user.id);
    setEnrolledAnywhere(status.enrolledAnywhere);
    setThisDeviceEnrolled(status.thisDeviceEnrolled);
    setDevices(status.devices);
    setIsEnabled(status.thisDeviceEnrolled);
    setLoading(false);
  };

  const toggleBiometric = async () => {
    if (!user?.id || !isAvailable) { Alert.alert('Not Available', 'Biometric authentication is not set up on this device.'); return; }
    if (!isEnabled) {
      const result = await enrollBiometric(user.id);
      if (result.success) { setIsEnabled(true); setThisDeviceEnrolled(true); setEnrolledAnywhere(true); await loadStatus(); Alert.alert('Enabled', `${biometricType} login is now enabled on this device.`); }
      else { Alert.alert('Failed', result.error || 'Could not enable biometric'); }
    } else {
      Alert.alert('Disable Biometric', 'Remove from this device only, or all devices?', [
        { text: 'This Device Only', onPress: async () => { const r = await removeThisDevice(user.id); if (r.success) { setIsEnabled(false); setThisDeviceEnrolled(false); await loadStatus(); } } },
        { text: 'All Devices', style: 'destructive', onPress: async () => { const r = await revokeAllBiometric(user.id); if (r.success) { setIsEnabled(false); setEnrolledAnywhere(false); setThisDeviceEnrolled(false); setDevices([]); await loadStatus(); Alert.alert('Revoked', 'Biometric login removed from all devices.'); } } },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const testBiometric = async () => {
    const result = await authenticateWithBiometric();
    if (result.success) { Alert.alert('Success', 'Biometric authentication works!'); }
    else { Alert.alert('Failed', result.error || 'Authentication failed'); }
  };

  if (loading) return <View style={styles.container}><ActivityIndicator size="large" color="#6366f1"/></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={()=>router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#fff"/></TouchableOpacity>
        <Text style={styles.title}>Biometric Login</Text>
        <View style={{width:40}}/>
      </View>
      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Ionicons name="globe" size={20} color={enrolledAnywhere?'#10b981':'#64748b'}/>
          <View style={styles.statusTextCol}>
            <Text style={styles.statusLabel}>Cross-Device Status</Text>
            <Text style={[styles.statusValue,{color:enrolledAnywhere?'#10b981':'#64748b'}]}>{enrolledAnywhere?'Active on '+devices.length+' device(s)':'Not enrolled'}</Text>
          </View>
        </View>
      </View>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.iconCircle}><Ionicons name="finger-print" size={28} color="#6366f1"/></View>
          <View style={styles.textCol}>
            <Text style={styles.label}>{biometricType||'Biometric'} on This Device</Text>
            <Text style={styles.sublabel}>{isAvailable?(thisDeviceEnrolled?`Use ${biometricType} to unlock on this device`:`Enable ${biometricType} for this device`):'Not available on this device'}</Text>
          </View>
          <Switch value={isEnabled} onValueChange={toggleBiometric} trackColor={{false:'#374151',true:'#6366f1'}} thumbColor={isEnabled?'#fff':'#9ca3af'} disabled={!isAvailable}/>
        </View>
      </View>
      {thisDeviceEnrolled && <TouchableOpacity style={styles.testBtn} onPress={testBiometric}><Ionicons name="shield-checkmark" size={18} color="#6366f1"/><Text style={styles.testText}>Test Biometric</Text></TouchableOpacity>}
      {devices.length>0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enrolled Devices</Text>
          {devices.map((device: any) =>(
            <View key={device.deviceId} style={styles.deviceRow}>
              <Ionicons name={device.platform==='ios'?'phone-portrait':'phone-portrait-outline'} size={18} color="#64748b"/>
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>{device.deviceName}</Text>
                <Text style={styles.deviceMeta}>Enrolled {new Date(device.enrolledAt).toLocaleDateString()}{device.lastUsed&&` · Last used ${new Date(device.lastUsed).toLocaleDateString()}`}</Text>
              </View>
              {device.deviceId===getDeviceId()&&<View style={styles.thisDeviceBadge}><Text style={styles.thisDeviceText}>This Device</Text></View>}
            </View>
          ))}
        </View>
      )}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={20} color="#6b7280"/>
        <Text style={styles.infoText}>Your biometric data never leaves your device. MTAA only stores a device enrollment record so you can manage access across all your devices.</Text>
      </View>
    </ScrollView>
  );
}

function getDeviceId(): string {
  const stored = typeof localStorage!=='undefined'?localStorage.getItem('mtaa_device_id'):null;
  return stored||'unknown';
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:'#0f0f1a'},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:16,paddingTop:50},backBtn:{width:40,height:40,borderRadius:20,backgroundColor:'rgba(255,255,255,0.1)',justifyContent:'center',alignItems:'center'},title:{fontSize:20,fontWeight:'bold',color:'#fff'},statusCard:{backgroundColor:'rgba(255,255,255,0.05)',borderRadius:16,padding:16,marginHorizontal:16,marginTop:16,borderWidth:1,borderColor:'rgba(255,255,255,0.1)'},statusRow:{flexDirection:'row',alignItems:'center',gap:12},statusTextCol:{flex:1},statusLabel:{fontSize:13,color:'#94a3b8'},statusValue:{fontSize:15,fontWeight:'600',marginTop:2},card:{backgroundColor:'rgba(255,255,255,0.05)',borderRadius:16,padding:20,marginHorizontal:16,marginTop:16,borderWidth:1,borderColor:'rgba(255,255,255,0.1)'},row:{flexDirection:'row',alignItems:'center'},iconCircle:{width:48,height:48,borderRadius:24,backgroundColor:'rgba(99,102,241,0.1)',justifyContent:'center',alignItems:'center',marginRight:16},textCol:{flex:1},label:{fontSize:16,fontWeight:'600',color:'#fff'},sublabel:{fontSize:13,color:'#9ca3af',marginTop:2},testBtn:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,marginHorizontal:16,marginTop:16,padding:14,backgroundColor:'rgba(99,102,241,0.1)',borderRadius:12,borderWidth:1,borderColor:'rgba(99,102,241,0.3)'},testText:{color:'#6366f1',fontWeight:'600',fontSize:15},section:{marginTop:24,paddingHorizontal:16},sectionTitle:{fontSize:13,fontWeight:'700',color:'#94a3b8',textTransform:'uppercase',letterSpacing:0.5,marginBottom:12},deviceRow:{flexDirection:'row',alignItems:'center',backgroundColor:'rgba(255,255,255,0.03)',borderRadius:12,padding:14,marginBottom:8,gap:12},deviceInfo:{flex:1},deviceName:{fontSize:14,fontWeight:'500',color:'#e2e8f0'},deviceMeta:{fontSize:12,color:'#64748b',marginTop:2},thisDeviceBadge:{backgroundColor:'rgba(16,185,129,0.15)',paddingHorizontal:10,paddingVertical:4,borderRadius:6},thisDeviceText:{fontSize:11,color:'#10b981',fontWeight:'600'},infoCard:{flexDirection:'row',alignItems:'flex-start',backgroundColor:'rgba(255,255,255,0.03)',borderRadius:12,padding:16,marginHorizontal:16,marginTop:16,marginBottom:40,gap:12},infoText:{flex:1,color:'#6b7280',fontSize:13,lineHeight:20},
});
