import React, { useState, useEffect, useCallback } from 'react';
import { Alert, View, Text, TouchableOpacity, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Alert, SafeAreaView } from 'react-native-safe-area-context';
import { Alert, Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

const GENDERS = ['Male', 'Female', 'Non-binary'];
const RELATIONSHIP_INTENTS = [
  'Friendship', 'Serious relationship', 'Marriage', 'Long-term partner',
  'Open to polygamous marriage', 'Already married and seeking another spouse',
  'Not interested in marriage', 'Not sure yet',
];

export default function PreferencesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Discovery preferences
  const [showMe, setShowMe] = useState<string[]>([]);
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(50);
  const [distanceMax, setDistanceMax] = useState(50);
  const [relationshipIntents, setRelationshipIntents] = useState<string[]>([]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [withPhotosOnly, setWithPhotosOnly] = useState(false);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);

  // Privacy
  const [invisibleMode, setInvisibleMode] = useState(false);
  const [hideFromDiscovery, setHideFromDiscovery] = useState(false);
  const [requireMessageRequest, setRequireMessageRequest] = useState(false);

  const fetchPreferences = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('hookup_preferences')
        .select('*')
        .eq('profile_id', user.id)
        .single();

      if (data) {
        setShowMe(data.show_me || []);
        setAgeMin(data.age_min || 18);
        setAgeMax(data.age_max || 50);
        setDistanceMax(data.distance_max_km || 50);
        setRelationshipIntents(data.relationship_intents_filter || []);
        setVerifiedOnly(data.verified_only || false);
        setWithPhotosOnly(data.with_photos_only || false);
        setShowOnlineStatus(data.show_online_status !== false);
        setInvisibleMode(data.invisible_mode || false);
        setHideFromDiscovery(data.hide_from_discovery || false);
        setRequireMessageRequest(data.require_message_request || false);
      }
    } catch (err) {
      console.error('Fetch prefs error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchPreferences(); }, [fetchPreferences]);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);

    const { error } = await supabase
      .from('hookup_preferences')
      .upsert({
        profile_id: user.id,
        show_me: showMe,
        age_min: ageMin,
        age_max: ageMax,
        distance_max_km: distanceMax,
        relationship_intents_filter: relationshipIntents,
        verified_only: verifiedOnly,
        with_photos_only: withPhotosOnly,
        show_online_status: showOnlineStatus,
        invisible_mode: invisibleMode,
        hide_from_discovery: hideFromDiscovery,
        require_message_request: requireMessageRequest,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'profile_id' });

    setSaving(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Saved', 'Your preferences have been updated.');
    }
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={{ marginBottom: 28 }}>
      <Text style={{ color: '#888', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>{title}</Text>
      {children}
    </View>
  );

  const ToggleRow = ({ icon, label, value, onToggle, description }: any) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
        <Feather name={icon} size={18} color="#666" style={{ width: 28 }} />
        <View>
          <Text style={{ color: '#fff', fontSize: 15 }}>{label}</Text>
          {description ? <Text style={{ color: '#666', fontSize: 12, marginTop: 2 }}>{description}</Text> : null}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#333', true: '#ff3366' }}
        thumbColor="#fff"
      />
    </View>
  );

  const ChipSelector = ({ options, selected, onToggle }: any) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map((opt: string) => {
        const isSelected = selected.includes(opt);
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => onToggle(opt)}
            style={{
              backgroundColor: isSelected ? '#ff3366' : '#2a2a2a',
              borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8,
              borderWidth: 1, borderColor: isSelected ? '#ff3366' : '#333',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 13 }}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
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
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Preferences</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#ff3366" /> : <Text style={{ color: '#ff3366', fontWeight: 'bold', fontSize: 15 }}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ padding: 16 }}>
        {/* Discovery Filters */}
        <Section title="Show Me">
          <ChipSelector
            options={GENDERS}
            selected={showMe}
            onToggle={(g: string) => setShowMe(prev => prev.includes(g) ? prev.filter((x: any) => x !== g) : [...prev, g])}
          />
        </Section>

        <Section title="Relationship Intent Filter">
          <ChipSelector
            options={RELATIONSHIP_INTENTS}
            selected={relationshipIntents}
            onToggle={(intent: string) => setRelationshipIntents(prev => prev.includes(intent) ? prev.filter((x: any) => x !== intent) : [...prev, intent])}
          />
        </Section>

        {/* Toggles */}
        <Section title="Discovery Filters">
          <ToggleRow
            icon="shield"
            label="Verified only"
            description="Only show verified profiles"
            value={verifiedOnly}
            onToggle={setVerifiedOnly}
          />
          <ToggleRow
            icon="image"
            label="Photos only"
            description="Only show profiles with photos"
            value={withPhotosOnly}
            onToggle={setWithPhotosOnly}
          />
        </Section>

        <Section title="Privacy & Safety">
          <ToggleRow
            icon="eye-off"
            label="Invisible mode"
            description="Browse without appearing in others' discovery"
            value={invisibleMode}
            onToggle={setInvisibleMode}
          />
          <ToggleRow
            icon="user-x"
            label="Hide from discovery"
            description="Temporarily pause your profile"
            value={hideFromDiscovery}
            onToggle={setHideFromDiscovery}
          />
          <ToggleRow
            icon="message-square"
            label="Message requests"
            description="Require approval before someone can message you"
            value={requireMessageRequest}
            onToggle={setRequireMessageRequest}
          />
          <ToggleRow
            icon="activity"
            label="Show online status"
            description="Let matches see when you're active"
            value={showOnlineStatus}
            onToggle={setShowOnlineStatus}
          />
        </Section>

        {/* Account Actions */}
        <Section title="Account">
          <TouchableOpacity
            onPress={() => router.push('/(os)/hookup/profile-setup' as any)}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="edit-3" size={18} color="#666" style={{ width: 28 }} />
              <Text style={{ color: '#fff', fontSize: 15 }}>Edit Profile</Text>
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
                'Delete Hookup Profile',
                'This will remove your dating profile and all matches. Your MTAA account will remain.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: async () => {
                    if (!user?.id) return;
                    await supabase.from('hookup_preferences').delete().eq('profile_id', user.id);
                    await supabase.from('hookup_likes').delete().eq('liker_id', user.id);
                    await supabase.from('hookup_passes').delete().eq('passer_id', user.id);
                    await supabase.from('hookup_matches').delete().or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
                    Alert.alert('Deleted', 'Your Hookup profile has been removed.');
                    router.push('/(os)/hookup/discovery' as any);
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
        </Section>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
