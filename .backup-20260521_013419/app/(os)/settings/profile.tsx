// app/(os)/settings/profile.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { user: profile, isLoading, updateUser } = useUser(user?.id);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    display_name: profile?.display_name || '',
    date_of_birth: profile?.date_of_birth || '',
    gender: profile?.gender || '',
    nationality: profile?.nationality || '',
    address_line1: profile?.address_line1 || '',
    city: profile?.city || '',
    region: profile?.region || '',
    country: profile?.country || '',
    occupation: profile?.occupation || '',
    employer: profile?.employer || '',
  });

  const handleSave = async () => {
    try {
      await updateUser(formData);
      Alert.alert('Success', 'Profile updated successfully');
      setEditing(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const renderField = (label: string, key: keyof typeof formData, placeholder: string, keyboardType: any = 'default') => (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {editing ? (
        <TextInput
          style={styles.input}
          value={formData[key]}
          onChangeText={(text) => setFormData(prev => ({ ...prev, [key]: text }))}
          placeholder={placeholder}
          keyboardType={keyboardType}
        />
      ) : (
        <Text style={styles.fieldValue}>{profile?.[key] || 'Not set'}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={() => editing ? handleSave() : setEditing(true)}>
          <Text style={styles.editText}>{editing ? 'Save' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={48} color="#94A3B8" />
            )}
          </View>
          <Text style={styles.userName}>{profile?.full_name || 'User'}</Text>
          <Text style={styles.userEmail}>{profile?.email || user?.email}</Text>
          <View style={styles.kycBadge}>
            <Text style={styles.kycText}>KYC Level {profile?.verification_level || 0}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          {renderField('Full Name', 'full_name', 'Enter full name')}
          {renderField('Phone', 'phone', 'Enter phone number', 'phone-pad')}
          {renderField('Display Name', 'display_name', 'Enter display name')}
          {renderField('Date of Birth', 'date_of_birth', 'YYYY-MM-DD')}
          {renderField('Gender', 'gender', 'Male / Female / Other')}
          {renderField('Nationality', 'nationality', 'Enter nationality')}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address</Text>
          {renderField('Address Line', 'address_line1', 'Enter address')}
          {renderField('City', 'city', 'Enter city')}
          {renderField('Region', 'region', 'Enter region')}
          {renderField('Country', 'country', 'Enter country')}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Work</Text>
          {renderField('Occupation', 'occupation', 'Enter occupation')}
          {renderField('Employer', 'employer', 'Enter employer')}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>User ID</Text>
            <Text style={styles.fieldValue}>{profile?.user_id || 'N/A'}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Trust Score</Text>
            <Text style={styles.fieldValue}>{profile?.trust_score || 0}/100</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Member Since</Text>
            <Text style={styles.fieldValue}>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B' },
  editText: { fontSize: 16, fontWeight: '600', color: '#3B82F6' },
  content: { flex: 1 },
  avatarSection: { alignItems: 'center', paddingVertical: 24, backgroundColor: '#FFF', marginBottom: 16 },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarImage: { width: 96, height: 96, borderRadius: 48 },
  userName: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
  userEmail: { fontSize: 14, color: '#64748B', marginTop: 4 },
  kycBadge: { backgroundColor: '#DBEAFE', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 8 },
  kycText: { fontSize: 12, fontWeight: '600', color: '#3B82F6' },
  section: { backgroundColor: '#FFF', marginBottom: 16, paddingHorizontal: 16, paddingVertical: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
  field: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  fieldLabel: { fontSize: 12, color: '#64748B', marginBottom: 4 },
  fieldValue: { fontSize: 16, color: '#1E293B' },
  input: { fontSize: 16, color: '#1E293B', padding: 8, backgroundColor: '#F8FAFC', borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0' },
});
