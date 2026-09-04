// @ts-nocheck
import React, { useState, useRef } from 'react';
import { Alert, View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, Dimensions, ActivityIndicator, FlatList, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Alert, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Alert, useProfile } from '@/lib/profile/hooks/useProfile';

const { width, height } = Dimensions.get('window');

const ROLES = [
  { id: 'general', label: 'General User', icon: 'person', desc: 'Browse, connect, and explore' },
  { id: 'creator', label: 'Creator', icon: 'videocam', desc: 'Create content on Streets & Studio' },
  { id: 'driver', label: 'Driver', icon: 'car', desc: 'Drive with MTaxi or MTruck' },
  { id: 'business', label: 'Business Owner', icon: 'storefront', desc: 'Sell on Shop & Marketplace' },
  { id: 'student', label: 'Student', icon: 'school', desc: 'Learn on Education' },
  { id: 'health_worker', label: 'Health Worker', icon: 'medical', desc: 'Provide health services' },
  { id: 'government', label: 'Government Officer', icon: 'shield', desc: 'Civic & governance tools' },
];

const INTERESTS = [
  'Technology', 'Music', 'Sports', 'Fashion', 'Food', 'Travel',
  'Politics', 'Education', 'Health', 'Business', 'Art', 'Gaming',
  'Finance', 'Real Estate', 'Agriculture', 'Entertainment',
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { updateProfile, uploadAvatar } = useProfile();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Form data
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState('general');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [referralCode, setReferralCode] = useState('');

  const totalSteps = 5;

  const pickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.length > 0) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takeAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.length > 0) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter((i: any) => i !== interest)
        : [...prev, interest]
    );
  };

  const canProceed = () => {
    switch (step) {
      case 0: return true; // Welcome
      case 1: return fullName.trim().length >= 2; // Profile
      case 2: return username.trim().length >= 3; // Username
      case 3: return selectedRole !== ''; // Role
      case 4: return true; // Interests (optional)
      default: return true;
    }
  };

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Not authenticated');
      return;
    }
    setLoading(true);
    try {
      let avatarUrl = null;
      if (avatarUri) {
        avatarUrl = await uploadAvatar(avatarUri);
      }

      await updateProfile({
        full_name: fullName.trim(),
        username: username.trim().toLowerCase(),
        bio: bio.trim(),
        location: location.trim(),
        phone: phone.trim(),
        avatar_url: avatarUrl,
        role: selectedRole,
        interests: selectedInterests,
        onboarding_completed: true,
        onboarding_step: totalSteps,
      });

      // Also update user metadata
      await useAuthStore.getState().updateUserMetadata?.({
        full_name: fullName.trim(),
        username: username.trim().toLowerCase(),
        avatar_url: avatarUrl,
      });

      router.replace('/(os)');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.welcomeIcon}>
              <Ionicons name="planet" size={80} color="#0ea5e9" />
            </View>
            <Text style={styles.welcomeTitle}>Welcome to MTAA</Text>
            <Text style={styles.welcomeSubtitle}>
              Africa's first operating system. Let's set up your profile in a few quick steps.
            </Text>
            <View style={styles.featuresList}>
              {['Connect with your community', 'Earn from your content', 'Access government services', 'Trade & do business'].map((feat, i) => (
                <View key={i} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                  <Text style={styles.featureText}>{feat}</Text>
                </View>
              ))}
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Your Profile</Text>
            <Text style={styles.stepSubtitle}>How should people know you?</Text>

            {/* Avatar */}
            <View style={styles.avatarSection}>
              <TouchableOpacity onPress={pickAvatar} style={styles.avatarWrapper}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Ionicons name="camera" size={32} color="#666" />
                  </View>
                )}
                <View style={styles.avatarBadge}>
                  <Ionicons name="add" size={16} color="#fff" />
                </View>
              </TouchableOpacity>
              <View style={styles.avatarActions}>
                <TouchableOpacity onPress={pickAvatar}>
                  <Text style={styles.avatarAction}>Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={takeAvatar}>
                  <Text style={styles.avatarAction}>Camera</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Kevin Nyasani"
                  placeholderTextColor="#666"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Bio</Text>
                <TextInput
                  style={[styles.input, styles.bioInput]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell us about yourself..."
                  placeholderTextColor="#666"
                  multiline
                  maxLength={160}
                />
                <Text style={styles.charCount}>{bio.length}/160</Text>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Location</Text>
                <TextInput
                  style={styles.input}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Nairobi, Kenya"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+254 7XX XXX XXX"
                  placeholderTextColor="#666"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Choose Username</Text>
            <Text style={styles.stepSubtitle}>This is your unique identity on MTAA</Text>

            <View style={styles.usernameContainer}>
              <Text style={styles.atSymbol}>@</Text>
              <TextInput
                style={styles.usernameInput}
                value={username}
                onChangeText={(text) => setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="username"
                placeholderTextColor="#666"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={20}
              />
            </View>

            {username.length >= 3 && (
              <View style={styles.usernamePreview}>
                <Ionicons name="link" size={16} color="#0ea5e9" />
                <Text style={styles.usernamePreviewText}>
                  mtaa.africa/@{username}
                </Text>
              </View>
            )}

            <View style={styles.usernameRules}>
              <Text style={styles.rulesTitle}>Username rules:</Text>
              {[
                '3-20 characters',
                'Letters, numbers, underscores only',
                'Cannot be changed later',
              ].map((rule, i) => (
                <View key={i} style={styles.ruleItem}>
                  <Ionicons name="checkmark" size={14} color={username.length >= 3 ? '#22c55e' : '#666'} />
                  <Text style={[styles.ruleText, username.length >= 3 && styles.ruleValid]}>{rule}</Text>
                </View>
              ))}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Referral Code (optional)</Text>
              <TextInput
                style={styles.input}
                value={referralCode}
                onChangeText={setReferralCode}
                placeholder="Enter referral code"
                placeholderTextColor="#666"
                autoCapitalize="characters"
              />
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Your Role</Text>
            <Text style={styles.stepSubtitle}>How will you use MTAA?</Text>

            <View style={styles.rolesList}>
              {ROLES.map((role: any) => (
                <TouchableOpacity
                  key={role.id}
                  style={[
                    styles.roleCard,
                    selectedRole === role.id && styles.roleCardActive,
                  ]}
                  onPress={() => setSelectedRole(role.id)}
                >
                  <View style={[styles.roleIcon, selectedRole === role.id && styles.roleIconActive]}>
                    <Ionicons name={role.icon as any} size={24} color={selectedRole === role.id ? '#fff' : '#0ea5e9'} />
                  </View>
                  <View style={styles.roleInfo}>
                    <Text style={[styles.roleLabel, selectedRole === role.id && styles.roleLabelActive]}>
                      {role.label}
                    </Text>
                    <Text style={styles.roleDesc}>{role.desc}</Text>
                  </View>
                  {selectedRole === role.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#0ea5e9" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Your Interests</Text>
            <Text style={styles.stepSubtitle}>Select topics you care about (optional)</Text>

            <View style={styles.interestsGrid}>
              {INTERESTS.map((interest: any) => (
                <TouchableOpacity
                  key={interest}
                  style={[
                    styles.interestChip,
                    selectedInterests.includes(interest) && styles.interestChipActive,
                  ]}
                  onPress={() => toggleInterest(interest)}
                >
                  <Text style={[
                    styles.interestText,
                    selectedInterests.includes(interest) && styles.interestTextActive,
                  ]}>
                    {interest}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>Your MTAA Identity</Text>
              <View style={styles.summaryRow}>
                <Ionicons name="person" size={16} color="#0ea5e9" />
                <Text style={styles.summaryText}>{fullName || 'Not set'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Ionicons name="at" size={16} color="#0ea5e9" />
                <Text style={styles.summaryText}>@{username || 'Not set'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Ionicons name="briefcase" size={16} color="#0ea5e9" />
                <Text style={styles.summaryText}>
                  {ROLES.find((r: any) => r.id === selectedRole)?.label || 'General User'}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Ionicons name="location" size={16} color="#0ea5e9" />
                <Text style={styles.summaryText}>{location || 'Not set'}</Text>
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((step + 1) / totalSteps) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>Step {step + 1} of {totalSteps}</Text>
      </View>

      {/* Content */}
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navBar}>
        {step > 0 ? (
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtnPlaceholder} />
        )}

        <TouchableOpacity
          style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]}
          onPress={handleNext}
          disabled={!canProceed() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.nextBtnText}>
                {step === totalSteps - 1 ? 'Complete' : 'Next'}
              </Text>
              <Ionicons name={step === totalSteps - 1 ? 'checkmark' : 'arrow-forward'} size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  progressContainer: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 12 },
  progressBar: { height: 4, backgroundColor: '#222', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#0ea5e9', borderRadius: 2 },
  progressText: { color: '#666', fontSize: 12, marginTop: 8, textAlign: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 20 },
  stepContainer: { flex: 1, paddingTop: 20 },

  // Welcome step
  welcomeIcon: { alignItems: 'center', marginBottom: 24 },
  welcomeTitle: { color: '#fff', fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  welcomeSubtitle: { color: '#999', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  featuresList: { gap: 14 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureText: { color: '#ccc', fontSize: 15 },

  // Step titles
  stepTitle: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 6 },
  stepSubtitle: { color: '#999', fontSize: 14, marginBottom: 24 },

  // Avatar
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 120, height: 120, borderRadius: 60 },
  avatarPlaceholder: { backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#333', borderStyle: 'dashed' },
  avatarBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#0ea5e9', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#000' },
  avatarActions: { flexDirection: 'row', gap: 20, marginTop: 12 },
  avatarAction: { color: '#0ea5e9', fontSize: 14, fontWeight: '600' },

  // Form
  form: { gap: 16 },
  field: { gap: 6 },
  label: { color: '#999', fontSize: 13, fontWeight: '500', textTransform: 'uppercase' },
  input: { backgroundColor: '#111', color: '#fff', fontSize: 15, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#222' },
  bioInput: { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 },
  charCount: { color: '#666', fontSize: 12, textAlign: 'right' },

  // Username
  usernameContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 10, borderWidth: 1, borderColor: '#222', paddingHorizontal: 14, marginBottom: 12 },
  atSymbol: { color: '#0ea5e9', fontSize: 18, fontWeight: '600', marginRight: 4 },
  usernameInput: { flex: 1, color: '#fff', fontSize: 16, paddingVertical: 12 },
  usernamePreview: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  usernamePreviewText: { color: '#0ea5e9', fontSize: 13 },
  usernameRules: { backgroundColor: '#111', padding: 14, borderRadius: 10, gap: 8 },
  rulesTitle: { color: '#fff', fontSize: 13, fontWeight: '600', marginBottom: 4 },
  ruleItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleText: { color: '#666', fontSize: 13 },
  ruleValid: { color: '#22c55e' },

  // Roles
  rolesList: { gap: 10 },
  roleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#222', gap: 12 },
  roleCardActive: { borderColor: '#0ea5e9', backgroundColor: '#0ea5e911' },
  roleIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' },
  roleIconActive: { backgroundColor: '#0ea5e9' },
  roleInfo: { flex: 1 },
  roleLabel: { color: '#fff', fontSize: 15, fontWeight: '600' },
  roleLabelActive: { color: '#0ea5e9' },
  roleDesc: { color: '#666', fontSize: 12, marginTop: 2 },

  // Interests
  interestsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  interestChip: { backgroundColor: '#111', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#222' },
  interestChipActive: { backgroundColor: '#0ea5e922', borderColor: '#0ea5e9' },
  interestText: { color: '#ccc', fontSize: 13 },
  interestTextActive: { color: '#0ea5e9', fontWeight: '600' },

  // Summary
  summaryBox: { backgroundColor: '#111', padding: 16, borderRadius: 12, gap: 10 },
  summaryTitle: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryText: { color: '#ccc', fontSize: 13 },

  // Nav
  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#222' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backBtnText: { color: '#fff', fontSize: 15 },
  backBtnPlaceholder: { width: 60 },
  nextBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0ea5e9', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  nextBtnDisabled: { backgroundColor: '#333' },
  nextBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});