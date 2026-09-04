// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { Alert, View, Text, TouchableOpacity, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Alert, SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Notification settings
  const [newMatchNotif, setNewMatchNotif] = useState(true);
  const [newLikeNotif, setNewLikeNotif] = useState(true);
  const [messageNotif, setMessageNotif] = useState(true);
  const [eventNotif, setEventNotif] = useState(true);

  // Discovery settings
  const [showInDiscovery, setShowInDiscovery] = useState(true);
  const [showDistance, setShowDistance] = useState(true);
  const [showAge, setShowAge] = useState(true);

  // Premium
  const [isPremium, setIsPremium] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('hookup_preferences')
        .select('new_match_notif, new_like_notif, message_notif, event_notif, show_in_discovery, show_distance, show_age, is_premium')
        .eq('profile_id', user.id)
        .single();

      if (data) {
        setNewMatchNotif(data.new_match_notif !== false);
        setNewLikeNotif(data.new_like_notif !== false);
        setMessageNotif(data.message_notif !== false);
        setEventNotif(data.event_notif !== false);
        setShowInDiscovery(data.show_in_discovery !== false);
        setShowDistance(data.show_distance !== false);
        setShowAge(data.show_age !== false);
        setIsPremium(data.is_premium || false);
      }
    } catch (err) {
      console.error('Settings fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    const { error } = await supabase.from('hookup_preferences').upsert({
      profile_id: user.id,
      new_match_notif: newMatchNotif,
      new_like_notif: newLikeNotif,
      message_notif: messageNotif,
      event_notif: eventNotif,
      show_in_discovery: showInDiscovery,
      show_distance: showDistance,
      show_age: showAge,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'profile_id' });
    setSaving(false);
    if (error) Alert.alert('Error', error.message);
    else Alert.alert('Saved', 'Settings updated.');
  };

  const ToggleRow = ({ icon, label, value, onToggle, description, disabled = false }: any) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
        <Feather name={icon} size={18} color={disabled ? '#444' : '#666'} style={{ width: 28 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: disabled ? '#555' : '#fff', fontSize: 15 }}>{label}</Text>
          {description ? <Text style={{ color: disabled ? '#444' : '#666', fontSize: 12, marginTop: 2 }}>{description}</Text> : null}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: '#333', true: '#ff3366' }}
        thumbColor="#fff"
      />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ff3366" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Settings</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#ff3366" /> : <Text style={{ color: '#ff3366', fontWeight: 'bold', fontSize: 15 }}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ padding: 16 }}>
        {/* Notifications */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: '#888', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Notifications</Text>
          <ToggleRow icon="heart" label="New matches" value={newMatchNotif} onToggle={setNewMatchNotif} />
          <ToggleRow icon="thumbs-up" label="New likes" value={newLikeNotif} onToggle={setNewLikeNotif} />
          <ToggleRow icon="message-circle" label="Messages" value={messageNotif} onToggle={setMessageNotif} />
          <ToggleRow icon="calendar" label="Events & updates" value={eventNotif} onToggle={setEventNotif} />
        </View>

        {/* Discovery Visibility */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: '#888', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Discovery Visibility</Text>
          <ToggleRow
            icon="eye"
            label="Show in discovery"
            description="Let others find your profile"
            value={showInDiscovery}
            onToggle={setShowInDiscovery}
          />
          <ToggleRow
            icon="map-pin"
            label="Show distance"
            description="Display how far you are from others"
            value={showDistance}
            onToggle={setShowDistance}
          />
          <ToggleRow
            icon="hash"
            label="Show age"
            description="Display your age on your profile"
            value={showAge}
            onToggle={setShowAge}
          />
        </View>

        {/* Premium */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: '#888', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>MTAA+ Premium</Text>
          {isPremium ? (
            <View style={{ backgroundColor: '#2a1a1a', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#ff336620' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Feather name="crown" size={20} color="#ffaa00" />
                <Text style={{ color: '#ffaa00', fontSize: 16, fontWeight: 'bold', marginLeft: 8 }}>MTAA+ Active</Text>
              </View>
              <Text style={{ color: '#888', fontSize: 13, marginTop: 6 }}>You have unlimited likes, read receipts, and advanced filters.</Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => {
                // Route to wallet for premium purchase
                Alert.alert('MTAA+', 'Upgrade to MTAA+ for unlimited likes, boosts, and advanced filters.', [
                  { text: 'Later', style: 'cancel' },
                  { text: 'Upgrade', onPress: () => router.push('/(os)/wallet' as any) },
                ]);
              }}
              style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#333' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Feather name="star" size={20} color="#ffaa00" />
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 }}>Upgrade to MTAA+</Text>
              </View>
              <Text style={{ color: '#888', fontSize: 13, marginTop: 6 }}>Unlimited likes • Read receipts • Profile boosts • Advanced filters</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Account Actions */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: '#888', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Account</Text>

          <TouchableOpacity
            onPress={() => router.push('/(os)/hookup/preferences' as any)}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="sliders" size={18} color="#666" style={{ width: 28 }} />
              <Text style={{ color: '#fff', fontSize: 15 }}>Discovery Preferences</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(os)/hookup/safety' as any)}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="shield" size={18} color="#666" style={{ width: 28 }} />
              <Text style={{ color: '#fff', fontSize: 15 }}>Safety Center</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Pause Hookup',
                'Your profile will be hidden from discovery. You can reactivate anytime.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Pause', onPress: async () => {
                    if (!user?.id) return;
                    await supabase.from('hookup_preferences').upsert({
                      profile_id: user.id,
                      hide_from_discovery: true,
                      updated_at: new Date().toISOString(),
                    }, { onConflict: 'profile_id' });
                    Alert.alert('Paused', 'Your Hookup profile is now hidden.');
                  }},
                ]
              );
            }}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="pause-circle" size={18} color="#ffaa00" style={{ width: 28 }} />
              <Text style={{ color: '#ffaa00', fontSize: 15 }}>Pause Profile</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Delete Hookup Profile',
                'This permanently removes your dating profile, matches, and likes. Your MTAA account remains.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: async () => {
                    if (!user?.id) return;
                    await supabase.from('hookup_preferences').delete().eq('profile_id', user.id);
                    await supabase.from('hookup_likes').delete().eq('liker_id', user.id);
                    await supabase.from('hookup_passes').delete().eq('passer_id', user.id);
                    await supabase.from('hookup_matches').delete().or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
                    await supabase.from('hookup_blocks').delete().eq('blocker_id', user.id);
                    Alert.alert('Deleted', 'Your Hookup profile has been removed.');
                    router.push('/(os)/appstore' as any);
                  }},
                ]
              );
            }}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="trash-2" size={18} color="#ff4444" style={{ width: 28 }} />
              <Text style={{ color: '#ff4444', fontSize: 15 }}>Delete Hookup Profile</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#ff4444" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
