import React, { useState, useEffect, useCallback } from 'react';
import { Alert, View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

interface ProfessionalProfile {
  id: string;
  user_id: string;
  job_title: string;
  company: string;
  industry: string;
  years_experience: number;
  skills: string[];
  bio: string;
  linkedin_url: string;
  portfolio_url: string;
  created_at: string;
  updated_at: string;
}

export default function ProfessionalScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tableExists, setTableExists] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('professional_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        if (error.message?.includes('does not exist') || error.code === '42P01') {
          setTableExists(false);
          setProfile(null);
        } else {
          console.error('Professional profile fetch error:', error);
        }
        setLoading(false);
        return;
      }

      setProfile(data);
      setTableExists(true);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#3b82f6" />
      </SafeAreaView>
    );
  }

  if (!tableExists) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>Professional</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="briefcase-outline" size={64} color="#333" />
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 16 }}>
            Professional Profiles Not Available
          </Text>
          <Text style={{ color: '#666', fontSize: 14, textAlign: 'center', marginTop: 8 }}>
            The professional_profiles table has not been created in your database yet.{'\n'}
            Run the SQL migration to enable this feature.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>Professional</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="briefcase-outline" size={64} color="#333" />
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 16 }}>
            No Professional Profile
          </Text>
          <Text style={{ color: '#666', fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 24 }}>
            Set up your professional profile to showcase your career
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/profile/professional/edit' as any)}
            style={{
              backgroundColor: '#3b82f6',
              paddingHorizontal: 32,
              paddingVertical: 14,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Create Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <ScrollView style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', flex: 1 }}>Professional</Text>
          <TouchableOpacity onPress={() => router.push('/profile/professional/edit' as any)}>
            <Ionicons name="create-outline" size={22} color="#3b82f6" />
          </TouchableOpacity>
        </View>

        <View style={{ padding: 16 }}>
          <View style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>{profile.job_title}</Text>
            {profile.company ? (
              <Text style={{ color: '#888', fontSize: 16, marginTop: 4 }}>{profile.company}</Text>
            ) : null}
            {profile.industry ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <Ionicons name="business-outline" size={14} color="#666" />
                <Text style={{ color: '#666', fontSize: 13, marginLeft: 4 }}>{profile.industry}</Text>
              </View>
            ) : null}
            {profile.years_experience ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Ionicons name="time-outline" size={14} color="#666" />
                <Text style={{ color: '#666', fontSize: 13, marginLeft: 4 }}>
                  {profile.years_experience} years experience
                </Text>
              </View>
            ) : null}
          </View>

          {profile.bio ? (
            <View style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <Text style={{ color: '#888', fontSize: 12, textTransform: 'uppercase', marginBottom: 8 }}>About</Text>
              <Text style={{ color: '#ccc', fontSize: 14, lineHeight: 20 }}>{profile.bio}</Text>
            </View>
          ) : null}

          {profile.skills && profile.skills.length > 0 ? (
            <View style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <Text style={{ color: '#888', fontSize: 12, textTransform: 'uppercase', marginBottom: 8 }}>Skills</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {profile.skills.map((skill, i) => (
                  <View key={i} style={{ backgroundColor: '#252525', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
                    <Text style={{ color: '#ccc', fontSize: 13 }}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {(profile.linkedin_url || profile.portfolio_url) ? (
            <View style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16 }}>
              <Text style={{ color: '#888', fontSize: 12, textTransform: 'uppercase', marginBottom: 8 }}>Links</Text>
              {profile.linkedin_url ? (
                <TouchableOpacity onPress={() => Alert.alert('Open Link', profile.linkedin_url || '')} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="logo-linkedin" size={18} color="#3b82f6" />
                  <Text style={{ color: '#3b82f6', fontSize: 14, marginLeft: 8 }}>LinkedIn Profile</Text>
                </TouchableOpacity>
              ) : null}
              {profile.portfolio_url ? (
                <TouchableOpacity onPress={() => Alert.alert('Open Link', profile.portfolio_url || '')} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="globe-outline" size={18} color="#3b82f6" />
                  <Text style={{ color: '#3b82f6', fontSize: 14, marginLeft: 8 }}>Portfolio</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
