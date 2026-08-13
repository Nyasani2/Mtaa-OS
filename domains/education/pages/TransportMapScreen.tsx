import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Dimensions, Animated,
} from 'react-native';
import MapView, { Marker, Polyline, Circle } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';

const { width, height } = Dimensions.get('window');

interface BusLocation {
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  timestamp: string;
}

interface BusStop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  sequence: number;
  estimated_arrival: string;
}

interface RouteInfo {
  id: string;
  name: string;
  vehicle_reg: string;
  driver_name: string;
  driver_phone: string;
  status: 'en_route' | 'at_stop' | 'completed';
}

export default function TransportMapScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [busLocation, setBusLocation] = useState<BusLocation | null>(null);
  const [stops, setStops] = useState<BusStop[]>([]);
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [eta, setEta] = useState({ minutes: 0, stops_away: 0 });
  const [selectedStop, setSelectedStop] = useState<BusStop | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: -1.2921,
    longitude: 36.8219,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for bus marker
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.5, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const fetchTransport = useCallback(async () => {
    try {
      const userId = user?.id;
      if (!userId) return;

      // Get student → transport assignment
      const { data: student } = await supabase
        .from('education_students')
        .select('id')
        .eq('user_id', userId)
        .eq('enrollment_status', 'active')
        .single();

      if (!student) {
        // Try parent view
        const { data: parent } = await supabase
          .from('education_parent_guardians')
          .select('student_ids')
          .eq('user_id', userId)
          .eq('status', 'active')
          .single();

        if (parent?.student_ids?.[0]) {
          student.id = parent.student_ids[0];
        }
      }

      if (!student?.id) { setLoading(false); return; }

      const { data: assignment } = await supabase
        .from('education_transport_assignments')
        .select(`
          route:route_id(id, name, status),
          vehicle:vehicle_id(registration, driver_name, driver_phone, current_latitude, current_longitude, current_speed, last_updated),
          stop:stop_id(id, name, latitude, longitude, sequence, estimated_arrival)
        `)
        .eq('student_id', student.id)
        .eq('status', 'active')
        .single();

      if (!assignment) { setLoading(false); return; }

      setRoute({
        id: assignment.route?.id,
        name: assignment.route?.name || 'Route',
        vehicle_reg: assignment.vehicle?.registration || '',
        driver_name: assignment.vehicle?.driver_name || 'Unknown',
        driver_phone: assignment.vehicle?.driver_phone || '',
        status: assignment.route?.status || 'en_route',
      });

      if (assignment.vehicle) {
        setBusLocation({
          latitude: assignment.vehicle.current_latitude || -1.2921,
          longitude: assignment.vehicle.current_longitude || 36.8219,
          speed: assignment.vehicle.current_speed || 0,
          heading: 0,
          timestamp: assignment.vehicle.last_updated,
        });

        setMapRegion({
          latitude: assignment.vehicle.current_latitude || -1.2921,
          longitude: assignment.vehicle.current_longitude || 36.8219,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });
      }

      // Fetch all stops on this route
      const { data: routeStops } = await supabase
        .from('education_transport_stops')
        .select('id, name, latitude, longitude, sequence, estimated_arrival')
        .eq('route_id', assignment.route?.id)
        .order('sequence');

      setStops(routeStops || []);

      // Calculate ETA
      if (assignment.stop && assignment.vehicle) {
        const stopLat = assignment.stop.latitude;
        const stopLon = assignment.stop.longitude;
        const busLat = assignment.vehicle.current_latitude;
        const busLon = assignment.vehicle.current_longitude;
        const distance = Math.sqrt(Math.pow(stopLat - busLat, 2) + Math.pow(stopLon - busLon, 2)) * 111;
        const speed = Math.max(assignment.vehicle.current_speed || 20, 5);
        const minutes = Math.round((distance / speed) * 60);

        const currentSeq = assignment.stop.sequence || 0;
        const stopsAway = Math.max(0, routeStops?.filter((s: any) => s.sequence > currentSeq).length || 0);

        setEta({ minutes: Math.max(1, minutes), stops_away: stopsAway });
      }
    } catch (e) {
      console.error('Transport fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchTransport();

    // Realtime subscription for bus location
    const channel = supabase
      .channel('bus_location')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'education_transport_vehicles',
      }, (payload) => {
        if (payload.new.current_latitude && payload.new.current_longitude) {
          setBusLocation({
            latitude: payload.new.current_latitude,
            longitude: payload.new.current_longitude,
            speed: payload.new.current_speed || 0,
            heading: payload.new.heading || 0,
            timestamp: payload.new.last_updated,
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchTransport]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>My Bus</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{route?.name || 'School Bus'}</Text>
        </View>
        <TouchableOpacity onPress={fetchTransport} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* ETA Banner */}
      {eta.minutes > 0 && (
        <View style={[styles.etaBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.etaBlock}>
            <Text style={[styles.etaNumber, { color: colors.text }]}>{eta.minutes}</Text>
            <Text style={[styles.etaUnit, { color: colors.textSecondary }]}>min away</Text>
          </View>
          <View style={styles.etaDivider} />
          <View style={styles.etaBlock}>
            <Text style={[styles.etaNumber, { color: colors.text }]}>{eta.stops_away}</Text>
            <Text style={[styles.etaUnit, { color: colors.textSecondary }]}>stops away</Text>
          </View>
          <View style={styles.etaDivider} />
          <View style={styles.etaBlock}>
            <Text style={[styles.etaNumber, { color: colors.text }]} numberOfLines={1}>{route?.driver_name?.split(' ')[0] || 'Driver'}</Text>
            <Text style={[styles.etaUnit, { color: colors.textSecondary }]}>Driver</Text>
          </View>
          <View style={[styles.liveBadge, { backgroundColor: '#ef444420' }]}>
            <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
            <Text style={{ color: '#ef4444', fontSize: 10, fontWeight: '700' }}>LIVE</Text>
          </View>
        </View>
      )}

      {/* Map */}
      <MapView
        style={styles.map}
        region={mapRegion}
        onRegionChangeComplete={setMapRegion}
        showsUserLocation
        showsTraffic
      >
        {/* Bus Marker */}
        {busLocation && (
          <Marker coordinate={{ latitude: busLocation.latitude, longitude: busLocation.longitude }}>
            <View style={styles.busMarker}>
              <Animated.View style={[styles.busPulse, { transform: [{ scale: pulseAnim }] }]} />
              <View style={styles.busIcon}>
                <Ionicons name="bus" size={18} color="#fff" />
              </View>
            </View>
          </Marker>
        )}

        {/* Stops */}
        {stops.map((stop, i) => (
          <Marker
            key={stop.id}
            coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
            onPress={() => setSelectedStop(stop)}
          >
            <View style={[
              styles.stopMarker,
              selectedStop?.id === stop.id && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}>
              <Text style={[styles.stopNumber, { color: selectedStop?.id === stop.id ? '#fff' : colors.text }]}>
                {stop.sequence}
              </Text>
            </View>
          </Marker>
        ))}

        {/* Route Polyline */}
        {stops.length > 1 && (
          <Polyline
            coordinates={stops.map((s: any) => ({ latitude: s.latitude, longitude: s.longitude }))}
            strokeColor={colors.primary}
            strokeWidth={3}
          />
        )}

        {/* Stop radius circle */}
        {selectedStop && (
          <Circle
            center={{ latitude: selectedStop.latitude, longitude: selectedStop.longitude }}
            radius={100}
            fillColor={colors.primary + '20'}
            strokeColor={colors.primary}
            strokeWidth={1}
          />
        )}
      </MapView>

      {/* Bottom Sheet — Stop Details */}
      {selectedStop && (
        <View style={[styles.bottomSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={[styles.sheetTitle, { color: colors.text }]}>{selectedStop.name}</Text>
                <Text style={[styles.sheetSub, { color: colors.textSecondary }]}>
                  Stop #{selectedStop.sequence} · Est. arrival: {selectedStop.estimated_arrival?.slice(0, 5) || 'TBD'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedStop(null)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Driver Info Bar */}
      <View style={[styles.driverBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.driverInfo}>
          <View style={[styles.driverAvatar, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="person" size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.driverName, { color: colors.text }]}>{route?.driver_name || 'Driver'}</Text>
            <Text style={[styles.driverVehicle, { color: colors.textSecondary }]}>{route?.vehicle_reg || 'Vehicle'}</Text>
          </View>
        </View>
        {route?.driver_phone && (
          <TouchableOpacity style={[styles.callBtn, { backgroundColor: colors.primary }]}>
            <Ionicons name="call" size={18} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  headerSub: { fontSize: 12, marginTop: 2 },
  refreshBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  etaBanner: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 10, padding: 14, borderRadius: 16, borderWidth: 1 },
  etaBlock: { flex: 1, alignItems: 'center' },
  etaNumber: { fontSize: 24, fontWeight: '800' },
  etaUnit: { fontSize: 11, marginTop: 2 },
  etaDivider: { width: 1, height: 30, backgroundColor: '#e2e8f0' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4, marginLeft: 8 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444' },
  map: { flex: 1, marginTop: 10 },
  busMarker: { alignItems: 'center', justifyContent: 'center' },
  busPulse: { position: 'absolute', width: 40, height: 40, borderRadius: 20, backgroundColor: '#ef444440' },
  busIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  stopMarker: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff', borderWidth: 2, borderColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
  stopNumber: { fontSize: 11, fontWeight: '700' },
  bottomSheet: { position: 'absolute', bottom: 80, left: 16, right: 16, borderRadius: 20, borderWidth: 1, padding: 16 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e2e8f0', alignSelf: 'center', marginBottom: 12 },
  sheetContent: {},
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sheetTitle: { fontSize: 16, fontWeight: '700' },
  sheetSub: { fontSize: 12, marginTop: 2 },
  driverBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1 },
  driverInfo: { flexDirection: 'row', alignItems: 'center' },
  driverAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  driverName: { fontSize: 14, fontWeight: '700' },
  driverVehicle: { fontSize: 12, marginTop: 1 },
  callBtn: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
});
