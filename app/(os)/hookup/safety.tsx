import React, { useState, useEffect, useCallback } from 'react';
import { Alert, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Modal, TextInput, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

interface BlockedUser {
  id: string;
  blocked_id: string;
  full_name: string;
  avatar_url: string;
  blocked_at: string;
}

interface ReportItem {
  id: string;
  reported_name: string;
  reason: string;
  status: string;
  created_at: string;
}

const VERIFICATION_STEPS = [
  { level: 1, title: 'Phone Verified', description: 'Your phone number is confirmed', icon: 'smartphone', color: '#4488ff' },
  { level: 2, title: 'Government ID', description: 'Upload a valid national ID or passport', icon: 'credit-card', color: '#ffaa00' },
  { level: 3, title: 'Face Verification', description: 'Take a live selfie to confirm identity', icon: 'camera', color: '#44ff88' },
  { level: 4, title: 'Professional Verified', description: 'Link a verified MTAA professional profile', icon: 'award', color: '#ff3366' },
];

export default function SafetyScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeSection, setActiveSection] = useState<'verify' | 'blocked' | 'reports'>('verify');
  const [verificationLevel, setVerificationLevel] = useState(0);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [myReports, setMyReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIdModal, setShowIdModal] = useState(false);
  const [idNumber, setIdNumber] = useState('');

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      // Get verification level
      const { data: prefs } = await supabase
        .from('hookup_preferences')
        .select('verified_level')
        .eq('profile_id', user.id)
        .single();
      setVerificationLevel(prefs?.verified_level || 0);

      // Get blocked users
      const { data: blocks } = await supabase
        .from('hookup_blocks')
        .select('blocked_id, created_at')
        .eq('blocker_id', user.id)
        .order('created_at', { ascending: false });

      const blocked: BlockedUser[] = [];
      for (const b of (blocks || [])) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('full_name, avatar_url')
          .eq('id', b.blocked_id)
          .single();
        blocked.push({
          id: b.blocked_id,
          blocked_id: b.blocked_id,
          full_name: profile?.full_name || 'Unknown',
          avatar_url: profile?.avatar_url || '',
          blocked_at: b.created_at,
        });
      }
      setBlockedUsers(blocked);

      // Get my reports
      const { data: reports } = await supabase
        .from('hookup_reports')
        .select('id, reported_id, reason, status, created_at')
        .eq('reporter_id', user.id)
        .order('created_at', { ascending: false });

      const enrichedReports: ReportItem[] = [];
      for (const r of (reports || [])) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('id', r.reported_id)
          .single();
        enrichedReports.push({
          id: r.id,
          reported_name: profile?.full_name || 'Unknown',
          reason: r.reason,
          status: r.status || 'pending',
          created_at: r.created_at,
        });
      }
      setMyReports(enrichedReports);
    } catch (err) {
      console.error('Safety fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUnblock = async (blockedId: string) => {
    if (!user?.id) return;
    Alert.alert('Unblock User', 'They will be able to see and interact with you again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Unblock', onPress: async () => {
        await supabase.from('hookup_blocks').delete()
          .eq('blocker_id', user.id)
          .eq('blocked_id', blockedId);
        setBlockedUsers(prev => prev.filter((b: any) => b.blocked_id !== blockedId));
      }},
    ]);
  };

  const handleVerifyId = async () => {
    if (!user?.id || !idNumber.trim()) return;
    await supabase.from('hookup_preferences').upsert({
      profile_id: user.id,
      verified_level: 2,
      id_verified: true,
      id_number: idNumber.trim(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'profile_id' });
    setVerificationLevel(2);
    setShowIdModal(false);
    setIdNumber('');
    Alert.alert('Verified', 'Your ID has been submitted for verification.');
  };

  const handleVerifyPhone = async () => {
    if (!user?.id) return;
    await supabase.from('hookup_preferences').upsert({
      profile_id: user.id,
      verified_level: Math.max(verificationLevel, 1),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'profile_id' });
    setVerificationLevel(Math.max(verificationLevel, 1));
    Alert.alert('Verified', 'Phone verification confirmed.');
  };

  const SectionButton = ({ icon, label, isActive, onPress, badge }: any) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row', alignItems: 'center', padding: 14,
        backgroundColor: isActive ? '#2a1a1a' : 'transparent',
        borderRadius: 12, marginBottom: 4,
        borderWidth: 1, borderColor: isActive ? '#ff336620' : 'transparent',
      }}
    >
      <Feather name={icon} size={18} color={isActive ? '#ff3366' : '#666'} style={{ width: 28 }} />
      <Text style={{ color: isActive ? '#ff3366' : '#fff', fontSize: 15, flex: 1 }}>{label}</Text>
      {badge > 0 && (
        <View style={{ backgroundColor: '#ff3366', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 }}>
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Safety Center</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={{ flex: 1, flexDirection: 'row' }}>
        {/* Sidebar */}
        <View style={{ width: 200, borderRightWidth: 1, borderRightColor: '#1a1a1a', padding: 12 }}>
          <SectionButton
            icon="shield"
            label="Verification"
            isActive={activeSection === 'verify'}
            onPress={() => setActiveSection('verify')}
          />
          <SectionButton
            icon="user-x"
            label="Blocked"
            isActive={activeSection === 'blocked'}
            onPress={() => setActiveSection('blocked')}
            badge={blockedUsers.length}
          />
          <SectionButton
            icon="flag"
            label="My Reports"
            isActive={activeSection === 'reports'}
            onPress={() => setActiveSection('reports')}
            badge={myReports.length}
          />

          <View style={{ marginTop: 24, padding: 12, backgroundColor: '#1a1a1a', borderRadius: 12 }}>
            <Feather name="alert-triangle" size={20} color="#ffaa00" />
            <Text style={{ color: '#ffaa00', fontSize: 13, fontWeight: 'bold', marginTop: 8 }}>Emergency</Text>
            <Text style={{ color: '#888', fontSize: 12, marginTop: 4 }}>If you feel unsafe, contact local authorities immediately.</Text>
          </View>
        </View>

        {/* Content */}
        <ScrollView style={{ flex: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator size="large" color="#ff3366" style={{ marginTop: 40 }} />
          ) : activeSection === 'verify' ? (
            <VerificationPanel
              level={verificationLevel}
              onVerifyPhone={handleVerifyPhone}
              onVerifyId={() => setShowIdModal(true)}
            />
          ) : activeSection === 'blocked' ? (
            <BlockedPanel users={blockedUsers} onUnblock={handleUnblock} />
          ) : (
            <ReportsPanel reports={myReports} />
          )}
        </ScrollView>
      </View>

      {/* ID Verification Modal */}
      <Modal visible={showIdModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#1a1a1a', borderRadius: 24, padding: 24 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>ID Verification</Text>
            <Text style={{ color: '#888', fontSize: 14, marginTop: 8, lineHeight: 20 }}>
              Enter your national ID or passport number. This is encrypted and only used for verification.
            </Text>
            <TextInput
              value={idNumber}
              onChangeText={setIdNumber}
              placeholder="ID / Passport Number"
              placeholderTextColor="#555"
              style={{ backgroundColor: '#2a2a2a', color: '#fff', borderRadius: 12, padding: 14, marginTop: 16, fontSize: 15 }}
            />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <TouchableOpacity
                onPress={() => setShowIdModal(false)}
                style={{ flex: 1, backgroundColor: '#2a2a2a', borderRadius: 12, padding: 14, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleVerifyId}
                style={{ flex: 1, backgroundColor: '#ff3366', borderRadius: 12, padding: 14, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function VerificationPanel({ level, onVerifyPhone, onVerifyId }: any) {
  return (
    <View>
      <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>Verification Levels</Text>
      <Text style={{ color: '#888', fontSize: 14, marginBottom: 20 }}>Higher verification = more trust & visibility</Text>

      {VERIFICATION_STEPS.map((step, i) => {
        const isCompleted = level >= step.level;
        const isNext = level + 1 === step.level;
        return (
          <View key={step.level} style={{ flexDirection: 'row', marginBottom: 20 }}>
            {/* Timeline */}
            <View style={{ alignItems: 'center', marginRight: 16 }}>
              <View style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: isCompleted ? step.color : isNext ? '#2a2a2a' : '#1a1a1a',
                justifyContent: 'center', alignItems: 'center',
                borderWidth: 2, borderColor: isCompleted ? step.color : isNext ? step.color : '#333',
              }}>
                {isCompleted ? (
                  <Feather name="check" size={16} color="#0a0a0a" />
                ) : (
                  <Feather name={step.icon as any} size={16} color={isNext ? step.color : '#555'} />
                )}
              </View>
              {i < VERIFICATION_STEPS.length - 1 && (
                <View style={{ width: 2, flex: 1, backgroundColor: isCompleted ? step.color : '#333', marginTop: 4 }} />
              )}
            </View>

            {/* Content */}
            <View style={{ flex: 1, paddingTop: 4 }}>
              <Text style={{ color: isCompleted ? '#fff' : isNext ? '#fff' : '#666', fontSize: 16, fontWeight: 'bold' }}>
                {step.title}
              </Text>
              <Text style={{ color: '#888', fontSize: 13, marginTop: 2, lineHeight: 18 }}>{step.description}</Text>

              {isNext && step.level === 1 && (
                <TouchableOpacity onPress={onVerifyPhone} style={{ marginTop: 8, backgroundColor: '#2a2a2a', borderRadius: 10, padding: 10, alignSelf: 'flex-start' }}>
                  <Text style={{ color: '#4488ff', fontSize: 13, fontWeight: 'bold' }}>Verify Phone</Text>
                </TouchableOpacity>
              )}
              {isNext && step.level === 2 && (
                <TouchableOpacity onPress={onVerifyId} style={{ marginTop: 8, backgroundColor: '#2a2a2a', borderRadius: 10, padding: 10, alignSelf: 'flex-start' }}>
                  <Text style={{ color: '#ffaa00', fontSize: 13, fontWeight: 'bold' }}>Upload ID</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function BlockedPanel({ users, onUnblock }: { users: BlockedUser[]; onUnblock: (id: string) => void }) {
  if (users.length === 0) {
    return (
      <View style={{ alignItems: 'center', marginTop: 40 }}>
        <Feather name="user-check" size={48} color="#333" />
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 16 }}>No blocked users</Text>
        <Text style={{ color: '#888', fontSize: 14, marginTop: 8, textAlign: 'center' }}>Users you block will appear here.</Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>Blocked Users</Text>
      {users.map((u: any) => (
        <View key={u.blocked_id} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#1a1a1a', borderRadius: 12, marginBottom: 8 }}>
          <Image source={{ uri: u.avatar_url || undefined }} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#2a2a2a' }} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: 'bold' }}>{u.full_name}</Text>
            <Text style={{ color: '#666', fontSize: 12 }}>Blocked {new Date(u.blocked_at).toLocaleDateString()}</Text>
          </View>
          <TouchableOpacity onPress={() => onUnblock(u.blocked_id)} style={{ backgroundColor: '#2a2a2a', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={{ color: '#ff3366', fontSize: 13, fontWeight: 'bold' }}>Unblock</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

function ReportsPanel({ reports }: { reports: ReportItem[] }) {
  if (reports.length === 0) {
    return (
      <View style={{ alignItems: 'center', marginTop: 40 }}>
        <Feather name="check-circle" size={48} color="#333" />
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 16 }}>No reports</Text>
        <Text style={{ color: '#888', fontSize: 14, marginTop: 8, textAlign: 'center' }}>Reports you submit will appear here with status updates.</Text>
      </View>
    );
  }

  const statusColor = (s: string) => {
    if (s === 'resolved') return '#44ff88';
    if (s === 'investigating') return '#ffaa00';
    return '#888';
  };

  return (
    <View>
      <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>My Reports</Text>
      {reports.map((r: any) => (
        <View key={r.id} style={{ padding: 14, backgroundColor: '#1a1a1a', borderRadius: 12, marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: 'bold' }}>{r.reported_name}</Text>
            <View style={{ backgroundColor: '#2a2a2a', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ color: statusColor(r.status), fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' }}>{r.status}</Text>
            </View>
          </View>
          <Text style={{ color: '#888', fontSize: 13, marginTop: 4 }}>Reason: {r.reason}</Text>
          <Text style={{ color: '#666', fontSize: 12, marginTop: 4 }}>{new Date(r.created_at).toLocaleDateString()}</Text>
        </View>
      ))}
    </View>
  );
}