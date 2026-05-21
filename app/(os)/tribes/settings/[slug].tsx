import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Switch } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TribeSettingsScreen() {
  const { slug } = useLocalSearchParams();
  const router = useRouter();
  const [tribe, setTribe] = useState<any>(null);
  const [membership, setMembership] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [slug]);

  const loadData = async () => {
    const { data: tribeData } = await supabase.from('tribes').select('*').eq('slug', slug).single();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: memberData } = await supabase.from('tribe_members').select('*').eq('tribe_id', tribeData.id).eq('user_id', user?.id).single();
    setTribe(tribeData);
    setMembership(memberData);
  };

  const updateStatus = async (status: string) => {
    await supabase.from('tribes').update({ status }).eq('id', tribe.id);
    Alert.alert('Updated', `Tribe is now ${status}`);
    loadData();
  };

  const leaveTribe = async () => {
    Alert.alert('Leave Tribe', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: async () => {
        await supabase.from('tribe_members').delete().eq('id', membership.id);
        router.replace('/tribes');
      }}
    ]);
  };

  if (!tribe || !membership) return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.loadingText}>Loading...</Text>
    </SafeAreaView>
  );

  const isAdmin = membership.role === 'admin' || membership.role === 'moderator';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Tribe Settings</Text>
        <Text style={styles.tribeName}>{tribe.name}</Text>
        <Text style={styles.role}>Your role: {membership.role}</Text>

        {isAdmin && (
          <>
            <Text style={styles.section}>Admin Controls</Text>
            <TouchableOpacity style={styles.btn} onPress={() => updateStatus('archived')}>
              <Text style={styles.btnText}>Archive Tribe</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btn} onPress={() => updateStatus('active')}>
              <Text style={styles.btnText}>Activate Tribe</Text>
            </TouchableOpacity>
          </>
        )}

        <Text style={styles.section}>Membership</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Notifications</Text>
          <Switch value={membership.notifications_enabled} onValueChange={async (v) => {
            await supabase.from('tribe_members').update({ notifications_enabled: v }).eq('id', membership.id);
            loadData();
          }} />
        </View>

        <TouchableOpacity style={[styles.btn, styles.leaveBtn]} onPress={leaveTribe}>
          <Text style={styles.leaveText}>Leave Tribe</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f23' },
  loadingText: { color: '#fff', textAlign: 'center', marginTop: 50 },
  content: { padding: 20 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  tribeName: { color: '#e94560', fontSize: 18, marginTop: 4 },
  role: { color: '#a0a0a0', fontSize: 14, marginTop: 4 },
  section: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 24, marginBottom: 12 },
  btn: { backgroundColor: '#1a1a3e', padding: 16, borderRadius: 12, marginBottom: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  label: { color: '#fff', fontSize: 16 },
  leaveBtn: { backgroundColor: '#7f1d1d', marginTop: 24 },
  leaveText: { color: '#fff', fontWeight: 'bold' }
});
