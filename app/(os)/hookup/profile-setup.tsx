import React, { useState, useEffect, useCallback } from 'react';
import { Alert, View, Text, Image, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Modal, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Alert, SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = width * 0.28;

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const LOOKING_FOR = ['Male', 'Female', 'Everyone'];
const INTENTS = ['Friendship', 'Casual', 'Serious relationship', 'Marriage', 'Not sure yet'];
const RELATIONSHIP_TYPES = ['Monogamous', 'Polygamous', 'Open', 'Prefer not to say'];
const OPENNESS = ['Very open', 'Somewhat open', 'Private', 'Prefer not to say'];

const INTERESTS_POOL = [
  'Football', 'Cars', 'Business', 'Coding', 'Reading', 'Movies', 'Music', 'Farming',
  'Hiking', 'Cooking', 'Travel', 'Photography', 'Dancing', 'Gaming', 'Fitness',
  'Fashion', 'Art', 'Politics', 'Science', 'History', 'Nature', 'Animals',
  'Spirituality', 'Entrepreneurship', 'Investing', 'Real Estate', 'Education',
  'Health', 'Technology', 'Writing', 'Poetry', 'Theatre',
];

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showInterestPicker, setShowInterestPicker] = useState(false);

  // Form state matching actual schema
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  const [intent, setIntent] = useState('');
  const [relationshipType, setRelationshipType] = useState('');
  const [rolePreference, setRolePreference] = useState('');
  const [openness, setOpenness] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);

  const fetchExisting = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('hookup_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setBio(data.bio || '');
        setGender(data.gender || '');
        setLookingFor(data.looking_for || '');
        setIntent(data.intent || '');
        setRelationshipType(data.relationship_type || '');
        setRolePreference(data.role_preference || '');
        setOpenness(data.openness || '');
        setInterests(data.interests || []);
        setPhotos(data.photos || []);
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchExisting(); }, [fetchExisting]);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);

    const payload = {
      user_id: user.id,
      bio,
      gender,
      looking_for: lookingFor,
      intent,
      relationship_type: relationshipType,
      role_preference: rolePreference,
      openness,
      interests,
      photos,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('hookup_profiles')
      .upsert(payload, { onConflict: 'user_id' });

    setSaving(false);

    if (error) {
      Alert.alert('Error', 'Failed to save profile: ' + error.message);
    } else {
      Alert.alert('Success', 'Your Hookup profile has been saved!', [
        { text: 'OK', onPress: () => router.push('/(os)/hookup/discovery' as any) },
      ]);
    }
  };

  const pickImage = async () => {
    if (!user?.id) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow photo access.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return;
    await uploadPhoto(result.assets[0].uri);
  };

  const uploadPhoto = async (uri: string) => {
    if (!user?.id) return;
    setUploading(true);
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
      );

      const response = await fetch(manipulated.uri);
      const blob = await response.blob();
      const fileName = `${user.id}/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('hookup-photos')
        .upload(fileName, blob, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('hookup-photos')
        .getPublicUrl(fileName);

      setPhotos(prev => [...prev, publicUrl]);
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message);
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const toggleInterest = (interest: string) => {
    setInterests(prev =>
      prev.includes(interest) ? prev.filter((i: any) => i !== interest) : [...prev, interest]
    );
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={{ marginBottom: 24 }}>
      <Text style={{ color: '#888', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>{title}</Text>
      {children}
    </View>
  );

  const ChipSelector = ({ options, selected, onToggle }: any) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {options.map((opt: string) => {
        const isSelected = selected === opt;
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => onToggle(opt)}
            style={{
              backgroundColor: isSelected ? '#ff3366' : '#2a2a2a',
              borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8,
              marginRight: 8, marginBottom: 8, borderWidth: 1,
              borderColor: isSelected ? '#ff3366' : '#333',
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
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Hookup Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#ff3366" /> : <Text style={{ color: '#ff3366', fontWeight: 'bold', fontSize: 15 }}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ padding: 16 }}>
        {/* Photos */}
        <Section title="Photos">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {photos.map((photo, idx) => (
              <View key={idx} style={{ position: 'relative' }}>
                <Image source={{ uri: photo }} style={{ width: PHOTO_SIZE, height: PHOTO_SIZE * 1.3, borderRadius: 12, backgroundColor: '#1a1a1a' }} resizeMode="cover" />
                <TouchableOpacity onPress={() => removePhoto(idx)} style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(255,0,0,0.7)', borderRadius: 10, padding: 4 }}>
                  <Feather name="x" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              onPress={pickImage}
              disabled={uploading}
              style={{ width: PHOTO_SIZE, height: PHOTO_SIZE * 1.3, borderRadius: 12, backgroundColor: '#1a1a1a', borderWidth: 2, borderColor: '#333', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' }}
            >
              {uploading ? <ActivityIndicator color="#ff3366" /> : <Feather name="plus" size={32} color="#666" />}
            </TouchableOpacity>
          </View>
        </Section>

        <Section title="About Me">
          <TextInput value={bio} onChangeText={setBio} placeholder="Tell people about yourself..." placeholderTextColor="#555" multiline numberOfLines={4}
            style={{ backgroundColor: '#1a1a1a', color: '#fff', borderRadius: 12, padding: 14, fontSize: 15, lineHeight: 22, textAlignVertical: 'top', minHeight: 100 }} />
        </Section>

        <Section title="Your Gender">
          <ChipSelector options={GENDERS} selected={gender} onToggle={setGender} />
        </Section>

        <Section title="Interested In">
          <ChipSelector options={LOOKING_FOR} selected={lookingFor} onToggle={setLookingFor} />
        </Section>

        <Section title="Intent">
          <ChipSelector options={INTENTS} selected={intent} onToggle={setIntent} />
        </Section>

        <Section title="Relationship Type">
          <ChipSelector options={RELATIONSHIP_TYPES} selected={relationshipType} onToggle={setRelationshipType} />
        </Section>

        <Section title="Openness">
          <ChipSelector options={OPENNESS} selected={openness} onToggle={setOpenness} />
        </Section>

        <Section title="Role Preference (Optional)">
          <TextInput value={rolePreference} onChangeText={setRolePreference} placeholder="e.g. Dominant, Submissive, Switch" placeholderTextColor="#555"
            style={{ backgroundColor: '#1a1a1a', color: '#fff', borderRadius: 12, padding: 14, fontSize: 15 }} />
        </Section>

        <Section title="Interests">
          <TouchableOpacity onPress={() => setShowInterestPicker(true)} style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: interests.length ? '#fff' : '#555' }}>{interests.length ? `${interests.length} selected` : 'Select interests...'}</Text>
            <Feather name="chevron-right" size={18} color="#888" />
          </TouchableOpacity>
          {interests.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
              {interests.map((i: any) => (
                <View key={i} style={{ backgroundColor: '#2a1a1a', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, marginRight: 6, marginBottom: 6, borderWidth: 1, borderColor: '#ff336620' }}>
                  <Text style={{ color: '#ff3366', fontSize: 12 }}>{i}</Text>
                </View>
              ))}
            </View>
          )}
        </Section>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Interest Picker Modal */}
      <Modal visible={showInterestPicker} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Select Interests</Text>
            <TouchableOpacity onPress={() => setShowInterestPicker(false)}>
              <Text style={{ color: '#ff3366', fontWeight: 'bold', fontSize: 15 }}>Done</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {INTERESTS_POOL.map((interest: any) => {
                const isSelected = interests.includes(interest);
                return (
                  <TouchableOpacity key={interest} onPress={() => toggleInterest(interest)}
                    style={{ backgroundColor: isSelected ? '#ff3366' : '#2a2a2a', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: isSelected ? '#ff3366' : '#333' }}>
                    <Text style={{ color: '#fff', fontSize: 13 }}>{interest}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
