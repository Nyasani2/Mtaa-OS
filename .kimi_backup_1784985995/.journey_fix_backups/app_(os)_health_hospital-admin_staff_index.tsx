import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, ActivityIndicator,
  RefreshControl, Alert, TextInput
} from 'react-native';
import { useHealthRole } from '@/lib/health/hooks/useHealthRole';
import { useHospitalAdmin } from '@/lib/health/hooks/useHospitalAdmin';

export default function HospitalStaffScreen() {
  const { selectedFacilityId, facilities, isLoading: roleLoading, selectFacility } = useHealthRole();
  const {
    staff, staffOnDuty, loading, error, refresh, inviteStaff
  } = useHospitalAdmin(selectedFacilityId);

  const [refreshing, setRefreshing] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('nurse');
  const [inviteDepartment, setInviteDepartment] = useState('');
  const [inviting, setInviting] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleInvite = async () => {
    if (!inviteName.trim() || !inviteEmail.trim() || !selectedFacilityId) {
      Alert.alert('Missing Fields', 'Please fill in all required fields and select a facility.');
      return;
    }
    setInviting(true);
    try {
      await inviteStaff({
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole,
        department: inviteDepartment.trim(),
        facility_id: selectedFacilityId,
        status: 'active',
      });
      setShowInvite(false);
      setInviteName('');
      setInviteEmail('');
      setInviteDepartment('');
      Alert.alert('Success', 'Staff member invited successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to invite staff');
    } finally {
      setInviting(false);
    }
  };

  if (roleLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // CRITICAL FIX: Show facility selector if none selected
  if (!selectedFacilityId) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f172a', padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 16 }}>Hospital Staff</Text>
        <Text style={{ color: '#94a3b8', marginBottom: 16 }}>Select a facility to manage staff:</Text>
        {facilities.length === 0 ? (
          <Text style={{ color: '#64748b' }}>No facilities found. Please contact your administrator.</Text>
        ) : (
          facilities.map((f: any) => (
            <TouchableOpacity
              key={f.id}
              onPress={() => selectFacility(f.id)}
              style={{
                backgroundColor: '#1e293b', padding: 16, borderRadius: 12,
                marginBottom: 12, borderWidth: 1, borderColor: '#334155'
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>{f.name}</Text>
              <Text style={{ color: '#94a3b8', marginTop: 4 }}>{f.type || 'Hospital'}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <View style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#fff' }}>Hospital Staff</Text>
        <TouchableOpacity
          onPress={() => setShowInvite(!showInvite)}
          style={{ backgroundColor: '#3b82f6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>+ Invite</Text>
        </TouchableOpacity>
      </View>

      {showInvite && (
        <View style={{ padding: 16, backgroundColor: '#1e293b', marginHorizontal: 16, borderRadius: 12, marginBottom: 12 }}>
          <Text style={{ color: '#fff', fontWeight: '600', marginBottom: 8 }}>Invite Staff Member</Text>
          <TextInput
            value={inviteName}
            onChangeText={setInviteName}
            placeholder="Full name"
            placeholderTextColor="#64748b"
            style={{ backgroundColor: '#0f172a', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 8 }}
          />
          <TextInput
            value={inviteEmail}
            onChangeText={setInviteEmail}
            placeholder="Email"
            placeholderTextColor="#64748b"
            keyboardType="email-address"
            autoCapitalize="none"
            style={{ backgroundColor: '#0f172a', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 8 }}
          />
          <TextInput
            value={inviteDepartment}
            onChangeText={setInviteDepartment}
            placeholder="Department"
            placeholderTextColor="#64748b"
            style={{ backgroundColor: '#0f172a', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 8 }}
          />
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            {['nurse', 'doctor', 'admin', 'receptionist'].map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setInviteRole(r)}
                style={{
                  flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center',
                  backgroundColor: inviteRole === r ? '#3b82f6' : '#0f172a'
                }}
              >
                <Text style={{ color: '#fff', fontSize: 12, textTransform: 'capitalize' }}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            onPress={handleInvite}
            disabled={inviting}
            style={{ backgroundColor: inviting ? '#1e40af' : '#22c55e', padding: 12, borderRadius: 8, alignItems: 'center' }}
          >
            {inviting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Send Invite</Text>}
          </TouchableOpacity>
        </View>
      )}

      {error && (
        <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#ef444422', padding: 12, borderRadius: 8 }}>
          <Text style={{ color: '#ef4444' }}>{error}</Text>
        </View>
      )}

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
        style={{ flex: 1, paddingHorizontal: 16 }}
      >
        {loading && !refreshing ? (
          <ActivityIndicator color="#3b82f6" style={{ marginTop: 40 }} />
        ) : staff.length === 0 ? (
          <Text style={{ color: '#64748b', textAlign: 'center', marginTop: 40 }}>No staff members found</Text>
        ) : (
          <>
            {staffOnDuty.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: '#94a3b8', fontWeight: '600', marginBottom: 8 }}>On Duty</Text>
                {staffOnDuty.map((s) => (
                  <View key={s.id} style={{ backgroundColor: '#1e293b', padding: 12, borderRadius: 8, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e', marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#fff', fontWeight: '600' }}>{s.name}</Text>
                      <Text style={{ color: '#94a3b8', fontSize: 12 }}>{s.role} · {s.department}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <Text style={{ color: '#94a3b8', fontWeight: '600', marginBottom: 8 }}>All Staff</Text>
            {staff.map((s) => (
              <View key={s.id} style={{ backgroundColor: '#1e293b', padding: 12, borderRadius: 8, marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ color: '#fff', fontWeight: '600' }}>{s.name}</Text>
                    <Text style={{ color: '#94a3b8', fontSize: 12 }}>{s.role} · {s.department}</Text>
                  </View>
                  <View style={{
                    backgroundColor: s.status === 'active' ? '#22c55e22' : '#ef444422',
                    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4
                  }}>
                    <Text style={{
                      color: s.status === 'active' ? '#22c55e' : '#ef4444',
                      fontSize: 12, fontWeight: '600', textTransform: 'capitalize'
                    }}>{s.status}</Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}
