// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Alert, View, Text, TouchableOpacity, TextInput, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Alert, SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

interface KidsSettings {
  pin: string;
  enabled: boolean;
  blockComments: boolean;
  blockDMs: boolean;
  blockLiveChat: boolean;
  blockMatureContent: boolean;
  requireTeacherApproval: boolean;
  requireParentApproval: boolean;
  maxWatchTimeMinutes: number;
  allowedCategories: string[];
}

const CATEGORIES = ['Education', 'Music', 'Sports', 'Comedy', 'Gaming', 'Science', 'Nature'];

export default function ChildrenModeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isLocked, setIsLocked] = useState(true);
  const [settings, setSettings] = useState<KidsSettings>({
    pin: '',
    enabled: false,
    blockComments: true,
    blockDMs: true,
    blockLiveChat: true,
    blockMatureContent: true,
    requireTeacherApproval: false,
    requireParentApproval: true,
    maxWatchTimeMinutes: 60,
    allowedCategories: ['Education', 'Music', 'Sports', 'Science', 'Nature'],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, [user?.id]);

  const loadSettings = async () => {
    if (!user?.id) return;
    const { data } = await supabase.from('studio_kids_settings').select('*').eq('profile_id', user.id).single();
    if (data) {
      setSettings({
        pin: data.pin || '',
        enabled: data.enabled || false,
        blockComments: data.block_comments ?? true,
        blockDMs: data.block_dms ?? true,
        blockLiveChat: data.block_live_chat ?? true,
        blockMatureContent: data.block_mature_content ?? true,
        requireTeacherApproval: data.require_teacher_approval ?? false,
        requireParentApproval: data.require_parent_approval ?? true,
        maxWatchTimeMinutes: data.max_watch_time_minutes || 60,
        allowedCategories: data.allowed_categories || ['Education', 'Music', 'Sports', 'Science', 'Nature'],
      });
      setIsLocked(data.enabled || false);
    }
    setLoading(false);
  };

  const saveSettings = async () => {
    if (!user?.id) return;

    if (settings.enabled && pin.length !== 4) {
      Alert.alert('Invalid PIN', 'PIN must be exactly 4 digits.');
      return;
    }

    if (settings.enabled && pin !== confirmPin) {
      Alert.alert('PIN Mismatch', 'PIN and confirmation do not match.');
      return;
    }

    const { error } = await supabase.from('studio_kids_settings').upsert({
      profile_id: user.id,
      pin: settings.enabled ? pin : null,
      enabled: settings.enabled,
      block_comments: settings.blockComments,
      block_dms: settings.blockDMs,
      block_live_chat: settings.blockLiveChat,
      block_mature_content: settings.blockMatureContent,
      require_teacher_approval: settings.requireTeacherApproval,
      require_parent_approval: settings.requireParentApproval,
      max_watch_time_minutes: settings.maxWatchTimeMinutes,
      allowed_categories: settings.allowedCategories,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'profile_id' });

    if (error) {
      Alert.alert('Error', 'Failed to save settings.');
    } else {
      Alert.alert('Saved', 'Children mode settings updated.');
      setIsLocked(settings.enabled);
    }
  };

  const toggleCategory = (cat: string) => {
    setSettings(prev => ({
      ...prev,
      allowedCategories: prev.allowedCategories.includes(cat)
        ? prev.allowedCategories.filter((c: any) => c !== cat)
        : [...prev.allowedCategories, cat],
    }));
  };

  const updateSetting = (key: keyof KidsSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (isLocked && settings.enabled) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <MaterialCommunityIcons name="shield-check" size={64} color="#1DA1F2" />
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 16 }}>Kids Mode Active</Text>
        <Text style={{ color: '#888', fontSize: 14, marginTop: 8, textAlign: 'center' }}>
          This section is protected. Enter the parent PIN to manage children mode settings.
        </Text>
        <TextInput
          value={pin}
          onChangeText={setPin}
          placeholder="Enter 4-digit PIN"
          placeholderTextColor="#555"
          keyboardType="number-pad"
          maxLength={4}
          secureTextEntry
          style={{
            width: '100%',
            backgroundColor: '#1a1a1a',
            borderRadius: 12,
            padding: 16,
            color: '#fff',
            fontSize: 18,
            textAlign: 'center',
            letterSpacing: 16,
            marginTop: 32,
          }}
        />
        <TouchableOpacity
          onPress={() => {
            if (pin === settings.pin) {
              setIsLocked(false);
              setPin('');
            } else {
              Alert.alert('Wrong PIN', 'Please try again.');
              setPin('');
            }
          }}
          style={{ width: '100%', backgroundColor: '#1DA1F2', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Unlock</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }} edges={['top']}>
      {/* Header */}
      <View style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Children Mode</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Enable Toggle */}
        <View style={{ margin: 16, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons name="shield-child" size={24} color="#1DA1F2" />
            <View style={{ marginLeft: 12 }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '500' }}>Enable Kids Mode</Text>
              <Text style={{ color: '#888', fontSize: 12 }}>Restrict content for children</Text>
            </View>
          </View>
          <Switch
            value={settings.enabled}
            onValueChange={v => updateSetting('enabled', v)}
            trackColor={{ false: '#333', true: '#1DA1F2' }}
            thumbColor={settings.enabled ? '#fff' : '#888'}
          />
        </View>

        {settings.enabled && (
          <>
            {/* PIN Setup */}
            <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16 }}>
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 12 }}>Parent PIN</Text>
              <Text style={{ color: '#888', fontSize: 12, marginBottom: 12 }}>Set a 4-digit PIN to protect settings</Text>
              <TextInput
                value={pin}
                onChangeText={setPin}
                placeholder="New PIN"
                placeholderTextColor="#555"
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
                style={{ backgroundColor: '#111', borderRadius: 8, padding: 12, color: '#fff', fontSize: 16, marginBottom: 8 }}
              />
              <TextInput
                value={confirmPin}
                onChangeText={setConfirmPin}
                placeholder="Confirm PIN"
                placeholderTextColor="#555"
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
                style={{ backgroundColor: '#111', borderRadius: 8, padding: 12, color: '#fff', fontSize: 16 }}
              />
            </View>

            {/* Safety Controls */}
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginHorizontal: 16, marginBottom: 12 }}>Safety Controls</Text>
            {[
              { key: 'blockComments', label: 'Block Comments', desc: 'Disable all comments on videos', icon: 'message-square' },
              { key: 'blockDMs', label: 'Block Direct Messages', desc: 'Prevent private messages', icon: 'mail' },
              { key: 'blockLiveChat', label: 'Block Live Chat', desc: 'Disable live stream chat', icon: 'message-circle' },
              { key: 'blockMatureContent', label: 'Block Mature Content', desc: 'Filter adult content', icon: 'alert-triangle' },
            ].map((control: any) => (
              <View key={control.key} style={{ marginHorizontal: 16, marginBottom: 8, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Feather name={control.icon as any} size={18} color="#888" />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={{ color: '#fff', fontSize: 14 }}>{control.label}</Text>
                    <Text style={{ color: '#666', fontSize: 11 }}>{control.desc}</Text>
                  </View>
                </View>
                <Switch
                  value={settings[control.key as keyof KidsSettings] as boolean}
                  onValueChange={v => updateSetting(control.key as keyof KidsSettings, v)}
                  trackColor={{ false: '#333', true: '#ff0000' }}
                  thumbColor={settings[control.key as keyof KidsSettings] ? '#fff' : '#888'}
                />
              </View>
            ))}

            {/* Approval Controls */}
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginHorizontal: 16, marginTop: 8, marginBottom: 12 }}>Approval Required</Text>
            {[
              { key: 'requireTeacherApproval', label: 'Teacher Approval', desc: 'Teacher must approve content', icon: 'book' },
              { key: 'requireParentApproval', label: 'Parent Approval', desc: 'Parent must approve content', icon: 'users' },
            ].map((control: any) => (
              <View key={control.key} style={{ marginHorizontal: 16, marginBottom: 8, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Feather name={control.icon as any} size={18} color="#888" />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={{ color: '#fff', fontSize: 14 }}>{control.label}</Text>
                    <Text style={{ color: '#666', fontSize: 11 }}>{control.desc}</Text>
                  </View>
                </View>
                <Switch
                  value={settings[control.key as keyof KidsSettings] as boolean}
                  onValueChange={v => updateSetting(control.key as keyof KidsSettings, v)}
                  trackColor={{ false: '#333', true: '#1DA1F2' }}
                  thumbColor={settings[control.key as keyof KidsSettings] ? '#fff' : '#888'}
                />
              </View>
            ))}

            {/* Allowed Categories */}
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginHorizontal: 16, marginTop: 8, marginBottom: 12 }}>Allowed Categories</Text>
            <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {CATEGORIES.map((cat: any) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => toggleCategory(cat)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 16,
                      backgroundColor: settings.allowedCategories.includes(cat) ? '#1DA1F2' : '#111',
                      borderWidth: 1,
                      borderColor: settings.allowedCategories.includes(cat) ? '#1DA1F2' : '#333',
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 12 }}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Watch Time Limit */}
            <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16 }}>
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>Daily Watch Time Limit</Text>
              <Text style={{ color: '#888', fontSize: 12, marginBottom: 12 }}>{settings.maxWatchTimeMinutes} minutes per day</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[30, 60, 90, 120, 180].map((min: any) => (
                  <TouchableOpacity
                    key={min}
                    onPress={() => updateSetting('maxWatchTimeMinutes', min)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 8,
                      backgroundColor: settings.maxWatchTimeMinutes === min ? '#1DA1F2' : '#111',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '500' }}>{min}m</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Save Button */}
      <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: '#1a1a1a' }}>
        <TouchableOpacity
          onPress={saveSettings}
          style={{ backgroundColor: settings.enabled ? '#1DA1F2' : '#333', borderRadius: 12, padding: 16, alignItems: 'center' }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Save Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
