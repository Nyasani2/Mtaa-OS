// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

const INTERESTS = [
  'Music', 'Travel', 'Cooking', 'Fitness', 'Reading', 'Gaming',
  'Art', 'Photography', 'Hiking', 'Movies', 'Dancing', 'Technology',
  'Faith', 'Business', 'Farming', 'Fashion', 'Sports'
];

export default function HookupProfileSetup() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  // Step 1: Basic Identity
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [age, setAge] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [introVideo, setIntroVideo] = useState<string | null>(null);
  const [introVideoThumb, setIntroVideoThumb] = useState<string | null>(null);
  
  // Step 2: Family Structure
  const [hasChildren, setHasChildren] = useState(false);
  const [numChildren, setNumChildren] = useState('0');
  const [isPolygamous, setIsPolygamous] = useState(false);
  const [numWives, setNumWives] = useState('0');
  const [numCoparents, setNumCoparents] = useState('0');
  const [openToPolygamy, setOpenToPolygamy] = useState<'yes' | 'no' | 'open'>('no');
  
  // Step 3: Interests
  const [interests, setInterests] = useState<string[]>([]);

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const pickImage = async () => {
    if (photos.length >= 6) {
      Alert.alert('Limit Reached', 'You can add a maximum of 6 photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  const pickIntroVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const videoUri = result.assets[0].uri;
      setIntroVideo(videoUri);
      try {
        const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, { time: 1000 });
        setIntroVideoThumb(uri);
      } catch (e) {
        console.error('Thumbnail error:', e);
      }
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!displayName.trim()) {
        Alert.alert('Missing Info', 'Please enter your display name.');
        return;
      }
      if (!age.trim() || parseInt(age) < 18) {
        Alert.alert('Invalid Age', 'You must be 18 or older to use MTAA Hookup.');
        return;
      }
      if (photos.length === 0) {
        Alert.alert('Missing Info', 'Please add at least one photo to continue.');
        return;
      }
    }
    if (step === 2) {
      if (!gender) {
        Alert.alert('Missing Info', 'Please select your gender.');
        return;
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSave = async () => {
    if (interests.length < 3) {
      Alert.alert('Missing Info', 'Please select at least 3 interests so ASIS can find compatible matches.');
      return;
    }
    setLoading(true);
    try {
      // Upload intro video if exists
      let introVideoUrl = null;
      if (introVideo && user?.id) {
        const response = await fetch(introVideo);
        const blob = await response.blob();
        const fileName = `${user.id}-intro-${Date.now()}.mp4`;
        const { error: uploadError } = await supabase.storage
          .from('hookup-profile-media')
          .upload(fileName, blob, { contentType: 'video/mp4' });
        if (!uploadError) {
          const { data } = supabase.storage.from('hookup-profile-media').getPublicUrl(fileName);
          introVideoUrl = data.publicUrl;
        }
      }

      const { error } = await supabase.from('hookup_profiles').upsert({
        user_id: user?.id,
        display_name: displayName.trim(),
        gender,
        age: parseInt(age) || null,
        photos: photos,
        intro_video_url: introVideoUrl,
        max_photos_allowed: 6,
        has_children: hasChildren,
        number_of_children: hasChildren ? Number(numChildren) : 0,
        is_polygamous: gender === 'male' ? isPolygamous : false,
        open_to_polygamy: gender === 'female' ? openToPolygamy === 'yes' : false,
        number_of_wives: gender === 'male' && isPolygamous ? Number(numWives) : 0,
        number_of_coparents: gender === 'male' ? Number(numCoparents) : 0,
        interests: interests,
      }, { onConflict: 'user_id' });
      
      if (error) throw error;
      
      Alert.alert('Profile Saved', 'Your transparent profile is now live. Welcome to MTAA Hookup!', [
        { text: 'OK', onPress: () => router.replace('/(os)/hookup/discovery' as any) }
      ]);
    } catch (err: any) {
      console.error('Profile save error:', err);
      Alert.alert('Error', err.message || 'Failed to save profile.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3].map((s) => (
        <View key={s} style={styles.stepWrapper}>
          <View style={[styles.stepCircle, step >= s && styles.stepCircleActive]}>
            <Text style={[styles.stepText, step >= s && styles.stepTextActive]}>{s}</Text>
          </View>
          {s < 3 && <View style={[styles.progressLine, step > s && styles.progressLineActive]} />}
        </View>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {renderStepIndicator()}
      
      {/* STEP 1: Photos, Name, Age & Intro Video */}
      {step === 1 && (
        <View style={styles.section}>
          <Text style={styles.headerTitle}>Let's start with the basics</Text>
          <Text style={styles.headerSubtitle}>Add photos, your age, and a short intro video.</Text>
          
          {/* Photos */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
            {photos.map((uri, i) => (
              <View key={i} style={styles.photoWrapper}>
                <Image source={{ uri }} style={styles.photoPreview} />
                <TouchableOpacity style={styles.removePhotoBtn} onPress={() => removePhoto(i)}>
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < 6 && (
              <TouchableOpacity style={styles.addPhotoBtn} onPress={pickImage}>
                <Ionicons name="camera" size={28} color="#8b5cf6" />
                <Text style={styles.addPhotoText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* 5-Second Intro Video */}
          <Text style={styles.label}>Intro Video (5 seconds max)</Text>
          <TouchableOpacity style={styles.videoBtn} onPress={pickIntroVideo}>
            {introVideoThumb ? (
              <Image source={{ uri: introVideoThumb }} style={styles.videoThumb} />
            ) : (
              <View style={styles.videoPlaceholder}>
                <Ionicons name="videocam" size={32} color="#8b5cf6" />
                <Text style={styles.videoPlaceholderText}>Record or upload 5s intro</Text>
              </View>
            )}
          </TouchableOpacity>
          {introVideo && (
            <TouchableOpacity style={styles.removeVideoBtn} onPress={() => { setIntroVideo(null); setIntroVideoThumb(null); }}>
              <Text style={styles.removeVideoText}>Remove Video</Text>
            </TouchableOpacity>
          )}

          {/* Display Name */}
          <Text style={styles.label}>Display Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="What should we call you?"
            placeholderTextColor="#666"
            value={displayName}
            onChangeText={setDisplayName}
          />

          {/* Age */}
          <Text style={styles.label}>Age *</Text>
          <TextInput
            style={styles.input}
            placeholder="Your age (must be 18+)"
            placeholderTextColor="#666"
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
          />
        </View>
      )}

      {/* STEP 2: Gender & Family Structure */}
      {step === 2 && (
        <View style={styles.section}>
          <Text style={styles.headerTitle}>Tell us about yourself</Text>
          <Text style={styles.headerSubtitle}>This helps us show you the right people.</Text>
          
          <Text style={styles.label}>I am a...</Text>
          <View style={styles.row}>
            {(['male', 'female', 'other'] as const).map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.genderChip, gender === g && styles.genderChipActive]}
                onPress={() => setGender(g)}
              >
                <Ionicons
                  name={g === 'male' ? 'male' : g === 'female' ? 'female' : 'person'}
                  size={20}
                  color={gender === g ? '#fff' : '#94a3b8'}
                  style={{ marginRight: 8 }}
                />
                <Text style={[styles.genderChipText, gender === g && styles.genderChipTextActive]}>
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { marginTop: 20 }]}>Do you have children?</Text>
          <View style={styles.row}>
            <TouchableOpacity style={[styles.chip, hasChildren && styles.chipActive]} onPress={() => setHasChildren(true)}>
              <Text style={[styles.chipText, hasChildren && styles.chipTextActive]}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.chip, !hasChildren && styles.chipActive]} onPress={() => setHasChildren(false)}>
              <Text style={[styles.chipText, !hasChildren && styles.chipTextActive]}>No</Text>
            </TouchableOpacity>
          </View>

          {hasChildren && (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.label}>How many children?</Text>
              <TextInput style={styles.input} placeholder="0" keyboardType="numeric" value={numChildren} onChangeText={setNumChildren} />
            </View>
          )}

          {gender === 'male' && (
            <>
              <Text style={[styles.label, { marginTop: 20 }]}>Are you currently in a polygamous marriage?</Text>
              <View style={styles.row}>
                <TouchableOpacity style={[styles.chip, isPolygamous && styles.chipActive]} onPress={() => setIsPolygamous(true)}>
                  <Text style={[styles.chipText, isPolygamous && styles.chipTextActive]}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.chip, !isPolygamous && styles.chipActive]} onPress={() => setIsPolygamous(false)}>
                  <Text style={[styles.chipText, !isPolygamous && styles.chipTextActive]}>No</Text>
                </TouchableOpacity>
              </View>
              {isPolygamous && (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.label}>How many wives do you have?</Text>
                  <TextInput style={styles.input} placeholder="0" keyboardType="numeric" value={numWives} onChangeText={setNumWives} />
                  <Text style={styles.label}>How many co-parents (baby mamas)?</Text>
                  <TextInput style={styles.input} placeholder="0" keyboardType="numeric" value={numCoparents} onChangeText={setNumCoparents} />
                </View>
              )}
            </>
          )}

          {gender === 'female' && (
            <>
              <Text style={[styles.label, { marginTop: 20 }]}>Are you open to polygamy or joining an existing family?</Text>
              <View style={styles.row}>
                {(['yes', 'no', 'open'] as const).map((opt) => (
                  <TouchableOpacity key={opt} style={[styles.chip, openToPolygamy === opt && styles.chipActive]} onPress={() => setOpenToPolygamy(opt)}>
                    <Text style={[styles.chipText, openToPolygamy === opt && styles.chipTextActive]}>
                      {opt === 'open' ? 'Open to discuss' : opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>
      )}

      {/* STEP 3: Interests */}
      {step === 3 && (
        <View style={styles.section}>
          <Text style={styles.headerTitle}>Hobbies & Interests</Text>
          <Text style={styles.headerSubtitle}>Select at least 3 to help ASIS find your compatible matches.</Text>
          <View style={styles.interestsGrid}>
            {INTERESTS.map((interest) => {
              const isSelected = interests.includes(interest);
              return (
                <TouchableOpacity key={interest} style={[styles.interestChip, isSelected && styles.interestChipActive]} onPress={() => toggleInterest(interest)}>
                  <Text style={[styles.interestChipText, isSelected && styles.interestChipTextActive]}>{interest}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Navigation Buttons */}
      <View style={styles.buttonRow}>
        {step > 1 && (
          <TouchableOpacity style={[styles.navBtn, styles.backBtn]} onPress={handleBack}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.navBtn, styles.nextBtn, loading && styles.nextBtnDisabled]}
          onPress={step === 3 ? handleSave : handleNext}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.navBtnText}>{step === 3 ? 'Complete Profile' : 'Continue'}</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 24, paddingTop: 60 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  stepWrapper: { flexDirection: 'row', alignItems: 'center' },
  stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  stepCircleActive: { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' },
  stepText: { color: '#94a3b8', fontSize: 14, fontWeight: '700' },
  stepTextActive: { color: '#fff' },
  progressLine: { width: 40, height: 2, backgroundColor: '#1e293b', marginHorizontal: 8 },
  progressLineActive: { backgroundColor: '#8b5cf6' },
  section: { marginBottom: 24 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 8 },
  headerSubtitle: { fontSize: 15, color: '#94a3b8', marginBottom: 24, lineHeight: 22 },
  photoRow: { flexDirection: 'row', marginBottom: 24, paddingBottom: 10 },
  photoWrapper: { position: 'relative', marginRight: 12 },
  photoPreview: { width: 90, height: 120, borderRadius: 12, backgroundColor: '#1e293b' },
  removePhotoBtn: { position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: 12, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center' },
  addPhotoBtn: { width: 90, height: 120, borderRadius: 12, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#8b5cf6', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  addPhotoText: { color: '#8b5cf6', fontSize: 12, fontWeight: '600', marginTop: 4 },
  videoBtn: { marginBottom: 16 },
  videoThumb: { width: '100%', height: 180, borderRadius: 12, backgroundColor: '#1e293b' },
  videoPlaceholder: { width: '100%', height: 180, borderRadius: 12, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#8b5cf6', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  videoPlaceholderText: { color: '#8b5cf6', fontSize: 14, fontWeight: '600', marginTop: 8 },
  removeVideoBtn: { marginTop: 8, alignItems: 'center' },
  removeVideoText: { color: '#ef4444', fontSize: 13, fontWeight: '600' },
  label: { fontSize: 14, fontWeight: '600', color: '#cbd5e1', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#1e293b', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#fff', borderWidth: 1, borderColor: '#334155' },
  row: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  genderChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  genderChipActive: { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' },
  genderChipText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
  genderChipTextActive: { color: '#fff' },
  chip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  chipActive: { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' },
  chipText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  interestsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  interestChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  interestChipActive: { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' },
  interestChipText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
  interestChipTextActive: { color: '#fff' },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  navBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 16, gap: 8 },
  backBtn: { flex: 0.3, backgroundColor: '#1e293b' },
  nextBtn: { backgroundColor: '#8b5cf6' },
  nextBtnDisabled: { opacity: 0.6 },
  navBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
