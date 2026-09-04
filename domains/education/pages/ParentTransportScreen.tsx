import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';

interface TransportAssignment {
  id: string;
  status: string;
  route_name: string;
  route_stops: any[];
  vehicle_registration: string;
  driver_name: string;
  driver_verified: boolean;
  student_name: string;
  last_update?: string;
  current_location?: { lat: number; lng: number };
}

export default function ParentTransportScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assignments, setAssignments] = useState<TransportAssignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<TransportAssignment | null>(null);

  const fetchTransport = useCallback(async () => {
    try {
      // Get children
      const { data: students } = await supabase
        .from('education_students')
        .select('id, full_name')
        .eq('primary_guardian_id', user?.id);

      if (!students || students.length === 0) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const studentIds = students.map((s: any) => s.id);

      // Get transport assignments
      const { data: transportData } = await supabase
        .from('education_transport_assignments')
        .select(`
          id, status,
          route:route_id(name, stops),
          vehicle:vehicle_id(registration),
          driver:driver_id(full_name, verification_status),
          student:student_id(full_name)
        `)
        .in('student_id', studentIds);

      const mapped: TransportAssignment[] = (transportData || []).map((t: any) => ({
        id: t.id,
        status: t.status,
        route_name: t.route?.name || 'Unknown Route',
        route_stops: t.route?.stops || [],
        vehicle_registration: t.vehicle?.registration || 'N/A',
        driver_name: t.driver?.full_name || 'N/A',
        driver_verified: t.driver?.verification_status === 'verified',
        student_name: t.student?.full_name || 'Student',
      }));

      setAssignments(mapped);
      if (mapped.length > 0 && !selectedAssignment) setSelectedAssignment(mapped[0]);
    } catch (e) {
      console.error('[ParentTransport]', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchTransport(); }, [fetchTransport]);
  const onRefresh = () => { setRefreshing(true); fetchTransport(); };

  const openLiveMap = () => {
    if (!selectedAssignment) {
      Alert.alert('No Transport', 'No active transport assignment found');
      return;
    }
    router.push({
      pathname: '/(education)/transport-map',
      params: { assignmentId: selectedAssignment.id },
    });
  };

  const reportEmergency = () => {
    Alert.alert(
      'Report Emergency',
      'This will notify the school administration and transport coordinator.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.from('education_transport_alerts').insert({
                assignment_id: selectedAssignment?.id,
                parent_id: user?.id,
                type: 'emergency',
                status: 'open',
                created_at: new Date().toISOString(),
              });
              Alert.alert('Reported', 'Emergency report has been sent to school administration.');
            } catch (e) {
              Alert.alert('Error', 'Failed to send emergency report');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading transport info...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>School Transport</Text>
        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>Track your child's school bus</Text>
      </View>

      {assignments.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="bus-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No transport assigned</Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Contact your school to set up transport</Text>
        </View>
      ) : (
        <>
          {/* Assignment Selector */}
          {assignments.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
              {assignments.map((a: any) => (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.assignmentChip, selectedAssignment?.id === a.id && { backgroundColor: colors.primary }]}
                  onPress={() => setSelectedAssignment(a)}
                >
                  <Text style={[styles.assignmentChipText, { color: selectedAssignment?.id === a.id ? '#fff' : colors.text }]}>
                    {a.student_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {selectedAssignment && (
            <>
              {/* Route Card */}
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>Route Details</Text>
                  <View style={[styles.statusPill, {
                    backgroundColor: selectedAssignment.status === 'active' ? '#ECFDF5' : '#FEE2E2'
                  }]}>
                    <Text style={[styles.statusText, {
                      color: selectedAssignment.status === 'active' ? '#059669' : '#DC2626'
                    }]}>{selectedAssignment.status}</Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="map-outline" size={18} color={colors.textSecondary} />
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Route</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{selectedAssignment.route_name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="car-outline" size={18} color={colors.textSecondary} />
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Vehicle</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{selectedAssignment.vehicle_registration}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="person-outline" size={18} color={colors.textSecondary} />
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Driver</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={[styles.detailValue, { color: colors.text }]}>{selectedAssignment.driver_name}</Text>
                    {selectedAssignment.driver_verified && <Ionicons name="shield-checkmark" size={14} color="#059669" />}
                  </View>
                </View>
              </View>

              {/* Stops */}
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 10 }]}>Route Stops</Text>
                {selectedAssignment.route_stops.map((stop: any, idx: number) => (
                  <View key={idx} style={styles.stopRow}>
                    <View style={[styles.stopDot, { backgroundColor: idx === 0 ? colors.primary : idx === selectedAssignment.route_stops.length - 1 ? '#EF4444' : '#9CA3AF' }]} />
                    <Text style={[styles.stopText, { color: colors.text }]}>{typeof stop === 'string' ? stop : stop.name}</Text>
                  </View>
                ))}
              </View>

              {/* Live Map Button */}
              <TouchableOpacity style={[styles.mapBtn, { backgroundColor: colors.primary }]} onPress={openLiveMap}>
                <Ionicons name="map" size={22} color="#fff" />
                <Text style={styles.mapBtnText}>View Live Map</Text>
              </TouchableOpacity>

              {/* Emergency Button */}
              <TouchableOpacity style={[styles.emergencyBtn, { borderColor: '#EF4444' }]} onPress={reportEmergency}>
                <Ionicons name="warning" size={20} color="#EF4444" />
                <Text style={[styles.emergencyBtnText, { color: '#EF4444' }]}>Report Emergency</Text>
              </TouchableOpacity>
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, fontSize: 14 },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  headerSub: { fontSize: 13, marginTop: 2 },
  selectorBar: { maxHeight: 52, marginVertical: 8 },
  assignmentChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6' },
  assignmentChipText: { fontSize: 13, fontWeight: '600' },
  card: { borderRadius: 16, padding: 16, marginTop: 12, marginHorizontal: 16, borderWidth: 1 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  detailLabel: { fontSize: 13, marginLeft: 10, width: 80 },
  detailValue: { fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right' },
  stopRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  stopDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  stopText: { fontSize: 14 },
  mapBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 14, marginHorizontal: 16, marginTop: 16 },
  mapBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  emergencyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 14, marginHorizontal: 16, marginTop: 10, borderWidth: 1 },
  emergencyBtnText: { fontWeight: '700', fontSize: 15 },
  emptyText: { marginTop: 12, fontSize: 14 },
  emptySub: { marginTop: 4, fontSize: 13, textAlign: 'center' },
});
