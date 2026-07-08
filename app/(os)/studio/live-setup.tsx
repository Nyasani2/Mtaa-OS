import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useMLiveStreams } from '@/lib/services/mstudio-hooks';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function StudioLiveSetupScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { create, loading } = useMLiveStreams();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledStart, setScheduledStart] = useState('');
  const [monetization, setMonetization] = useState(false);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [membersOnly, setMembersOnly] = useState(false);
  const [slowMode, setSlowMode] = useState(0);

  const handleGoLive = async () => {
    if (!title.trim() || !user?.id) return;
    const stream = await create({
      user_id: user.id,
      studio_id: user.id,
      title: title.trim(),
      description: description.trim(),
      status: 'live',
      actual_start: new Date().toISOString(),
      monetization_enabled: monetization,
      chat_enabled: chatEnabled,
      chat_members_only: membersOnly,
      chat_slow_mode: slowMode,
    });
    if (stream) {
      router.push(`/(os)/studio/live-active?id=${stream.id}`);
    }
  };

  const handleSchedule = async () => {
    if (!title.trim() || !scheduledStart || !user?.id) return;
    const stream = await create({
      user_id: user.id,
      studio_id: user.id,
      title: title.trim(),
      description: description.trim(),
      status: 'scheduled',
      scheduled_start: scheduledStart,
      monetization_enabled: monetization,
      chat_enabled: chatEnabled,
      chat_members_only: membersOnly,
      chat_slow_mode: slowMode,
    });
    if (stream) {
      Alert.alert('Scheduled', `Live stream scheduled for ${new Date(scheduledStart).toLocaleString()}`);
      router.push('/(os)/studio/dashboard');
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <View style={{ padding: 16, paddingTop: 48 }}>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>Go Live</Text>

        <Label>Stream Title</Label>
        <TextInput value={title} onChangeText={setTitle} placeholder="What's happening?" placeholderTextColor="#555" style={input} />

        <Label>Description</Label>
        <TextInput value={description} onChangeText={setDescription} placeholder="Tell viewers what to expect..." placeholderTextColor="#555" multiline numberOfLines={3} style={[input, { height: 80, textAlignVertical: 'top' }]} />

        <Label>Schedule (optional)</Label>
        <TextInput value={scheduledStart} onChangeText={setScheduledStart} placeholder="2026-07-10T14:00:00Z" placeholderTextColor="#555" style={input} />

        <View style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginTop: 16 }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 12 }}>Settings</Text>

          <SettingRow label="Enable Monetization" value={monetization} onToggle={setMonetization} />
          <SettingRow label="Enable Chat" value={chatEnabled} onToggle={setChatEnabled} />
          <SettingRow label="Members Only Chat" value={membersOnly} onToggle={setMembersOnly} />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={{ color: '#fff' }}>Slow Mode (seconds)</Text>
            <TextInput
              value={String(slowMode)}
              onChangeText={v => setSlowMode(parseInt(v) || 0)}
              keyboardType="numeric"
              style={{ backgroundColor: '#222', borderRadius: 8, padding: 8, color: '#fff', width: 60, textAlign: 'center' }}
            />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
          <TouchableOpacity onPress={handleSchedule} style={{ flex: 1, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#333' }}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleGoLive} style={{ flex: 1, backgroundColor: '#ff0000', borderRadius: 12, padding: 16, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Go Live Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

function Label({ children }: { children: string }) {
  return <Text style={{ color: '#888', fontSize: 12, marginBottom: 6, marginTop: 12, textTransform: 'uppercase' }}>{children}</Text>;
}

function SettingRow({ label, value, onToggle }: { label: string; value: boolean; onToggle: (v: boolean) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <Text style={{ color: '#fff' }}>{label}</Text>
      <Switch value={value} onValueChange={onToggle} trackColor={{ false: '#333', true: '#ff0000' }} />
    </View>
  );
}

const input = { backgroundColor: '#1a1a1a', borderRadius: 10, padding: 12, color: '#fff', fontSize: 14 };
