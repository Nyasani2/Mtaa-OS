// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function HookupProfileSetup() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  
  // Step 1: Basic Identity
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [maxPhotos, setMaxPhotos] = useState(3);

  // Step 2: Parental Reality
  const [hasChildren, setHasChildren] = useState(false);
  const [numChildren, setNumChildren] = useState('0');

  // Step 3: Polygamy & Family Structure
  const [isPolygamous, setIsPolygamous] = useState(false);
  const [numWives, setNumWives] = useState('0');
  const [numCoparents, setNumCoparents] = useState('0');
  const [openToPolygamy, setOpenToPolygamy] = useState<'yes' | 'no' | 'open'>('no');

  const handleSave = async () => {
    if (!displayName.trim() || !gender) {
      Alert.alert('Missing Info', 'Please provide your display name and gender.');
      return;
    }
    if (hasChildren && (isNaN(Number(numChildren)) || Number(numChildren) < 0)) {
      Alert.alert('Invalid Input', 'Please enter a valid number of children.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('hookup_profiles').upsert({
        user_id: user?.id,
        display_name: displayName.trim(),
        gender,
        max_photos_allowed: maxPhotos,
        has_children: hasChildren,
        number_of_children: hasChildren ? Number(numChildren) : 0,
        is_polygamous: gender === 'male' ? isPolygamous : false,
        open_to_polygamy: gender === 'female' ? openToPolygamy === 'yes' : false,
        number_of_wives: gender === 'male' && isPolygamous ? Number(numWives) : 0,
        number_of_coparents: gender === 'male' ? Number(numCoparents) : 0,
      });

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Build Your Real Profile</Text>
      <Text style={styles.headerSubtitle}>MTAA Hookup is built on radical transparency. No lies, no charades.</Text>

      {/* 1. Basic Identity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. How should we call you?</Text>
        <TextInput
          style={styles.input}
          placeholder="Your preferred name"
          placeholderTextColor="#666"
          value={displayName}
          onChangeText={setDisplayName}
        />
        
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Your Gender</Text>
        <View style={styles.row}>
          {(['male', 'female', 'other'] as const).map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.chip, gender === g && styles.chipActive]}
              onPress={() => setGender(g)}
            >
              <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Max Photos Allowed (1-6)</Text>
        <View style={styles.row}>
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <TouchableOpacity
              key={num}
              style={[styles.chipSmall, maxPhotos === num && styles.chipActive]}
              onPress={() => setMaxPhotos(num)}
            >
              <Text style={[styles.chipText, maxPhotos === num && styles.chipTextActive]}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 2. Parental Reality */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. The Parental Reality</Text>
        <Text style={styles.subText}>Do you have children?</Text>
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
            <TextInput
              style={styles.input}
              placeholder="0"
              keyboardType="numeric"
              value={numChildren}
              onChangeText={setNumChildren}
            />
          </View>
        )}
      </View>

      {/* 3. Family Structure Transparency */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Family Structure Transparency</Text>
        
        {gender === 'male' && (
          <>
            <Text style={styles.subText}>Are you currently in a polygamous marriage?</Text>
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
                <Text style={[styles.label, { marginTop: 12 }]}>How many co-parents (baby mamas)?</Text>
                <TextInput style={styles.input} placeholder="0" keyboardType="numeric" value={numCoparents} onChangeText={setNumCoparents} />
              </View>
            )}
            {!isPolygamous && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.label}>How many co-parents (baby mamas)?</Text>
                <TextInput style={styles.input} placeholder="0" keyboardType="numeric" value={numCoparents} onChangeText={setNumCoparents} />
              </View>
            )}
          </>
        )}

        {gender === 'female' && (
          <>
            <Text style={styles.subText}>Are you open to polygamy or joining an existing family?</Text>
            <View style={styles.row}>
              <TouchableOpacity style={[styles.chip, openToPolygamy === 'yes' && styles.chipActive]} onPress={() => setOpenToPolygamy('yes')}>
                <Text style={[styles.chipText, openToPolygamy === 'yes' && styles.chipTextActive]}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.chip, openToPolygamy === 'no' && styles.chipActive]} onPress={() => setOpenToPolygamy('no')}>
                <Text style={[styles.chipText, openToPolygamy === 'no' && styles.chipTextActive]}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.chip, openToPolygamy === 'open' && styles.chipActive]} onPress={() => setOpenToPolygamy('open')}>
                <Text style={[styles.chipText, openToPolygamy === 'open' && styles.chipTextActive]}>Open to discuss</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {gender === '' && (
          <Text style={styles.subText}>Please select your gender above to see family structure options.</Text>
        )}
      </View>

      <TouchableOpacity style={[styles.continueBtn, loading && styles.continueBtnDisabled]} onPress={handleSave} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={styles.continueBtnText}>Save & Enter MTAA Hookup</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </>
        )}
      </TouchableOpacity>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 24, paddingTop: 60 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 8 },
  headerSubtitle: { fontSize: 15, color: '#94a3b8', marginBottom: 32, lineHeight: 22 },
  section: { marginBottom: 32, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 12 },
  subText: { fontSize: 15, color: '#cbd5e1', marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#94a3b8', marginBottom: 8 },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#334155',
  },
  row: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipActive: { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' },
  chipText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  chipSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 16,
    gap: 8,
  },
  continueBtnDisabled: { opacity: 0.6 },
  continueBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
