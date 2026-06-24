import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  Alert, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

const REPORT_REASONS = [
  { key: 'spam', label: 'Spam', icon: 'warning' },
  { key: 'harassment', label: 'Harassment or Bullying', icon: 'sad' },
  { key: 'fraud', label: 'Fraud or Scam', icon: 'card' },
  { key: 'violence', label: 'Violence or Dangerous Content', icon: 'flame' },
  { key: 'copyright', label: 'Copyright Infringement', icon: 'document' },
  { key: 'hate', label: 'Hate Speech', icon: 'megaphone' },
  { key: 'misinformation', label: 'Misinformation', icon: 'alert-circle' },
  { key: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
];

export default function ReportScreen() {
  const router = useRouter();
  const { postId, userId } = useLocalSearchParams<{ postId?: string; userId?: string }>();
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Select a reason', 'Please choose why you are reporting this content.');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('streets_reports').insert({
        reporter_id: user.id,
        reported_post_id: postId || null,
        reported_user_id: userId || null,
        reason: selectedReason,
        details: details.trim() || null,
        status: 'pending',
      });

      if (error) throw error;

      Alert.alert('Report Submitted', 'Thank you. Our team will review this report.');
      router.back();
    } catch (e) {
      Alert.alert('Error', String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleBlock = async () => {
    if (!userId) return;
    Alert.alert(
      'Block User',
      'Are you sure you want to block this user? You will no longer see their content.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;
              await supabase.from('user_blocks').insert({ blocker_id: user.id, blocked_id: userId });
              Alert.alert('Blocked', 'User has been blocked.');
              router.back();
            } catch (e) {
              Alert.alert('Error', String(e));
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={{ paddingTop: 50, paddingHorizontal: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700' }}>Report Content</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={{ color: '#888', fontSize: 14, marginBottom: 16 }}>Why are you reporting this?</Text>

        {REPORT_REASONS.map(reason => (
          <TouchableOpacity
            key={reason.key}
            onPress={() => setSelectedReason(reason.key)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 14,
              paddingHorizontal: 16,
              backgroundColor: selectedReason === reason.key ? '#1a3a4a' : '#1a1a1a',
              borderRadius: 12,
              marginBottom: 8,
              borderWidth: selectedReason === reason.key ? 1 : 0,
              borderColor: '#00d4ff',
            }}
          >
            <Ionicons name={reason.icon as any} size={22} color={selectedReason === reason.key ? '#00d4ff' : '#666'} />
            <Text style={{ color: '#fff', fontSize: 15, marginLeft: 12, flex: 1 }}>{reason.label}</Text>
            {selectedReason === reason.key && <Ionicons name="checkmark-circle" size={22} color="#00d4ff" />}
          </TouchableOpacity>
        ))}

        <Text style={{ color: '#888', fontSize: 14, marginTop: 16, marginBottom: 8 }}>Additional details (optional)</Text>
        <TextInput
          value={details}
          onChangeText={setDetails}
          placeholder="Describe the issue..."
          placeholderTextColor="#666"
          multiline
          numberOfLines={4}
          style={{
            color: '#fff',
            fontSize: 14,
            borderWidth: 1,
            borderColor: '#333',
            borderRadius: 12,
            padding: 12,
            minHeight: 100,
            textAlignVertical: 'top',
          }}
        />

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting}
          style={{
            backgroundColor: selectedReason ? '#ff3040' : '#333',
            borderRadius: 24,
            paddingVertical: 16,
            alignItems: 'center',
            marginTop: 24,
          }}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Submit Report</Text>}
        </TouchableOpacity>

        {userId && (
          <TouchableOpacity onPress={handleBlock} style={{ marginTop: 16, alignItems: 'center' }}>
            <Text style={{ color: '#ff3040', fontSize: 14 }}>Block this user</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}
